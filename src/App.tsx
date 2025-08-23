import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ShellLayout } from "@/components/ShellLayout";
import Index, { supabase } from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<string | null>(null);

  const handleLogin = (email: string) => {
    setUser(email);
  };

  const handleLogout = () => {
    setUser(null);
  };

  useEffect(() => {
    async function checkIfUserLoggedIn() {
      const { data, error } = await supabase.auth.getSession()
      console.log('user', data, error)
      if (data && !error) {
        setUser(data.session.user.email)
        localStorage.setItem('user', JSON.stringify(data.session.user))
      }
    }
    checkIfUserLoggedIn()
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
                  user={user} 
                  onLogin={handleLogin} 
                  onLogout={handleLogout} 
                />
              }
            >
              <Route index element={<Index />} />
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
