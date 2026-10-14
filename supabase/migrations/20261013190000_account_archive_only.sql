-- Accounts are part of the user's financial history and must not be deleted.
-- Archive/unarchive through the archived column instead.

revoke delete on table public.accounts from authenticated;

drop policy if exists "Users can manage their own accounts" on public.accounts;
drop policy if exists "Users can view their own accounts" on public.accounts;
drop policy if exists "Users can create their own accounts" on public.accounts;
drop policy if exists "Users can update their own accounts" on public.accounts;

create policy "Users can view their own accounts" on public.accounts
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own accounts" on public.accounts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own accounts" on public.accounts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
