-- Step 2: category, subcategory, and payee management.
-- Apply manually after 20261014100000_transaction_lifecycle.sql.

alter table public.categories
  add column if not exists archived boolean not null default false;

alter table public.payees
  add column if not exists archived boolean not null default false;

create index if not exists categories_user_parent_idx
  on public.categories(user_id, parent_id, name);

create index if not exists categories_active_kind_idx
  on public.categories(user_id, archived, kind);

create index if not exists payees_user_active_name_idx
  on public.payees(user_id, archived, name);

create index if not exists transactions_category_id_idx
  on public.transactions(category_id);

create index if not exists transactions_payee_id_idx
  on public.transactions(payee_id);

-- Global defaults are readable by every signed-in user, but only user-owned
-- categories can be created, updated, or archived.
drop policy if exists "Users can manage their own categories" on public.categories;
drop policy if exists "Users can view available categories" on public.categories;
drop policy if exists "Users can create their own categories" on public.categories;
drop policy if exists "Users can update their own categories" on public.categories;

create policy "Users can view available categories"
  on public.categories for select
  to authenticated
  using (user_id is null or (select auth.uid()) = user_id);

create policy "Users can create their own categories"
  on public.categories for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      parent_id is null
      or exists (
        select 1
        from public.categories parent_category
        where parent_category.id = parent_id
          and (parent_category.user_id is null or parent_category.user_id = (select auth.uid()))
      )
    )
  );

create policy "Users can update their own categories"
  on public.categories for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      parent_id is null
      or exists (
        select 1
        from public.categories parent_category
        where parent_category.id = parent_id
          and (parent_category.user_id is null or parent_category.user_id = (select auth.uid()))
      )
    )
  );

revoke delete on public.categories from authenticated;

drop policy if exists "Users can manage their own payees" on public.payees;
drop policy if exists "Users can view their own payees" on public.payees;
drop policy if exists "Users can create their own payees" on public.payees;
drop policy if exists "Users can update their own payees" on public.payees;

create policy "Users can view their own payees"
  on public.payees for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own payees"
  on public.payees for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      default_category_id is null
      or exists (
        select 1
        from public.categories default_category
        where default_category.id = default_category_id
          and (default_category.user_id is null or default_category.user_id = (select auth.uid()))
      )
    )
  );

create policy "Users can update their own payees"
  on public.payees for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      default_category_id is null
      or exists (
        select 1
        from public.categories default_category
        where default_category.id = default_category_id
          and (default_category.user_id is null or default_category.user_id = (select auth.uid()))
      )
    )
  );

revoke delete on public.payees from authenticated;

-- Make category and payee foreign keys meaningful at the RLS boundary.
drop policy if exists "Users can manage their own transactions" on public.transactions;
create policy "Users can manage their own transactions"
  on public.transactions for all
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.accounts source_account
      where source_account.id = account_id
        and source_account.user_id = (select auth.uid())
    )
    and (
      to_account_id is null
      or exists (
        select 1
        from public.accounts destination_account
        where destination_account.id = to_account_id
          and destination_account.user_id = (select auth.uid())
      )
    )
    and (
      category_id is null
      or exists (
        select 1
        from public.categories linked_category
        where linked_category.id = category_id
          and (linked_category.user_id is null or linked_category.user_id = (select auth.uid()))
      )
    )
    and (
      subcategory_id is null
      or exists (
        select 1
        from public.categories linked_subcategory
        where linked_subcategory.id = subcategory_id
          and (linked_subcategory.user_id is null or linked_subcategory.user_id = (select auth.uid()))
      )
    )
    and (
      payee_id is null
      or exists (
        select 1
        from public.payees linked_payee
        where linked_payee.id = payee_id
          and linked_payee.user_id = (select auth.uid())
      )
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.accounts source_account
      where source_account.id = account_id
        and source_account.user_id = (select auth.uid())
    )
    and (
      to_account_id is null
      or exists (
        select 1
        from public.accounts destination_account
        where destination_account.id = to_account_id
          and destination_account.user_id = (select auth.uid())
      )
    )
    and (
      category_id is null
      or exists (
        select 1
        from public.categories linked_category
        where linked_category.id = category_id
          and (linked_category.user_id is null or linked_category.user_id = (select auth.uid()))
      )
    )
    and (
      subcategory_id is null
      or exists (
        select 1
        from public.categories linked_subcategory
        where linked_subcategory.id = subcategory_id
          and (linked_subcategory.user_id is null or linked_subcategory.user_id = (select auth.uid()))
      )
    )
    and (
      payee_id is null
      or exists (
        select 1
        from public.payees linked_payee
        where linked_payee.id = payee_id
          and linked_payee.user_id = (select auth.uid())
      )
    )
  );

-- Seed a small read-only global starter taxonomy. Existing rows are preserved.
insert into public.categories (user_id, name, kind)
select null, starter.name, starter.kind
from (values
  ('Food & Dining', 'expense'),
  ('Housing', 'expense'),
  ('Transport', 'expense'),
  ('Shopping', 'expense'),
  ('Bills & Utilities', 'expense'),
  ('Health', 'expense'),
  ('Salary', 'income'),
  ('Other Income', 'income')
) as starter(name, kind)
where not exists (
  select 1
  from public.categories existing
  where existing.user_id is null
    and lower(existing.name) = lower(starter.name)
);

insert into public.categories (user_id, name, parent_id, kind)
select null, starter.name, parent.id, parent.kind
from (values
  ('Food & Dining', 'Groceries'),
  ('Food & Dining', 'Restaurants'),
  ('Transport', 'Fuel'),
  ('Transport', 'Public transit'),
  ('Housing', 'Rent'),
  ('Bills & Utilities', 'Internet'),
  ('Bills & Utilities', 'Electricity'),
  ('Salary', 'Bonus')
) as starter(parent_name, name)
join public.categories parent
  on parent.user_id is null
 and lower(parent.name) = lower(starter.parent_name)
where not exists (
  select 1
  from public.categories existing
  where existing.user_id is null
    and existing.parent_id = parent.id
    and lower(existing.name) = lower(starter.name)
);
