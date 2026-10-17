"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import type { Account, Category, Payee, Transaction, TransactionInput, TransactionStatus, TransactionType } from "@/types/finance";

const typeOptions: { value: TransactionType; label: string; helper: string; icon: typeof ArrowUpRight }[] = [
  { value: "expense", label: "Expense", helper: "Money leaving an account", icon: ArrowDownLeft },
  { value: "income", label: "Income", helper: "Money coming in", icon: ArrowUpRight },
  { value: "transfer", label: "Transfer", helper: "Move money between accounts", icon: ArrowLeftRight },
  { value: "refund", label: "Refund", helper: "Money returned to you", icon: RotateCcw },
];

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  payees: Payee[];
  onSave: (input: TransactionInput) => Promise<boolean>;
  initialTransaction?: Transaction | null;
  disabled?: boolean;
}

export function TransactionForm({ accounts, categories, payees, onSave, initialTransaction = null, disabled = false }: TransactionFormProps) {
  const isEditing = Boolean(initialTransaction);
  const [type, setType] = useState<TransactionType>(initialTransaction?.type ?? "expense");
  const [accountId, setAccountId] = useState(initialTransaction?.account_id ?? "");
  const [toAccountId, setToAccountId] = useState(initialTransaction?.to_account_id ?? "");
  const [toAmount, setToAmount] = useState(initialTransaction?.to_amount ? String(initialTransaction.to_amount) : "");
  const [amount, setAmount] = useState(initialTransaction ? String(initialTransaction.amount) : "");
  const [currency, setCurrency] = useState(initialTransaction?.currency ?? "INR");
  const [categoryId, setCategoryId] = useState(initialTransaction?.category_id ?? "");
  const [subcategoryId, setSubcategoryId] = useState(initialTransaction?.subcategory_id ?? "");
  const [category, setCategory] = useState(initialTransaction?.category ?? "");
  const [subcategory, setSubcategory] = useState(initialTransaction?.subcategory ?? "");
  const [payeeId, setPayeeId] = useState(initialTransaction?.payee_id ?? "");
  const [payee, setPayee] = useState(initialTransaction?.payee ?? "");
  const [description, setDescription] = useState(initialTransaction?.description ?? "");
  const [status, setStatus] = useState<TransactionStatus>(initialTransaction?.status ?? "cleared");
  const [date, setDate] = useState<Date>(initialTransaction?.occurred_at ?? new Date());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setType(initialTransaction?.type ?? "expense");
    setAccountId(initialTransaction?.account_id ?? "");
    setToAccountId(initialTransaction?.to_account_id ?? "");
    setToAmount(initialTransaction?.to_amount ? String(initialTransaction.to_amount) : "");
    setAmount(initialTransaction ? String(initialTransaction.amount) : "");
    setCurrency(initialTransaction?.currency ?? "INR");
    setCategoryId(initialTransaction?.category_id ?? "");
    setSubcategoryId(initialTransaction?.subcategory_id ?? "");
    setCategory(initialTransaction?.category ?? "");
    setSubcategory(initialTransaction?.subcategory ?? "");
    setPayeeId(initialTransaction?.payee_id ?? "");
    setPayee(initialTransaction?.payee ?? "");
    setDescription(initialTransaction?.description ?? "");
    setStatus(initialTransaction?.status ?? "cleared");
    setDate(initialTransaction?.occurred_at ?? new Date());
    setValidationError(null);
  }, [initialTransaction]);

  const rootCategories = useMemo(() => categories.filter((item) => !item.archived && !item.parent_id && (type === "income" || type === "refund" ? item.kind === "income" || item.kind === "both" : item.kind === "expense" || item.kind === "both")), [categories, type]);
  const subcategories = useMemo(() => categories.filter((item) => !item.archived && item.parent_id === categoryId), [categories, categoryId]);
  const activePayees = useMemo(() => payees.filter((item) => !item.archived), [payees]);
  const hasSavedPayees = activePayees.length > 0;

  const handleCategoryChange = (value: string) => {
    if (value === "custom") {
      setCategoryId("");
      setSubcategoryId("");
      setCategory("");
      setSubcategory("");
      return;
    }
    const selected = categories.find((item) => item.id === value);
    setCategoryId(value);
    setSubcategoryId("");
    setCategory(selected?.name ?? "");
    setSubcategory("");
  };

  const handleSubcategoryChange = (value: string) => {
    if (value === "none") {
      setSubcategoryId("");
      setSubcategory("");
      return;
    }
    const selected = categories.find((item) => item.id === value);
    setSubcategoryId(value);
    setSubcategory(selected?.name ?? "");
  };

  const handlePayeeChange = (value: string) => {
    if (value === "custom") {
      setPayeeId("");
      setPayee("");
      return;
    }
    const selected = activePayees.find((item) => item.id === value);
    setPayeeId(value);
    setPayee(selected?.name ?? "");
  };

  const handleAccountChange = (value: string) => {
    setAccountId(value);
    const selected = accounts.find((account) => account.id === value);
    if (selected) setCurrency(selected.currency);
  };

  const handleSubmit = async (event: FormEvent) => {
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
    const parsedToAmount = type === "transfer" ? Number(toAmount || amount) : null;
    if (type === "transfer" && (!Number.isFinite(parsedToAmount) || parsedToAmount <= 0)) {
      setValidationError("Enter the amount received by the destination account.");
      return;
    }
    if (!/^[A-Za-z]{3}$/.test(currency.trim())) {
      setValidationError("Use a 3-letter currency code, such as INR or USD.");
      return;
    }
    if ((type === "expense" || type === "income" || type === "refund") && !category.trim() && !description.trim()) {
      setValidationError("Add a category or a short description.");
      return;
    }

    setValidationError(null);
    setIsSaving(true);
    const saved = await onSave({
      account_id: accountId,
      to_account_id: type === "transfer" ? toAccountId : null,
      type,
      to_amount: parsedToAmount,
      amount: parsedAmount,
      currency,
      exchange_rate: 1,
      category_id: categoryId || null,
      subcategory_id: subcategoryId || null,
      category: category || null,
      subcategory: subcategory || null,
      payee_id: payeeId || null,
      payee: payee || null,
      description: description || null,
      occurred_at: date,
      status,
    });
    setIsSaving(false);

    if (saved && !isEditing) {
      setAmount("");
      setToAmount("");
      setCategoryId("");
      setSubcategoryId("");
      setCategory("");
      setSubcategory("");
      setPayeeId("");
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
          <button key={value} type="button" onClick={() => setType(value)} disabled={disabled || isSaving || isEditing} className={cn("rounded-2xl border p-3 text-left transition-all", type === value ? "border-primary bg-primary/15 text-primary shadow-button" : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:text-foreground", isEditing && type !== value && "cursor-not-allowed opacity-50")}>
            <Icon className="mb-2 h-5 w-5" />
            <span className="block text-sm font-semibold">{label}</span>
            <span className="mt-1 block text-[11px] leading-4 opacity-75">{helper}</span>
          </button>
        ))}
      </div>
      {isEditing && <p className="text-xs text-muted-foreground">Transaction type cannot be changed after saving. Create a new transaction if the type is wrong.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>From account</Label><Select value={accountId} onValueChange={handleAccountChange} disabled={disabled || isSaving || accounts.length === 0}><SelectTrigger><SelectValue placeholder={accounts.length === 0 ? "No accounts found" : "Choose account"} /></SelectTrigger><SelectContent>{accounts.length === 0 ? <div className="px-3 py-6 text-center text-sm text-muted-foreground"><WalletCards className="mx-auto mb-2 h-5 w-5 text-primary" /><p className="font-medium text-foreground">No accounts found</p><p className="mt-1 text-xs">Add an account before recording a transaction.</p></div> : accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name} · {account.currency}</SelectItem>)}</SelectContent></Select>{accounts.length === 0 && <p className="text-xs text-warning">Create an account first, then reopen this form.</p>}</div>
        {type === "transfer" ? <div className="space-y-2"><Label>To account</Label><Select value={toAccountId} onValueChange={(value) => { setToAccountId(value); if (!toAmount) setToAmount(amount); }} disabled={disabled || isSaving || accounts.length < 2}><SelectTrigger><SelectValue placeholder={accounts.length < 2 ? "No destination account" : "Destination account"} /></SelectTrigger><SelectContent>{accounts.filter((account) => account.id !== accountId).length === 0 ? <div className="px-3 py-6 text-center text-sm text-muted-foreground"><ArrowLeftRight className="mx-auto mb-2 h-5 w-5 text-info" /><p className="font-medium text-foreground">No destination account</p><p className="mt-1 text-xs">Add a second account to make a transfer.</p></div> : accounts.filter((account) => account.id !== accountId).map((account) => <SelectItem key={account.id} value={account.id}>{account.name} · {account.currency}</SelectItem>)}</SelectContent></Select></div> : <div className="space-y-2"><Label htmlFor="transaction-amount">Amount</Label><Input id="transaction-amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={disabled || isSaving} /></div>}
      </div>

      {type === "transfer" && <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="transfer-amount">Amount leaving ({accounts.find((account) => account.id === accountId)?.currency ?? currency})</Label><Input id="transfer-amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={disabled || isSaving} /></div><div className="space-y-2"><Label htmlFor="transfer-to-amount">Amount received ({accounts.find((account) => account.id === toAccountId)?.currency ?? "currency"})</Label><Input id="transfer-to-amount" type="number" min="0.01" step="0.01" placeholder={amount || "0.00"} value={toAmount} onChange={(event) => setToAmount(event.target.value)} disabled={disabled || isSaving || !toAccountId} /></div></div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="transaction-payee">Payee / merchant</Label>
          {hasSavedPayees ? <Select value={payeeId || "custom"} onValueChange={handlePayeeChange} disabled={disabled || isSaving}>
            <SelectTrigger><SelectValue placeholder="Choose payee" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Enter manually</SelectItem>
              {activePayees.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select> : <p className="rounded-xl border border-dashed border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">No saved payees yet. Enter one manually below.</p>}
          {(!hasSavedPayees || !payeeId) && <Input id="transaction-payee" placeholder="e.g. Swiggy, salary, rent" value={payee} onChange={(event) => { setPayeeId(""); setPayee(event.target.value); }} disabled={disabled || isSaving} />}
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId || "custom"} onValueChange={handleCategoryChange} disabled={disabled || isSaving}>
            <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Type a category manually</SelectItem>
              {rootCategories.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {!categoryId && <Input id="transaction-category" placeholder="e.g. Food & Dining" value={category} onChange={(event) => setCategory(event.target.value)} disabled={disabled || isSaving} />}
        </div>
      </div>

      {categoryId && subcategories.length > 0 && <div className="space-y-2"><Label>Subcategory</Label><Select value={subcategoryId || "none"} onValueChange={handleSubcategoryChange} disabled={disabled || isSaving}><SelectTrigger><SelectValue placeholder="Choose subcategory" /></SelectTrigger><SelectContent><SelectItem value="none">No subcategory</SelectItem>{subcategories.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal" disabled={disabled || isSaving}><CalendarIcon className="mr-2 h-4 w-4" />{format(date, "PPP")}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={(nextDate) => nextDate && setDate(nextDate)} initialFocus /></PopoverContent></Popover></div>
        <div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value as TransactionStatus)} disabled={disabled || isSaving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="cleared">Cleared</SelectItem><SelectItem value="reconciled">Reconciled</SelectItem></SelectContent></Select></div>
      </div>

      <div className="space-y-2"><Label htmlFor="transaction-description">Note</Label><Textarea id="transaction-description" placeholder="Add context for your future self" value={description} onChange={(event) => setDescription(event.target.value)} disabled={disabled || isSaving} /></div>

      {validationError && <p role="alert" className="text-sm text-destructive">{validationError}</p>}
      <Button type="submit" className="w-full" disabled={disabled || isSaving || accounts.length === 0}>{isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> {isEditing ? "Updating transaction..." : "Saving transaction..."}</> : isEditing ? "Update transaction" : "Save transaction"}</Button>
    </form>
  );
}
