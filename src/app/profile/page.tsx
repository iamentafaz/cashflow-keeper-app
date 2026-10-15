"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleAlert, Loader2, Save, UserRound, UserRoundCheck } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { createClient } from "@/utils/supabase/client";
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard";
import { supportedCurrencies } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { normalizeProfile, type UserProfile, type UserProfileInput, type UserProfileRow } from "@/types/profile";

const timezones = ["Asia/Calcutta", "Asia/Kolkata", "UTC", "America/New_York", "Europe/London", "Asia/Singapore"];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function isProfileSchemaError(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() || "";
  return error?.code === "42703" || error?.code === "42P01" || message.includes("profiles") && (message.includes("column") || message.includes("does not exist") || message.includes("schema cache"));
}

export default function ProfilePage() {
  const user = useSelector((state: RootState) => state.user.user);
  const userId = typeof user?.id === "string" ? user.id : null;
  const email = typeof user?.email === "string" ? user.email : "";
  const fallbackName = typeof user?.user_metadata?.name === "string" ? user.user_metadata.name : "";
  const isOnline = useOnlineStatus();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<UserProfileInput>({ name: fallbackName, phone: "", avatar_url: "", default_currency: "INR", timezone: "Asia/Calcutta", locale: "en-IN" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemaMissing, setSchemaMissing] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    if (!isOnline) {
      setError("You are offline. Reconnect to load your profile.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSchemaMissing(false);
    const { data, error: profileError } = await createClient().from("profiles").select("id, name, phone, avatar_url, default_currency, timezone, locale, updated_at").eq("id", userId).maybeSingle();

    if (profileError) {
      if (isProfileSchemaError(profileError)) {
        setSchemaMissing(true);
        setError("The profile fields migration has not been applied yet.");
      } else {
        const message = getErrorMessage(profileError);
        setError(message);
        toast({ title: "Unable to load profile", description: message, variant: "danger" });
      }
      setIsLoading(false);
      return;
    }

    const normalized = normalizeProfile((data || { id: userId }) as UserProfileRow, fallbackName);
    setProfile(normalized);
    setForm({ name: normalized.name, phone: normalized.phone, avatar_url: normalized.avatar_url, default_currency: normalized.default_currency, timezone: normalized.timezone, locale: normalized.locale });
    setIsLoading(false);
  }, [fallbackName, isOnline, toast, userId]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  const initials = useMemo(() => {
    const source = form.name || email || "U";
    return source.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }, [email, form.name]);

  const updateField = <K extends keyof UserProfileInput>(field: K, value: UserProfileInput[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId || !isOnline) return;
    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (form.default_currency.length !== 3) {
      setError("Choose a valid 3-letter currency code.");
      return;
    }

    setIsSaving(true);
    setError(null);
    const { data, error: saveError } = await createClient().from("profiles").upsert({ id: userId, name: form.name.trim(), phone: form.phone.trim() || null, avatar_url: form.avatar_url.trim() || null, default_currency: form.default_currency.toUpperCase(), timezone: form.timezone, locale: form.locale, updated_at: new Date().toISOString() }, { onConflict: "id" }).select("id, name, phone, avatar_url, default_currency, timezone, locale, updated_at").single();
    setIsSaving(false);

    if (saveError) {
      const message = getErrorMessage(saveError);
      setError(message);
      toast({ title: "Could not save profile", description: message, variant: "danger" });
      return;
    }

    const normalized = normalizeProfile(data as UserProfileRow, fallbackName);
    setProfile(normalized);
    setForm({ name: normalized.name, phone: normalized.phone, avatar_url: normalized.avatar_url, default_currency: normalized.default_currency, timezone: normalized.timezone, locale: normalized.locale });
    toast({ title: "Profile updated", description: "Your personal details were saved.", variant: "success" });
  };

  if (!userId) {
    return <div className="container mx-auto px-4 py-16"><Card className="mx-auto max-w-lg text-center"><CardContent className="space-y-4 py-12"><UserRound className="mx-auto h-10 w-10 text-primary" /><h1 className="text-2xl font-semibold">Sign in to view your profile</h1><p className="text-muted-foreground">Your profile and security settings are private to your account.</p><Link href="/" className="text-primary underline">Return home to sign in</Link></CardContent></Card></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><Link href="/finance" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to money workspace</Link><p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">Account settings</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Your profile</h1><p className="mt-3 text-muted-foreground">Keep your personal details and account security up to date.</p></div><div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-hero text-xl font-bold text-primary-foreground shadow-button">{initials}</div></div>

        {!isOnline && <div role="status" className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"><CircleAlert className="h-4 w-4" /> You are offline. Reconnect before saving profile changes.</div>}
        {error && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><Button size="sm" variant="outline" onClick={() => void loadProfile()} disabled={!isOnline}><Loader2 className="h-4 w-4" /> Retry</Button></div>}
        {schemaMissing && <Card className="border-primary/25 bg-primary/[0.06]"><CardContent className="p-5 text-sm text-muted-foreground">Apply <code className="rounded bg-secondary px-1.5 py-0.5">supabase/migrations/20261013180000_add_profile_details.sql</code> in Supabase, then retry.</CardContent></Card>}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/70 bg-gradient-card shadow-card"><CardHeader><CardTitle className="flex items-center gap-3"><span className="rounded-xl bg-primary/15 p-2 text-primary"><UserRoundCheck className="h-5 w-5" /></span>Personal details</CardTitle><CardDescription>These details help personalize your finance workspace.</CardDescription></CardHeader><CardContent><form onSubmit={saveProfile} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="profile-email">Email address</Label><Input id="profile-email" value={email} disabled className="bg-muted/40" /><p className="text-xs text-muted-foreground">Email changes are managed separately by account verification.</p></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" value={form.name} onChange={(event) => updateField("name", event.target.value)} disabled={isLoading || isSaving || !isOnline} placeholder="Your name" /></div><div className="space-y-2"><Label htmlFor="profile-phone">Phone number</Label><Input id="profile-phone" type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} disabled={isLoading || isSaving || !isOnline} placeholder="Optional" /></div><div className="space-y-2"><Label htmlFor="profile-avatar">Avatar URL</Label><Input id="profile-avatar" type="url" value={form.avatar_url} onChange={(event) => updateField("avatar_url", event.target.value)} disabled={isLoading || isSaving || !isOnline} placeholder="Optional image URL" /></div><div className="space-y-2"><Label>Default currency</Label><Select value={form.default_currency} onValueChange={(value) => updateField("default_currency", value)} disabled={isLoading || isSaving || !isOnline}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{supportedCurrencies.map((currency) => <SelectItem key={currency.code} value={currency.code}>{currency.code} · {currency.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Timezone</Label><Select value={form.timezone} onValueChange={(value) => updateField("timezone", value)} disabled={isLoading || isSaving || !isOnline}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{timezones.map((timezone) => <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>)}</SelectContent></Select></div></div><Button type="submit" className="w-full" disabled={isLoading || isSaving || !isOnline}>{isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving profile...</> : <><Save className="h-4 w-4" /> Save personal details</>}</Button></form></CardContent></Card>
          <ChangePasswordCard email={email} disabled={isLoading || schemaMissing || !isOnline} />
        </div>

        {profile?.updated_at && <p className="text-center text-xs text-muted-foreground">Last updated {new Date(profile.updated_at).toLocaleString()}</p>}
      </div>
    </div>
  );
}

