# KipCash

KipCash is a personal expense-management app built with Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Redux Toolkit, and Supabase.

## Local development

```sh
npm install
npm run dev
```

The app runs on the Next.js App Router. The main routes are:

- `/` — landing page
- `/finance` — accounts, balances, and unified transactions workspace
- `/profile` — personal details and password security

The former `/manage-expenses` and `/expenses` URLs redirect to `/finance` so existing bookmarks continue to work.

After deploying this cutover, apply [`supabase/migrations/20261013170000_remove_legacy_expenses.sql`](supabase/migrations/20261013170000_remove_legacy_expenses.sql) manually to remove the obsolete `public.expenses` table. This is intentionally destructive and does not affect `auth.users` or `public.profiles`.

Before using profile editing, apply [`supabase/migrations/20261013180000_add_profile_details.sql`](supabase/migrations/20261013180000_add_profile_details.sql) manually. Configure Supabase Auth reauthentication email templates to display the OTP token with `{{ .Token }}`.

Before using `/finance`, apply [`supabase/schema/finance-workspace.sql`](supabase/schema/finance-workspace.sql) in the Supabase SQL editor. The screen shows a setup message if the new tables are not available yet.

## Environment variables

Create `.env.local` with the Supabase project URL and publishable key:

```sh
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Checks

```sh
npm run lint
npx tsc --noEmit
npm run build
```
