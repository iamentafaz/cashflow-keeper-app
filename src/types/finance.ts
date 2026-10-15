import { isValid, parseISO } from "date-fns";

export type AccountType = "bank" | "cash" | "credit_card" | "wallet";
export type TransactionType = "income" | "expense" | "transfer" | "refund";
export type TransactionStatus = "pending" | "cleared" | "reconciled";
export type TransferDirection = "debit" | "credit";
export type CategoryKind = "income" | "expense" | "both";

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  parent_id: string | null;
  kind: CategoryKind;
  color: string | null;
  archived: boolean;
  created_at?: string;
}

export interface CategoryRow {
  id: string;
  user_id?: string | null;
  name: string;
  parent_id?: string | null;
  kind?: CategoryKind | null;
  color?: string | null;
  archived?: boolean | null;
  created_at?: string;
}

export interface CategoryInput {
  name: string;
  parent_id?: string | null;
  kind: CategoryKind;
}

export interface Payee {
  id: string;
  user_id: string;
  name: string;
  default_category_id: string | null;
  archived: boolean;
  created_at?: string;
}

export interface PayeeRow {
  id: string;
  user_id: string;
  name: string;
  default_category_id?: string | null;
  archived?: boolean | null;
  created_at?: string;
}

export interface PayeeInput {
  name: string;
  default_category_id?: string | null;
}

export interface ExchangeRate {
  id?: string;
  user_id: string | null;
  base_currency: string;
  quote_currency: string;
  rate: number;
  rate_date: string;
  source: string;
  fetched_at?: string;
}

export interface ExchangeRateRow {
  id?: string;
  user_id?: string | null;
  base_currency: string;
  quote_currency: string;
  rate: number | string;
  rate_date: string;
  source?: string | null;
  fetched_at?: string;
}

export interface TransactionAttachment {
  id: string;
  transaction_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  captured_at: string | null;
  merchant_name: string | null;
  receipt_total: number | null;
  receipt_metadata: Record<string, unknown>;
  created_at?: string;
}

export interface TransactionAttachmentRow {
  id: string;
  transaction_id: string;
  storage_path: string;
  file_name: string;
  mime_type?: string | null;
  file_size?: number | string | null;
  captured_at?: string | null;
  merchant_name?: string | null;
  receipt_total?: number | string | null;
  receipt_metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export interface ReconciliationSession {
  id: string;
  account_id: string;
  statement_date: string;
  statement_balance: number;
  book_balance: number;
  difference: number;
  reconciled_transaction_count: number;
  notes: string | null;
  status: "completed";
  completed_at: string;
  created_at?: string;
}

export interface ReconciliationSessionRow {
  id: string;
  account_id: string;
  statement_date: string;
  statement_balance: number | string;
  book_balance: number | string;
  difference: number | string;
  reconciled_transaction_count?: number | string | null;
  notes?: string | null;
  status?: "completed" | null;
  completed_at: string;
  created_at?: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  opening_balance: number;
  archived: boolean;
  created_at?: string;
}

export interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  opening_balance: number | string;
  archived?: boolean | null;
  created_at?: string;
}

export interface AccountInput {
  name: string;
  type: AccountType;
  currency: string;
  opening_balance: number;
}

export type AccountUpdateInput = AccountInput;

export interface Transaction {
  id: string;
  account_id: string;
  to_account_id: string | null;
  type: TransactionType;
  transfer_group_id: string | null;
  transfer_direction: TransferDirection | null;
  to_amount?: number | null;
  amount: number;
  currency: string;
  exchange_rate: number;
  category_id: string | null;
  subcategory_id: string | null;
  category: string | null;
  subcategory: string | null;
  payee_id: string | null;
  payee: string | null;
  description: string | null;
  occurred_at: Date;
  status: TransactionStatus;
  notes: string | null;
  created_at?: string;
}

export interface TransactionRow {
  id: string;
  account_id: string;
  to_account_id?: string | null;
  type: TransactionType;
  transfer_group_id?: string | null;
  transfer_direction?: TransferDirection | null;
  to_amount?: number | string | null;
  amount: number | string;
  currency?: string | null;
  exchange_rate?: number | string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  category?: string | null;
  subcategory?: string | null;
  payee_id?: string | null;
  payee?: string | null;
  description?: string | null;
  occurred_at: string;
  status?: TransactionStatus | null;
  notes?: string | null;
  created_at?: string;
}

export interface TransactionInput {
  account_id: string;
  to_account_id?: string | null;
  type: TransactionType;
  to_amount?: number | null;
  amount: number;
  currency: string;
  exchange_rate: number;
  category_id?: string | null;
  subcategory_id?: string | null;
  category?: string | null;
  subcategory?: string | null;
  payee_id?: string | null;
  payee?: string | null;
  description?: string | null;
  occurred_at: Date;
  status: TransactionStatus;
  notes?: string | null;
}

export function normalizeAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency || "INR",
    opening_balance: Number(row.opening_balance) || 0,
    archived: Boolean(row.archived),
    created_at: row.created_at,
  };
}

export function normalizeCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    user_id: row.user_id ?? null,
    name: row.name,
    parent_id: row.parent_id ?? null,
    kind: row.kind ?? "expense",
    color: row.color ?? null,
    archived: Boolean(row.archived),
    created_at: row.created_at,
  };
}

export function normalizePayee(row: PayeeRow): Payee {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    default_category_id: row.default_category_id ?? null,
    archived: Boolean(row.archived),
    created_at: row.created_at,
  };
}

export function normalizeAttachment(row: TransactionAttachmentRow): TransactionAttachment {
  return {
    id: row.id,
    transaction_id: row.transaction_id,
    storage_path: row.storage_path,
    file_name: row.file_name,
    mime_type: row.mime_type ?? null,
    file_size: row.file_size == null ? null : Number(row.file_size),
    captured_at: row.captured_at ?? null,
    merchant_name: row.merchant_name ?? null,
    receipt_total: row.receipt_total == null ? null : Number(row.receipt_total),
    receipt_metadata: row.receipt_metadata ?? {},
    created_at: row.created_at,
  };
}

export function normalizeReconciliationSession(row: ReconciliationSessionRow): ReconciliationSession {
  return {
    id: row.id,
    account_id: row.account_id,
    statement_date: row.statement_date,
    statement_balance: Number(row.statement_balance),
    book_balance: Number(row.book_balance),
    difference: Number(row.difference),
    reconciled_transaction_count: Number(row.reconciled_transaction_count) || 0,
    notes: row.notes ?? null,
    status: row.status ?? "completed",
    completed_at: row.completed_at,
    created_at: row.created_at,
  };
}

export function normalizeTransaction(row: TransactionRow): Transaction {
  const occurredAt = parseISO(row.occurred_at);

  if (!isValid(occurredAt)) {
    throw new Error(`Invalid transaction date returned for transaction ${row.id}`);
  }

  return {
    id: row.id,
    account_id: row.account_id,
    to_account_id: row.to_account_id ?? null,
    type: row.type,
    transfer_group_id: row.transfer_group_id ?? null,
    transfer_direction: row.transfer_direction ?? (row.type === "transfer" ? "debit" : null),
    to_amount: row.to_amount == null ? null : Number(row.to_amount),
    amount: Number(row.amount),
    currency: row.currency || "INR",
    exchange_rate: Number(row.exchange_rate) || 1,
    category_id: row.category_id ?? null,
    subcategory_id: row.subcategory_id ?? null,
    category: row.category ?? null,
    subcategory: row.subcategory ?? null,
    payee_id: row.payee_id ?? null,
    payee: row.payee ?? null,
    description: row.description ?? null,
    occurred_at: occurredAt,
    status: row.status || "cleared",
    notes: row.notes ?? null,
    created_at: row.created_at,
  };
}

export function serializeAccount(input: AccountInput) {
  return {
    name: input.name.trim(),
    type: input.type,
    currency: input.currency.trim().toUpperCase(),
    opening_balance: input.opening_balance,
  };
}

export function serializeTransaction(input: TransactionInput) {
  return {
    account_id: input.account_id,
    to_account_id: input.to_account_id || null,
    type: input.type,
    amount: input.amount,
    currency: input.currency.trim().toUpperCase(),
    exchange_rate: input.exchange_rate,
    category_id: input.category_id || null,
    subcategory_id: input.subcategory_id || null,
    category: input.category?.trim() || null,
    subcategory: input.subcategory?.trim() || null,
    payee_id: input.payee_id || null,
    payee: input.payee?.trim() || null,
    description: input.description?.trim() || null,
    occurred_at: input.occurred_at.toISOString().slice(0, 10),
    status: input.status,
    notes: input.notes?.trim() || null,
  };
}

