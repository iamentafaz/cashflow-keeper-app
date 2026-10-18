"use client";

import { useState } from "react";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { useAppDispatch } from "@/store/types";
import { userSignIn } from "@/store/slices/userSlice";

interface AuthModalProps {
  onLogin: (email: string) => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const nameRegex = /^[\p{L}][\p{L}\s.'-]*$/u;

function validateName(name: string) {
  const normalized = name.trim();
  if (!normalized) return "Please enter your name.";
  if (normalized.length < 2) return "Name must be at least 2 characters.";
  if (normalized.length > 100) return "Name must be 100 characters or fewer.";
  if (!nameRegex.test(normalized)) return "Name can contain letters, spaces, apostrophes, periods, and hyphens only.";
  return null;
}

function validateEmail(email: string) {
  const normalized = email.trim();
  if (!normalized) return "Please enter your email address.";
  if (normalized.length > 254 || !emailRegex.test(normalized)) return "Please enter a valid email address.";
  return null;
}

function validatePassword(password: string) {
  if (!password) return "Please enter your password.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/\d/.test(password)) return "Password must include a number.";
  return null;
}

function VisibilityToggle({ visible, onClick, label }: { visible: boolean; onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition hover:text-foreground" aria-label={label}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>;
}

export function AuthModal({ onLogin }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const emailError = validateEmail(normalizedEmail);
    if (emailError) {
      toast({ title: "Invalid email", description: emailError, variant: "warning" });
      return;
    }

    if (isSignUp) {
      const nameError = validateName(name);
      if (nameError) {
        toast({ title: "Invalid name", description: nameError, variant: "warning" });
        return;
      }
    }

    const passwordError = isSignUp ? validatePassword(password) : password ? null : "Please enter your password.";
    if (passwordError) {
      toast({ title: "Invalid password", description: passwordError, variant: "warning" });
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Enter the same password in both fields.", variant: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await createClient().auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo: `${(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, "")}/`,
          },
        });
        if (error) throw error;
        onLogin(normalizedEmail);
        setIsOpen(false);
        resetForm();
        toast({ title: "Account created", description: "Welcome to KipCash!", variant: "success" });
      } else {
        const response = await dispatch(userSignIn({ email: normalizedEmail, password }));
        const payload = response.payload as { error?: string };
        if (payload?.error) throw new Error(payload.error);
        onLogin(normalizedEmail);
        setIsOpen(false);
        resetForm();
        toast({ title: "Login successful", description: "Welcome back!", variant: "success" });
      }
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "We could not complete that request. Please try again.";
      toast({ title: isSignUp ? "Signup failed" : "Login failed", description: message, variant: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp((current) => !current);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
      <DialogTrigger asChild><Button variant="outline" className="gap-2">{isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}{isSignUp ? "Sign Up" : "Login"}</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{isSignUp ? "Create your account" : "Login to your account"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" type="text" placeholder="Enter your name" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" maxLength={100} /></div>}
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" maxLength={254} /></div>
          <div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} placeholder={isSignUp ? "At least 8 characters" : "Enter your password"} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete={isSignUp ? "new-password" : "current-password"} aria-describedby={isSignUp ? "password-requirements" : undefined} className="pr-10" /><VisibilityToggle visible={showPassword} onClick={() => setShowPassword((visible) => !visible)} label={showPassword ? "Hide password" : "Show password"} /></div>{isSignUp && <p id="password-requirements" className="text-xs text-muted-foreground">Use at least 8 characters with uppercase, lowercase, and a number.</p>}</div>
          {isSignUp && <div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><div className="relative"><Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter your password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required autoComplete="new-password" className="pr-10" /><VisibilityToggle visible={showConfirmPassword} onClick={() => setShowConfirmPassword((visible) => !visible)} label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"} /></div></div>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Please wait..." : isSignUp ? "Create Account" : "Login"}</Button>
          <div className="text-center"><button type="button" onClick={toggleMode} className="text-sm text-muted-foreground transition-colors hover:text-primary" disabled={isSubmitting}>{isSignUp ? "Already have an account? Login" : "Don't have an account? Sign up"}</button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
