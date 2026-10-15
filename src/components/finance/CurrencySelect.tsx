"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currencyName, supportedCurrencies } from "@/lib/currencies";

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function CurrencySelect({ value, onValueChange, disabled = false }: CurrencySelectProps) {
  const normalizedValue = value.toUpperCase();
  const hasCurrentCurrency = supportedCurrencies.some((currency) => currency.code === normalizedValue);
  const options = hasCurrentCurrency ? supportedCurrencies : [{ code: normalizedValue, name: currencyName(normalizedValue) }, ...supportedCurrencies];

  return (
    <Select value={normalizedValue} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((currency) => <SelectItem key={currency.code} value={currency.code}>{currency.code} · {currency.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
