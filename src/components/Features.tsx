import { ArrowLeftRight, BookOpenCheck, FolderTree, Globe2, Paperclip, Receipt, ShieldCheck, Store, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  { icon: WalletCards, title: "Account hub", description: "Manage bank, cash, credit-card, and wallet accounts with balances and archive/restore controls.", color: "text-primary" },
  { icon: ArrowLeftRight, title: "Complete transaction ledger", description: "Record income, expenses, refunds, and transfers. Transfers stay linked as matching debit and credit records.", color: "text-accent" },
  { icon: FolderTree, title: "Categories and subcategories", description: "Organize spending with your own category structure, then filter the ledger when you need clarity.", color: "text-warning" },
  { icon: Store, title: "Payees and merchants", description: "Keep a reusable list of merchants so recurring spending is easier to understand and search.", color: "text-info" },
  { icon: Globe2, title: "Multi-currency support", description: "Set a reporting currency, fetch exchange rates, and preserve the applied rate on each transaction.", color: "text-success" },
  { icon: BookOpenCheck, title: "Reconciliation", description: "Compare an account against its statement, select cleared transactions, and mark them reconciled.", color: "text-primary" },
  { icon: Paperclip, title: "Receipts and metadata", description: "Attach private receipt files and useful metadata to the transaction that they belong to.", color: "text-accent" },
  { icon: ShieldCheck, title: "Status-aware records", description: "Track pending, cleared, and reconciled transactions so your books reflect their real state.", color: "text-success" },
  { icon: Receipt, title: "Profile and security", description: "Maintain your personal details, base currency, and change your password with OTP verification.", color: "text-warning" },
];

const Features = () => (
  <section className="bg-background py-24">
    <div className="container mx-auto px-4">
      <div className="mx-auto mb-16 max-w-3xl text-center animate-fade-in-up">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-accent">One workspace, less financial noise</p>
        <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">The tools already inside KipCash</h2>
        <p className="text-xl leading-relaxed text-muted-foreground">From the first account you add to the statement you reconcile, every part of your money workflow has a clear home.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description, color }, index) => (
          <Card key={title} className={"group animate-fade-in-up border-border/70 bg-gradient-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-elegant [animation-delay:" + index * 60 + "ms]"}>
            <div className={"mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-current/10 transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-110 " + color}><Icon className="h-6 w-6" /></div>
            <h3 className="mb-3 text-xl font-semibold">{title}</h3>
            <p className="leading-relaxed text-muted-foreground">{description}</p>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
