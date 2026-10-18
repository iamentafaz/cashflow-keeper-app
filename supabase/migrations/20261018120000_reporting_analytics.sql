-- Reporting and analytics aggregation.
-- Apply after 20261016100000_reconciliation_and_receipts.sql.

alter table public.transactions
  add column if not exists exchange_rate_base_currency text not null default 'INR';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'transactions_exchange_rate_base_currency_check'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint transactions_exchange_rate_base_currency_check
      check (exchange_rate_base_currency ~ '^[A-Z]{3}$');
  end if;
end
$$;

create or replace function public.set_transaction_exchange_rate_base_currency()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_currency text;
begin
  select default_currency into v_currency
  from public.profiles
  where id = new.user_id;

  if v_currency is not null and v_currency ~ '^[A-Z]{3}$' then
    new.exchange_rate_base_currency := v_currency;
  end if;

  return new;
end;
$$;

drop trigger if exists set_transaction_exchange_rate_base_currency on public.transactions;
create trigger set_transaction_exchange_rate_base_currency
  before insert or update of amount, currency, exchange_rate, user_id on public.transactions
  for each row execute function public.set_transaction_exchange_rate_base_currency();

create index if not exists transactions_user_reporting_filters_idx
  on public.transactions(user_id, occurred_at desc, account_id, category_id, payee_id);

create or replace function public.get_finance_report(
  p_start_date date default null,
  p_end_date date default current_date,
  p_compare_start_date date default null,
  p_compare_end_date date default null,
  p_base_currency text default 'INR',
  p_account_id uuid default null,
  p_category text default null,
  p_payee text default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_metrics jsonb;
  v_comparison jsonb;
  v_trend jsonb;
  v_categories jsonb;
  v_payees jsonb;
  v_accounts jsonb;
  v_status jsonb;
  v_account_balances jsonb;
  v_net_worth jsonb;
  v_recent jsonb;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to view reports.';
  end if;

  if p_base_currency is null or p_base_currency !~ '^[A-Z]{3}$' then
    raise exception 'Reporting currency must be a 3-letter code.';
  end if;

  with rows as (
    select
      t.*,
      coalesce(nullif(trim(t.category), ''), c.name, 'Uncategorized') as category_name,
      coalesce(nullif(trim(t.payee), ''), p.name, 'Unknown payee') as payee_name,
      a.name as account_name,
      a.type as account_type,
      case
        when t.currency = p_base_currency then t.amount
        when t.exchange_rate_base_currency = p_base_currency then t.amount * t.exchange_rate
        when er.rate is not null then t.amount / er.rate
        else null
      end as converted_amount
    from public.transactions t
    left join public.categories c on c.id = t.category_id
    left join public.payees p on p.id = t.payee_id
    left join public.accounts a on a.id = t.account_id
    left join lateral (
      select rate
      from public.exchange_rates
      where (user_id = v_user_id or user_id is null)
        and base_currency = p_base_currency
        and quote_currency = t.currency
        and rate_date <= coalesce(t.occurred_at, current_date)
      order by (user_id = v_user_id) desc, rate_date desc
      limit 1
    ) er on true
    where t.user_id = v_user_id
      and (p_account_id is null or t.account_id = p_account_id)
      and (p_category is null or lower(coalesce(nullif(trim(t.category), ''), c.name, 'Uncategorized')) = lower(p_category))
      and (p_payee is null or lower(coalesce(nullif(trim(t.payee), ''), p.name, 'Unknown payee')) = lower(p_payee))
  )
  select jsonb_build_object(
    'income', coalesce(sum(converted_amount) filter (where type in ('income', 'refund') and (p_start_date is null or occurred_at >= p_start_date) and (p_end_date is null or occurred_at <= p_end_date)), 0),
    'expenses', coalesce(sum(converted_amount) filter (where type = 'expense' and (p_start_date is null or occurred_at >= p_start_date) and (p_end_date is null or occurred_at <= p_end_date)), 0),
    'net', coalesce(sum(converted_amount) filter (where type in ('income', 'refund') and (p_start_date is null or occurred_at >= p_start_date) and (p_end_date is null or occurred_at <= p_end_date)), 0) - coalesce(sum(converted_amount) filter (where type = 'expense' and (p_start_date is null or occurred_at >= p_start_date) and (p_end_date is null or occurred_at <= p_end_date)), 0),
    'pending', count(*) filter (where (p_start_date is null or occurred_at >= p_start_date) and (p_end_date is null or occurred_at <= p_end_date) and status = 'pending'),
    'transactions', count(*) filter (where (p_start_date is null or occurred_at >= p_start_date) and (p_end_date is null or occurred_at <= p_end_date)),
    'missingConversions', count(*) filter (where (p_start_date is null or occurred_at >= p_start_date) and (p_end_date is null or occurred_at <= p_end_date) and converted_amount is null and currency <> p_base_currency)
  ) into v_metrics
  from rows;

  if p_compare_start_date is null or p_compare_end_date is null then
    v_comparison := null;
  else
    with rows as (
      select
        t.type,
        t.occurred_at,
        case
          when t.currency = p_base_currency then t.amount
          when t.exchange_rate_base_currency = p_base_currency then t.amount * t.exchange_rate
          when er.rate is not null then t.amount / er.rate
          else null
        end as converted_amount
      from public.transactions t
      left join public.categories c on c.id = t.category_id
      left join public.payees p on p.id = t.payee_id
      left join lateral (
        select rate
        from public.exchange_rates
        where (user_id = v_user_id or user_id is null)
          and base_currency = p_base_currency
          and quote_currency = t.currency
          and rate_date <= coalesce(t.occurred_at, current_date)
        order by (user_id = v_user_id) desc, rate_date desc
        limit 1
      ) er on true
      where t.user_id = v_user_id
        and (p_account_id is null or t.account_id = p_account_id)
        and (p_category is null or lower(coalesce(nullif(trim(t.category), ''), c.name, 'Uncategorized')) = lower(p_category))
        and (p_payee is null or lower(coalesce(nullif(trim(t.payee), ''), p.name, 'Unknown payee')) = lower(p_payee))
    )
    select jsonb_build_object(
      'income', coalesce(sum(converted_amount) filter (where type in ('income', 'refund')), 0),
      'expenses', coalesce(sum(converted_amount) filter (where type = 'expense'), 0),
      'net', coalesce(sum(converted_amount) filter (where type in ('income', 'refund')), 0) - coalesce(sum(converted_amount) filter (where type = 'expense'), 0),
      'pending', count(*) filter (where type is not null),
      'transactions', count(*),
      'missingConversions', count(*) filter (where converted_amount is null)
    ) into v_comparison
    from rows
    where occurred_at >= p_compare_start_date and occurred_at <= p_compare_end_date;
  end if;

  with rows as (
    select date_trunc('month', t.occurred_at)::date as month_start,
      sum(case when t.type in ('income', 'refund') then coalesce(case when t.currency = p_base_currency then t.amount when t.exchange_rate_base_currency = p_base_currency then t.amount * t.exchange_rate when er.rate is not null then t.amount / er.rate else null end, 0) else 0 end) as income,
      sum(case when t.type = 'expense' then coalesce(case when t.currency = p_base_currency then t.amount when t.exchange_rate_base_currency = p_base_currency then t.amount * t.exchange_rate when er.rate is not null then t.amount / er.rate else null end, 0) else 0 end) as expenses
    from public.transactions t
    left join lateral (
      select rate from public.exchange_rates
      where (user_id = v_user_id or user_id is null)
        and base_currency = p_base_currency and quote_currency = t.currency
        and rate_date <= t.occurred_at
      order by (user_id = v_user_id) desc, rate_date desc
      limit 1
    ) er on true
    where t.user_id = v_user_id
      and (p_start_date is null or t.occurred_at >= p_start_date)
      and (p_end_date is null or t.occurred_at <= p_end_date)
      and (p_account_id is null or t.account_id = p_account_id)
    group by date_trunc('month', t.occurred_at)::date
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', to_char(month_start, 'YYYY-MM'),
    'month', to_char(month_start, 'Mon YY'),
    'income', income,
    'expenses', expenses,
    'net', income - expenses
  ) order by month_start), '[]'::jsonb) into v_trend
  from rows;

  with grouped as (
    select coalesce(nullif(trim(t.category), ''), c.name, 'Uncategorized') as name,
      sum(case when t.currency = p_base_currency then t.amount when t.exchange_rate_base_currency = p_base_currency then t.amount * t.exchange_rate when er.rate is not null then t.amount / er.rate else 0 end) as amount
    from public.transactions t
    left join public.categories c on c.id = t.category_id
    left join lateral (
      select rate from public.exchange_rates
      where (user_id = v_user_id or user_id is null)
        and base_currency = p_base_currency and quote_currency = t.currency
        and rate_date <= t.occurred_at
      order by (user_id = v_user_id) desc, rate_date desc
      limit 1
    ) er on true
    where t.user_id = v_user_id
      and t.type = 'expense'
      and (p_start_date is null or t.occurred_at >= p_start_date)
      and (p_end_date is null or t.occurred_at <= p_end_date)
      and (p_account_id is null or t.account_id = p_account_id)
      and (p_payee is null or lower(coalesce(nullif(trim(t.payee), ''), 'Unknown payee')) = lower(p_payee))
    group by 1
  ), totals as (
    select coalesce(sum(amount), 0) as total from grouped
  ), rows as (
    select * from grouped order by amount desc limit 8
  )
  select coalesce(jsonb_agg(jsonb_build_object('name', rows.name, 'amount', rows.amount, 'percentage', case when totals.total = 0 then 0 else rows.amount / totals.total * 100 end) order by rows.amount desc), '[]'::jsonb) into v_categories
  from rows cross join totals;

  with grouped as (
    select coalesce(nullif(trim(t.payee), ''), p.name, 'Unknown payee') as name,
      sum(case when t.currency = p_base_currency then t.amount when t.exchange_rate_base_currency = p_base_currency then t.amount * t.exchange_rate when er.rate is not null then t.amount / er.rate else 0 end) as amount
    from public.transactions t
    left join public.payees p on p.id = t.payee_id
    left join lateral (
      select rate from public.exchange_rates
      where (user_id = v_user_id or user_id is null)
        and base_currency = p_base_currency and quote_currency = t.currency
        and rate_date <= t.occurred_at
      order by (user_id = v_user_id) desc, rate_date desc
      limit 1
    ) er on true
    where t.user_id = v_user_id
      and t.type = 'expense'
      and (p_start_date is null or t.occurred_at >= p_start_date)
      and (p_end_date is null or t.occurred_at <= p_end_date)
      and (p_account_id is null or t.account_id = p_account_id)
      and (p_category is null or lower(coalesce(nullif(trim(t.category), ''), 'Uncategorized')) = lower(p_category))
    group by 1
  ), totals as (
    select coalesce(sum(amount), 0) as total from grouped
  ), rows as (
    select * from grouped order by amount desc limit 8
  )
  select coalesce(jsonb_agg(jsonb_build_object('name', rows.name, 'amount', rows.amount, 'percentage', case when totals.total = 0 then 0 else rows.amount / totals.total * 100 end) order by rows.amount desc), '[]'::jsonb) into v_payees
  from rows cross join totals;

  with grouped as (
    select a.id as account_id, a.name,
      sum(case when t.currency = p_base_currency then t.amount when t.exchange_rate_base_currency = p_base_currency then t.amount * t.exchange_rate when er.rate is not null then t.amount / er.rate else 0 end) as amount
    from public.transactions t
    join public.accounts a on a.id = t.account_id
    left join lateral (
      select rate from public.exchange_rates
      where (user_id = v_user_id or user_id is null)
        and base_currency = p_base_currency and quote_currency = t.currency
        and rate_date <= t.occurred_at
      order by (user_id = v_user_id) desc, rate_date desc
      limit 1
    ) er on true
    where t.user_id = v_user_id
      and t.type = 'expense'
      and (p_start_date is null or t.occurred_at >= p_start_date)
      and (p_end_date is null or t.occurred_at <= p_end_date)
      and (p_account_id is null or t.account_id = p_account_id)
      and (p_category is null or lower(coalesce(nullif(trim(t.category), ''), 'Uncategorized')) = lower(p_category))
      and (p_payee is null or lower(coalesce(nullif(trim(t.payee), ''), 'Unknown payee')) = lower(p_payee))
    group by a.id, a.name
  ), totals as (
    select coalesce(sum(amount), 0) as total from grouped
  ), rows as (
    select * from grouped order by amount desc limit 8
  )
  select coalesce(jsonb_agg(jsonb_build_object('accountId', rows.account_id, 'name', rows.name, 'amount', rows.amount, 'percentage', case when totals.total = 0 then 0 else rows.amount / totals.total * 100 end) order by rows.amount desc), '[]'::jsonb) into v_accounts
  from rows cross join totals;

  select coalesce(jsonb_agg(jsonb_build_object('name', initcap(status), 'value', total) order by status), '[]'::jsonb) into v_status
  from (
    select t.status, count(*) as total
    from public.transactions t
    where t.user_id = v_user_id
      and (p_start_date is null or t.occurred_at >= p_start_date)
      and (p_end_date is null or t.occurred_at <= p_end_date)
      and (p_account_id is null or t.account_id = p_account_id)
    group by t.status
  ) statuses;

  with balances as (
    select a.id, a.name, a.type, a.currency, a.archived,
      a.opening_balance + coalesce(sum(case
        when t.type = 'transfer' and t.transfer_direction = 'credit' then t.amount
        when t.type = 'transfer' and t.transfer_direction = 'debit' then -t.amount
        when t.type in ('income', 'refund') then t.amount
        when t.type = 'expense' then -t.amount
        else 0
      end) filter (where t.occurred_at <= p_end_date), 0) as balance
    from public.accounts a
    left join public.transactions t on t.account_id = a.id and t.user_id = v_user_id
    where a.user_id = v_user_id
    group by a.id, a.name, a.type, a.currency, a.archived
  ), converted as (
    select b.*, case when b.currency = p_base_currency then b.balance else b.balance / nullif(er.rate, 0) end as converted_balance
    from balances b
    left join lateral (
      select rate from public.exchange_rates
      where (user_id = v_user_id or user_id is null)
        and base_currency = p_base_currency and quote_currency = b.currency
        and rate_date <= p_end_date
      order by (user_id = v_user_id) desc, rate_date desc
      limit 1
    ) er on true
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'type', type, 'currency', currency, 'balance', balance, 'convertedBalance', converted_balance, 'archived', archived) order by converted_balance desc nulls last), '[]'::jsonb) into v_account_balances
  from converted;

  with balances as (
    select a.type,
      a.opening_balance + coalesce(sum(case
        when t.type = 'transfer' and t.transfer_direction = 'credit' then t.amount
        when t.type = 'transfer' and t.transfer_direction = 'debit' then -t.amount
        when t.type in ('income', 'refund') then t.amount
        when t.type = 'expense' then -t.amount
        else 0
      end) filter (where t.occurred_at <= p_end_date), 0) as balance,
      case when a.currency = p_base_currency then 1 else 1 / nullif(er.rate, 0) end as conversion
    from public.accounts a
    left join public.transactions t on t.account_id = a.id and t.user_id = v_user_id
    left join lateral (
      select rate from public.exchange_rates
      where (user_id = v_user_id or user_id is null)
        and base_currency = p_base_currency and quote_currency = a.currency
        and rate_date <= p_end_date
      order by (user_id = v_user_id) desc, rate_date desc
      limit 1
    ) er on true
    where a.user_id = v_user_id
    group by a.id, a.type, a.currency, er.rate
  ), amounts as (
    select type, balance * conversion as amount from balances where conversion is not null
  )
  select jsonb_build_object(
    'assets', coalesce(sum(case when type <> 'credit_card' and amount > 0 then amount when type = 'credit_card' and amount > 0 then amount else 0 end), 0),
    'liabilities', coalesce(sum(case when amount < 0 then -amount else 0 end), 0),
    'netWorth', coalesce(sum(amount), 0)
  ) into v_net_worth
  from amounts;

  with rows as (
    select t.id, t.type, t.amount, t.currency, t.exchange_rate, t.exchange_rate_base_currency,
      t.category, t.payee, t.description, t.occurred_at, t.status, t.created_at,
      case when t.currency = p_base_currency then t.amount
        when t.exchange_rate_base_currency = p_base_currency then t.amount * t.exchange_rate
        when er.rate is not null then t.amount / er.rate
        else null end as converted_amount
    from public.transactions t
    left join lateral (
      select rate from public.exchange_rates
      where (user_id = v_user_id or user_id is null)
        and base_currency = p_base_currency and quote_currency = t.currency
        and rate_date <= t.occurred_at
      order by (user_id = v_user_id) desc, rate_date desc
      limit 1
    ) er on true
    where t.user_id = v_user_id
      and (p_start_date is null or t.occurred_at >= p_start_date)
      and (p_end_date is null or t.occurred_at <= p_end_date)
      and (p_account_id is null or t.account_id = p_account_id)
      and (t.type <> 'transfer' or t.transfer_direction = 'debit')
    order by t.occurred_at desc, t.created_at desc
    limit 8
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'type', type, 'amount', amount, 'currency', currency,
    'exchangeRate', exchange_rate, 'exchangeRateBaseCurrency', exchange_rate_base_currency,
    'convertedAmount', converted_amount, 'category', category, 'payee', payee,
    'description', description, 'occurredAt', occurred_at, 'status', status
  ) order by occurred_at desc, created_at desc), '[]'::jsonb) into v_recent
  from rows;

  return jsonb_build_object(
    'reportingCurrency', p_base_currency,
    'metrics', v_metrics,
    'comparison', v_comparison,
    'trend', v_trend,
    'categories', v_categories,
    'payees', v_payees,
    'accounts', v_accounts,
    'status', v_status,
    'accountBalances', v_account_balances,
    'netWorth', v_net_worth,
    'recentTransactions', v_recent
  );
end;
$$;

revoke all on function public.get_finance_report(date, date, date, date, text, uuid, text, text) from public, anon;
grant execute on function public.get_finance_report(date, date, date, date, text, uuid, text, text) to authenticated;
