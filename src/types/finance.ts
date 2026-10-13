import { isValid, parseISO } from "date-fns";

export type AccountType = "bank" | "cash" | "credit_card" | "wallet";
export type TransactionType = "income" | "expense" | "transfer" | "refund";
export type TransactionStatus = "pending" | "cleared" | "reconciled";

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

export interface Transaction {
  id: string;
  account_id: string;
  to_account_id: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  exchange_rate: number;
  category: string | null;
  subcategory: string | null;
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
  amount: number | string;
  currency?: string | null;
  exchange_rate?: number | string | null;
  category?: string | null;
  subcategory?: string | null;
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
  amount: number;
  currency: string;
  exchange_rate: number;
  category?: string | null;
  subcategory?: string | null;
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
    amount: Number(row.amount),
    currency: row.currency || "INR",
    exchange_rate: Number(row.exchange_rate) || 1,
    category: row.category ?? null,
    subcategory: row.subcategory ?? null,
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
    category: input.category?.trim() || null,
    subcategory: input.subcategory?.trim() || null,
    payee: input.payee?.trim() || null,
    description: input.description?.trim() || null,
    occurred_at: input.occurred_at.toISOString().slice(0, 10),
    status: input.status,
    notes: input.notes?.trim() || null,
  };
}

