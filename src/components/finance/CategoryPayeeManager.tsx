"use client";

import { useMemo, useState } from "react";
import { Archive, FolderTree, Plus, Store, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category, CategoryInput, CategoryKind, Payee, PayeeInput } from "@/types/finance";

interface CategoryPayeeManagerProps {
  categories: Category[];
  payees: Payee[];
  onCreateCategory: (input: CategoryInput) => Promise<boolean>;
  onArchiveCategory: (category: Category) => Promise<boolean>;
  onCreatePayee: (input: PayeeInput) => Promise<boolean>;
  onArchivePayee: (payee: Payee) => Promise<boolean>;
  disabled?: boolean;
}

export function CategoryPayeeManager({
  categories,
  payees,
  onCreateCategory,
  onArchiveCategory,
  onCreatePayee,
  onArchivePayee,
  disabled = false,
}: CategoryPayeeManagerProps) {
  const { toast } = useToast();
  const [categoryName, setCategoryName] = useState("");
  const [categoryKind, setCategoryKind] = useState<CategoryKind>("expense");
  const [parentId, setParentId] = useState("none");
  const [payeeName, setPayeeName] = useState("");
  const [defaultCategoryId, setDefaultCategoryId] = useState("none");
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingPayee, setSavingPayee] = useState(false);

  const activeCategories = useMemo(() => categories.filter((category) => !category.archived), [categories]);
  const rootCategories = useMemo(() => activeCategories.filter((category) => !category.parent_id), [activeCategories]);
  const archivedCategories = useMemo(() => categories.filter((category) => category.archived && category.user_id !== null), [categories]);
  const activePayees = useMemo(() => payees.filter((payee) => !payee.archived), [payees]);
  const archivedPayees = useMemo(() => payees.filter((payee) => payee.archived), [payees]);

  const categoryLabel = (category: Category) => {
    const parent = category.parent_id ? categories.find((item) => item.id === category.parent_id) : null;
    return parent ? parent.name + " · " + category.name : category.name;
  };

  const handleCreateCategory = async () => {
    const name = categoryName.trim();
    if (!name) {
      toast({ title: "Category name required", description: "Give this category a short, recognizable name.", variant: "warning" });
      return;
    }

    setSavingCategory(true);
    const saved = await onCreateCategory({ name, kind: categoryKind, parent_id: parentId === "none" ? null : parentId });
    if (saved) {
      setCategoryName("");
      setParentId("none");
    }
    setSavingCategory(false);
  };

  const handleCreatePayee = async () => {
    const name = payeeName.trim();
    if (!name) {
      toast({ title: "Payee name required", description: "Add the merchant, employer, or person involved.", variant: "warning" });
      return;
    }

    setSavingPayee(true);
    const saved = await onCreatePayee({ name, default_category_id: defaultCategoryId === "none" ? null : defaultCategoryId });
    if (saved) {
      setPayeeName("");
      setDefaultCategoryId("none");
    }
    setSavingPayee(false);
  };

  return (
    <Card className="border-border/70 bg-gradient-card shadow-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Categories & payees</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Build a consistent vocabulary for your money movement.</p>
          </div>
          <span className="rounded-2xl bg-accent/15 p-3 text-accent"><FolderTree className="h-5 w-5" /></span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-background/30 p-4">
            <div className="mb-4 flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /><p className="font-semibold">Add category</p></div>
            <div className="space-y-3">
              <div className="space-y-2"><Label htmlFor="new-category-name">Name</Label><Input id="new-category-name" placeholder="e.g. Dining out" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} disabled={disabled || savingCategory} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label>Kind</Label><Select value={categoryKind} onValueChange={(value) => setCategoryKind(value as CategoryKind)} disabled={disabled || savingCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="expense">Expense</SelectItem><SelectItem value="income">Income</SelectItem><SelectItem value="both">Income & expense</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Parent</Label><Select value={parentId} onValueChange={setParentId} disabled={disabled || savingCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Top-level category</SelectItem>{rootCategories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <Button type="button" className="w-full" onClick={() => void handleCreateCategory()} disabled={disabled || savingCategory}><Plus className="h-4 w-4" /> {savingCategory ? "Adding..." : "Add category"}</Button>
            </div>
          </div>
          <div className="space-y-2">
            {activeCategories.length === 0 ? <p className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">No categories yet. Add one above to make transaction entry faster.</p> : activeCategories.map((category) => <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium">{categoryLabel(category)}</p><p className="text-xs capitalize text-muted-foreground">{category.kind}{category.user_id === null ? " · Starter" : ""}</p></div>{category.user_id !== null && <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => void onArchiveCategory(category)} disabled={disabled} aria-label={"Archive " + category.name}><Archive className="h-4 w-4" /></Button>}</div>)}
            {archivedCategories.length > 0 && <div className="mt-4 space-y-2 border-t border-border/60 pt-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Archived categories</p>{archivedCategories.map((category) => <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-secondary/15 px-3 py-2.5 opacity-75"><div className="min-w-0"><p className="truncate text-sm">{categoryLabel(category)}</p><p className="text-xs capitalize text-muted-foreground">{category.kind}</p></div><Button type="button" variant="ghost" size="sm" onClick={() => void onArchiveCategory(category)} disabled={disabled}>Restore</Button></div>)}</div>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-background/30 p-4">
            <div className="mb-4 flex items-center gap-2"><Store className="h-4 w-4 text-info" /><p className="font-semibold">Add payee / merchant</p></div>
            <div className="space-y-3">
              <div className="space-y-2"><Label htmlFor="new-payee-name">Name</Label><Input id="new-payee-name" placeholder="e.g. Acme Supermarket" value={payeeName} onChange={(event) => setPayeeName(event.target.value)} disabled={disabled || savingPayee} /></div>
              <div className="space-y-2"><Label>Default category</Label><Select value={defaultCategoryId} onValueChange={setDefaultCategoryId} disabled={disabled || savingPayee}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Choose later</SelectItem>{rootCategories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></div>
              <Button type="button" variant="outline" className="w-full" onClick={() => void handleCreatePayee()} disabled={disabled || savingPayee}><Plus className="h-4 w-4" /> {savingPayee ? "Adding..." : "Add payee"}</Button>
            </div>
          </div>
          <div className="space-y-2">
            {activePayees.length === 0 ? <p className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">No payees yet. Add merchants as you encounter them.</p> : activePayees.map((payee) => <div key={payee.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium">{payee.name}</p>{payee.default_category_id && <Badge variant="outline" className="mt-1 text-[10px]">{categoryLabel(categories.find((category) => category.id === payee.default_category_id) ?? { id: "", user_id: null, name: "Default category", parent_id: null, kind: "both", color: null, archived: false })}</Badge>}</div><Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => void onArchivePayee(payee)} disabled={disabled} aria-label={"Archive " + payee.name}><Archive className="h-4 w-4" /></Button></div>)}
            {archivedPayees.length > 0 && <div className="mt-4 space-y-2 border-t border-border/60 pt-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Archived payees</p>{archivedPayees.map((payee) => <div key={payee.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-secondary/15 px-3 py-2.5 opacity-75"><p className="truncate text-sm">{payee.name}</p><Button type="button" variant="ghost" size="sm" onClick={() => void onArchivePayee(payee)} disabled={disabled}>Restore</Button></div>)}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
