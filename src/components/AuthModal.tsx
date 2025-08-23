import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { supabase } from "@/pages/Index";

interface AuthModalProps {
  onLogin: (email: string) => void;
}

export function AuthModal({ onLogin }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [isFormValid, setIsFormValid] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    console.log('Invalid hook')
    if (isFormValid) {  
      if(isSignUp) {        
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
            emailRedirectTo: 'http://localhost:8080',
          },
        }).then(response => {
          console.log('data from signup', response)
          if(response.error) {
            console.log(response.error.message)
            toast({
              title: 'Signup failed',
              description: response.error.message,
            });
            setIsFormValid(false)
            return
          }
          onLogin(email);
          setIsOpen(false);
          setEmail("");
          setPassword("");
          setName("");
          setIsFormValid(false)
          toast({
            title: isSignUp ? "Account created" : "Login successful",
            description: isSignUp ? "Welcome to ExpenseTracker!" : "Welcome back!",
          });
        })
      } else {
        console.log('login method')
        supabase.auth.signInWithPassword({
          email,
          password,
        }).then(response => {
          console.log('data from signup', response)
          if(response.error) {
            console.log(response.error.message)
            toast({
              title: 'Login failed',
              description: response.error.message,
            });
          setIsFormValid(false)
            return
          }
          onLogin(email);
          setEmail("");
          setPassword("");
          setIsOpen(false);
          setIsFormValid(false)
          toast({
            title: isSignUp ? "Account created" : "Login successful",
            description: isSignUp ? "Welcome to ExpenseTracker!" : "Welcome back!",
          });
        })
      }
    }
  }, [isFormValid]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    if (isSignUp && !name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }
    console.log('Form triggered')
    setIsFormValid(true);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
          {isSignUp ? "Sign Up" : "Login"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isSignUp ? "Create your account" : "Login to your account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            {isSignUp ? "Create Account" : "Login"}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}