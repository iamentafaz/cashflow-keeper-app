-- Add editable profile details while preserving existing auth.users and profiles.id values.

alter table public.profiles
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists default_currency text not null default 'INR',
  add column if not exists timezone text not null default 'Asia/Calcutta',
  add column if not exists locale text not null default 'en-IN',
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.profiles enable row level security;

grant select, insert, update on public.profiles to authenticated;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

