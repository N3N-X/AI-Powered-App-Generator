"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Shield, Loader2, LogOut } from "lucide-react";

export default function MfaVerifyPage() {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [isLoadingFactor, setIsLoadingFactor] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, loading, mfaListFactors, mfaChallenge, mfaVerify, logout } =
    useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/sign-in");
      return;
    }

    loadFactor();
  }, [user, loading]);

  useEffect(() => {
    if (!isLoadingFactor && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoadingFactor]);

  const loadFactor = async () => {
    try {
      const factors = await mfaListFactors();
      const verifiedTotpFactors =
        factors.totp?.filter((f) => f.status === "verified") ?? [];

      if (verifiedTotpFactors.length === 0) {
        router.replace("/dashboard");
        return;
      }

      setFactorId(verifiedTotpFactors[0].id);
    } catch {
      setError("Failed to load authentication factors.");
    } finally {
      setIsLoadingFactor(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!factorId || code.length !== 6) return;

    setIsVerifying(true);
    setError(null);

    try {
      const challengeId = await mfaChallenge(factorId);
      await mfaVerify(factorId, challengeId, code);
      router.replace("/dashboard");
    } catch {
      setError("Invalid verification code. Please try again.");
      setCode("");
      inputRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.replace("/sign-in");
  };

  const handleCodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setCode(cleaned);
    setError(null);
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

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Button>
        </Link>
      </div>

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Two-Factor Authentication
            </h1>
            <p className="text-slate-400">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {/* Auth Card */}
          <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
            {isLoadingFactor ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="space-y-3">
                  <Input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    disabled={isVerifying}
                    className="bg-slate-800/50 border-slate-700 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-slate-600 focus:border-violet-500 focus:ring-violet-500/20 transition-colors h-14"
                  />
                  {error && (
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isVerifying || code.length !== 6}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-6 transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40"
                >
                  {isVerifying ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Use Different Account */}
          <div className="text-center">
            <button
              onClick={handleSignOut}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors inline-flex items-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              Use a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
