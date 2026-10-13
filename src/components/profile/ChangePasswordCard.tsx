"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, MailCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";

type PasswordStep = "password" | "otp";

interface ChangePasswordCardProps {
  email: string;
  disabled?: boolean;
}

function getPasswordScore(password: string) {
  return [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

function getAuthErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "We could not complete that request. Please try again.";
}

export function ChangePasswordCard({ email, disabled = false }: ChangePasswordCardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<PasswordStep>("password");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const passwordScore = useMemo(() => getPasswordScore(newPassword), [newPassword]);
  const passwordIsValid = passwordScore >= 4;

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const requestOtp = async () => {
    if (!passwordIsValid) {
      setError("Use at least 8 characters with uppercase, lowercase, and a number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    if (!email) {
      setError("Your account does not have a verified email for OTP verification.");
      return;
    }

    setError(null);
    setIsSending(true);
    const { error: reauthError } = await createClient().auth.reauthenticate();
    setIsSending(false);

    if (reauthError) {
      const message = getAuthErrorMessage(reauthError);
      setError(message);
      toast({ title: "Could not send verification code", description: message, variant: "danger" });
      return;
    }

    setStep("otp");
    setOtp("");
    setResendSeconds(60);
    toast({ title: "Verification code sent", description: `Check ${email} for your password-change code.`, variant: "info" });
  };

  const verifyAndUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (otp.length !== 6) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setError(null);
    setIsUpdating(true);
    const { error: updateError } = await createClient().auth.updateUser({
      password: newPassword,
      nonce: otp,
    });
    setIsUpdating(false);

    if (updateError) {
      const message = getAuthErrorMessage(updateError);
      setError(message);
      toast({ title: "Password was not changed", description: message, variant: "danger" });
      return;
    }

    setStep("password");
    setNewPassword("");
    setConfirmPassword("");
    setOtp("");
    setResendSeconds(0);
    toast({ title: "Password changed", description: "Your new password is active now.", variant: "success" });
  };

  const cancelOtp = () => {
    setStep("password");
    setOtp("");
    setError(null);
    setResendSeconds(0);
  };

  return (
    <Card className="border-border/70 bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span className="rounded-xl bg-accent/15 p-2 text-accent"><KeyRound className="h-5 w-5" /></span>
          Password & security
        </CardTitle>
        <CardDescription>Verify your email before changing the password for this account.</CardDescription>
      </CardHeader>
      <CardContent>
        {step === "password" ? (
          <form onSubmit={(event) => { event.preventDefault(); void requestOtp(); }} className="space-y-5">
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><p>We’ll send a one-time verification code to <span className="font-semibold text-foreground">{email || "your verified email"}</span>. The code is never stored in the app.</p></div>
            </div>
            <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} disabled={disabled || isSending} placeholder="Create a strong password" /></div>
            <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="confirm-password">Confirm new password</Label><span className="text-xs text-muted-foreground">{passwordScore}/5 strength</span></div><Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={disabled || isSending} placeholder="Repeat the new password" /><Progress value={passwordScore * 20} className="h-1.5" /></div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={disabled || isSending}>{isSending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending code...</> : <><MailCheck className="h-4 w-4" /> Verify and change password</>}</Button>
          </form>
        ) : (
          <form onSubmit={(event) => void verifyAndUpdatePassword(event)} className="space-y-5">
            <div className="rounded-2xl border border-info/25 bg-info/10 p-4 text-sm text-info"><div className="flex items-start gap-3"><MailCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>Enter the 6-digit code sent to <span className="font-semibold">{email}</span>.</p></div></div>
            <div className="space-y-3"><Label htmlFor="password-otp">Verification code</Label><InputOTP id="password-otp" maxLength={6} value={otp} onChange={setOtp} disabled={isUpdating}><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup></InputOTP></div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-col gap-3 sm:flex-row"><Button type="submit" className="flex-1" disabled={isUpdating || otp.length !== 6}>{isUpdating ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : <><CheckCircle2 className="h-4 w-4" /> Confirm password change</>}</Button><Button type="button" variant="outline" onClick={cancelOtp} disabled={isUpdating}>Back</Button></div>
            <Button type="button" variant="ghost" className="w-full" onClick={() => void requestOtp()} disabled={isUpdating || isSending || resendSeconds > 0}><RefreshCw className="h-4 w-4" />{resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend verification code"}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

