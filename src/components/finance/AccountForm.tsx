"use client";

import { useState } from "react";
import { Banknote, CreditCard, Landmark, Loader2, Plus, Smartphone, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AccountInput, AccountType } from "@/types/finance";

const accountOptions: { value: AccountType; label: string; icon: typeof Landmark }[] = [
  { value: "bank", label: "Bank account", icon: Landmark },
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "credit_card", label: "Credit card", icon: CreditCard },
  { value: "wallet", label: "Digital wallet", icon: Smartphone },
];

interface AccountFormProps {
  onCreate: (input: AccountInput) => Promise<boolean>;
  disabled?: boolean;
}

export function AccountForm({ onCreate, disabled = false }: AccountFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [currency, setCurrency] = useState("INR");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedBalance = Number(openingBalance);

    if (!name.trim()) {
      setValidationError("Give this account a name.");
      return;
    }

    if (!currency.trim() || currency.trim().length !== 3) {
      setValidationError("Use a 3-letter currency code, such as INR or USD.");
      return;
    }

    if (!Number.isFinite(parsedBalance)) {
      setValidationError("Opening balance must be a valid number.");
      return;
    }

    setValidationError(null);
    setIsSaving(true);
    const saved = await onCreate({
      name,
      type,
      currency,
      opening_balance: parsedBalance,
    });
    setIsSaving(false);

    if (saved) {
      setName("");
      setType("bank");
      setCurrency("INR");
      setOpeningBalance("0");
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <span className="rounded-xl bg-primary/15 p-2 text-primary"><Plus className="h-5 w-5" /></span>
          Add an account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Account name</Label>
            <Input id="account-name" placeholder="e.g. HDFC checking" value={name} onChange={(event) => setName(event.target.value)} disabled={disabled || isSaving} />
          </div>

          <div className="space-y-2">
            <Label>Account type</Label>
            <Select value={type} onValueChange={(value) => setType(value as AccountType)} disabled={disabled || isSaving}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {accountOptions.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}><span className="inline-flex items-center gap-2"><Icon className="h-4 w-4 text-primary" />{label}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-currency">Currency</Label>
              <Input id="account-currency" maxLength={3} placeholder="INR" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} disabled={disabled || isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opening-balance">Opening balance</Label>
              <Input id="opening-balance" type="number" step="0.01" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} disabled={disabled || isSaving} />
            </div>
          </div>

          {validationError && <p role="alert" className="text-sm text-destructive">{validationError}</p>}

          <Button type="submit" className="w-full" disabled={disabled || isSaving}>
            {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving account...</> : <><WalletCards className="h-4 w-4" /> Save account</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

