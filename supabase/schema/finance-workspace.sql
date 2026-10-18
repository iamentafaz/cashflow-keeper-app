-- KipCash finance workspace schema.
-- Apply this in the Supabase SQL editor before opening /finance.
-- Every exposed table is protected by user ownership RLS.

create extension if not exists pgcrypto;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  type text not null check (type in ('bank', 'cash', 'credit_card', 'wallet')),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  opening_balance numeric(14, 2) not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  parent_id uuid references public.categories(id) on delete cascade,
  kind text not null default 'expense' check (kind in ('income', 'expense', 'both')),
  color text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, parent_id, name)
);

create table if not exists public.payees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  default_category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  base_currency text not null check (base_currency ~ '^[A-Z]{3}$'),
  quote_currency text not null check (quote_currency ~ '^[A-Z]{3}$'),
  rate numeric(20, 8) not null check (rate > 0),
  rate_date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, base_currency, quote_currency, rate_date)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  to_account_id uuid references public.accounts(id) on delete restrict,
  type text not null check (type in ('income', 'expense', 'transfer', 'refund')),
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  exchange_rate numeric(20, 8) not null default 1 check (exchange_rate > 0),
  exchange_rate_base_currency text not null default 'INR' check (exchange_rate_base_currency ~ '^[A-Z]{3}$'),
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.categories(id) on delete set null,
  category text,
  subcategory text,
  payee_id uuid references public.payees(id) on delete set null,
  payee text,
  description text,
  occurred_at date not null default current_date,
  status text not null default 'cleared' check (status in ('pending', 'cleared', 'reconciled')),
  notes text,
  transfer_group_id uuid,
  original_transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint valid_transfer_destination check (type <> 'transfer' or (to_account_id is not null and to_account_id <> account_id)),
  constraint same_user_accounts_are_required check (to_account_id is null or to_account_id <> account_id)
);

create table if not exists public.transaction_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  captured_at timestamptz,
  merchant_name text,
  receipt_total numeric(14, 2),
  receipt_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists accounts_user_id_idx on public.accounts(user_id);
create index if not exists transactions_user_date_idx on public.transactions(user_id, occurred_at desc, created_at desc);
create index if not exists transactions_account_id_idx on public.transactions(account_id);
create index if not exists transactions_status_idx on public.transactions(user_id, status);
create index if not exists transactions_user_reporting_filters_idx on public.transactions(user_id, occurred_at desc, account_id, category_id, payee_id);
create index if not exists attachments_transaction_id_idx on public.transaction_attachments(transaction_id);

alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.payees enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_attachments enable row level security;

grant select, insert, update, delete on public.accounts to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.payees to authenticated;
grant select, insert, update, delete on public.exchange_rates to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.transaction_attachments to authenticated;

drop policy if exists "Users can manage their own accounts" on public.accounts;
create policy "Users can manage their own accounts" on public.accounts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own categories" on public.categories;
create policy "Users can manage their own categories" on public.categories for all to authenticated
  using (user_id is null or (select auth.uid()) = user_id) with check (user_id is null or (select auth.uid()) = user_id);

drop policy if exists "Users can manage their own payees" on public.payees;
create policy "Users can manage their own payees" on public.payees for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own exchange rates" on public.exchange_rates;
create policy "Users can manage their own exchange rates" on public.exchange_rates for all to authenticated
  using (user_id is null or (select auth.uid()) = user_id) with check (user_id is null or (select auth.uid()) = user_id);

drop policy if exists "Users can manage their own transactions" on public.transactions;
create policy "Users can manage their own transactions" on public.transactions for all to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (select 1 from public.accounts source_account where source_account.id = account_id and source_account.user_id = (select auth.uid()))
    and (to_account_id is null or exists (select 1 from public.accounts destination_account where destination_account.id = to_account_id and destination_account.user_id = (select auth.uid())))
  )
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.accounts source_account where source_account.id = account_id and source_account.user_id = (select auth.uid()))
    and (to_account_id is null or exists (select 1 from public.accounts destination_account where destination_account.id = to_account_id and destination_account.user_id = (select auth.uid())))
  );

drop policy if exists "Users can manage their own attachments" on public.transaction_attachments;
create policy "Users can manage their own attachments" on public.transaction_attachments for all to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (select 1 from public.transactions linked_transaction where linked_transaction.id = transaction_id and linked_transaction.user_id = (select auth.uid()))
  )
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.transactions linked_transaction where linked_transaction.id = transaction_id and linked_transaction.user_id = (select auth.uid()))
  );

