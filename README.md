# KipCash

KipCash is a personal expense-management app built with Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Redux Toolkit, and Supabase.

## Local development

```sh
npm install
npm run dev
```

The app runs on the Next.js App Router. The main routes are:

- `/` — landing page
- `/finance` — accounts, balances, and unified transactions overview
- `/reports` — cash-flow, spending, account-balance, and transaction-health insights
- `/accounts` — focused account management workspace
- `/transactions` — focused transaction management workspace
- `/categories` — searchable category and subcategory management
- `/payees` — searchable payee and merchant management
- `/reconciliation` — focused account reconciliation workspace
- `/profile` — personal details and password security

The former `/manage-expenses` and `/expenses` URLs redirect to `/finance` so existing bookmarks continue to work.

After deploying this cutover, apply [`supabase/migrations/20261013170000_remove_legacy_expenses.sql`](supabase/migrations/20261013170000_remove_legacy_expenses.sql) manually to remove the obsolete `public.expenses` table. This is intentionally destructive and does not affect `auth.users` or `public.profiles`.

Before using profile editing, apply [`supabase/migrations/20261013180000_add_profile_details.sql`](supabase/migrations/20261013180000_add_profile_details.sql) manually. Configure Supabase Auth reauthentication email templates to display the OTP token with `{{ .Token }}`.

Before using `/finance`, apply [`supabase/schema/finance-workspace.sql`](supabase/schema/finance-workspace.sql) in the Supabase SQL editor. The screen shows a setup message if the new tables are not available yet.

After applying the finance schema, apply [`supabase/migrations/20261014100000_transaction_lifecycle.sql`](supabase/migrations/20261014100000_transaction_lifecycle.sql) to enable editable/deletable transactions and linked debit/credit transfer records. Apply [`supabase/migrations/20261013190000_account_archive_only.sql`](supabase/migrations/20261013190000_account_archive_only.sql) to prevent account deletion and use archive/restore instead. Apply [`supabase/migrations/20261014110000_categories_payees_management.sql`](supabase/migrations/20261014110000_categories_payees_management.sql) to enable managed categories, subcategories, payees, and transaction ownership checks. Apply [`supabase/migrations/20261015100000_currency_exchange_management.sql`](supabase/migrations/20261015100000_currency_exchange_management.sql) to secure user exchange-rate caching and validate profile currencies. Apply [`supabase/migrations/20261016100000_reconciliation_and_receipts.sql`](supabase/migrations/20261016100000_reconciliation_and_receipts.sql) to enable reconciliation history and the private 5 MB receipts bucket.

Apply [`supabase/migrations/20261018120000_reporting_analytics.sql`](supabase/migrations/20261018120000_reporting_analytics.sql) to enable server-side report aggregation, historical exchange-rate base-currency tracking, reporting filters, and the `get_finance_report` RPC used by `/reports`.

## Environment variables

Create `.env.local` with the Supabase project URL, publishable key, and site URL:

```sh
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For an S3/CloudFront static export, set the same variables in the build environment before running `npm run build`. Copy `.env.example` to `.env.local` for local development, and replace `NEXT_PUBLIC_SITE_URL` with the deployed HTTPS URL in production.

Exchange rates use the keyless Frankfurter API. The app caches fetched rates in `public.exchange_rates` and stores the applied base-currency rate on each transaction.

## Checks

```sh
npm run lint
npx tsc --noEmit
npm run build
```
