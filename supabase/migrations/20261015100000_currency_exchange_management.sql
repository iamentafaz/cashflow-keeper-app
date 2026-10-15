-- Step 3: base currency and exchange-rate management.
-- Apply manually after 20261014110000_categories_payees_management.sql.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_default_currency_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_default_currency_check
      check (default_currency ~ '^[A-Z]{3}$');
  end if;
end
$$;

alter table public.exchange_rates
  add column if not exists source text not null default 'frankfurter',
  add column if not exists fetched_at timestamptz not null default timezone('utc', now());

create index if not exists exchange_rates_user_base_date_idx
  on public.exchange_rates(user_id, base_currency, rate_date desc);

drop policy if exists "Users can manage their own exchange rates" on public.exchange_rates;
drop policy if exists "Users can view available exchange rates" on public.exchange_rates;
drop policy if exists "Users can create their own exchange rates" on public.exchange_rates;
drop policy if exists "Users can update their own exchange rates" on public.exchange_rates;
drop policy if exists "Users can delete their own exchange rates" on public.exchange_rates;

create policy "Users can view available exchange rates"
  on public.exchange_rates for select
  to authenticated
  using (user_id is null or (select auth.uid()) = user_id);

create policy "Users can create their own exchange rates"
  on public.exchange_rates for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own exchange rates"
  on public.exchange_rates for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own exchange rates"
  on public.exchange_rates for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.create_currency_transfer_transaction(
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_from_amount numeric,
  p_to_amount numeric,
  p_from_exchange_rate numeric,
  p_to_exchange_rate numeric,
  p_occurred_at date,
  p_status text,
  p_category text,
  p_payee text,
  p_description text,
  p_notes text
)
returns setof public.transactions
language plpgsql
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_transfer_group_id uuid := gen_random_uuid();
  v_from_currency text;
  v_to_currency text;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to create a transfer.';
  end if;

  if p_from_account_id = p_to_account_id then
    raise exception 'A transfer requires two different accounts.';
  end if;

  if p_from_amount <= 0 or p_to_amount <= 0 then
    raise exception 'Transfer amounts must be greater than zero.';
  end if;

  if p_from_exchange_rate <= 0 or p_to_exchange_rate <= 0 then
    raise exception 'Transfer exchange rates must be greater than zero.';
  end if;

  if p_status not in ('pending', 'cleared', 'reconciled') then
    raise exception 'Invalid transaction status.';
  end if;

  select currency into v_from_currency
  from public.accounts
  where id = p_from_account_id
    and user_id = v_user_id
    and archived = false;

  select currency into v_to_currency
  from public.accounts
  where id = p_to_account_id
    and user_id = v_user_id
    and archived = false;

  if v_from_currency is null or v_to_currency is null then
    raise exception 'Both transfer accounts must be active accounts you own.';
  end if;

  insert into public.transactions (
    user_id, account_id, to_account_id, type, amount, currency, exchange_rate,
    category, payee, description, occurred_at, status, notes,
    transfer_group_id, transfer_direction
  )
  values (
    v_user_id, p_from_account_id, p_to_account_id, 'transfer', p_from_amount,
    v_from_currency, p_from_exchange_rate, p_category, p_payee, p_description,
    coalesce(p_occurred_at, current_date), p_status, p_notes,
    v_transfer_group_id, 'debit'
  );

  insert into public.transactions (
    user_id, account_id, to_account_id, type, amount, currency, exchange_rate,
    category, payee, description, occurred_at, status, notes,
    transfer_group_id, transfer_direction
  )
  values (
    v_user_id, p_to_account_id, p_from_account_id, 'transfer', p_to_amount,
    v_to_currency, p_to_exchange_rate, p_category, p_payee, p_description,
    coalesce(p_occurred_at, current_date), p_status, p_notes,
    v_transfer_group_id, 'credit'
  );

  return query
    select *
    from public.transactions
    where transfer_group_id = v_transfer_group_id
    order by (transfer_direction = 'debit') desc;
end;
$$;

create or replace function public.update_currency_transfer_transaction(
  p_transaction_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_from_amount numeric,
  p_to_amount numeric,
  p_from_exchange_rate numeric,
  p_to_exchange_rate numeric,
  p_occurred_at date,
  p_status text,
  p_category text,
  p_payee text,
  p_description text,
  p_notes text
)
returns setof public.transactions
language plpgsql
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_transfer_group_id uuid;
  v_from_currency text;
  v_to_currency text;
begin
  select transfer_group_id
  into v_transfer_group_id
  from public.transactions
  where id = p_transaction_id
    and user_id = v_user_id
    and type = 'transfer'
    and transfer_direction = 'debit';

  if v_transfer_group_id is null then
    raise exception 'The transfer could not be found.';
  end if;

  if p_from_account_id = p_to_account_id or p_from_amount <= 0 or p_to_amount <= 0 then
    raise exception 'A transfer requires two different accounts and positive amounts.';
  end if;

  if p_from_exchange_rate <= 0 or p_to_exchange_rate <= 0 then
    raise exception 'Transfer exchange rates must be greater than zero.';
  end if;

  if p_status not in ('pending', 'cleared', 'reconciled') then
    raise exception 'Invalid transaction status.';
  end if;

  select currency into v_from_currency
  from public.accounts
  where id = p_from_account_id
    and user_id = v_user_id
    and archived = false;

  select currency into v_to_currency
  from public.accounts
  where id = p_to_account_id
    and user_id = v_user_id
    and archived = false;

  if v_from_currency is null or v_to_currency is null then
    raise exception 'Both transfer accounts must be active accounts you own.';
  end if;

  update public.transactions
  set account_id = p_from_account_id,
      to_account_id = p_to_account_id,
      amount = p_from_amount,
      currency = v_from_currency,
      exchange_rate = p_from_exchange_rate,
      category = p_category,
      payee = p_payee,
      description = p_description,
      occurred_at = coalesce(p_occurred_at, current_date),
      status = p_status,
      notes = p_notes,
      updated_at = timezone('utc', now())
  where transfer_group_id = v_transfer_group_id
    and user_id = v_user_id
    and transfer_direction = 'debit';

  update public.transactions
  set account_id = p_to_account_id,
      to_account_id = p_from_account_id,
      amount = p_to_amount,
      currency = v_to_currency,
      exchange_rate = p_to_exchange_rate,
      category = p_category,
      payee = p_payee,
      description = p_description,
      occurred_at = coalesce(p_occurred_at, current_date),
      status = p_status,
      notes = p_notes,
      updated_at = timezone('utc', now())
  where transfer_group_id = v_transfer_group_id
    and user_id = v_user_id
    and transfer_direction = 'credit';

  return query
    select *
    from public.transactions
    where transfer_group_id = v_transfer_group_id
    order by (transfer_direction = 'debit') desc;
end;
$$;

revoke all on function public.create_currency_transfer_transaction(uuid, uuid, numeric, numeric, numeric, numeric, date, text, text, text, text, text) from public;
grant execute on function public.create_currency_transfer_transaction(uuid, uuid, numeric, numeric, numeric, numeric, date, text, text, text, text, text) to authenticated;
revoke all on function public.update_currency_transfer_transaction(uuid, uuid, uuid, numeric, numeric, numeric, numeric, date, text, text, text, text, text) from public;
grant execute on function public.update_currency_transfer_transaction(uuid, uuid, uuid, numeric, numeric, numeric, numeric, date, text, text, text, text, text) to authenticated;
