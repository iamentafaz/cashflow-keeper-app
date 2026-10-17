import Link from "next/link";
import { ArrowRight, Check, FileCheck2, LockKeyhole, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const benefits = [
  { icon: SlidersHorizontal, title: "Flexible enough for real life", description: "Use the accounts, currencies, categories, and payees that match how you actually manage money." },
  { icon: FileCheck2, title: "A record you can trust", description: "Keep status, reconciliation, linked transfers, and receipts together instead of scattered across tools." },
  { icon: LockKeyhole, title: "Control without clutter", description: "Archive what is no longer active, keep ownership boundaries in place, and maintain a focused workspace." },
];

const included = [
  "Bank, cash, credit-card, and wallet accounts",
  "Income, expense, refund, and linked transfers",
  "Interactive cash-flow and spending reports",
  "Categories, subcategories, and payees",
  "Reporting currency and exchange-rate caching",
  "Pending, cleared, and reconciled statuses",
  "Private receipt attachments up to 5 MB",
  "Profile details and OTP password change",
];

const Benefits = () => (
  <section className="bg-background py-24">
    <div className="container mx-auto px-4">
      <div className="grid items-start gap-16 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-accent">Designed for everyday clarity</p>
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">A complete money record, without the overwhelm.</h2>
          <p className="mb-8 text-xl leading-relaxed text-muted-foreground">KipCash gives each part of your financial routine a place, so you can move from capture to understanding without losing the details.</p>
          <div className="space-y-5">
            {benefits.map(({ icon: Icon, title, description }, index) => (
              <Card key={title} className={"group animate-fade-in-up border-border/70 bg-gradient-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant [animation-delay:" + index * 80 + "ms]"}>
                <div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105"><Icon className="h-5 w-5" /></div><div><h3 className="text-lg font-semibold">{title}</h3><p className="mt-1 text-muted-foreground">{description}</p></div></div>
              </Card>
            ))}
          </div>
        </div>
        <Card className="border-primary/10 bg-gradient-to-br from-primary/10 to-accent/10 p-8 shadow-elegant lg:sticky lg:top-24">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Included from day one</p>
          <h3 className="mb-6 mt-3 text-3xl font-bold">Everything you need to manage the ledger</h3>
          <div className="space-y-4">
            {included.map((item) => <div key={item} className="flex items-start gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success text-white"><Check className="h-4 w-4" /></span><span className="font-medium text-foreground">{item}</span></div>)}
          </div>
          <div className="mt-8 rounded-2xl border border-primary/10 bg-card/80 p-6 backdrop-blur-sm"><p className="text-lg font-semibold">Start with one account.</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Add more detail as your routine grows. The workspace is ready when you are.</p><Button asChild variant="hero" className="mt-5 w-full"><Link href="/accounts" prefetch={false}>Set up accounts <ArrowRight className="h-4 w-4" /></Link></Button></div>
        </Card>
      </div>
    </div>
  </section>
);

export default Benefits;
