import Link from "next/link";
import { ArrowLeftRight, ArrowRight, CheckCircle2, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-subtle">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="absolute left-[-8rem] top-20 h-72 w-72 animate-soft-pulse rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-20 right-[-6rem] h-96 w-96 animate-soft-pulse rounded-full bg-accent/10 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 pb-20 pt-16 sm:pt-24 lg:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div className="animate-fade-in-up space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-card backdrop-blur-sm">
                <WalletCards className="h-4 w-4" />
                Your personal finance workspace
              </div>
              <h1 className="text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground lg:text-7xl">
                One clear view of
                <span className="block bg-gradient-hero bg-clip-text text-transparent">every rupee.</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
                KipCash brings accounts, transactions, categories, currencies, receipts, and reconciliation into one calm, focused workspace.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild variant="hero" size="lg" className="text-base">
                <Link href="/finance" prefetch={false}>
                  Open the workspace
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline-white" size="lg" className="text-base">
                <Link href="/accounts" prefetch={false}>See what you can manage</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border/70 pt-6 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Manual-first and flexible</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-info" /> User-owned records</span>
            </div>
          </div>

          <div className="relative animate-fade-in-up [animation-delay:180ms]">
            <Card className="border-primary/20 bg-card/90 p-3 shadow-elegant backdrop-blur-xl sm:p-5">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 sm:p-5">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Money overview</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight">₹84,260.00</p>
                  </div>
                  <span className="rounded-xl bg-success/10 px-3 py-2 text-xs font-semibold text-success">This month +12.4%</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <PreviewMetric label="Accounts" value="4 active" icon={<WalletCards className="h-4 w-4" />} tone="text-primary" />
                  <PreviewMetric label="Transactions" value="128 logged" icon={<ArrowLeftRight className="h-4 w-4" />} tone="text-accent" />
                  <PreviewMetric label="Receipts" value="18 attached" icon={<ReceiptText className="h-4 w-4" />} tone="text-warning" />
                </div>
                <div className="mt-5 space-y-3">
                  <PreviewRow label="Salary · Main bank" amount="+₹72,000" tone="text-success" status="Cleared" />
                  <PreviewRow label="Rent · Main bank" amount="−₹24,000" tone="text-destructive" status="Reconciled" />
                  <PreviewRow label="Transfer · Wallet → Cash" amount="₹5,000" tone="text-primary" status="Linked" />
                </div>
              </div>
            </Card>
            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-success/20 bg-card/95 p-4 shadow-card backdrop-blur-sm sm:block sm:-left-8">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-success/10 p-2 text-success"><CheckCircle2 className="h-5 w-5" /></span>
                <div><p className="text-sm font-semibold">Reconciliation ready</p><p className="text-xs text-muted-foreground">Your ledger stays in sync</p></div>
              </div>
            </div>
            <div className="absolute -right-3 -top-5 hidden rounded-2xl border border-accent/20 bg-card/95 p-4 shadow-card backdrop-blur-sm sm:block sm:-right-8">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-accent/10 p-2 text-accent"><ShieldCheck className="h-5 w-5" /></span>
                <div><p className="text-sm font-semibold">Private by design</p><p className="text-xs text-muted-foreground">Your records, your account</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function PreviewMetric({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string }) {
  return <div className="rounded-xl border border-border/60 bg-secondary/30 p-3"><span className={`inline-flex rounded-lg bg-current/10 p-2 ${tone}`}>{icon}</span><p className="mt-3 text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}

function PreviewRow({ label, amount, tone, status }: { label: string; amount: string; tone: string; status: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/20 px-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{status}</p></div><p className={`whitespace-nowrap text-sm font-semibold ${tone}`}>{amount}</p></div>;
}

export default Hero;
