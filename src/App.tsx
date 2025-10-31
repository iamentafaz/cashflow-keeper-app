"use client"

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ShellLayout } from "@/components/ShellLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { getLoggedInUser, userLogOut } from "./store/slices/userSlice";
import { useAppDispatch } from "./store/types";
import Landing from "./pages/Landing";
import ExpensesView from "./pages/ExpensesView";

const queryClient = new QueryClient();

const App = () => {
  const dispatch = useAppDispatch()


  const handleLogin = (email: string) => {
    // setUser(email);
  };

  const handleLogout = () => {
    dispatch(userLogOut())
  };

  useEffect(() => {
    dispatch(getLoggedInUser())
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                <ShellLayout 
                  onLogin={handleLogin} 
                  onLogout={handleLogout}
                />
              }
            >
              <Route index element={<Landing />} />
              <Route path="/manage-expenses" element={<Index />}/>
              <Route path="/expenses" element={<ExpensesView />}/>
              {/* Remote app routes will be added here */}
              {/* Example: <Route path="/remote-app/*" element={<RemoteAppLoader appName="remoteApp" moduleName="./App" />} /> */}
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
