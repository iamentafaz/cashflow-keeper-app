"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, BarChart3, CircleAlert, Clock3, Filter, Loader2, PieChart as PieChartIcon, Receipt, RefreshCw, ShieldCheck, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, ChartOptions, DoughnutController, LinearScale, Tooltip as ChartJSTooltip } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatReportDate, getReportPeriod, reportMetricDelta, accountIsLiability } from "@/lib/reporting";
import type { ReportResponse, ReportRange, ReportMetrics } from "@/types/reporting";

const chartColors = ["#8b7cff", "#2dd4bf", "#fbbf24", "#38bdf8", "#fb7185", "#a78bfa", "#f97316", "#22c55e"];
const statusColors = { Pending: "#fbbf24", Cleared: "#38bdf8", Reconciled: "#2dd4bf" };

ChartJS.register(ArcElement, BarElement, CategoryScale, DoughnutController, ChartJSTooltip, LinearScale);

type FilterOption = { id: string; name: string };

const EMPTY_REPORT: ReportResponse = {
  reportingCurrency: "INR",
  metrics: { income: 0, expenses: 0, net: 0, pending: 0, transactions: 0, missingConversions: 0 },
  comparison: null,
  trend: [],
  categories: [],
  payees: [],
  accounts: [],
  status: [],
  accountBalances: [],
  netWorth: { assets: 0, liabilities: 0, netWorth: 0 },
  recentTransactions: [],
};

function formatMoney(amount: number | null | undefined, currency: string) {
  if (amount == null || !Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return currency + " " + Math.round(amount).toLocaleString("en-IN");
  }
}

function formatCompactCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(amount);
  } catch {
    return Math.round(amount).toLocaleString("en-IN");
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong while loading reports.";
}

function normalizeReport(data: unknown): ReportResponse {
  const raw = (data || {}) as Partial<ReportResponse>;
  const metrics = { ...EMPTY_REPORT.metrics, ...(raw.metrics || {}) } as ReportMetrics;
  return {
    ...EMPTY_REPORT,
    ...raw,
    metrics: { ...metrics, income: Number(metrics.income) || 0, expenses: Number(metrics.expenses) || 0, net: Number(metrics.net) || 0, pending: Number(metrics.pending) || 0, transactions: Number(metrics.transactions) || 0, missingConversions: Number(metrics.missingConversions) || 0 },
    comparison: raw.comparison ? { ...EMPTY_REPORT.metrics, ...raw.comparison } as ReportMetrics : null,
    trend: (raw.trend || []).map((row) => ({ ...row, income: Number(row.income) || 0, expenses: Number(row.expenses) || 0, net: Number(row.net) || 0 })),
    categories: (raw.categories || []).map((row) => ({ ...row, amount: Number(row.amount) || 0, percentage: Number(row.percentage) || 0 })),
    payees: (raw.payees || []).map((row) => ({ ...row, amount: Number(row.amount) || 0, percentage: Number(row.percentage) || 0 })),
    accounts: (raw.accounts || []).map((row) => ({ ...row, amount: Number(row.amount) || 0, percentage: Number(row.percentage) || 0 })),
    status: (raw.status || []).map((row) => ({ name: row.name, value: Number(row.value) || 0 })),
    accountBalances: (raw.accountBalances || []).map((row) => ({ ...row, balance: Number(row.balance) || 0, convertedBalance: row.convertedBalance == null ? null : Number(row.convertedBalance) })),
    netWorth: { ...EMPTY_REPORT.netWorth, ...(raw.netWorth || {}), assets: Number(raw.netWorth?.assets) || 0, liabilities: Number(raw.netWorth?.liabilities) || 0, netWorth: Number(raw.netWorth?.netWorth) || 0 },
    recentTransactions: raw.recentTransactions || [],
  };
}

export function ReportsDashboard() {
  const user = useSelector((state: RootState) => state.user.user);
  const userId = typeof user?.id === "string" ? user.id : null;
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const [range, setRange] = useState<ReportRange>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("INR");
  const [accountFilter, setAccountFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [payeeFilter, setPayeeFilter] = useState("all");
  const [accounts, setAccounts] = useState<FilterOption[]>([]);
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [payees, setPayees] = useState<FilterOption[]>([]);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const period = useMemo(() => getReportPeriod(range, customStart, customEnd), [customEnd, customStart, range]);

  const loadFilterOptions = useCallback(async () => {
    if (!userId) return;
    setIsLoadingOptions(true);
    const supabase = createClient();
    const [accountResult, categoryResult, payeeResult, profileResult] = await Promise.all([
      supabase.from("accounts").select("id, name").eq("user_id", userId).order("name", { ascending: true }),
      supabase.from("categories").select("id, name, archived").order("name", { ascending: true }),
      supabase.from("payees").select("id, name, archived").eq("user_id", userId).order("name", { ascending: true }),
      supabase.from("profiles").select("default_currency").eq("id", userId).maybeSingle(),
    ]);
    if (accountResult.error || categoryResult.error || payeeResult.error) {
      toast({ title: "Could not load report filters", description: getErrorMessage(accountResult.error || categoryResult.error || payeeResult.error), variant: "warning" });
    } else {
      setAccounts(accountResult.data || []);
      setCategories((categoryResult.data || []).filter((item) => !item.archived));
      setPayees((payeeResult.data || []).filter((item) => !item.archived));
    }
    const profileCurrency = profileResult.data?.default_currency;
    if (!profileResult.error && typeof profileCurrency === "string" && /^[A-Z]{3}$/.test(profileCurrency)) setBaseCurrency(profileCurrency);
    setIsLoadingOptions(false);
  }, [toast, userId]);

  const loadReports = useCallback(async () => {
    if (!userId) {
      setReport(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    const { data, error: reportError } = await createClient().rpc("get_finance_report", {
      p_start_date: period.start,
      p_end_date: period.end,
      p_compare_start_date: period.compareStart,
      p_compare_end_date: period.compareEnd,
      p_base_currency: baseCurrency,
      p_account_id: accountFilter === "all" ? null : accountFilter,
      p_category: categoryFilter === "all" ? null : categoryFilter,
      p_payee: payeeFilter === "all" ? null : payeeFilter,
    });
    if (reportError) {
      const message = reportError.message.includes("get_finance_report") ? "Apply the reporting analytics migration before opening this page." : getErrorMessage(reportError);
      setError(message);
      toast({ title: "Could not load reports", description: message, variant: "danger" });
    } else {
      setReport(normalizeReport(data));
    }
    setIsLoading(false);
  }, [accountFilter, baseCurrency, categoryFilter, payeeFilter, period, toast, userId]);

  useEffect(() => { void loadFilterOptions(); }, [loadFilterOptions]);
  useEffect(() => { void loadReports(); }, [loadReports]);

  const data = report || EMPTY_REPORT;
  const comparison = data.comparison;
  const rangeLabel = period.label;
  const chartOptions = useMemo<ChartOptions<"bar">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top", align: "end", labels: { color: "#d7dbea", usePointStyle: true, pointStyle: "circle", padding: 18 } }, tooltip: { backgroundColor: "#171b2e", borderColor: "rgba(139, 124, 255, 0.45)", borderWidth: 1, padding: 12 } },
    scales: { x: { grid: { display: false }, ticks: { color: "#aeb5c7" } }, y: { beginAtZero: true, grid: { color: "rgba(174, 181, 199, 0.12)" }, ticks: { color: "#aeb5c7", callback: (value) => formatCompactCurrency(Number(value), data.reportingCurrency) } } },
  }), [data.reportingCurrency]);
  const horizontalChartOptions = useMemo<ChartOptions<"bar">>(() => ({ ...chartOptions, indexAxis: "y", plugins: { ...chartOptions.plugins, legend: { display: false } } }), [chartOptions]);
  const doughnutOptions = useMemo<ChartOptions<"doughnut">>(() => ({ responsive: true, maintainAspectRatio: false, cutout: "68%", plugins: { legend: { display: false }, tooltip: { backgroundColor: "#171b2e", borderColor: "rgba(139, 124, 255, 0.45)", borderWidth: 1, padding: 12 } } }), []);

  const trendChartData = useMemo(() => ({ labels: data.trend.map((row) => row.month), datasets: [
    { label: "Money in", data: data.trend.map((row) => row.income), backgroundColor: "rgba(45, 212, 191, 0.82)", borderColor: "#2dd4bf", borderWidth: 1, borderRadius: 10, borderSkipped: false },
    { label: "Money out", data: data.trend.map((row) => row.expenses), backgroundColor: "rgba(251, 113, 133, 0.82)", borderColor: "#fb7185", borderWidth: 1, borderRadius: 10, borderSkipped: false },
  ] }), [data.trend]);
  const categoryChartData = useMemo(() => ({ labels: data.categories.map((row) => row.name), datasets: [{ data: data.categories.map((row) => row.amount), backgroundColor: data.categories.map((_, index) => chartColors[index % chartColors.length]), borderColor: "#171b2e", borderWidth: 4, hoverOffset: 12 }] }), [data.categories]);
  const payeeChartData = useMemo(() => ({ labels: data.payees.map((row) => row.name), datasets: [{ label: "Spending", data: data.payees.map((row) => row.amount), backgroundColor: "rgba(139, 124, 255, 0.8)", borderRadius: 8 }] }), [data.payees]);
  const accountChartData = useMemo(() => ({ labels: data.accounts.map((row) => row.name), datasets: [{ label: "Spending", data: data.accounts.map((row) => row.amount), backgroundColor: "rgba(56, 189, 248, 0.8)", borderRadius: 8 }] }), [data.accounts]);
  const statusChartData = useMemo(() => ({ labels: data.status.map((row) => row.name), datasets: [{ data: data.status.map((row) => row.value), backgroundColor: data.status.map((row) => statusColors[row.name as keyof typeof statusColors] || "#8b7cff"), borderColor: "#171b2e", borderWidth: 4, hoverOffset: 12 }] }), [data.status]);

  if (!userId) {
    return <div className="container mx-auto px-4 py-16"><Card className="mx-auto max-w-xl border-primary/20 bg-gradient-card text-center shadow-elegant"><CardContent className="p-10"><BarChart3 className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-5 text-2xl font-bold">Your financial picture starts here</h1><p className="mt-3 text-muted-foreground">Sign in to see cash flow, spending patterns, account balances, and transaction health.</p></CardContent></Card></div>;
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-10 sm:py-14">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div className="animate-fade-in-up"><p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-accent">Financial intelligence</p><h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Reports and insights</h1><p className="mt-3 max-w-2xl text-muted-foreground">Understand where your money went, what came in, and how your accounts are tracking.</p></div><Button variant="outline" onClick={() => void loadReports()} disabled={isLoading || !isOnline}><RefreshCw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Refresh</Button></div>

      <Card className="border-border/70 bg-gradient-card shadow-card"><CardContent className="flex flex-wrap items-end gap-3 p-4"><div className="min-w-[165px] flex-1"><label className="mb-1 block text-xs font-semibold text-muted-foreground">Period</label><Select value={range} onValueChange={(value) => setRange(value as ReportRange)}><SelectTrigger><Filter className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="month">This month</SelectItem><SelectItem value="quarter">Last 3 months</SelectItem><SelectItem value="year">This year</SelectItem><SelectItem value="all">All time</SelectItem><SelectItem value="custom">Custom range</SelectItem></SelectContent></Select></div>{range === "custom" && <><div className="min-w-[145px] flex-1"><label className="mb-1 block text-xs font-semibold text-muted-foreground">From</label><Input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></div><div className="min-w-[145px] flex-1"><label className="mb-1 block text-xs font-semibold text-muted-foreground">To</label><Input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></div></>}<FilterSelect label="Account" value={accountFilter} onChange={setAccountFilter} options={accounts} allLabel="All accounts" loading={isLoadingOptions} /><FilterSelect label="Category" value={categoryFilter} onChange={setCategoryFilter} options={categories} allLabel="All categories" loading={isLoadingOptions} /><FilterSelect label="Payee" value={payeeFilter} onChange={setPayeeFilter} options={payees} allLabel="All payees" loading={isLoadingOptions} /></CardContent></Card>

      {!isOnline && <div role="status" className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"><CircleAlert className="h-4 w-4" /> You are offline. Reports are based on the last loaded data.</div>}{error && <Card className="border-destructive/30 bg-destructive/10"><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-sm text-destructive"><CircleAlert className="h-4 w-4" /> {error}</p><Button variant="outline" onClick={() => void loadReports()}>Try again</Button></CardContent></Card>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><ReportStat label="Money in" value={formatMoney(data.metrics.income, data.reportingCurrency)} helper={rangeLabel} icon={TrendingUp} tone="text-success" isLoading={isLoading} current={data.metrics.income} previous={comparison?.income} /><ReportStat label="Money out" value={formatMoney(data.metrics.expenses, data.reportingCurrency)} helper={rangeLabel} icon={TrendingDown} tone="text-destructive" isLoading={isLoading} current={data.metrics.expenses} previous={comparison?.expenses} /><ReportStat label="Net cash flow" value={formatMoney(data.metrics.net, data.reportingCurrency)} helper={data.metrics.net >= 0 ? "Positive movement" : "Review your outflow"} icon={Activity} tone={data.metrics.net >= 0 ? "text-primary" : "text-warning"} isLoading={isLoading} current={data.metrics.net} previous={comparison?.net} /><ReportStat label="Net worth" value={formatMoney(data.netWorth.netWorth, data.reportingCurrency)} helper={`${formatMoney(data.netWorth.assets, data.reportingCurrency)} assets · ${formatMoney(data.netWorth.liabilities, data.reportingCurrency)} liabilities`} icon={WalletCards} tone="text-info" isLoading={isLoading} current={data.netWorth.netWorth} /><ReportStat label="Pending items" value={String(data.metrics.pending)} helper={`${data.metrics.transactions} transactions reviewed`} icon={Clock3} tone="text-warning" isLoading={isLoading} current={data.metrics.pending} /></div>

      {data.metrics.missingConversions > 0 && <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">{data.metrics.missingConversions} transaction{data.metrics.missingConversions === 1 ? "" : "s"} could not be converted into {data.reportingCurrency} and are excluded from currency totals.</div>}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]"><ReportCard title="Cash-flow trend" description={`Monthly inflow and outflow for ${rangeLabel.toLowerCase()}.`} loading={isLoading} empty={data.trend.length === 0} emptyLabel="No income or expense entries in this period"><div className="h-[300px]"><Bar data={trendChartData} options={chartOptions} /></div></ReportCard><ReportCard title="Spending by category" description="See where your outflow is concentrated." loading={isLoading} empty={data.categories.length === 0} emptyLabel="No expense categories yet"><div className="h-[300px]"><Doughnut data={categoryChartData} options={doughnutOptions} /></div><LegendRows rows={data.categories} /></ReportCard></div>
      <div className="grid gap-6 xl:grid-cols-2"><ReportCard title="Spending by payee" description="Find the merchants driving your expenses." loading={isLoading} empty={data.payees.length === 0} emptyLabel="No payee spending in this period"><div className="h-[300px]"><Bar data={payeeChartData} options={horizontalChartOptions} /></div></ReportCard><ReportCard title="Spending by account" description="Compare outflow across your accounts." loading={isLoading} empty={data.accounts.length === 0} emptyLabel="No account spending in this period"><div className="h-[300px]"><Bar data={accountChartData} options={horizontalChartOptions} /></div></ReportCard></div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]"><Card className="border-border/70 bg-gradient-card shadow-card"><CardHeader><CardTitle>Account balances and net worth</CardTitle><p className="mt-1 text-sm text-muted-foreground">Balances are shown as of {formatReportDate(period.end)} in {data.reportingCurrency}.</p></CardHeader><CardContent className="space-y-3">{isLoading ? <ChartSkeleton /> : data.accountBalances.length === 0 ? <EmptyReport label="Add an account to see net worth" /> : data.accountBalances.slice(0, 8).map((account) => <div key={account.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-background/25 p-4"><div className="flex min-w-0 items-center gap-3"><span className={(accountIsLiability(account.type) ? "bg-warning/10 text-warning" : "bg-primary/12 text-primary") + " rounded-xl p-2.5"}><WalletCards className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate font-semibold">{account.name}</p><p className="text-xs text-muted-foreground">{account.currency}{account.archived ? " · Archived" : ""}</p></div></div><p className={"whitespace-nowrap text-right font-bold " + (account.convertedBalance != null && account.convertedBalance < 0 ? "text-destructive" : "text-foreground")}>{formatMoney(account.convertedBalance, data.reportingCurrency)}<span className="block text-xs font-normal text-muted-foreground">{formatMoney(account.balance, account.currency)}</span></p></div>)}</CardContent></Card><Card className="border-border/70 bg-gradient-card shadow-card"><CardHeader><CardTitle>Transaction health</CardTitle><p className="mt-1 text-sm text-muted-foreground">A quick view of what still needs attention.</p></CardHeader><CardContent>{isLoading ? <ChartSkeleton /> : data.status.length === 0 ? <EmptyReport label="No transaction statuses yet" /> : <div className="grid gap-6 sm:grid-cols-[190px_1fr] sm:items-center"><div className="h-[190px]"><Doughnut data={statusChartData} options={doughnutOptions} /></div><div className="space-y-4">{data.status.map((item) => <div key={item.name} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[item.name as keyof typeof statusColors] || "#8b7cff" }} />{item.name}</span><span className="font-bold">{item.value}</span></div>)}<div className="flex items-center gap-2 rounded-2xl border border-success/20 bg-success/10 px-3 py-3 text-xs text-success"><ShieldCheck className="h-4 w-4 shrink-0" /> Reconciled records are ready to trust</div></div></div>}</CardContent></Card></div>

      <Card className="border-border/70 bg-gradient-card shadow-card"><CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle>Recent activity</CardTitle><p className="mt-1 text-sm text-muted-foreground">Latest transactions in {rangeLabel.toLowerCase()}</p></div><Button asChild variant="outline" size="sm"><Link href="/transactions" prefetch={false}>View ledger <ArrowLeftRight className="h-4 w-4" /></Link></Button></CardHeader><CardContent>{isLoading ? <ChartSkeleton /> : data.recentTransactions.length === 0 ? <EmptyReport label="No activity in this period" /> : <div className="grid gap-2 md:grid-cols-2">{data.recentTransactions.map((transaction) => { const amount = transaction.convertedAmount ?? transaction.amount; const signed = transaction.type === "expense" ? -amount : transaction.type === "transfer" ? 0 : amount; return <div key={transaction.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-background/25 p-4"><div className="flex min-w-0 items-center gap-3"><span className={(signed > 0 ? "bg-success/10 text-success" : signed < 0 ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info") + " rounded-xl p-2.5"}>{signed > 0 ? <ArrowUpRight className="h-4 w-4" /> : signed < 0 ? <ArrowDownLeft className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{transaction.payee || transaction.description || "Transaction"}</p><p className="mt-1 text-xs text-muted-foreground">{formatReportDate(transaction.occurredAt)} · {transaction.category || transaction.type}</p></div></div><p className={(signed > 0 ? "text-success" : signed < 0 ? "text-destructive" : "text-info") + " whitespace-nowrap text-sm font-bold"}>{signed === 0 ? formatMoney(amount, data.reportingCurrency) : (signed > 0 ? "+" : "−") + formatMoney(Math.abs(signed), data.reportingCurrency)}</p></div>; })}</div>}</CardContent></Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><PieChartIcon className="h-4 w-4 text-primary" /> Reporting currency: <strong className="text-foreground">{data.reportingCurrency}</strong></span><span>Transfers are excluded from net cash flow because they move money between your own accounts.</span></div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, allLabel, loading }: { label: string; value: string; onChange: (value: string) => void; options: FilterOption[]; allLabel: string; loading: boolean }) {
  return <div className="min-w-[165px] flex-1"><label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label><Select value={value} onValueChange={onChange} disabled={loading}><SelectTrigger><SelectValue placeholder={allLabel} /></SelectTrigger><SelectContent><SelectItem value="all">{allLabel}</SelectItem>{options.map((option) => <SelectItem key={option.id} value={option.name}>{option.name}</SelectItem>)}</SelectContent></Select></div>;
}

function ReportCard({ title, description, loading, empty, emptyLabel, children }: { title: string; description: string; loading: boolean; empty: boolean; emptyLabel: string; children: React.ReactNode }) {
  return <Card className="border-border/70 bg-gradient-card shadow-card"><CardHeader><CardTitle>{title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{description}</p></CardHeader><CardContent className="min-w-0">{loading ? <ChartSkeleton /> : empty ? <EmptyReport label={emptyLabel} /> : children}</CardContent></Card>;
}

function LegendRows({ rows }: { rows: Array<{ name: string; amount: number; percentage: number }> }) {
  return <div className="mt-4 grid gap-2 sm:grid-cols-2">{rows.slice(0, 8).map((row, index) => <div key={row.name} className="flex items-center justify-between gap-2 text-xs"><span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} /><span className="truncate text-muted-foreground">{row.name}</span></span><span className="font-semibold">{Math.round(row.percentage)}%</span></div>)}</div>;
}

function ReportStat({ label, value, helper, icon: Icon, tone, isLoading, current, previous }: { label: string; value: string; helper: string; icon: typeof TrendingUp; tone: string; isLoading: boolean; current: number; previous?: number }) {
  const delta = previous == null ? null : reportMetricDelta(current, previous);
  return <Card className="border-border/70 bg-gradient-card shadow-card"><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">{label}</p>{isLoading ? <div className="mt-2 h-8 w-32 animate-pulse rounded bg-muted" /> : <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>}</div><span className={"rounded-xl bg-current/10 p-2.5 " + tone}><Icon className="h-5 w-5" /></span></div><p className="mt-3 text-xs text-muted-foreground">{helper}</p>{delta && <p className={"mt-2 text-xs font-semibold " + (delta.absolute >= 0 ? "text-success" : "text-destructive")}>{delta.absolute >= 0 ? "▲" : "▼"} {delta.percentage == null ? "Compared with previous period" : `${Math.abs(delta.percentage).toFixed(0)}% vs previous period`}</p>}</CardContent></Card>;
}

function ChartSkeleton() {
  return <div className="flex h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
}

function EmptyReport({ label }: { label: string }) {
  return <div className="flex min-h-40 flex-col items-center justify-center text-center text-sm text-muted-foreground"><BarChart3 className="mb-3 h-8 w-8 text-primary/60" /><p>{label}</p></div>;
}
