# Finance Management Roadmap

Tracking document for the remaining personal-finance management work.

Status reviewed: 2026-10-18

## Overall status

- [x] Complete reporting and analytics
- [ ] Build budgets and savings goals
- [ ] Build recurring transactions
- [ ] Build import and export
- [ ] Add large-data transaction support

Recommended delivery order:

1. Large-data transaction support
2. Complete reporting and analytics
3. Budgets and savings goals
4. Recurring transactions
5. Import and export

## 1. Reporting and analytics — complete

Current implementation:

- [x] Reports route at `/reports`
- [x] Chart.js integration
- [x] Cash-flow trend chart
- [x] Spending by category chart
- [x] Account balance overview
- [x] Transaction health/status visualization
- [x] Recent transaction activity
- [x] Month, quarter, year, and all-time filters
- [x] Basic reporting-currency display

Remaining work:

- [x] Add spending by payee/merchant
- [x] Add spending by account
- [x] Add a true net-worth overview across assets and liabilities
- [x] Add period-over-period comparisons
- [x] Add custom date-range selection
- [x] Centralize and verify base-currency conversion across all reports
- [x] Move report aggregation to scalable database queries or reporting views

## 2. Budgets and savings goals — not started

Database:

- [ ] Add budget tables and row-level security policies
- [ ] Support monthly and category-specific budgets
- [ ] Add savings-goal tables, targets, deadlines, and archived state

UI and behavior:

- [ ] Create budgets management page
- [ ] Create savings-goals management page
- [ ] Add budget progress indicators
- [ ] Add spent, remaining, and projected amounts
- [ ] Add overspending warnings
- [ ] Add goal progress and contribution tracking
- [ ] Add dashboard summaries and empty states

## 3. Recurring transactions — not started

Data and rules:

- [ ] Add recurring transaction definitions
- [ ] Support daily, weekly, monthly, yearly, and custom recurrence rules
- [ ] Support start date, end date, next run, timezone, and active/paused state
- [ ] Preserve links to generated transactions

Automation:

- [ ] Add Supabase Edge Function for due recurring transactions
- [ ] Schedule execution with Supabase Cron
- [ ] Make generation idempotent to prevent duplicates
- [ ] Add reminder notification handling

UI:

- [ ] Create recurring transactions page
- [ ] Add create, edit, pause, resume, and archive flows
- [ ] Add upcoming transactions view
- [ ] Show generation history and failures

## 4. Import and export — not started

CSV import:

- [ ] Add CSV upload UI
- [ ] Add column mapping for date, amount, type, account, category, payee, currency, and notes
- [ ] Add validation and import preview
- [ ] Add duplicate detection
- [ ] Add partial-failure reporting and retry support
- [ ] Preserve the original import batch for auditability

Export:

- [ ] Add filtered CSV export
- [ ] Add date-range and account filters to exports
- [ ] Add optional PDF report export
- [ ] Ensure exported amounts use the selected reporting currency where applicable

## 5. Large-data support — partially complete

Current implementation:

- [x] Client-side text search
- [x] Client-side type filtering
- [x] Client-side status filtering
- [x] Basic transaction/date indexes exist
- [x] Reusable pagination UI component exists

Remaining work:

- [ ] Add server-side pagination using Supabase range queries
- [ ] Add total-count or next-page metadata
- [ ] Add server-side date-range filtering
- [ ] Add account filtering
- [ ] Add category filtering
- [ ] Add payee filtering
- [ ] Add amount-range filtering
- [ ] Add explicit ascending/descending sorting
- [ ] Add debounced search against the server query
- [ ] Add database indexes for common combined filters
- [ ] Avoid loading the entire ledger in `FinanceWorkspace`
- [ ] Apply a scalable query strategy to reports as well

## Definition of done

The roadmap is complete when:

- Reports remain responsive with a large transaction history.
- Users can plan spending with budgets and savings goals.
- Recurring activity can be scheduled, reviewed, and safely generated.
- Users can migrate data in and out through validated CSV workflows.
- All new tables and functions have RLS, indexes, and migration files.
- Loading, empty, error, offline, and retry states are present for each new workflow.
