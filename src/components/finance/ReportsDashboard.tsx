"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { endOfDay, format, isAfter, isBefore, startOfMonth, startOfYear, subMonths } from "date-fns";
import { Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, BarChart3, CircleAlert, Clock3, Filter, Loader2, PieChart as PieChartIcon, Receipt, RefreshCw, ShieldCheck, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, ChartData, ChartOptions, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip as ChartJSTooltip } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Account, AccountRow, Transaction, TransactionRow } from "@/types/finance";
import { normalizeAccount, normalizeTransaction } from "@/types/finance";

type ReportRange = "month" | "quarter" | "year" | "all";

const chartColors = ["#8b7cff", "#2dd4bf", "#fbbf24", "#38bdf8", "#fb7185", "#a78bfa"];
const statusColors = { pending: "#fbbf24", cleared: "#38bdf8", reconciled: "#2dd4bf" };

ChartJS.register(ArcElement, BarElement, CategoryScale, ChartJSTooltip, Filler, Legend, LinearScale, LineElement, PointElement);

type ReportCategoryRow = {
  id: string;
  name: string;
  archived?: boolean | null;
};

type StatusDatum = {
  name: string;
  value: number;
};

function normalizeReportTransaction(row: TransactionRow, categoryNames: Map<string, string>) {
  const type = String(row.type || "").trim().toLowerCase() as TransactionRow["type"];
  const status = String(row.status || "cleared").trim().toLowerCase() as NonNullable<TransactionRow["status"]>;

  return normalizeTransaction({
    ...row,
    type,
    status,
    category: row.category?.trim() || (row.category_id ? categoryNames.get(row.category_id) ?? null : null),
    subcategory: row.subcategory?.trim() || (row.subcategory_id ? categoryNames.get(row.subcategory_id) ?? null : null),
  });
}

function formatMoney(amount: number, currency: string) {
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

function snapshotAmount(transaction: Transaction, baseCurrency: string) {
  if (transaction.currency === baseCurrency) return transaction.amount;
  return transaction.amount * transaction.exchange_rate;
}

function signedAmount(transaction: Transaction, baseCurrency: string) {
  const amount = snapshotAmount(transaction, baseCurrency);
  return transaction.type === "expense" ? -amount : transaction.type === "transfer" ? 0 : amount;
}

function getRangeStart(range: ReportRange) {
  const today = new Date();
  if (range === "month") return startOfMonth(today);
  if (range === "quarter") return startOfMonth(subMonths(today, 2));
  if (range === "year") return startOfYear(today);
  return null;
}

function getStatusColor(status: string) {
  return statusColors[status.toLowerCase() as keyof typeof statusColors] || "#8b7cff";
}

export function ReportsDashboard() {
  const user = useSelector((state: RootState) => state.user.user);
  const userId = typeof user?.id === "string" ? user.id : null;
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const [range, setRange] = useState<ReportRange>("all");
  const [baseCurrency, setBaseCurrency] = useState("INR");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!userId) {
      setTransactions([]);
      setAccounts([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const [transactionResult, accountResult, profileResult, categoryResult] = await Promise.all([
      supabase.from("transactions").select("id, account_id, to_account_id, type, amount, currency, exchange_rate, category_id, subcategory_id, category, subcategory, payee_id, payee, description, occurred_at, status, notes, created_at, transfer_group_id, transfer_direction").eq("user_id", userId).order("occurred_at", { ascending: true }).order("created_at", { ascending: true }),
      supabase.from("accounts").select("id, name, type, currency, opening_balance, archived, created_at").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("profiles").select("default_currency").eq("id", userId).maybeSingle(),
      supabase.from("categories").select("id, name, archived").order("name", { ascending: true }),
    ]);

    try {
      if (transactionResult.error) throw transactionResult.error;
      if (accountResult.error) throw accountResult.error;
      const resolvedCategoryNames = new Map(
        ((categoryResult.error ? [] : categoryResult.data ?? []) as ReportCategoryRow[])
          .filter((category) => !category.archived)
          .map((category) => [category.id, category.name.trim()]),
      );
      setTransactions((transactionResult.data ?? []).map((row) => normalizeReportTransaction(row as TransactionRow, resolvedCategoryNames)));
      setAccounts((accountResult.data ?? []).map((row) => normalizeAccount(row as AccountRow)));
      const resolvedBaseCurrency = profileResult.data?.default_currency;
      if (!profileResult.error && typeof resolvedBaseCurrency === "string" && /^[A-Z]{3}$/.test(resolvedBaseCurrency)) {
        setBaseCurrency(resolvedBaseCurrency);
      }
    } catch (loadError) {
      const message = getErrorMessage(loadError);
      setError(message);
      toast({ title: "Could not load reports", description: message, variant: "danger" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, userId]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const filteredTransactions = useMemo(() => {
    const start = getRangeStart(range);
    const end = endOfDay(new Date());
    return transactions.filter((transaction) => (!start || !isBefore(transaction.occurred_at, start)) && !isAfter(transaction.occurred_at, end));
  }, [range, transactions]);

  const metrics = useMemo(() => {
    const income = filteredTransactions.filter((transaction) => transaction.type === "income" || transaction.type === "refund").reduce((sum, transaction) => sum + snapshotAmount(transaction, baseCurrency), 0);
    const expenses = filteredTransactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + snapshotAmount(transaction, baseCurrency), 0);
    return { income, expenses, net: income - expenses, pending: filteredTransactions.filter((transaction) => transaction.status === "pending").length };
  }, [baseCurrency, filteredTransactions]);

  const reportDataSummary = useMemo(() => {
    const incomeCount = filteredTransactions.filter((transaction) => transaction.type === "income" || transaction.type === "refund").length;
    const expenseCount = filteredTransactions.filter((transaction) => transaction.type === "expense").length;
    return `${filteredTransactions.length} transaction${filteredTransactions.length === 1 ? "" : "s"} · ${incomeCount} money in · ${expenseCount} expense${expenseCount === 1 ? "" : "s"}`;
  }, [filteredTransactions]);

  const trendData = useMemo(() => {
    const rows = new Map<string, { key: string; month: string; income: number; expenses: number }>();
    filteredTransactions.forEach((transaction) => {
      const key = format(transaction.occurred_at, "yyyy-MM");
      const row = rows.get(key) || { key, month: format(transaction.occurred_at, "MMM yy"), income: 0, expenses: 0 };
      if (transaction.type === "expense") row.expenses += snapshotAmount(transaction, baseCurrency);
      if (transaction.type === "income" || transaction.type === "refund") row.income += snapshotAmount(transaction, baseCurrency);
      rows.set(key, row);
    });
    return Array.from(rows.values()).sort((a, b) => a.key.localeCompare(b.key)).map((row) => ({ ...row, net: row.income - row.expenses }));
  }, [baseCurrency, filteredTransactions]);

  const categoryData = useMemo(() => {
    const rows = new Map<string, number>();
    filteredTransactions.filter((transaction) => transaction.type === "expense").forEach((transaction) => {
      const name = transaction.category || "Uncategorized";
      rows.set(name, (rows.get(name) || 0) + snapshotAmount(transaction, baseCurrency));
    });
    const total = Array.from(rows.values()).reduce((sum, amount) => sum + amount, 0);
    return Array.from(rows.entries()).map(([name, amount]) => ({ name, amount, percentage: total > 0 ? (amount / total) * 100 : 0 })).sort((a, b) => b.amount - a.amount).slice(0, 7);
  }, [baseCurrency, filteredTransactions]);

  const categoryTotal = filteredTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + snapshotAmount(transaction, baseCurrency), 0);

  const statusData = useMemo(() => {
    const counts = filteredTransactions.reduce<Record<string, number>>((result, transaction) => {
      result[transaction.status] = (result[transaction.status] || 0) + 1;
      return result;
    }, {});
    return [
      { name: "Pending", value: counts.pending || 0 },
      { name: "Cleared", value: counts.cleared || 0 },
      { name: "Reconciled", value: counts.reconciled || 0 },
    ].filter((item) => item.value > 0);
  }, [filteredTransactions]);

  const statusTotal = statusData.reduce((sum, item) => sum + item.value, 0);

  const cashFlowChartData = useMemo(() => ({
    labels: trendData.map((row) => row.month),
    datasets: [
      { label: "Money in", data: trendData.map((row) => row.income), backgroundColor: "rgba(45, 212, 191, 0.82)", borderColor: "#2dd4bf", borderWidth: 1, borderRadius: 10, borderSkipped: false, barPercentage: 0.62, categoryPercentage: 0.68 },
      { label: "Money out", data: trendData.map((row) => row.expenses), backgroundColor: "rgba(251, 113, 133, 0.82)", borderColor: "#fb7185", borderWidth: 1, borderRadius: 10, borderSkipped: false, barPercentage: 0.62, categoryPercentage: 0.68 },
    ],
  }), [trendData]);

  const cashFlowChartOptions = useMemo<ChartOptions<"bar">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    animation: { duration: 700, easing: "easeOutQuart" },
    plugins: {
      legend: { position: "top", align: "end", labels: { color: "#d7dbea", usePointStyle: true, pointStyle: "circle", padding: 18 } },
      tooltip: { backgroundColor: "#171b2e", borderColor: "rgba(139, 124, 255, 0.45)", borderWidth: 1, padding: 12, callbacks: { label: (context) => `${context.dataset.label}: ${formatMoney(Number(context.parsed.y), baseCurrency)}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#aeb5c7" } },
      y: { beginAtZero: true, grid: { color: "rgba(174, 181, 199, 0.12)" }, ticks: { color: "#aeb5c7", callback: (value) => formatCompactCurrency(Number(value), baseCurrency) } },
    },
  }), [baseCurrency]);

  const categoryChartData = useMemo(() => ({
    labels: categoryData.map((item) => item.name),
    datasets: [{ data: categoryData.map((item) => item.amount), backgroundColor: categoryData.map((_, index) => chartColors[index % chartColors.length]), borderColor: "#171b2e", borderWidth: 4, hoverOffset: 12 }],
  }), [categoryData]);

  const categoryChartOptions = useMemo<ChartOptions<"doughnut">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    animation: { duration: 800, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#171b2e", borderColor: "rgba(139, 124, 255, 0.45)", borderWidth: 1, padding: 12, callbacks: { label: (context) => `${context.label}: ${formatMoney(Number(context.parsed), baseCurrency)}` } },
    },
  }), [baseCurrency]);

  const statusChartData = useMemo(() => ({
    labels: statusData.map((item) => item.name),
    datasets: [{ data: statusData.map((item) => item.value), backgroundColor: statusData.map((item) => getStatusColor(item.name)), borderColor: "#171b2e", borderWidth: 4, hoverOffset: 12 }],
  }), [statusData]);

  const statusChartOptions = useMemo<ChartOptions<"doughnut">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    animation: { duration: 800, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#171b2e", borderColor: "rgba(56, 189, 248, 0.45)", borderWidth: 1, padding: 12, callbacks: { label: (context) => `${context.label}: ${context.parsed} records` } },
    },
  }), []);

  const accountData = useMemo(() => accounts.map((account) => {
    const balance = transactions.reduce((total, transaction) => {
      if (transaction.account_id !== account.id) return total;
      if (transaction.type === "transfer") return total + (transaction.transfer_direction === "credit" ? transaction.amount : -transaction.amount);
      if (transaction.type === "income" || transaction.type === "refund") return total + transaction.amount;
      if (transaction.type === "expense") return total - transaction.amount;
      return total;
    }, account.opening_balance);
    return { ...account, balance };
  }).sort((a, b) => b.balance - a.balance), [accounts, transactions]);

  const recentTransactions = filteredTransactions.slice().sort((a, b) => b.occurred_at.getTime() - a.occurred_at.getTime()).slice(0, 6);
  const rangeLabel = range === "month" ? "This month" : range === "quarter" ? "Last 3 months" : range === "year" ? "This year" : "All time";

  if (!userId) {
    return <div className="container mx-auto px-4 py-16"><Card className="mx-auto max-w-xl border-primary/20 bg-gradient-card text-center shadow-elegant"><CardContent className="p-10"><BarChart3 className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-5 text-2xl font-bold">Your financial picture starts here</h1><p className="mt-3 text-muted-foreground">Sign in to see cash flow, spending patterns, account balances, and transaction health.</p></CardContent></Card></div>;
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-10 sm:py-14">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="animate-fade-in-up"><p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-accent">Financial intelligence</p><h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Reports and insights</h1><p className="mt-3 max-w-2xl text-muted-foreground">Understand where your money went, what came in, and how your accounts are tracking.</p></div>
        <div className="flex flex-wrap gap-3"><Select value={range} onValueChange={(value) => setRange(value as ReportRange)}><SelectTrigger className="w-[170px]"><Filter className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="month">This month</SelectItem><SelectItem value="quarter">Last 3 months</SelectItem><SelectItem value="year">This year</SelectItem><SelectItem value="all">All time</SelectItem></SelectContent></Select><Button variant="outline" onClick={() => void loadReports()} disabled={isLoading || !isOnline}><RefreshCw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Refresh</Button></div>
      </div>

      {!isOnline && <div role="status" className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"><CircleAlert className="h-4 w-4" /> You are offline. Reports are based on the last loaded data.</div>}
      {error && <Card className="border-destructive/30 bg-destructive/10"><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-sm text-destructive"><CircleAlert className="h-4 w-4" /> {error}</p><Button variant="outline" onClick={() => void loadReports()}>Try again</Button></CardContent></Card>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><ReportStat label="Money in" value={formatMoney(metrics.income, baseCurrency)} helper={rangeLabel} icon={TrendingUp} tone="text-success" isLoading={isLoading} /><ReportStat label="Money out" value={formatMoney(metrics.expenses, baseCurrency)} helper={rangeLabel} icon={TrendingDown} tone="text-destructive" isLoading={isLoading} /><ReportStat label="Net cash flow" value={formatMoney(metrics.net, baseCurrency)} helper={metrics.net >= 0 ? "Positive movement" : "Review your outflow"} icon={Activity} tone={metrics.net >= 0 ? "text-primary" : "text-warning"} isLoading={isLoading} /><ReportStat label="Pending items" value={String(metrics.pending)} helper={filteredTransactions.length + " transactions reviewed"} icon={Clock3} tone="text-warning" isLoading={isLoading} /></div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="border-border/70 bg-gradient-card shadow-card"><CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle>Cash-flow trend</CardTitle><p className="mt-1 text-sm text-muted-foreground">Compare inflow and outflow with a responsive Chart.js visualization.</p><p className="mt-2 text-xs text-muted-foreground">{reportDataSummary}</p></div><Badge variant="outline" className="border-primary/25 text-primary">{rangeLabel}</Badge></CardHeader><CardContent className="h-[350px] min-w-0 pt-2">{isLoading ? <ChartSkeleton /> : trendData.length === 0 ? <EmptyReport label={filteredTransactions.length === 0 ? "No transactions in this period" : "No income or expense entries to chart"} /> : <div className="h-[300px] w-full min-w-0"><Bar data={cashFlowChartData} options={cashFlowChartOptions} /></div>}</CardContent></Card>
        <Card className="border-border/70 bg-gradient-card shadow-card"><CardHeader><CardTitle>Spending by category</CardTitle><p className="mt-1 text-sm text-muted-foreground">See where your outflow is concentrated.</p><p className="mt-2 text-xs text-muted-foreground">{categoryData.length} categor{categoryData.length === 1 ? "y" : "ies"} represented</p></CardHeader><CardContent className="h-[350px] min-w-0 pt-2">{isLoading ? <ChartSkeleton /> : categoryData.length === 0 ? <EmptyReport label="No expense categories yet" /> : <div className="grid h-[300px] gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(145px,0.9fr)]"><div className="relative h-[300px] min-h-0"><Doughnut data={categoryChartData} options={categoryChartOptions} /></div><div className="flex flex-col justify-center gap-3">{categoryData.map((item, index) => <div key={item.name} className="space-y-1.5"><div className="flex items-center justify-between gap-2 text-xs"><span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} /><span className="truncate text-muted-foreground">{item.name}</span></span><span className="font-semibold text-foreground">{Math.round(item.percentage)}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full" style={{ width: `${Math.max(item.percentage, 3)}%`, backgroundColor: chartColors[index % chartColors.length] }} /></div></div>)}</div></div>}</CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70 bg-gradient-card shadow-card"><CardHeader><CardTitle>Account balances</CardTitle><p className="mt-1 text-sm text-muted-foreground">Current balance across your accounts</p></CardHeader><CardContent className="space-y-3">{isLoading ? <ChartSkeleton /> : accountData.length === 0 ? <EmptyReport label="Add an account to see balances" /> : accountData.slice(0, 6).map((account) => <div key={account.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-background/25 p-4"><div className="flex min-w-0 items-center gap-3"><span className="rounded-xl bg-primary/12 p-2.5 text-primary"><WalletCards className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate font-semibold">{account.name}</p><p className="text-xs text-muted-foreground">{account.currency}{account.archived ? " · Archived" : ""}</p></div></div><p className={"whitespace-nowrap font-bold " + (account.balance < 0 ? "text-destructive" : "text-foreground")}>{formatMoney(account.balance, account.currency)}</p></div>)}</CardContent></Card>
        <Card className="border-border/70 bg-gradient-card shadow-card"><CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle>Transaction health</CardTitle><p className="mt-1 text-sm text-muted-foreground">A quick view of what still needs attention.</p></div><Badge variant="outline" className="border-info/30 text-info">{statusTotal} tracked</Badge></CardHeader><CardContent>{isLoading ? <ChartSkeleton /> : statusData.length === 0 ? <EmptyReport label="No transaction statuses yet" /> : <TransactionHealth statusData={statusData} statusTotal={statusTotal} chartData={statusChartData} chartOptions={statusChartOptions} />}</CardContent></Card>
      </div>

      <Card className="border-border/70 bg-gradient-card shadow-card"><CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle>Recent activity</CardTitle><p className="mt-1 text-sm text-muted-foreground">Latest transactions in {rangeLabel.toLowerCase()}</p></div><Button asChild variant="outline" size="sm"><Link href="/transactions" prefetch={false}>View ledger <ArrowLeftRight className="h-4 w-4" /></Link></Button></CardHeader><CardContent>{isLoading ? <ChartSkeleton /> : recentTransactions.length === 0 ? <EmptyReport label="No activity in this period" /> : <div className="grid gap-2 md:grid-cols-2">{recentTransactions.map((transaction) => { const signed = signedAmount(transaction, baseCurrency); return <div key={transaction.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-background/25 p-4"><div className="flex min-w-0 items-center gap-3"><span className={"rounded-xl p-2.5 " + (signed > 0 ? "bg-success/10 text-success" : signed < 0 ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info")}>{signed > 0 ? <ArrowUpRight className="h-4 w-4" /> : signed < 0 ? <ArrowDownLeft className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{transaction.payee || transaction.description || "Transaction"}</p><p className="mt-1 text-xs text-muted-foreground">{format(transaction.occurred_at, "dd MMM yyyy")} · {transaction.category || transaction.type}</p></div></div><p className={"whitespace-nowrap text-sm font-bold " + (signed > 0 ? "text-success" : signed < 0 ? "text-destructive" : "text-info")}>{signed === 0 ? formatMoney(snapshotAmount(transaction, baseCurrency), baseCurrency) : (signed > 0 ? "+" : "−") + formatMoney(Math.abs(signed), baseCurrency)}</p></div>; })}</div>}</CardContent></Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><PieChartIcon className="h-4 w-4 text-primary" /> Reporting currency: <strong className="text-foreground">{baseCurrency}</strong></span><span>Transfers are excluded from net cash flow because they move money between your own accounts.</span></div>
    </div>
  );
}

function TransactionHealth({ statusData, statusTotal, chartData, chartOptions }: { statusData: StatusDatum[]; statusTotal: number; chartData: ChartData<"doughnut">; chartOptions: ChartOptions<"doughnut"> }) {
  return <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center"><div className="relative h-[220px] min-w-0"><Doughnut data={chartData} options={chartOptions} /><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-4xl font-bold tracking-tight text-foreground">{statusTotal}</span><span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">records</span></div></div><div className="space-y-4">{statusData.map((item) => { const percentage = Math.round((item.value / statusTotal) * 100); const color = getStatusColor(item.name); return <div key={item.name} className="space-y-2"><div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 font-medium text-foreground"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{item.name}</span><span className="font-bold text-foreground">{item.value} <span className="ml-1 text-xs font-normal text-muted-foreground">({percentage}%)</span></span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentage}%`, backgroundColor: color }} /></div></div>; })}<div className="flex items-center gap-2 rounded-2xl border border-success/20 bg-success/10 px-3 py-3 text-xs text-success"><ShieldCheck className="h-4 w-4 shrink-0" /> Reconciled records are ready to trust</div></div></div>;
}

function ReportStat({ label, value, helper, icon: Icon, tone, isLoading }: { label: string; value: string; helper: string; icon: typeof TrendingUp; tone: string; isLoading: boolean }) {
  return <Card className="border-border/70 bg-gradient-card shadow-card"><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">{label}</p>{isLoading ? <div className="mt-2 h-8 w-32 animate-pulse rounded bg-muted" /> : <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>}</div><span className={"rounded-xl bg-current/10 p-2.5 " + tone}><Icon className="h-5 w-5" /></span></div><p className="mt-3 text-xs text-muted-foreground">{helper}</p></CardContent></Card>;
}

function ChartSkeleton() {
  return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
}

function EmptyReport({ label }: { label: string }) {
  return <div className="flex h-full min-h-40 flex-col items-center justify-center text-center text-sm text-muted-foreground"><BarChart3 className="mb-3 h-8 w-8 text-primary/60" /><p>{label}</p></div>;
}
