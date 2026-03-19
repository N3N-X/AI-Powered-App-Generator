"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { ForgotPasswordView, RequestAccessView, AuthFormView } from "./views";

type ModalView = "signin" | "signup" | "forgot-password" | "request-access";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "signin" | "signup";
  initialInviteCode?: string;
}

export function AuthModal({
  open,
  onOpenChange,
  defaultMode = "signin",
  initialInviteCode = "",
}: AuthModalProps) {
  const [view, setView] = useState<ModalView>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [requestEmail, setRequestEmail] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >("idle");
  const [inviterName, setInviterName] = useState<string>();
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setView(defaultMode);
      if (initialInviteCode) {
        setInviteCode(initialInviteCode);
      }
    }
  }, [open, defaultMode, initialInviteCode]);

  // Validate invite code
  useEffect(() => {
    if (view !== "signup") return;

    const validateCode = async () => {
      if (!inviteCode || inviteCode.length < 6) {
        setInviteStatus("idle");
        setInviterName(undefined);
        return;
      }

      setInviteStatus("validating");
      try {
        const res = await fetch("/api/invite/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: inviteCode }),
        });
        const data = await res.json();
        if (data.valid) {
          setInviteStatus("valid");
          setInviterName(data.inviterName);
        } else {
          setInviteStatus("invalid");
          setInviterName(undefined);
        }
      } catch {
        setInviteStatus("invalid");
        setInviterName(undefined);
      }
    };

    const debounce = setTimeout(validateCode, 500);
    return () => clearTimeout(debounce);
  }, [inviteCode, view]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === "signin") {
        await signIn(email, password);

        const supabase = createClient();
        const { data: aalData } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (aalData && aalData.currentLevel !== aalData.nextLevel) {
          onOpenChange(false);
          router.push("/auth/mfa-verify");
          return;
        }

        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        router.push("/dashboard");
      } else {
        if (inviteStatus !== "valid") {
          toast({
            title: "Invalid invite code",
            description: "Please enter a valid invite code.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        await signUp(email, password, name, inviteCode);
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
      }
      onOpenChange(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Authentication failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      setView("signin");
      setForgotEmail("");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Request failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestLoading(true);

    try {
      const res = await fetch("/api/invite/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: requestEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      toast({
        title: "Request submitted!",
        description: "We'll notify you when early access opens up.",
      });
      setView("signup");
      setRequestEmail("");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Request failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setRequestLoading(false);
    }
  };

  if (view === "forgot-password") {
    return (
      <ForgotPasswordView
        open={open}
        onOpenChange={onOpenChange}
        forgotEmail={forgotEmail}
        setForgotEmail={setForgotEmail}
        forgotLoading={forgotLoading}
        onSubmit={handleForgotPassword}
        onBack={() => setView("signin")}
      />
    );
  }

  if (view === "request-access") {
    return (
      <RequestAccessView
        open={open}
        onOpenChange={onOpenChange}
        requestEmail={requestEmail}
        setRequestEmail={setRequestEmail}
        requestLoading={requestLoading}
        onSubmit={handleRequestAccess}
        onBack={() => setView("signup")}
      />
    );
  }

  return (
    <AuthFormView
      open={open}
      onOpenChange={onOpenChange}
      view={view as "signin" | "signup"}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      name={name}
      setName={setName}
      inviteCode={inviteCode}
      setInviteCode={setInviteCode}
      inviteStatus={inviteStatus}
      inviterName={inviterName}
      loading={loading}
      onSubmit={handleEmailAuth}
      onSwitchView={() => setView(view === "signin" ? "signup" : "signin")}
      onForgotPassword={() => setView("forgot-password")}
      onRequestAccess={() => setView("request-access")}
    />
  );
}
