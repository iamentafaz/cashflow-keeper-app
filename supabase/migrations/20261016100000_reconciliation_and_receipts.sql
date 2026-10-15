-- Step 4: reconciliation sessions and private receipt storage.
-- Apply manually after 20261015100000_currency_exchange_management.sql.

create table if not exists public.reconciliation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  statement_date date not null,
  statement_balance numeric(14, 2) not null,
  book_balance numeric(14, 2) not null,
  difference numeric(14, 2) not null,
  reconciled_transaction_count integer not null default 0 check (reconciled_transaction_count >= 0),
  notes text,
  status text not null default 'completed' check (status = 'completed'),
  completed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists reconciliation_sessions_user_account_date_idx
  on public.reconciliation_sessions(user_id, account_id, statement_date desc, completed_at desc);

alter table public.reconciliation_sessions enable row level security;

grant select, insert on public.reconciliation_sessions to authenticated;

drop policy if exists "Users can view their own reconciliation sessions" on public.reconciliation_sessions;
create policy "Users can view their own reconciliation sessions"
  on public.reconciliation_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own reconciliation sessions" on public.reconciliation_sessions;
create policy "Users can create their own reconciliation sessions"
  on public.reconciliation_sessions for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.accounts
      where accounts.id = account_id and accounts.user_id = (select auth.uid())
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'transaction_attachments_file_size_check'
      and conrelid = 'public.transaction_attachments'::regclass
  ) then
    alter table public.transaction_attachments
      add constraint transaction_attachments_file_size_check
      check (file_size is null or file_size between 1 and 5242880);
  end if;
end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view their own receipt files" on storage.objects;
create policy "Users can view their own receipt files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
    and exists (
      select 1 from public.transactions
      where transactions.id = ((storage.foldername(name))[2])::uuid
        and transactions.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can upload their own receipt files" on storage.objects;
create policy "Users can upload their own receipt files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
    and exists (
      select 1 from public.transactions
      where transactions.id = ((storage.foldername(name))[2])::uuid
        and transactions.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can replace their own receipt files" on storage.objects;
create policy "Users can replace their own receipt files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
    and exists (
      select 1 from public.transactions
      where transactions.id = ((storage.foldername(name))[2])::uuid
        and transactions.user_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
    and exists (
      select 1 from public.transactions
      where transactions.id = ((storage.foldername(name))[2])::uuid
        and transactions.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete their own receipt files" on storage.objects;
create policy "Users can delete their own receipt files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
    and exists (
      select 1 from public.transactions
      where transactions.id = ((storage.foldername(name))[2])::uuid
        and transactions.user_id = (select auth.uid())
    )
  );

create or replace function public.complete_reconciliation(
  p_account_id uuid,
  p_statement_date date,
  p_statement_balance numeric,
  p_reconciled_transaction_ids uuid[] default '{}',
  p_notes text default null
)
returns public.reconciliation_sessions
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_opening_balance numeric(14, 2);
  v_book_balance numeric(14, 2);
  v_difference numeric(14, 2);
  v_reconciled_count integer := 0;
  v_session public.reconciliation_sessions;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to reconcile an account.';
  end if;
  if p_account_id is null or p_statement_date is null or p_statement_balance is null then
    raise exception 'Account, statement date, and statement balance are required.';
  end if;
  if not exists (
    select 1 from public.accounts
    where id = p_account_id and user_id = v_user_id
  ) then
    raise exception 'The account could not be found.';
  end if;
  if exists (
    select 1
    from public.transactions
    where id = any(coalesce(p_reconciled_transaction_ids, '{}'))
      and (user_id <> v_user_id or account_id <> p_account_id or occurred_at > p_statement_date)
  ) then
    raise exception 'One or more selected transactions do not belong to this account or statement period.';
  end if;

  select opening_balance
  into v_opening_balance
  from public.accounts
  where id = p_account_id and user_id = v_user_id;

  select coalesce(sum(
    case
      when type in ('income', 'refund') then amount
      when type = 'expense' then -amount
      when type = 'transfer' and transfer_direction = 'credit' then amount
      when type = 'transfer' and transfer_direction = 'debit' then -amount
      else 0
    end
  ), 0) + v_opening_balance
  into v_book_balance
  from public.transactions
  where user_id = v_user_id
    and account_id = p_account_id
    and occurred_at <= p_statement_date;

  update public.transactions
  set status = 'reconciled',
      updated_at = timezone('utc', now())
  where user_id = v_user_id
    and account_id = p_account_id
    and id = any(coalesce(p_reconciled_transaction_ids, '{}'))
    and occurred_at <= p_statement_date
    and status in ('pending', 'cleared');

  get diagnostics v_reconciled_count = row_count;
  v_difference := round(p_statement_balance - v_book_balance, 2);

  insert into public.reconciliation_sessions (
    user_id,
    account_id,
    statement_date,
    statement_balance,
    book_balance,
    difference,
    reconciled_transaction_count,
    notes
  ) values (
    v_user_id,
    p_account_id,
    p_statement_date,
    round(p_statement_balance, 2),
    round(v_book_balance, 2),
    v_difference,
    v_reconciled_count,
    nullif(trim(p_notes), '')
  )
  returning * into v_session;

  return v_session;
end;
$$;

revoke all on function public.complete_reconciliation(uuid, date, numeric, uuid[], text) from public;
grant execute on function public.complete_reconciliation(uuid, date, numeric, uuid[], text) to authenticated;
