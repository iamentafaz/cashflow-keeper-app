-- Remove the legacy expenses data path after the finance workspace cutover.
--
-- This intentionally does not touch auth.users or public.profiles. Existing
-- users can continue signing in and are redirected to /finance by the app.
-- Historical rows in public.expenses are permanently discarded by this drop.

drop table if exists public.expenses;
