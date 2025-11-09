"use client"

import { AuthModal } from "@/components/AuthModal";
import { UserMenu } from "@/components/UserMenu";
import { Wallet } from "lucide-react";
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
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">KipCash</h1>
                <p className="text-sm text-muted-foreground">Ease your expense management</p>
              </div>
            </Link>
            <div>
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