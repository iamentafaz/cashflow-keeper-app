"use client"

import { AuthModal } from "@/components/AuthModal";
import { UserMenu } from "@/components/UserMenu";
import { ArrowLeftRight, BarChart3, BookOpenCheck, CircleUserRound, FolderTree, LayoutDashboard, LogOut, Menu, Store, Wallet, WalletCards } from "lucide-react";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const financeLinks = [
  { href: "/finance", label: "Money", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
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
  const authUser = user as { id?: string | null; email?: string | null } | null;
  const pathname = usePathname()
  const router = useRouter();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = Boolean(authUser?.email);
  const userEmail = authUser?.email || "";

  const isLinkActive = (href: string) => pathname === href || (href === "/finance" && pathname === "/");
  const getInitials = (email: string) => email.split("@")[0]?.charAt(0).toUpperCase() || "U";

  const handleLogout = () => {
    (onLogout || (() => {}))();
    router.replace("/");
  };

  const handleMobileLogout = () => {
    setMobileMenuOpen(false);
    handleLogout();
    toast({ title: "Logged out", description: "You have been successfully logged out", variant: "info" });
  };
  
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
          {isAuthenticated && (
            <nav aria-label="Finance navigation" className="hidden min-w-0 flex-1 overflow-x-auto lg:block">
              <div className="flex min-w-max items-center justify-center gap-1">
                {financeLinks.map(({ href, label, icon: Icon }) => {
                  const isActive = isLinkActive(href)

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
              {isAuthenticated ? (
                <>
                  <div className="hidden lg:block">
                    <UserMenu userEmail={userEmail} onLogout={handleLogout} />
                  </div>
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[min(88vw,360px)] border-r border-border bg-background p-0">
                      <SheetHeader className="border-b border-border/70 px-5 py-6 pr-14 text-left">
                        <SheetTitle className="flex items-center gap-3">
                          <span className="rounded-xl bg-gradient-hero p-2 text-primary-foreground shadow-button"><Wallet className="h-5 w-5" /></span>
                          <span>KipCash</span>
                        </SheetTitle>
                        <SheetDescription>Navigate your personal finance workspace.</SheetDescription>
                      </SheetHeader>
                      <div className="flex h-[calc(100vh-118px)] flex-col overflow-y-auto px-4 py-5">
                        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/35 p-3">
                          <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary text-primary-foreground">{getInitials(userEmail)}</AvatarFallback></Avatar>
                          <div className="min-w-0"><p className="truncate text-sm font-semibold">{userEmail}</p><p className="text-xs text-muted-foreground">Signed in</p></div>
                        </div>
                        <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
                        <nav aria-label="Mobile finance navigation" className="space-y-1">
                          {financeLinks.map(({ href, label, icon: Icon }) => {
                            const isActive = isLinkActive(href);
                            return <Link key={href} href={href} prefetch={false} aria-current={isActive ? "page" : undefined} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isActive ? "bg-primary/15 text-primary ring-1 ring-primary/25" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><Icon className="h-4 w-4" /><span>{label}</span></Link>;
                          })}
                        </nav>
                        <div className="my-6 border-t border-border/70" />
                        <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Account</p>
                        <Link href="/profile" prefetch={false} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isLinkActive("/profile") ? "bg-primary/15 text-primary ring-1 ring-primary/25" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><CircleUserRound className="h-4 w-4" /><span>Profile &amp; security</span></Link>
                        <Button type="button" variant="ghost" onClick={handleMobileLogout} className="mt-1 justify-start gap-3 rounded-xl px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"><LogOut className="h-4 w-4" /><span>Log out</span></Button>
                        <div className="mt-auto rounded-2xl border border-primary/15 bg-primary/10 p-4 text-xs leading-relaxed text-muted-foreground"><p className="font-semibold text-foreground">Your money, organized.</p><p className="mt-1">Use Reports to see cash flow, spending patterns, and transaction health.</p></div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </>
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
