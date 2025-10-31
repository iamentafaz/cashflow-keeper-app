import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import {createClient} from "../utils/supabase/client";
import { useAppDispatch } from "@/store/types";
import { userSignIn } from "@/store/slices/userSlice";

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
  const dispatch = useAppDispatch()



  useEffect(() => {
    async function random() {
      const supabase = await createClient()
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
        if(response.error) {
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
    }
    if (isFormValid) {  
      if(isSignUp) {  
        random()      
      } else {
        dispatch(userSignIn({email, password})).then((response: { payload: Object}) => {
          console.log('response', response)
          if(response.payload.error) {
            toast({
              title: 'Login failed',
              description: response.payload.error,
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
                autoComplete="off"
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
              autoComplete="off"
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
              autoComplete="off"
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