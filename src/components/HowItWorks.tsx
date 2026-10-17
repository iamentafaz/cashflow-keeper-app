import Link from "next/link";
import { ArrowLeftRight, ArrowRight, BarChart3, BookOpenCheck, FolderTree, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  { icon: WalletCards, title: "Add your accounts", description: "Start with the places your money lives: bank, cash, credit card, or wallet.", step: "01" },
  { icon: ArrowLeftRight, title: "Capture movement", description: "Log income, spending, refunds, and transfers with the details you want to remember.", step: "02" },
  { icon: FolderTree, title: "Give it context", description: "Assign categories, subcategories, and payees. Add a currency and attach a receipt when useful.", step: "03" },
  { icon: BookOpenCheck, title: "Review and reconcile", description: "Filter by status, compare against your statement, and keep your records ready for review.", step: "04" },
];

const HowItWorks = () => (
  <section className="bg-gradient-to-b from-background to-primary/5 py-24">
    <div className="container mx-auto px-4">
      <div className="mx-auto mb-16 max-w-3xl text-center animate-fade-in-up">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-accent">A calmer money routine</p>
        <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">From transaction to trusted record</h2>
        <p className="text-xl leading-relaxed text-muted-foreground">KipCash keeps the everyday flow simple while giving you the controls needed for a reliable personal ledger.</p>
      </div>
      <div className="mb-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, description, step }, index) => (
          <div key={step} className={"relative animate-fade-in-up [animation-delay:" + index * 90 + "ms]"}>
            <Card className="group h-full border-border/70 bg-card/80 p-6 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
              <div className="mb-4 text-6xl font-bold tracking-tight text-primary/10 transition-colors group-hover:text-primary/20">{step}</div>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-110"><Icon className="h-8 w-8" /></div>
              <h3 className="mb-3 text-xl font-semibold">{title}</h3>
              <p className="text-muted-foreground">{description}</p>
            </Card>
            {index < steps.length - 1 && <ArrowRight className="absolute -right-4 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-primary/30 lg:block" />}
          </div>
        ))}
      </div>
      <Card className="mx-auto mb-16 max-w-4xl border-accent/20 bg-gradient-to-r from-accent/10 via-card/80 to-primary/10 p-6 shadow-card sm:p-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent"><BarChart3 className="h-6 w-6" /></div>
            <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-accent">Step 05 · Understand the pattern</p><h3 className="mt-2 text-2xl font-bold">Turn your records into useful insight.</h3><p className="mt-2 max-w-2xl text-muted-foreground">Use interactive cash-flow, category, balance, and transaction-health charts to see what is happening across your money.</p></div>
          </div>
          <Button asChild variant="outline" className="shrink-0"><Link href="/reports" prefetch={false}>View reports <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </Card>
      <div className="text-center">
        <Card className="mx-auto max-w-2xl border-primary/10 bg-gradient-to-r from-primary/10 to-accent/10 p-8 shadow-card">
          <h3 className="mb-3 text-2xl font-bold">Ready to see your money clearly?</h3>
          <p className="mb-6 text-muted-foreground">Open the workspace and start with the account or transaction that matters most today.</p>
          <Button asChild variant="hero" size="lg"><Link href="/finance" prefetch={false}>Explore KipCash <ArrowRight className="h-5 w-5" /></Link></Button>
        </Card>
      </div>
    </div>
  </section>
);

export default HowItWorks;
