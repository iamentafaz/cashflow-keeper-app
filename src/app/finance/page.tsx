"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Archive,
  ArchiveRestore,
  Banknote,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  Filter,
  Landmark,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { createClient } from "@/utils/supabase/client";
import { AccountForm } from "@/components/finance/AccountForm";
import { CategoryPayeeManager } from "@/components/finance/CategoryPayeeManager";
import { TransactionForm } from "@/components/finance/TransactionForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type {
  Account,
  AccountInput,
  AccountRow,
  Category,
  CategoryInput,
  CategoryRow,
  Payee,
  PayeeInput,
  PayeeRow,
  Transaction,
  TransactionInput,
  TransactionRow,
  TransactionType,
} from "@/types/finance";
import { normalizeAccount, normalizeCategory, normalizePayee, normalizeTransaction, serializeAccount, serializeTransaction } from "@/types/finance";

const accountMeta: Record<Account["type"], { label: string; icon: typeof Landmark; accent: string }> = {
  bank: { label: "Bank", icon: Landmark, accent: "text-primary bg-primary/15" },
  cash: { label: "Cash", icon: Banknote, accent: "text-success bg-success/15" },
  credit_card: { label: "Credit card", icon: CreditCard, accent: "text-warning bg-warning/15" },
  wallet: { label: "Wallet", icon: Smartphone, accent: "text-info bg-info/15" },
};

const transactionMeta: Record<TransactionType, { label: string; icon: typeof ArrowUpRight; color: string }> = {
  income: { label: "Income", icon: ArrowUpRight, color: "text-success" },
  expense: { label: "Expense", icon: ArrowDownLeft, color: "text-destructive" },
  transfer: { label: "Transfer", icon: ArrowLeftRight, color: "text-info" },
  refund: { label: "Refund", icon: RotateCcw, color: "text-primary" },
};

const statusMeta = {
  pending: { label: "Pending", icon: Clock3, className: "border-warning/30 bg-warning/10 text-warning" },
  cleared: { label: "Cleared", icon: CheckCircle2, className: "border-info/30 bg-info/10 text-info" },
  reconciled: { label: "Reconciled", icon: ShieldCheck, className: "border-primary/30 bg-primary/10 text-primary" },
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
  return error?.code === "42P01" || error?.message?.toLowerCase().includes("does not exist") || error?.message?.toLowerCase().includes("schema cache");
}

function formatMoney(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function balanceForAccount(account: Account, transactions: Transaction[]) {
  return transactions.reduce((balance, transaction) => {
    if (transaction.type === "transfer") {
      if (transaction.account_id !== account.id) return balance;
      return transaction.transfer_direction === "credit" ? balance + transaction.amount : balance - transaction.amount;
    }
    if (transaction.account_id === account.id) {
      if (transaction.type === "income" || transaction.type === "refund") return balance + transaction.amount;
      if (transaction.type === "expense") return balance - transaction.amount;
    }
    return balance;
  }, account.opening_balance);
}

export default function FinancePage() {
  const user = useSelector((state: RootState) => state.user.user);
  const userId = typeof user?.id === "string" ? user.id : null;
  const isOnline = useOnlineStatus();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [transactionSheetOpen, setTransactionSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountToArchive, setAccountToArchive] = useState<Account | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);

  const loadFinanceData = useCallback(async () => {
    if (!userId) {
      setAccounts([]);
      setCategories([]);
      setPayees([]);
      setTransactions([]);
      setIsLoading(false);
      return;
    }
    if (!isOnline) {
      setError("You are offline. Reconnect to load your finance workspace.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSchemaMissing(false);

    try {
      const supabase = createClient();
      const [accountResult, categoryResult, payeeResult, transactionResult] = await Promise.all([
        supabase.from("accounts").select("id, name, type, currency, opening_balance, archived, created_at").eq("user_id", userId).order("created_at", { ascending: true }),
        supabase.from("categories").select("id, user_id, name, parent_id, kind, color, archived, created_at").order("name", { ascending: true }),
        supabase.from("payees").select("id, user_id, name, default_category_id, archived, created_at").eq("user_id", userId).order("name", { ascending: true }),
        supabase.from("transactions").select("id, account_id, to_account_id, type, amount, currency, exchange_rate, category_id, subcategory_id, category, subcategory, payee_id, payee, description, occurred_at, status, notes, created_at, transfer_group_id, transfer_direction").eq("user_id", userId).order("occurred_at", { ascending: false }).order("created_at", { ascending: false }),
      ]);

      if (accountResult.error || categoryResult.error || payeeResult.error || transactionResult.error) {
        const queryError = accountResult.error || categoryResult.error || payeeResult.error || transactionResult.error;
        if (isMissingTableError(queryError)) {
          setSchemaMissing(true);
          setError("The finance tables are not connected to this Supabase project yet.");
          return;
        }
        throw queryError;
      }

      setAccounts((accountResult.data ?? []).map((row) => normalizeAccount(row as AccountRow)));
      setCategories((categoryResult.data ?? []).map((row) => normalizeCategory(row as CategoryRow)));
      setPayees((payeeResult.data ?? []).map((row) => normalizePayee(row as PayeeRow)));
      setTransactions((transactionResult.data ?? []).map((row) => normalizeTransaction(row as TransactionRow)));
    } catch (loadError) {
      const message = getErrorMessage(loadError);
      setError(message);
      toast({ title: "Unable to load finance workspace", description: message, variant: "danger" });
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, toast, userId]);

  useEffect(() => { void loadFinanceData(); }, [loadFinanceData]);

  const activeAccounts = useMemo(() => accounts.filter((account) => !account.archived), [accounts]);
  const archivedAccounts = useMemo(() => accounts.filter((account) => account.archived), [accounts]);

  const openCreateAccount = () => {
    setEditingAccount(null);
    setAccountSheetOpen(true);
  };

  const openEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAccountSheetOpen(true);
  };

  const handleSaveAccount = async (input: AccountInput) => {
    if (!userId || !isOnline) return false;
    setIsCreatingAccount(!editingAccount);
    setIsUpdatingAccount(Boolean(editingAccount));
    try {
      const supabase = createClient();
      const query = editingAccount
        ? supabase.from("accounts").update(serializeAccount(input)).eq("id", editingAccount.id).eq("user_id", userId)
        : supabase.from("accounts").insert({ ...serializeAccount(input), user_id: userId });
      const { data, error: saveError } = await query.select("id, name, type, currency, opening_balance, archived, created_at").single();
      if (saveError) throw saveError;
      if (!data) throw new Error("The account was saved but no row was returned.");
      const savedAccount = normalizeAccount(data as AccountRow);
      setAccounts((previous) => editingAccount ? previous.map((account) => account.id === savedAccount.id ? savedAccount : account) : [...previous, savedAccount]);
      setAccountSheetOpen(false);
      setEditingAccount(null);
      toast({ title: editingAccount ? "Account updated" : "Account added", description: `${input.name} is ready for transactions.`, variant: "success" });
      return true;
    } catch (saveError) {
      const message = getErrorMessage(saveError);
      toast({ title: editingAccount ? "Could not update account" : "Could not add account", description: message, variant: "danger" });
      return false;
    } finally {
      setIsCreatingAccount(false);
      setIsUpdatingAccount(false);
    }
  };

  const handleArchiveAccount = async () => {
    if (!userId || !isOnline || !accountToArchive) return;
    const account = accountToArchive;
    setIsUpdatingAccount(true);
    try {
      const { data, error: updateError } = await createClient().from("accounts").update({ archived: !account.archived }).eq("id", account.id).eq("user_id", userId).select("id, name, type, currency, opening_balance, archived, created_at").single();
      if (updateError) throw updateError;
      if (!data) throw new Error("The account status was changed but no row was returned.");
      const updatedAccount = normalizeAccount(data as AccountRow);
      setAccounts((previous) => previous.map((item) => item.id === updatedAccount.id ? updatedAccount : item));
      toast({ title: updatedAccount.archived ? "Account archived" : "Account restored", description: updatedAccount.archived ? `${updatedAccount.name} is preserved but hidden from new transactions.` : `${updatedAccount.name} is active again.`, variant: "success" });
    } catch (updateError) {
      toast({ title: account.archived ? "Could not restore account" : "Could not archive account", description: getErrorMessage(updateError), variant: "danger" });
    } finally {
      setIsUpdatingAccount(false);
      setAccountToArchive(null);
    }
  };

  const handleCreateCategory = async (input: CategoryInput) => {
    if (!userId || !isOnline) return false;
    try {
      const { data, error: saveError } = await createClient().from("categories").insert({
        user_id: userId,
        name: input.name.trim(),
        parent_id: input.parent_id || null,
        kind: input.kind,
        archived: false,
      }).select("id, user_id, name, parent_id, kind, color, archived, created_at").single();
      if (saveError) throw saveError;
      if (!data) throw new Error("The category was saved but no row was returned.");
      setCategories((previous) => [...previous, normalizeCategory(data as CategoryRow)]);
      toast({ title: "Category added", description: input.name + " is ready for transaction entry.", variant: "success" });
      return true;
    } catch (saveError) {
      toast({ title: "Could not add category", description: getErrorMessage(saveError), variant: "danger" });
      return false;
    }
  };

  const handleArchiveCategory = async (category: Category) => {
    if (!userId || !isOnline || !category.user_id) return false;
    try {
      const { data, error: updateError } = await createClient().from("categories").update({ archived: !category.archived }).eq("id", category.id).eq("user_id", userId).select("id, user_id, name, parent_id, kind, color, archived, created_at").single();
      if (updateError) throw updateError;
      if (!data) throw new Error("The category status was changed but no row was returned.");
      const updatedCategory = normalizeCategory(data as CategoryRow);
      setCategories((previous) => previous.map((item) => item.id === updatedCategory.id ? updatedCategory : item));
      toast({ title: updatedCategory.archived ? "Category archived" : "Category restored", description: updatedCategory.archived ? updatedCategory.name + " is hidden from new transactions." : updatedCategory.name + " is available again.", variant: "success" });
      return true;
    } catch (updateError) {
      toast({ title: "Could not update category", description: getErrorMessage(updateError), variant: "danger" });
      return false;
    }
  };

  const handleCreatePayee = async (input: PayeeInput) => {
    if (!userId || !isOnline) return false;
    try {
      const { data, error: saveError } = await createClient().from("payees").insert({
        user_id: userId,
        name: input.name.trim(),
        default_category_id: input.default_category_id || null,
        archived: false,
      }).select("id, user_id, name, default_category_id, archived, created_at").single();
      if (saveError) throw saveError;
      if (!data) throw new Error("The payee was saved but no row was returned.");
      setPayees((previous) => [...previous, normalizePayee(data as PayeeRow)]);
      toast({ title: "Payee added", description: input.name + " will be easier to select next time.", variant: "success" });
      return true;
    } catch (saveError) {
      toast({ title: "Could not add payee", description: getErrorMessage(saveError), variant: "danger" });
      return false;
    }
  };

  const handleArchivePayee = async (payee: Payee) => {
    if (!userId || !isOnline) return false;
    try {
      const { data, error: updateError } = await createClient().from("payees").update({ archived: !payee.archived }).eq("id", payee.id).eq("user_id", userId).select("id, user_id, name, default_category_id, archived, created_at").single();
      if (updateError) throw updateError;
      if (!data) throw new Error("The payee status was changed but no row was returned.");
      const updatedPayee = normalizePayee(data as PayeeRow);
      setPayees((previous) => previous.map((item) => item.id === updatedPayee.id ? updatedPayee : item));
      toast({ title: updatedPayee.archived ? "Payee archived" : "Payee restored", description: updatedPayee.archived ? updatedPayee.name + " is hidden from new transactions." : updatedPayee.name + " is available again.", variant: "success" });
      return true;
    } catch (updateError) {
      toast({ title: "Could not update payee", description: getErrorMessage(updateError), variant: "danger" });
      return false;
    }
  };

  const openCreateTransaction = () => {
    setEditingTransaction(null);
    setTransactionSheetOpen(true);
  };

  const openEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionSheetOpen(true);
  };

  const handleSaveTransaction = async (input: TransactionInput) => {
    if (!userId || !isOnline) return false;
    setIsCreatingTransaction(true);
    try {
      const supabase = createClient();
      const serialized = serializeTransaction(input);

      if (input.type === "transfer") {
        const rpcName = editingTransaction ? "update_transfer_transaction" : "create_transfer_transaction";
        const rpcArgs = editingTransaction
          ? {
              p_transaction_id: editingTransaction.id,
              p_from_account_id: input.account_id,
              p_to_account_id: input.to_account_id,
              p_amount: input.amount,
              p_currency: input.currency,
              p_exchange_rate: input.exchange_rate,
              p_occurred_at: serialized.occurred_at,
              p_status: input.status,
              p_category: input.category,
              p_payee: input.payee,
              p_description: input.description,
              p_notes: input.notes,
            }
          : {
              p_from_account_id: input.account_id,
              p_to_account_id: input.to_account_id,
              p_amount: input.amount,
              p_currency: input.currency,
              p_exchange_rate: input.exchange_rate,
              p_occurred_at: serialized.occurred_at,
              p_status: input.status,
              p_category: input.category,
              p_payee: input.payee,
              p_description: input.description,
              p_notes: input.notes,
            };
        const { error: transferError } = await supabase.rpc(rpcName, rpcArgs);
        if (transferError) throw transferError;
      } else if (editingTransaction) {
        const { error: updateError } = await supabase.from("transactions").update(serialized).eq("id", editingTransaction.id).eq("user_id", userId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("transactions").insert({ ...serialized, user_id: userId });
        if (insertError) throw insertError;
      }

      await loadFinanceData();
      setTransactionSheetOpen(false);
      setEditingTransaction(null);
      toast({ title: editingTransaction ? "Transaction updated" : "Transaction added", description: input.type === "transfer" ? "Both sides of the transfer have been updated." : "Your cash flow has been updated.", variant: "success" });
      return true;
    } catch (saveError) {
      const message = getErrorMessage(saveError);
      toast({ title: editingTransaction ? "Could not update transaction" : "Could not add transaction", description: message, variant: "danger" });
      return false;
    } finally { setIsCreatingTransaction(false); }
  };

  const handleDeleteTransaction = async () => {
    if (!userId || !isOnline || !transactionToDelete) return;
    const transaction = transactionToDelete;
    setIsDeletingTransaction(true);
    try {
      const { error: deleteError } = await createClient().rpc("delete_transaction", { p_transaction_id: transaction.id });
      if (deleteError) throw deleteError;
      setTransactions((previous) => previous.filter((item) => transaction.transfer_group_id ? item.transfer_group_id !== transaction.transfer_group_id : item.id !== transaction.id));
      setTransactionToDelete(null);
      toast({ title: transaction.type === "transfer" ? "Transfer deleted" : "Transaction deleted", description: transaction.type === "transfer" ? "Both linked sides were removed." : "The transaction was removed from your ledger.", variant: "success" });
    } catch (deleteError) {
      toast({ title: "Could not delete transaction", description: getErrorMessage(deleteError), variant: "danger" });
    } finally {
      setIsDeletingTransaction(false);
    }
  };

  const visibleTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((transaction) => transaction.type !== "transfer" || transaction.transfer_direction !== "credit").filter((transaction) => {
      const account = accounts.find((item) => item.id === transaction.account_id);
      const matchesSearch = !query || [transaction.payee, transaction.category, transaction.description, account?.name].filter(Boolean).some((value) => value!.toLowerCase().includes(query));
      const matchesType = typeFilter === "all" || transaction.type === typeFilter;
      const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [accounts, search, statusFilter, transactions, typeFilter]);

  const totalBalance = activeAccounts.reduce((sum, account) => sum + balanceForAccount(account, transactions), 0);
  const income = transactions.filter((transaction) => transaction.type === "income" || transaction.type === "refund").reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = transactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0);
  const pendingCount = transactions.filter((transaction) => transaction.status === "pending").length;

  if (!userId) {
    return <div className="container mx-auto px-4 py-16"><Card className="mx-auto max-w-lg text-center"><CardContent className="space-y-4 py-12"><WalletCards className="mx-auto h-10 w-10 text-primary" /><h1 className="text-2xl font-semibold">Sign in to open your money workspace</h1><p className="text-muted-foreground">Accounts and transactions are private to your account.</p><Link href="/" className="text-primary underline">Return home to sign in</Link></CardContent></Card></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="animate-fade-in-up"><p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-accent">Your financial command center</p><h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Money workspace</h1><p className="mt-3 max-w-2xl text-muted-foreground">See every account, transaction, and pending item in one calm, focused view.</p></div>
          <div className="flex flex-wrap gap-3">
            <Sheet open={accountSheetOpen} onOpenChange={(open) => { setAccountSheetOpen(open); if (!open) setEditingAccount(null); }}><SheetTrigger asChild><Button variant="outline" onClick={openCreateAccount}><Plus className="h-4 w-4" /> Add account</Button></SheetTrigger><SheetContent className="w-full overflow-y-auto border-border bg-background sm:max-w-lg"><SheetHeader><SheetTitle>{editingAccount ? "Update account details" : "Set up an account"}</SheetTitle><SheetDescription>{editingAccount ? "Keep this account’s details current without losing its history." : "Add a bank, wallet, cash pocket, or card to start tracking it."}</SheetDescription></SheetHeader><div className="mt-8"><AccountForm key={editingAccount?.id ?? "new-account"} onSave={handleSaveAccount} initialAccount={editingAccount} hasTransactions={Boolean(editingAccount && transactions.some((transaction) => transaction.account_id === editingAccount.id || transaction.to_account_id === editingAccount.id))} disabled={!isOnline || isCreatingAccount || isUpdatingAccount} /></div></SheetContent></Sheet>
            <Sheet open={transactionSheetOpen} onOpenChange={(open) => { setTransactionSheetOpen(open); if (!open) setEditingTransaction(null); }}><SheetTrigger asChild><Button onClick={openCreateTransaction}><Plus className="h-4 w-4" /> Add transaction</Button></SheetTrigger><SheetContent className="w-full overflow-y-auto border-border bg-background sm:max-w-2xl"><SheetHeader><SheetTitle>{editingTransaction ? "Edit transaction" : "Capture a transaction"}</SheetTitle><SheetDescription>{editingTransaction ? "Update the details while preserving the transaction history." : "Record income, spending, transfers, and refunds while the details are fresh."}</SheetDescription></SheetHeader><div className="mt-8"><TransactionForm key={editingTransaction?.id ?? "new-transaction"} accounts={activeAccounts} categories={categories} payees={payees} onSave={handleSaveTransaction} initialTransaction={editingTransaction} disabled={!isOnline || isCreatingTransaction} /></div></SheetContent></Sheet>
          </div>
        </section>

        {!isOnline && <div role="status" className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"><CircleAlert className="h-4 w-4" /> You are offline. Reconnect before saving or refreshing data.</div>}
        {error && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><Button size="sm" variant="outline" onClick={() => void loadFinanceData()} disabled={!isOnline}><RefreshCw className="h-4 w-4" /> Retry</Button></div>}
        {schemaMissing && <Card className="border-primary/25 bg-primary/[0.06]"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-foreground">One setup step before your workspace is live</p><p className="mt-1 text-sm text-muted-foreground">Apply the finance schema script in <code className="rounded bg-secondary px-1.5 py-0.5">supabase/schema/finance-workspace.sql</code>, then refresh.</p></div><Button variant="outline" onClick={() => void loadFinanceData()}><RefreshCw className="h-4 w-4" /> Check again</Button></CardContent></Card>}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total balance" value={formatMoney(totalBalance)} helper={`${activeAccounts.length} active account${activeAccounts.length === 1 ? "" : "s"}`} icon={WalletCards} tone="primary" />
          <StatCard label="Money in" value={formatMoney(income)} helper="Income + refunds" icon={TrendingUp} tone="success" />
          <StatCard label="Money out" value={formatMoney(expenses)} helper="Expenses recorded" icon={TrendingDown} tone="danger" />
          <StatCard label="Needs attention" value={pendingCount.toString().padStart(2, "0")} helper="Pending transactions" icon={Clock3} tone="warning" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_1.95fr]">
          <Card className="border-border/70 bg-gradient-card shadow-card"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Accounts</CardTitle><p className="mt-1 text-sm text-muted-foreground">Where your money lives</p></div><button onClick={openCreateAccount} className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground" aria-label="Add account"><Plus className="h-4 w-4" /></button></CardHeader><CardContent className="space-y-3">{isLoading ? <LoadingRows count={3} /> : activeAccounts.length === 0 ? <EmptyAccounts onAdd={openCreateAccount} /> : activeAccounts.map((account) => <AccountCard key={account.id} account={account} balance={balanceForAccount(account, transactions)} onEdit={() => openEditAccount(account)} onArchive={() => setAccountToArchive(account)} />)}{!isLoading && archivedAccounts.length > 0 && <div className="space-y-3 border-t border-border/60 pt-5"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Archived accounts</p><Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">{archivedAccounts.length}</Badge></div>{archivedAccounts.map((account) => <AccountCard key={account.id} account={account} balance={balanceForAccount(account, transactions)} onEdit={() => openEditAccount(account)} onRestore={() => setAccountToArchive(account)} />)}</div>}</CardContent></Card>

          <Card className="border-border/70 bg-gradient-card shadow-card"><CardHeader className="space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><CardTitle>Transactions</CardTitle><p className="mt-1 text-sm text-muted-foreground">Your latest money movement</p></div><Badge variant="outline" className="w-fit border-primary/30 text-primary">{visibleTransactions.length} shown</Badge></div><div className="flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search payee, category, account..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="flex gap-3"><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="min-w-[130px]"><Filter className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem><SelectItem value="transfer">Transfer</SelectItem><SelectItem value="refund">Refund</SelectItem></SelectContent></Select><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="min-w-[130px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="cleared">Cleared</SelectItem><SelectItem value="reconciled">Reconciled</SelectItem></SelectContent></Select></div></div></CardHeader><CardContent>{isLoading ? <LoadingRows count={5} /> : visibleTransactions.length === 0 ? <EmptyTransactions onAdd={openCreateTransaction} /> : <div className="space-y-2">{visibleTransactions.map((transaction) => <TransactionRowView key={transaction.id} transaction={transaction} accounts={accounts} onEdit={() => openEditTransaction(transaction)} onDelete={() => setTransactionToDelete(transaction)} />)}</div>}</CardContent></Card>
        </section>

        <CategoryPayeeManager categories={categories} payees={payees} onCreateCategory={handleCreateCategory} onArchiveCategory={handleArchiveCategory} onCreatePayee={handleCreatePayee} onArchivePayee={handleArchivePayee} disabled={!isOnline || isLoading} />

        <Card className="border-border/70 bg-gradient-card shadow-card"><CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-4"><span className="rounded-2xl bg-accent/15 p-3 text-accent"><Receipt className="h-5 w-5" /></span><div><p className="font-semibold">Next up: make every transaction effortless</p><p className="mt-1 text-sm text-muted-foreground">Categories, payees, receipt attachments, and reconciliation are ready for the next layer.</p></div></div></CardContent></Card>
      </div>

      <AlertDialog open={Boolean(accountToArchive)} onOpenChange={(open) => { if (!open && !isUpdatingAccount) setAccountToArchive(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{accountToArchive?.archived ? "Restore this account?" : "Archive this account?"}</AlertDialogTitle>
            <AlertDialogDescription>{accountToArchive?.archived ? `${accountToArchive.name} will become available for new transactions again.` : `${accountToArchive?.name} will be hidden from new transactions. Its balance and history will be preserved.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void handleArchiveAccount(); }} disabled={isUpdatingAccount}>{isUpdatingAccount ? "Saving..." : accountToArchive?.archived ? "Restore account" : "Archive account"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(transactionToDelete)} onOpenChange={(open) => { if (!open && !isDeletingTransaction) setTransactionToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{transactionToDelete?.type === "transfer" ? "Delete this transfer?" : "Delete this transaction?"}</AlertDialogTitle>
            <AlertDialogDescription>{transactionToDelete?.type === "transfer" ? "Both linked debit and credit records will be deleted from your ledger. This cannot be undone." : "This transaction will be permanently removed from your ledger. This cannot be undone."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTransaction}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={(event) => { event.preventDefault(); void handleDeleteTransaction(); }} disabled={isDeletingTransaction}>{isDeletingTransaction ? "Deleting..." : "Delete transaction"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ label, value, helper, icon: Icon, tone }: { label: string; value: string; helper: string; icon: typeof WalletCards; tone: "primary" | "success" | "danger" | "warning" }) {
  const toneClass = { primary: "bg-primary/15 text-primary", success: "bg-success/15 text-success", danger: "bg-destructive/15 text-destructive", warning: "bg-warning/15 text-warning" }[tone];
  return <Card className="border-border/70 bg-gradient-card shadow-card transition-transform duration-300 hover:-translate-y-1"><CardContent className="p-5"><div className="flex items-start justify-between"><span className={`rounded-2xl p-3 ${toneClass}`}><Icon className="h-5 w-5" /></span><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span></div><p className="mt-5 text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 text-sm text-muted-foreground">{helper}</p></CardContent></Card>;
}

function AccountCard({ account, balance, onEdit, onArchive, onRestore }: { account: Account; balance: number; onEdit: () => void; onArchive?: () => void; onRestore?: () => void }) {
  const meta = accountMeta[account.type];
  const Icon = meta.icon;
  return <div className="group flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/35 p-4 transition-all duration-300 hover:border-primary/40 hover:bg-secondary/60"><div className="flex min-w-0 items-center gap-3"><span className={`rounded-xl p-2.5 ${meta.accent}`}><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate font-semibold">{account.name}</p><p className="text-xs text-muted-foreground">{meta.label} · {account.currency}{account.archived ? " · Archived" : ""}</p></div></div><div className="ml-3 flex items-center gap-2"><p className="whitespace-nowrap text-right font-bold">{formatMoney(balance, account.currency)}</p><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Manage ${account.name}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={onEdit}><Pencil className="mr-2 h-4 w-4" /> Edit account</DropdownMenuItem>{onArchive && <DropdownMenuItem onSelect={onArchive}><Archive className="mr-2 h-4 w-4" /> Archive account</DropdownMenuItem>}{onRestore && <DropdownMenuItem onSelect={onRestore}><ArchiveRestore className="mr-2 h-4 w-4" /> Restore account</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></div></div>;
}

function TransactionRowView({ transaction, accounts, onEdit, onDelete }: { transaction: Transaction; accounts: Account[]; onEdit: () => void; onDelete: () => void }) {
  const meta = transactionMeta[transaction.type];
  const status = statusMeta[transaction.status];
  const TypeIcon = meta.icon;
  const StatusIcon = status.icon;
  const account = accounts.find((item) => item.id === transaction.account_id);
  const destination = transaction.to_account_id ? accounts.find((item) => item.id === transaction.to_account_id) : null;
  const signedAmount = transaction.type === "expense" || transaction.type === "transfer" ? -transaction.amount : transaction.amount;
  return <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background/30 p-3 transition-colors hover:border-primary/30 hover:bg-secondary/30"><span className={`rounded-xl bg-secondary p-2.5 ${meta.color}`}><TypeIcon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate font-medium">{transaction.payee || transaction.description || meta.label}</p><Badge variant="outline" className={`hidden items-center gap-1 px-1.5 py-0.5 text-[10px] sm:inline-flex ${status.className}`}><StatusIcon className="h-3 w-3" />{status.label}</Badge></div><p className="mt-1 truncate text-xs text-muted-foreground">{format(transaction.occurred_at, "dd MMM yyyy")} · {account?.name || "Account"}{destination ? ` → ${destination.name}` : ""}{transaction.category ? ` · ${transaction.category}` : ""}</p></div><div className="flex items-center gap-2"><div className="text-right"><p className={`whitespace-nowrap font-semibold ${meta.color}`}>{signedAmount > 0 ? "+" : "−"}{formatMoney(Math.abs(signedAmount), transaction.currency)}</p><span className="mt-1 block text-[10px] text-muted-foreground sm:hidden">{status.label}</span></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Manage ${transaction.payee || transaction.description || "transaction"}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={onEdit}><Pencil className="mr-2 h-4 w-4" /> Edit transaction</DropdownMenuItem><DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete transaction</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div>;
}

function EmptyAccounts({ onAdd }: { onAdd: () => void }) { return <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.05] p-6 text-center"><WalletCards className="mx-auto h-8 w-8 text-primary" /><p className="mt-3 font-semibold">Start with your first account</p><p className="mt-1 text-sm text-muted-foreground">Add a bank, cash pocket, card, or wallet to see balances here.</p><Button className="mt-4" size="sm" onClick={onAdd}><Plus className="h-4 w-4" /> Add account</Button></div>; }
function EmptyTransactions({ onAdd }: { onAdd: () => void }) { return <div className="rounded-2xl border border-dashed border-accent/30 bg-accent/[0.05] p-8 text-center"><Receipt className="mx-auto h-8 w-8 text-accent" /><p className="mt-3 font-semibold">Your ledger is ready</p><p className="mt-1 text-sm text-muted-foreground">Capture an income, expense, transfer, or refund to get started.</p><Button variant="outline" className="mt-4" size="sm" onClick={onAdd}><Plus className="h-4 w-4" /> Add transaction</Button></div>; }
function LoadingRows({ count }: { count: number }) { return <div className="space-y-3">{Array.from({ length: count }).map((_, index) => <div key={index} className="flex animate-pulse items-center gap-3 rounded-2xl bg-secondary/45 p-4"><div className="h-10 w-10 rounded-xl bg-muted" /><div className="flex-1 space-y-2"><div className="h-3 w-2/5 rounded bg-muted" /><div className="h-2 w-3/5 rounded bg-muted" /></div><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>)}</div>; }

