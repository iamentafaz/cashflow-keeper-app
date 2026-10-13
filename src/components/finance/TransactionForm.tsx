"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CalendarIcon, Loader2, RotateCcw, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Account, TransactionInput, TransactionStatus, TransactionType } from "@/types/finance";

const typeOptions: { value: TransactionType; label: string; helper: string; icon: typeof ArrowUpRight }[] = [
  { value: "expense", label: "Expense", helper: "Money leaving an account", icon: ArrowDownLeft },
  { value: "income", label: "Income", helper: "Money coming in", icon: ArrowUpRight },
  { value: "transfer", label: "Transfer", helper: "Move money between accounts", icon: ArrowLeftRight },
  { value: "refund", label: "Refund", helper: "Money returned to you", icon: RotateCcw },
];

interface TransactionFormProps {
  accounts: Account[];
  onCreate: (input: TransactionInput) => Promise<boolean>;
  disabled?: boolean;
}

export function TransactionForm({ accounts, onCreate, disabled = false }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [category, setCategory] = useState("");
  const [payee, setPayee] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TransactionStatus>("cleared");
  const [date, setDate] = useState<Date>(new Date());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAccountChange = (value: string) => {
    setAccountId(value);
    const selected = accounts.find((account) => account.id === value);
    if (selected) setCurrency(selected.currency);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!accountId) {
      setValidationError("Choose the account this transaction belongs to.");
      return;
    }
    if (type === "transfer" && (!toAccountId || toAccountId === accountId)) {
      setValidationError("Choose a different destination account for a transfer.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setValidationError("Enter an amount greater than zero.");
      return;
    }
    if ((type === "expense" || type === "income" || type === "refund") && !category.trim() && !description.trim()) {
      setValidationError("Add a category or a short description.");
      return;
    }

    setValidationError(null);
    setIsSaving(true);
    const saved = await onCreate({
      account_id: accountId,
      to_account_id: type === "transfer" ? toAccountId : null,
      type,
      amount: parsedAmount,
      currency,
      exchange_rate: 1,
      category: category || null,
      payee: payee || null,
      description: description || null,
      occurred_at: date,
      status,
    });
    setIsSaving(false);

    if (saved) {
      setAmount("");
      setCategory("");
      setPayee("");
      setDescription("");
      setToAccountId("");
      setStatus("cleared");
      setDate(new Date());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {typeOptions.map(({ value, label, helper, icon: Icon }) => (
          <button key={value} type="button" onClick={() => setType(value)} disabled={disabled || isSaving} className={cn("rounded-2xl border p-3 text-left transition-all", type === value ? "border-primary bg-primary/15 text-primary shadow-button" : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
            <Icon className="mb-2 h-5 w-5" />
            <span className="block text-sm font-semibold">{label}</span>
            <span className="mt-1 block text-[11px] leading-4 opacity-75">{helper}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>From account</Label><Select value={accountId} onValueChange={handleAccountChange} disabled={disabled || isSaving || accounts.length === 0}><SelectTrigger><SelectValue placeholder={accounts.length === 0 ? "No accounts found" : "Choose account"} /></SelectTrigger><SelectContent>{accounts.length === 0 ? <div className="px-3 py-6 text-center text-sm text-muted-foreground"><WalletCards className="mx-auto mb-2 h-5 w-5 text-primary" /><p className="font-medium text-foreground">No accounts found</p><p className="mt-1 text-xs">Add an account before recording a transaction.</p></div> : accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name} · {account.currency}</SelectItem>)}</SelectContent></Select>{accounts.length === 0 && <p className="text-xs text-warning">Create an account first, then reopen this form.</p>}</div>
        {type === "transfer" ? <div className="space-y-2"><Label>To account</Label><Select value={toAccountId} onValueChange={setToAccountId} disabled={disabled || isSaving || accounts.length < 2}><SelectTrigger><SelectValue placeholder={accounts.length < 2 ? "No destination account" : "Destination account"} /></SelectTrigger><SelectContent>{accounts.filter((account) => account.id !== accountId).length === 0 ? <div className="px-3 py-6 text-center text-sm text-muted-foreground"><ArrowLeftRight className="mx-auto mb-2 h-5 w-5 text-info" /><p className="font-medium text-foreground">No destination account</p><p className="mt-1 text-xs">Add a second account to make a transfer.</p></div> : accounts.filter((account) => account.id !== accountId).map((account) => <SelectItem key={account.id} value={account.id}>{account.name} · {account.currency}</SelectItem>)}</SelectContent></Select></div> : <div className="space-y-2"><Label htmlFor="transaction-amount">Amount</Label><Input id="transaction-amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={disabled || isSaving} /></div>}
      </div>

      {type === "transfer" && <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="transfer-amount">Amount</Label><Input id="transfer-amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={disabled || isSaving} /></div><div className="space-y-2"><Label>Currency</Label><Input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} maxLength={3} disabled={disabled || isSaving} /></div></div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="transaction-payee">Payee / merchant</Label><Input id="transaction-payee" placeholder="e.g. Swiggy, salary, rent" value={payee} onChange={(event) => setPayee(event.target.value)} disabled={disabled || isSaving} /></div>
        <div className="space-y-2"><Label htmlFor="transaction-category">Category</Label><Input id="transaction-category" placeholder="e.g. Food & Dining" value={category} onChange={(event) => setCategory(event.target.value)} disabled={disabled || isSaving} /></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal" disabled={disabled || isSaving}><CalendarIcon className="mr-2 h-4 w-4" />{format(date, "PPP")}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={(nextDate) => nextDate && setDate(nextDate)} initialFocus /></PopoverContent></Popover></div>
        <div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value as TransactionStatus)} disabled={disabled || isSaving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="cleared">Cleared</SelectItem><SelectItem value="reconciled">Reconciled</SelectItem></SelectContent></Select></div>
      </div>

      <div className="space-y-2"><Label htmlFor="transaction-description">Note</Label><Textarea id="transaction-description" placeholder="Add context for your future self" value={description} onChange={(event) => setDescription(event.target.value)} disabled={disabled || isSaving} /></div>

      {validationError && <p role="alert" className="text-sm text-destructive">{validationError}</p>}
      <Button type="submit" className="w-full" disabled={disabled || isSaving || accounts.length === 0}>{isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving transaction...</> : "Save transaction"}</Button>
    </form>
  );
}

