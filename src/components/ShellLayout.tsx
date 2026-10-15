"use client"

import { AuthModal } from "@/components/AuthModal";
import { UserMenu } from "@/components/UserMenu";
import { ArrowLeftRight, BookOpenCheck, FolderTree, LayoutDashboard, Store, Wallet, WalletCards } from "lucide-react";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import Link from "next/link";
import { usePathname } from "next/navigation";

const financeLinks = [
  { href: "/finance", label: "Money", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: WalletCards },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/payees", label: "Payees", icon: Store },
  { href: "/reconciliation", label: "Reconcile", icon: BookOpenCheck },
];

interface ShellLayoutProps {
  onLogin?: (email: string) => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export function ShellLayout({ onLogin, onLogout, children }: ShellLayoutProps) {
  const user = useSelector((state: RootState) => state.user.user)
  const pathname = usePathname()
  
  return (
    <div className="min-h-screen bg-background">
      {/* Global Header */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <div className="shrink-0">
            <Link href="/" prefetch={false} className="group flex items-center gap-3">
              <div className="rounded-xl bg-gradient-hero p-2.5 shadow-button transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="bg-gradient-hero bg-clip-text text-xl font-bold tracking-tight text-transparent">KipCash</h1>
                <p className="text-xs font-medium text-muted-foreground">Clarity for every rupee</p>
              </div>
            </Link>
          </div>
          {user && 'email' in user && user.email && (
            <nav aria-label="Finance navigation" className="min-w-0 flex-1 overflow-x-auto">
              <div className="flex min-w-max items-center justify-center gap-1">
                {financeLinks.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || (href === "/finance" && pathname === "/")

                  return (
                  <Link key={href} href={href} prefetch={false} aria-current={isActive ? "page" : undefined} className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${isActive ? "bg-primary/15 text-primary ring-1 ring-primary/25" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                  )
                })}
              </div>
            </nav>
          )}
          <div className="ml-auto shrink-0">
            <div className="animate-fade-in-up">
              {user && 'email' in user && user.email ? (
                <UserMenu userEmail={user.email as string} onLogout={onLogout || (() => {})} />
              ) : (
                <AuthModal onLogin={onLogin || (() => {})} />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

export default ShellLayout;
