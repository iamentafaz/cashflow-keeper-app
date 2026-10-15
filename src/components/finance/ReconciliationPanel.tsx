"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Check, CheckCircle2, ClipboardCheck, FileCheck2, Loader2, WalletCards } from "lucide-react";
import { Account, ReconciliationSession, Transaction } from "@/types/finance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ReconciliationPanelProps {
  accounts: Account[];
  transactions: Transaction[];
  sessions: ReconciliationSession[];
  onComplete: (input: {
    accountId: string;
    statementDate: string;
    statementBalance: number;
    transactionIds: string[];
    notes: string;
  }) => Promise<boolean>;
  disabled?: boolean;
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function accountBookBalance(account: Account, transactions: Transaction[], statementDate: string) {
  return transactions.reduce((balance, transaction) => {
    if (transaction.account_id !== account.id || transaction.occurred_at.toISOString().slice(0, 10) > statementDate) return balance;
    if (transaction.type === "income" || transaction.type === "refund") return balance + transaction.amount;
    if (transaction.type === "expense") return balance - transaction.amount;
    if (transaction.type === "transfer") return balance + (transaction.transfer_direction === "credit" ? transaction.amount : -transaction.amount);
    return balance;
  }, account.opening_balance);
}

export function ReconciliationPanel({ accounts, transactions, sessions, onComplete, disabled = false }: ReconciliationPanelProps) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [statementDate, setStatementDate] = useState(new Date().toISOString().slice(0, 10));
  const [statementBalance, setStatementBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const account = accounts.find((item) => item.id === accountId) ?? null;
  const eligibleTransactions = useMemo(() => transactions
    .filter((transaction) => transaction.account_id === accountId)
    .filter((transaction) => transaction.occurred_at.toISOString().slice(0, 10) <= statementDate)
    .filter((transaction) => transaction.status === "cleared"), [accountId, statementDate, transactions]);
  const bookBalance = account ? accountBookBalance(account, transactions, statementDate) : 0;
  const difference = statementBalance === "" ? null : Number(statementBalance) - bookBalance;
  const accountSessions = sessions.filter((session) => session.account_id === accountId).slice(0, 4);

  useEffect(() => {
    setSelectedIds(new Set(eligibleTransactions.map((transaction) => transaction.id)));
  }, [eligibleTransactions]);

  useEffect(() => {
    if (!accountId && accounts[0]) setAccountId(accounts[0].id);
  }, [accountId, accounts]);

  const toggleTransaction = (id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    const parsedBalance = Number(statementBalance);
    if (!account) {
      setValidationError("Choose an account to reconcile.");
      return;
    }
    if (!statementDate) {
      setValidationError("Choose the statement date.");
      return;
    }
    if (!Number.isFinite(parsedBalance)) {
      setValidationError("Enter a valid statement balance.");
      return;
    }
    setValidationError(null);
    setIsSaving(true);
    try {
      const saved = await onComplete({ accountId, statementDate, statementBalance: parsedBalance, transactionIds: [...selectedIds], notes });
      if (saved) {
        setStatementBalance("");
        setNotes("");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-border/70 bg-gradient-card shadow-card">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-accent" /> Reconcile an account</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Match the account to its statement and preserve a history of each review.</p>
        </div>
        <Badge variant="outline" className="w-fit border-accent/30 text-accent">{selectedIds.size} cleared selected</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {accounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.05] p-6 text-center"><WalletCards className="mx-auto h-8 w-8 text-primary" /><p className="mt-3 font-semibold">Add an account first</p><p className="mt-1 text-sm text-muted-foreground">Reconciliation becomes available after you add a bank, card, cash account, or wallet.</p></div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-1"><Label>Account</Label><Select value={accountId} onValueChange={setAccountId} disabled={disabled || isSaving}><SelectTrigger><SelectValue placeholder="Choose account" /></SelectTrigger><SelectContent>{accounts.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · {item.currency}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="statement-date">Statement date</Label><Input id="statement-date" type="date" value={statementDate} onChange={(event) => setStatementDate(event.target.value)} disabled={disabled || isSaving} /></div>
              <div className="space-y-2"><Label htmlFor="statement-balance">Statement balance</Label><Input id="statement-balance" inputMode="decimal" placeholder="0.00" value={statementBalance} onChange={(event) => setStatementBalance(event.target.value)} disabled={disabled || isSaving} /></div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Book balance</p><p className="mt-2 text-xl font-bold">{account ? formatMoney(bookBalance, account.currency) : "—"}</p></div>
              <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Difference</p><p className={`mt-2 text-xl font-bold ${difference === null ? "text-muted-foreground" : Math.abs(difference) < 0.01 ? "text-success" : "text-warning"}`}>{difference === null || !account ? "—" : formatMoney(difference, account.currency)}</p></div>
              <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cleared to review</p><p className="mt-2 text-xl font-bold">{eligibleTransactions.length}</p></div>
            </div>

            <div className="space-y-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Cleared transactions</p><p className="text-xs text-muted-foreground">Selected transactions will move to reconciled.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setSelectedIds(new Set(eligibleTransactions.map((transaction) => transaction.id)))} disabled={disabled || isSaving || eligibleTransactions.length === 0}><Check className="h-4 w-4" /> Select all</Button></div>{eligibleTransactions.length === 0 ? <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">No cleared transactions are available for this account and statement date.</div> : <div className="max-h-64 space-y-2 overflow-y-auto pr-1">{eligibleTransactions.map((transaction) => <label key={transaction.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-background/30 p-3 transition-colors hover:border-primary/30 hover:bg-secondary/30"><input type="checkbox" checked={selectedIds.has(transaction.id)} onChange={() => toggleTransaction(transaction.id)} disabled={disabled || isSaving} className="h-4 w-4 rounded border-border accent-primary" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{transaction.payee || transaction.description || "Transaction"}</span><span className="block text-xs text-muted-foreground">{format(transaction.occurred_at, "dd MMM yyyy")} · {transaction.category || "Uncategorized"}</span></span><span className="whitespace-nowrap text-sm font-semibold">{formatMoney(transaction.amount, transaction.currency)}</span></label>)}</div>}</div>

            <div className="space-y-2"><Label htmlFor="reconciliation-notes">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="reconciliation-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add a note about this statement or any difference..." disabled={disabled || isSaving} /></div>
            {validationError && <p role="alert" className="text-sm text-destructive">{validationError}</p>}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">A difference is recorded for follow-up; the reconciliation is not discarded if balances do not match.</p><Button type="button" onClick={() => void handleSubmit()} disabled={disabled || isSaving}>{isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><FileCheck2 className="h-4 w-4" /> Complete reconciliation</>}</Button></div>

            {accountSessions.length > 0 && <div className="space-y-3 border-t border-border/60 pt-5"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /><p className="font-semibold">Recent reconciliations</p></div><div className="grid gap-2 sm:grid-cols-2">{accountSessions.map((session) => <div key={session.id} className="rounded-xl border border-border/50 bg-secondary/20 p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{format(new Date(session.statement_date), "dd MMM yyyy")}</p><Badge variant="outline" className={Math.abs(session.difference) < 0.01 ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"}>{Math.abs(session.difference) < 0.01 ? "Matched" : "Difference"}</Badge></div><p className="mt-1 text-xs text-muted-foreground">Statement {formatMoney(session.statement_balance, account.currency)} · {session.reconciled_transaction_count} transactions</p></div>)}</div></div>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
