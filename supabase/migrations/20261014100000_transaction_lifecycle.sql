-- Complete the transaction lifecycle.
--
-- Transfers are represented by two linked rows: a debit row on the source
-- account and a credit row on the destination account. Existing legacy
-- transfer rows are upgraded to that shape before the constraints are added.

alter table public.transactions
  add column if not exists transfer_direction text;

update public.transactions
set transfer_group_id = coalesce(transfer_group_id, gen_random_uuid()),
    transfer_direction = coalesce(transfer_direction, 'debit')
where type = 'transfer';

insert into public.transactions (
  user_id,
  account_id,
  to_account_id,
  type,
  amount,
  currency,
  exchange_rate,
  category_id,
  subcategory_id,
  category,
  subcategory,
  payee_id,
  payee,
  description,
  occurred_at,
  status,
  notes,
  transfer_group_id,
  transfer_direction
)
select
  debit.user_id,
  debit.to_account_id,
  debit.account_id,
  'transfer',
  debit.amount,
  debit.currency,
  debit.exchange_rate,
  debit.category_id,
  debit.subcategory_id,
  debit.category,
  debit.subcategory,
  debit.payee_id,
  debit.payee,
  debit.description,
  debit.occurred_at,
  debit.status,
  debit.notes,
  debit.transfer_group_id,
  'credit'
from public.transactions debit
where debit.type = 'transfer'
  and debit.transfer_direction = 'debit'
  and debit.to_account_id is not null
  and not exists (
    select 1
    from public.transactions credit
    where credit.transfer_group_id = debit.transfer_group_id
      and credit.transfer_direction = 'credit'
  );

create unique index if not exists transactions_transfer_group_direction_idx
  on public.transactions (transfer_group_id, transfer_direction)
  where transfer_group_id is not null;

alter table public.transactions
  drop constraint if exists transactions_transfer_direction_check;

alter table public.transactions
  add constraint transactions_transfer_direction_check
  check (transfer_direction is null or transfer_direction in ('debit', 'credit'));

alter table public.transactions
  drop constraint if exists transactions_transfer_shape_check;

alter table public.transactions
  add constraint transactions_transfer_shape_check
  check (
    (
      type = 'transfer'
      and transfer_group_id is not null
      and transfer_direction is not null
      and to_account_id is not null
      and to_account_id <> account_id
    )
    or (
      type <> 'transfer'
      and transfer_group_id is null
      and transfer_direction is null
      and to_account_id is null
    )
  ) not valid;

alter table public.transactions
  validate constraint transactions_transfer_shape_check;

create or replace function public.create_transfer_transaction(
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_currency text,
  p_exchange_rate numeric,
  p_occurred_at date,
  p_status text,
  p_category text,
  p_payee text,
  p_description text,
  p_notes text
)
returns setof public.transactions
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_transfer_group_id uuid := gen_random_uuid();
  v_currency text := upper(trim(p_currency));
begin
  if v_user_id is null then
    raise exception 'You must be signed in to create a transfer.';
  end if;
  if p_from_account_id is null or p_to_account_id is null or p_from_account_id = p_to_account_id then
    raise exception 'A transfer requires two different accounts.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Transfer amount must be greater than zero.';
  end if;
  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'Transfer currency must be a 3-letter code.';
  end if;
  if p_exchange_rate is null or p_exchange_rate <= 0 then
    raise exception 'Exchange rate must be greater than zero.';
  end if;
  if p_status not in ('pending', 'cleared', 'reconciled') then
    raise exception 'Invalid transaction status.';
  end if;
  if not exists (select 1 from public.accounts where id = p_from_account_id and user_id = v_user_id and archived = false) then
    raise exception 'The source account is not available.';
  end if;
  if not exists (select 1 from public.accounts where id = p_to_account_id and user_id = v_user_id and archived = false) then
    raise exception 'The destination account is not available.';
  end if;

  insert into public.transactions (
    user_id, account_id, to_account_id, type, amount, currency,
    exchange_rate, category, payee, description, occurred_at, status,
    notes, transfer_group_id, transfer_direction
  ) values (
    v_user_id, p_from_account_id, p_to_account_id, 'transfer', p_amount, v_currency,
    p_exchange_rate, p_category, p_payee, p_description, coalesce(p_occurred_at, current_date), p_status,
    p_notes, v_transfer_group_id, 'debit'
  );

  insert into public.transactions (
    user_id, account_id, to_account_id, type, amount, currency,
    exchange_rate, category, payee, description, occurred_at, status,
    notes, transfer_group_id, transfer_direction
  ) values (
    v_user_id, p_to_account_id, p_from_account_id, 'transfer', p_amount, v_currency,
    p_exchange_rate, p_category, p_payee, p_description, coalesce(p_occurred_at, current_date), p_status,
    p_notes, v_transfer_group_id, 'credit'
  );

  return query
    select *
    from public.transactions
    where transfer_group_id = v_transfer_group_id
    order by (transfer_direction = 'debit') desc;
end;
$$;

create or replace function public.update_transfer_transaction(
  p_transaction_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_currency text,
  p_exchange_rate numeric,
  p_occurred_at date,
  p_status text,
  p_category text,
  p_payee text,
  p_description text,
  p_notes text
)
returns setof public.transactions
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_transfer_group_id uuid;
  v_currency text := upper(trim(p_currency));
begin
  select transfer_group_id
  into v_transfer_group_id
  from public.transactions
  where id = p_transaction_id
    and user_id = v_user_id
    and type = 'transfer';

  if v_transfer_group_id is null then
    raise exception 'The transfer could not be found.';
  end if;
  if p_from_account_id is null or p_to_account_id is null or p_from_account_id = p_to_account_id then
    raise exception 'A transfer requires two different accounts.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Transfer amount must be greater than zero.';
  end if;
  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'Transfer currency must be a 3-letter code.';
  end if;
  if p_exchange_rate is null or p_exchange_rate <= 0 then
    raise exception 'Exchange rate must be greater than zero.';
  end if;
  if p_status not in ('pending', 'cleared', 'reconciled') then
    raise exception 'Invalid transaction status.';
  end if;
  if not exists (select 1 from public.accounts where id = p_from_account_id and user_id = v_user_id and archived = false) then
    raise exception 'The source account is not available.';
  end if;
  if not exists (select 1 from public.accounts where id = p_to_account_id and user_id = v_user_id and archived = false) then
    raise exception 'The destination account is not available.';
  end if;

  update public.transactions
  set account_id = p_from_account_id,
      to_account_id = p_to_account_id,
      amount = p_amount,
      currency = v_currency,
      exchange_rate = p_exchange_rate,
      category = p_category,
      payee = p_payee,
      description = p_description,
      occurred_at = coalesce(p_occurred_at, current_date),
      status = p_status,
      notes = p_notes,
      updated_at = timezone('utc', now())
  where user_id = v_user_id
    and transfer_group_id = v_transfer_group_id
    and transfer_direction = 'debit';

  update public.transactions
  set account_id = p_to_account_id,
      to_account_id = p_from_account_id,
      amount = p_amount,
      currency = v_currency,
      exchange_rate = p_exchange_rate,
      category = p_category,
      payee = p_payee,
      description = p_description,
      occurred_at = coalesce(p_occurred_at, current_date),
      status = p_status,
      notes = p_notes,
      updated_at = timezone('utc', now())
  where user_id = v_user_id
    and transfer_group_id = v_transfer_group_id
    and transfer_direction = 'credit';

  return query
    select *
    from public.transactions
    where transfer_group_id = v_transfer_group_id
    order by (transfer_direction = 'debit') desc;
end;
$$;

create or replace function public.delete_transaction(p_transaction_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_transfer_group_id uuid;
begin
  select transfer_group_id
  into v_transfer_group_id
  from public.transactions
  where id = p_transaction_id
    and user_id = v_user_id;

  if not found then
    raise exception 'The transaction could not be found.';
  end if;

  if v_transfer_group_id is null then
    delete from public.transactions where id = p_transaction_id and user_id = v_user_id;
  else
    delete from public.transactions where transfer_group_id = v_transfer_group_id and user_id = v_user_id;
  end if;
end;
$$;

revoke all on function public.create_transfer_transaction(uuid, uuid, numeric, text, numeric, date, text, text, text, text, text) from public;
grant execute on function public.create_transfer_transaction(uuid, uuid, numeric, text, numeric, date, text, text, text, text, text) to authenticated;
revoke all on function public.update_transfer_transaction(uuid, uuid, uuid, numeric, text, numeric, date, text, text, text, text, text) from public;
grant execute on function public.update_transfer_transaction(uuid, uuid, uuid, numeric, text, numeric, date, text, text, text, text, text) to authenticated;
revoke all on function public.delete_transaction(uuid) from public;
grant execute on function public.delete_transaction(uuid) to authenticated;
