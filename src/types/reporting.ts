export type ReportRange = "month" | "quarter" | "year" | "all" | "custom";

export interface ReportPeriod {
  start: string | null;
  end: string;
  compareStart: string | null;
  compareEnd: string | null;
  label: string;
}

export interface ReportMetrics {
  income: number;
  expenses: number;
  net: number;
  pending: number;
  transactions: number;
  missingConversions: number;
}

export interface ReportGroup {
  name: string;
  amount: number;
  percentage: number;
}

export interface ReportAccountSpend extends ReportGroup {
  accountId: string;
}

export interface ReportAccountBalance {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  convertedBalance: number | null;
  archived: boolean;
}

export interface ReportNetWorth {
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface ReportRecentTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  exchangeRateBaseCurrency: string;
  convertedAmount: number | null;
  category: string | null;
  payee: string | null;
  description: string | null;
  occurredAt: string;
  status: string;
}

export interface ReportResponse {
  reportingCurrency: string;
  metrics: ReportMetrics;
  comparison: ReportMetrics | null;
  trend: Array<{ key: string; month: string; income: number; expenses: number; net: number }>;
  categories: ReportGroup[];
  payees: ReportGroup[];
  accounts: ReportAccountSpend[];
  status: Array<{ name: string; value: number }>;
  accountBalances: ReportAccountBalance[];
  netWorth: ReportNetWorth;
  recentTransactions: ReportRecentTransaction[];
}
