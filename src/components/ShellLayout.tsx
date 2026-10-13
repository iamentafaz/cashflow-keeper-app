"use client"

import { AuthModal } from "@/components/AuthModal";
import { UserMenu } from "@/components/UserMenu";
import { LayoutDashboard, Wallet } from "lucide-react";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import Link from "next/link";

interface ShellLayoutProps {
  onLogin?: (email: string) => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export function ShellLayout({ onLogin, onLogout, children }: ShellLayoutProps) {
  const user = useSelector((state: RootState) => state.user.user)
  
  return (
    <div className="min-h-screen bg-background">
      {/* Global Header */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-3">
              <div className="rounded-xl bg-gradient-hero p-2.5 shadow-button transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="bg-gradient-hero bg-clip-text text-xl font-bold tracking-tight text-transparent">KipCash</h1>
                <p className="text-xs font-medium text-muted-foreground">Clarity for every rupee</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user && 'email' in user && user.email && (
              <nav className="hidden items-center gap-1 sm:flex">
                <Link href="/finance" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <LayoutDashboard className="h-4 w-4" /> Money
                </Link>
              </nav>
            )}
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
