"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CircleAlert, FolderTree, Loader2, RefreshCw, Store } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { CategoryPayeeManager } from "@/components/finance/CategoryPayeeManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Category, CategoryInput, CategoryRow, Payee, PayeeInput, PayeeRow } from "@/types/finance";
import { normalizeCategory, normalizePayee } from "@/types/finance";

type Focus = "categories" | "payees";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
  return error?.code === "42P01" || error?.message?.toLowerCase().includes("does not exist") || error?.message?.toLowerCase().includes("schema cache");
}

export function ReferenceDataPage({ focus }: { focus: Focus }) {
  const user = useSelector((state: RootState) => state.user.user);
  const userId = typeof user?.id === "string" ? user.id : null;
  const isOnline = useOnlineStatus();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) { setCategories([]); setPayees([]); setIsLoading(false); return; }
    if (!isOnline) { setError("You are offline. Reconnect to load this management page."); setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try {
      const [categoryResult, payeeResult] = await Promise.all([
        createClient().from("categories").select("id, user_id, name, parent_id, kind, color, archived, created_at").order("name", { ascending: true }),
        createClient().from("payees").select("id, user_id, name, default_category_id, archived, created_at").eq("user_id", userId).order("name", { ascending: true }),
      ]);
      if (categoryResult.error || payeeResult.error) throw categoryResult.error || payeeResult.error;
      setCategories((categoryResult.data ?? []).map((row) => normalizeCategory(row as CategoryRow)));
      setPayees((payeeResult.data ?? []).map((row) => normalizePayee(row as PayeeRow)));
    } catch (loadError) {
      const message = errorMessage(loadError);
      setError(message);
      toast({ title: "Unable to load management data", description: message, variant: isMissingTableError(loadError as { code?: string; message?: string }) ? "warning" : "danger" });
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, toast, userId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleCreateCategory = async (input: CategoryInput) => {
    if (!userId || !isOnline) return false;
    setIsSaving(true);
    try {
      const { data, error: saveError } = await createClient().from("categories").insert({ user_id: userId, name: input.name.trim(), parent_id: input.parent_id || null, kind: input.kind, archived: false }).select("id, user_id, name, parent_id, kind, color, archived, created_at").single();
      if (saveError) throw saveError;
      if (!data) throw new Error("The category was saved but no row was returned.");
      setCategories((previous) => [...previous, normalizeCategory(data as CategoryRow)]);
      toast({ title: "Category added", description: `${input.name} is ready for transaction entry.`, variant: "success" });
      return true;
    } catch (saveError) {
      toast({ title: "Could not add category", description: errorMessage(saveError), variant: "danger" });
      return false;
    } finally { setIsSaving(false); }
  };

  const handleArchiveCategory = async (category: Category) => {
    if (!userId || !isOnline || !category.user_id) return false;
    setIsSaving(true);
    try {
      const { data, error: updateError } = await createClient().from("categories").update({ archived: !category.archived }).eq("id", category.id).eq("user_id", userId).select("id, user_id, name, parent_id, kind, color, archived, created_at").single();
      if (updateError) throw updateError;
      if (!data) throw new Error("The category status was not returned.");
      const updated = normalizeCategory(data as CategoryRow);
      setCategories((previous) => previous.map((item) => item.id === updated.id ? updated : item));
      toast({ title: updated.archived ? "Category archived" : "Category restored", description: updated.name, variant: "success" });
      return true;
    } catch (updateError) {
      toast({ title: "Could not update category", description: errorMessage(updateError), variant: "danger" });
      return false;
    } finally { setIsSaving(false); }
  };

  const handleCreatePayee = async (input: PayeeInput) => {
    if (!userId || !isOnline) return false;
    setIsSaving(true);
    try {
      const { data, error: saveError } = await createClient().from("payees").insert({ user_id: userId, name: input.name.trim(), default_category_id: input.default_category_id || null, archived: false }).select("id, user_id, name, default_category_id, archived, created_at").single();
      if (saveError) throw saveError;
      if (!data) throw new Error("The payee was saved but no row was returned.");
      setPayees((previous) => [...previous, normalizePayee(data as PayeeRow)]);
      toast({ title: "Payee added", description: `${input.name} is ready for transaction entry.`, variant: "success" });
      return true;
    } catch (saveError) {
      toast({ title: "Could not add payee", description: errorMessage(saveError), variant: "danger" });
      return false;
    } finally { setIsSaving(false); }
  };

  const handleArchivePayee = async (payee: Payee) => {
    if (!userId || !isOnline) return false;
    setIsSaving(true);
    try {
      const { data, error: updateError } = await createClient().from("payees").update({ archived: !payee.archived }).eq("id", payee.id).eq("user_id", userId).select("id, user_id, name, default_category_id, archived, created_at").single();
      if (updateError) throw updateError;
      if (!data) throw new Error("The payee status was not returned.");
      const updated = normalizePayee(data as PayeeRow);
      setPayees((previous) => previous.map((item) => item.id === updated.id ? updated : item));
      toast({ title: updated.archived ? "Payee archived" : "Payee restored", description: updated.name, variant: "success" });
      return true;
    } catch (updateError) {
      toast({ title: "Could not update payee", description: errorMessage(updateError), variant: "danger" });
      return false;
    } finally { setIsSaving(false); }
  };

  if (!userId) return <div className="container mx-auto px-4 py-16"><Card className="mx-auto max-w-lg text-center"><CardContent className="space-y-4 py-12"><FolderTree className="mx-auto h-10 w-10 text-primary" /><h1 className="text-2xl font-semibold">Sign in to manage your finance lists</h1><Link href="/" prefetch={false} className="text-primary underline">Return home to sign in</Link></CardContent></Card></div>;

  return <div className="min-h-screen bg-gradient-subtle px-4 py-6 md:px-8 md:py-10"><div className="mx-auto max-w-7xl space-y-6"><section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-accent">Finance setup</p><h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{focus === "categories" ? "Categories" : "Payees & merchants"}</h1><p className="mt-3 max-w-2xl text-muted-foreground">{focus === "categories" ? "Organize spending with a compact, searchable category tree." : "Keep merchants easy to find and connect them to default categories."}</p></div><Button variant="outline" onClick={() => void loadData()} disabled={!isOnline || isLoading}><RefreshCw className="h-4 w-4" /> Refresh</Button></section>{!isOnline && <div role="status" className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"><CircleAlert className="h-4 w-4" /> You are offline. Reconnect before saving changes.</div>}{error && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><Button size="sm" variant="outline" onClick={() => void loadData()} disabled={!isOnline}><RefreshCw className="h-4 w-4" /> Retry</Button></div>}{isLoading ? <Card className="border-border/70 bg-gradient-card"><CardContent className="flex items-center justify-center gap-3 py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading your lists...</CardContent></Card> : <CategoryPayeeManager focus={focus} categories={categories} payees={payees} onCreateCategory={handleCreateCategory} onArchiveCategory={handleArchiveCategory} onCreatePayee={handleCreatePayee} onArchivePayee={handleArchivePayee} disabled={!isOnline || isSaving} />}</div></div>;
}
