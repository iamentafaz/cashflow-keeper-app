const FRANKFURTER_API = "https://api.frankfurter.dev/v2";

export interface ExchangeRateResult {
  base: string;
  quote: string;
  rate: number;
  date: string;
}

interface FrankfurterRateRow {
  base: string;
  quote: string;
  rate: number;
  date: string;
}

export async function fetchLatestRates(baseCurrency: string, quoteCurrencies: string[]): Promise<ExchangeRateResult[]> {
  const base = baseCurrency.trim().toUpperCase();
  const quotes = [...new Set(quoteCurrencies.map((currency) => currency.trim().toUpperCase()).filter((currency) => currency && currency !== base))];

  if (quotes.length === 0) return [];

  const response = await fetch(FRANKFURTER_API + "/rates?base=" + encodeURIComponent(base) + "&quotes=" + encodeURIComponent(quotes.join(",")));
  if (!response.ok) {
    throw new Error("Exchange-rate service returned HTTP " + response.status + ".");
  }

  const rows = await response.json() as FrankfurterRateRow[];
  return rows.filter((row) => Number.isFinite(Number(row.rate)) && Number(row.rate) > 0).map((row) => ({
    base: row.base.toUpperCase(),
    quote: row.quote.toUpperCase(),
    rate: Number(row.rate),
    date: row.date,
  }));
}

export function invertRatesToBase(baseCurrency: string, rows: ExchangeRateResult[]) {
  const base = baseCurrency.toUpperCase();
  const rates: Record<string, number> = { [base]: 1 };

  rows.forEach((row) => {
    if (row.base === base && row.rate > 0) {
      rates[row.quote] = 1 / row.rate;
    }
  });

  return rates;
}
