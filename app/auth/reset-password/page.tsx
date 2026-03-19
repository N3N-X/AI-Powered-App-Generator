"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check } from "lucide-react";
import { RuxLogo } from "@/components/shared/rux-logo";

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (pwd: string) => pwd.length >= 8 },
  { label: "Contains a number", test: (pwd: string) => /\d/.test(pwd) },
  {
    label: "Contains uppercase letter",
    test: (pwd: string) => /[A-Z]/.test(pwd),
  },
  {
    label: "Contains lowercase letter",
    test: (pwd: string) => /[a-z]/.test(pwd),
  },
];

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const isPasswordValid = () => {
    return PASSWORD_REQUIREMENTS.every((req) => req.test(password));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordValid()) {
      toast({
        title: "Weak password",
        description: "Please meet all password requirements.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Password updated",
        description: "Your password has been reset successfully.",
      });

      // Redirect to home after a short delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description:
          error.message ||
          "Failed to reset password. The link may have expired.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Liquid Glass Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-blue-400/15 via-blue-300/8 to-transparent rounded-full blur-[140px] animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-gradient-radial from-purple-400/12 via-purple-300/6 to-transparent rounded-full blur-[160px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-radial from-cyan-300/5 via-transparent to-transparent rounded-full blur-[100px]" />
      </div>

      {/* Back to Home */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Button>
        </Link>
      </div>

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <RuxLogo className="h-16 w-16" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {isSuccess ? "Password updated" : "Set new password"}
            </h1>
            <p className="text-muted-foreground">
              {isSuccess
                ? "Redirecting you to sign in..."
                : "Enter your new password below"}
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-black/10 dark:border-white/10 p-8 shadow-2xl">
            {isSuccess ? (
              <div className="space-y-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mx-auto">
                  <Check className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Your password has been updated. You'll be redirected to sign
                  in shortly.
                </p>
                <Link href="/" className="block">
                  <Button variant="gradient" className="w-full">
                    Go to home
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  {password && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">
                        Password must have:
                      </p>
                      <ul className="space-y-1">
                        {PASSWORD_REQUIREMENTS.map((req, idx) => {
                          const isValid = req.test(password);
                          return (
                            <li
                              key={idx}
                              className={`text-xs flex items-center gap-2 transition-colors ${
                                isValid
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <Check
                                className={`h-3 w-3 ${isValid ? "opacity-100" : "opacity-30"}`}
                              />
                              {req.label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !isPasswordValid()}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-6 transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating password...
                    </span>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
