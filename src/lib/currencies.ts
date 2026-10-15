export const supportedCurrencies = [
  { code: "AED", name: "UAE dirham" },
  { code: "AUD", name: "Australian dollar" },
  { code: "CAD", name: "Canadian dollar" },
  { code: "CHF", name: "Swiss franc" },
  { code: "CNY", name: "Chinese yuan" },
  { code: "DKK", name: "Danish krone" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British pound" },
  { code: "HKD", name: "Hong Kong dollar" },
  { code: "INR", name: "Indian rupee" },
  { code: "JPY", name: "Japanese yen" },
  { code: "NOK", name: "Norwegian krone" },
  { code: "NZD", name: "New Zealand dollar" },
  { code: "PLN", name: "Polish złoty" },
  { code: "SEK", name: "Swedish krona" },
  { code: "SGD", name: "Singapore dollar" },
  { code: "THB", name: "Thai baht" },
  { code: "TRY", name: "Turkish lira" },
  { code: "USD", name: "US dollar" },
  { code: "ZAR", name: "South African rand" },
] as const;

export type SupportedCurrency = (typeof supportedCurrencies)[number]["code"];

export function currencyName(code: string) {
  return supportedCurrencies.find((currency) => currency.code === code)?.name ?? "Custom currency";
}
