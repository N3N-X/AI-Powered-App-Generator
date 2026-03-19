"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Check } from "lucide-react";
import { RuxLogo } from "@/components/shared/rux-logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
      toast({
        title: "Reset email sent",
        description: "Check your inbox for the password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send reset email",
        description: error.message || "Please check your email and try again.",
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
              Reset password
            </h1>
            <p className="text-slate-400">
              {emailSent
                ? "Check your email for the reset link"
                : "Enter your email to receive a password reset link"}
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
            {emailSent ? (
              <div className="space-y-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mx-auto">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">Email sent!</p>
                  <p className="text-sm text-slate-400">
                    We sent a password reset link to{" "}
                    <span className="text-white font-medium">{email}</span>.
                    Check your inbox and follow the link to reset your password.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEmailSent(false);
                      setEmail("");
                    }}
                  >
                    Try a different email
                  </Button>
                  <Link href="/" className="block">
                    <Button variant="gradient" className="w-full">
                      Back to home
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-slate-300 flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 transition-colors"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-6 transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send reset link"
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
