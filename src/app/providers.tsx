"use client"

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { getLoggedInUser, userLogOut } from "@/store/slices/userSlice";
import { useAppDispatch } from "@/store/types";
import { ShellLayout } from "@/components/ShellLayout";

const queryClient = new QueryClient();

function AppProviders({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  const handleLogin = (email: string) => {
    // Handle login logic
  };

  const handleLogout = () => {
    dispatch(userLogOut());
  };

  useEffect(() => {
    dispatch(getLoggedInUser());
  }, [dispatch]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ShellLayout onLogin={handleLogin} onLogout={handleLogout}>
          {children}
        </ShellLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AppProviders>{children}</AppProviders>
    </Provider>
  );
}

