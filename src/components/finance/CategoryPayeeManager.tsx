"use client";

import { useMemo, useState } from "react";
import { Archive, ChevronDown, ChevronRight, FolderTree, Plus, Search, Store, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category, CategoryInput, CategoryKind, Payee, PayeeInput } from "@/types/finance";

type ManagerFocus = "categories" | "payees" | "both";

interface CategoryPayeeManagerProps {
  categories: Category[];
  payees: Payee[];
  onCreateCategory: (input: CategoryInput) => Promise<boolean>;
  onArchiveCategory: (category: Category) => Promise<boolean>;
  onCreatePayee: (input: PayeeInput) => Promise<boolean>;
  onArchivePayee: (payee: Payee) => Promise<boolean>;
  disabled?: boolean;
  focus?: ManagerFocus;
}

export function CategoryPayeeManager({ categories, payees, onCreateCategory, onArchiveCategory, onCreatePayee, onArchivePayee, disabled = false, focus = "both" }: CategoryPayeeManagerProps) {
  const { toast } = useToast();
  const [categoryName, setCategoryName] = useState("");
  const [categoryKind, setCategoryKind] = useState<CategoryKind>("expense");
  const [parentId, setParentId] = useState("none");
  const [payeeName, setPayeeName] = useState("");
  const [defaultCategoryId, setDefaultCategoryId] = useState("none");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [payeeQuery, setPayeeQuery] = useState("");
  const [expandedRoots, setExpandedRoots] = useState<Set<string>>(new Set());
  const [showArchivedCategories, setShowArchivedCategories] = useState(false);
  const [showArchivedPayees, setShowArchivedPayees] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingPayee, setSavingPayee] = useState(false);

  const activeCategories = useMemo(() => categories.filter((category) => !category.archived), [categories]);
  const rootCategories = useMemo(() => activeCategories.filter((category) => !category.parent_id), [activeCategories]);
  const archivedCategories = useMemo(() => categories.filter((category) => category.archived && category.user_id !== null), [categories]);
  const activePayees = useMemo(() => payees.filter((payee) => !payee.archived), [payees]);
  const archivedPayees = useMemo(() => payees.filter((payee) => payee.archived), [payees]);

  const categoryLabel = (category: Category) => {
    const parent = category.parent_id ? categories.find((item) => item.id === category.parent_id) : null;
    return parent ? `${parent.name} · ${category.name}` : category.name;
  };
  const matchesCategory = (category: Category) => {
    const query = categoryQuery.trim().toLowerCase();
    return !query || category.name.toLowerCase().includes(query) || categoryLabel(category).toLowerCase().includes(query);
  };
  const visibleRoots = rootCategories.filter((root) => matchesCategory(root) || activeCategories.some((category) => category.parent_id === root.id && matchesCategory(category)));
  const childrenFor = (rootId: string) => activeCategories.filter((category) => category.parent_id === rootId && matchesCategory(category));
  const filteredPayees = activePayees.filter((payee) => payee.name.toLowerCase().includes(payeeQuery.trim().toLowerCase()));

  const handleCreateCategory = async () => {
    const name = categoryName.trim();
    if (!name) {
      toast({ title: "Category name required", description: "Give this category a short, recognizable name.", variant: "warning" });
      return;
    }
    setSavingCategory(true);
    const saved = await onCreateCategory({ name, kind: categoryKind, parent_id: parentId === "none" ? null : parentId });
    if (saved) { setCategoryName(""); setParentId("none"); }
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
    if (saved) { setPayeeName(""); setDefaultCategoryId("none"); }
    setSavingPayee(false);
  };

  const renderCategoryManager = () => <div className="space-y-5">
    <div className="rounded-2xl border border-border/60 bg-background/30 p-4"><div className="mb-4 flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /><p className="font-semibold">Add category</p></div><div className="space-y-3"><div className="space-y-2"><Label htmlFor="new-category-name">Name</Label><Input id="new-category-name" placeholder="e.g. Dining out" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} disabled={disabled || savingCategory} /></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Kind</Label><Select value={categoryKind} onValueChange={(value) => setCategoryKind(value as CategoryKind)} disabled={disabled || savingCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="expense">Expense</SelectItem><SelectItem value="income">Income</SelectItem><SelectItem value="both">Income & expense</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Parent</Label><Select value={parentId} onValueChange={setParentId} disabled={disabled || savingCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Top-level category</SelectItem>{rootCategories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></div></div><Button type="button" className="w-full" onClick={() => void handleCreateCategory()} disabled={disabled || savingCategory}><Plus className="h-4 w-4" /> {savingCategory ? "Adding..." : "Add category"}</Button></div></div>
    <div className="space-y-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search categories..." value={categoryQuery} onChange={(event) => setCategoryQuery(event.target.value)} /></div>{visibleRoots.length === 0 ? <p className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">No active categories match your search.</p> : <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">{visibleRoots.map((root) => { const children = childrenFor(root.id); const isExpanded = expandedRoots.has(root.id) || Boolean(categoryQuery.trim()); return <div key={root.id} className="rounded-xl border border-border/50 bg-secondary/20"><div className="flex items-center justify-between gap-3 px-3 py-2.5"><button type="button" className="flex min-w-0 items-center gap-2 text-left" onClick={() => setExpandedRoots((previous) => { const next = new Set(previous); if (next.has(root.id)) next.delete(root.id); else next.add(root.id); return next; })} aria-expanded={isExpanded}>{children.length > 0 ? (isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />) : <span className="h-4 w-4" />}<span className="truncate text-sm font-medium">{root.name}</span><Badge variant="outline" className="text-[10px]">{children.length}</Badge></button>{root.user_id !== null && <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => void onArchiveCategory(root)} disabled={disabled} aria-label={`Archive ${root.name}`}><Archive className="h-4 w-4" /></Button>}</div>{isExpanded && children.length > 0 && <div className="space-y-1 border-t border-border/50 px-3 py-2">{children.map((category) => <div key={category.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5"><div className="min-w-0"><p className="truncate text-sm text-muted-foreground">{category.name}</p><p className="text-[11px] capitalize text-muted-foreground/75">{category.kind}{category.user_id === null ? " · Starter" : ""}</p></div>{category.user_id !== null && <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => void onArchiveCategory(category)} disabled={disabled} aria-label={`Archive ${category.name}`}><Archive className="h-3.5 w-3.5" /></Button>}</div>)}</div>}</div>; })}</div>}{archivedCategories.length > 0 && <div className="border-t border-border/60 pt-3"><Button type="button" variant="ghost" size="sm" className="px-0 text-muted-foreground" onClick={() => setShowArchivedCategories((value) => !value)}>{showArchivedCategories ? "Hide" : "Show"} {archivedCategories.length} archived categories</Button>{showArchivedCategories && <div className="mt-2 space-y-2">{archivedCategories.map((category) => <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-secondary/15 px-3 py-2.5 opacity-75"><p className="truncate text-sm">{categoryLabel(category)}</p><Button type="button" variant="ghost" size="sm" onClick={() => void onArchiveCategory(category)} disabled={disabled}>Restore</Button></div>)}</div>}</div>}</div>
  </div>;

  const renderPayeeManager = () => <div className="space-y-5">
    <div className="rounded-2xl border border-border/60 bg-background/30 p-4"><div className="mb-4 flex items-center gap-2"><Store className="h-4 w-4 text-info" /><p className="font-semibold">Add payee / merchant</p></div><div className="space-y-3"><div className="space-y-2"><Label htmlFor="new-payee-name">Name</Label><Input id="new-payee-name" placeholder="e.g. Acme Supermarket" value={payeeName} onChange={(event) => setPayeeName(event.target.value)} disabled={disabled || savingPayee} /></div><div className="space-y-2"><Label>Default category</Label><Select value={defaultCategoryId} onValueChange={setDefaultCategoryId} disabled={disabled || savingPayee}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Choose later</SelectItem>{rootCategories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></div><Button type="button" variant="outline" className="w-full" onClick={() => void handleCreatePayee()} disabled={disabled || savingPayee}><Plus className="h-4 w-4" /> {savingPayee ? "Adding..." : "Add payee"}</Button></div></div>
    <div className="space-y-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search payees..." value={payeeQuery} onChange={(event) => setPayeeQuery(event.target.value)} /></div>{filteredPayees.length === 0 ? <p className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">No active payees match your search.</p> : <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">{filteredPayees.map((payee) => <div key={payee.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium">{payee.name}</p>{payee.default_category_id && <Badge variant="outline" className="mt-1 text-[10px]">{categoryLabel(categories.find((category) => category.id === payee.default_category_id) ?? { id: "", user_id: null, name: "Default category", parent_id: null, kind: "both", color: null, archived: false })}</Badge>}</div><Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => void onArchivePayee(payee)} disabled={disabled} aria-label={`Archive ${payee.name}`}><Archive className="h-4 w-4" /></Button></div>)}</div>}{archivedPayees.length > 0 && <div className="border-t border-border/60 pt-3"><Button type="button" variant="ghost" size="sm" className="px-0 text-muted-foreground" onClick={() => setShowArchivedPayees((value) => !value)}>{showArchivedPayees ? "Hide" : "Show"} {archivedPayees.length} archived payees</Button>{showArchivedPayees && <div className="mt-2 space-y-2">{archivedPayees.map((payee) => <div key={payee.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-secondary/15 px-3 py-2.5 opacity-75"><p className="truncate text-sm">{payee.name}</p><Button type="button" variant="ghost" size="sm" onClick={() => void onArchivePayee(payee)} disabled={disabled}>Restore</Button></div>)}</div>}</div>}</div>
  </div>;

  return <Card className="border-border/70 bg-gradient-card shadow-card"><CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle>{focus === "categories" ? "Categories" : focus === "payees" ? "Payees & merchants" : "Categories & payees"}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{focus === "categories" ? "Keep your spending vocabulary focused and easy to scan." : focus === "payees" ? "Keep merchants searchable and connected to useful defaults." : "Build a consistent vocabulary for your money movement."}</p></div><span className="rounded-2xl bg-accent/15 p-3 text-accent"><FolderTree className="h-5 w-5" /></span></div></CardHeader><CardContent className={focus === "both" ? "grid gap-6 lg:grid-cols-2" : "max-w-3xl"}>{focus !== "payees" && renderCategoryManager()}{focus !== "categories" && renderPayeeManager()}</CardContent></Card>;
}
