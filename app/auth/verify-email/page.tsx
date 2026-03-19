"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { RuxLogo } from "@/components/shared/rux-logo";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleResend = async () => {
    if (!email) {
      toast({
        title: "No email provided",
        description: "Please go back and sign up again.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;

      toast({
        title: "Email resent",
        description: "Check your inbox for the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend",
        description: error.message || "Please wait a moment and try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <RuxLogo className="h-16 w-16" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Check your email
        </h1>
        <p className="text-muted-foreground">
          We sent a verification link to your email
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
        <div className="space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/10 mx-auto">
            <Mail className="h-8 w-8 text-violet-400" />
          </div>

          <div className="space-y-2">
            <p className="text-white font-medium">Verify your email</p>
            <p className="text-sm text-slate-400">
              {email ? (
                <>
                  We sent a verification link to{" "}
                  <span className="text-white font-medium">{email}</span>. Click
                  the link in the email to activate your account.
                </>
              ) : (
                <>
                  Click the link in the email we sent you to activate your
                  account.
                </>
              )}
            </p>
          </div>

          <div className="space-y-3">
            {email && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Resending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Resend verification email
                  </span>
                )}
              </Button>
            )}

            <Link href="/" className="block">
              <Button variant="gradient" className="w-full">
                Go to home
              </Button>
            </Link>
          </div>

          <p className="text-xs text-slate-500">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
