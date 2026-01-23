"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Provider } from "@supabase/supabase-js";
import { ArrowLeft, Lock, Mail, User, Check } from "lucide-react";

interface OAuthProvider {
  name: string;
  provider: Provider;
  icon: React.ReactNode;
  color: string;
}

const PROVIDER_CONFIGS: Record<
  string,
  Omit<OAuthProvider, "provider" | "name">
> = {
  google: {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    color: "hover:bg-white/10",
  },
  github: {
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    color: "hover:bg-slate-700/50",
  },
  azure: {
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13.05 2.39L7.95 12.2l-6.9 9.4h5.34l11.55-15.91L13.05 2.39zm-1.47 16.4H4.85l4.93-6.77 1.8 6.77zm3.47-9.16l-3.96 5.43-1.36-5.16 5.32-.27z" />
      </svg>
    ),
    color: "hover:bg-blue-600/20",
  },
  apple: {
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    ),
    color: "hover:bg-white/10",
  },
};

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

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const { signUp } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Fetch enabled OAuth providers from Supabase
  useEffect(() => {
    async function fetchProviders() {
      try {
        const enabledProviders: OAuthProvider[] = [];
        const providersToCheck: Provider[] = [
          "google",
          "github",
          "azure",
          "apple",
        ];

        for (const providerName of providersToCheck) {
          if (PROVIDER_CONFIGS[providerName]) {
            enabledProviders.push({
              name:
                providerName.charAt(0).toUpperCase() + providerName.slice(1),
              provider: providerName,
              ...PROVIDER_CONFIGS[providerName],
            });
          }
        }

        setProviders(enabledProviders);
      } catch (error) {
        console.error("Failed to fetch providers:", error);
      }
    }

    fetchProviders();
  }, []);

  const isPasswordValid = () => {
    return PASSWORD_REQUIREMENTS.every((req) => req.test(password));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
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
      await signUp(email, password, name);

      // Check if email confirmation is required
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // Email confirmation disabled - user is logged in immediately
        toast({
          title: "Account created!",
          description: "Welcome to RUX!",
        });
        router.push("/dashboard");
      } else {
        // Email confirmation required
        toast({
          title: "Account created!",
          description:
            "Please check your email to verify your account before logging in.",
        });
        router.push("/sign-in");
      }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description:
          error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignUp = async (provider: Provider) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || `Failed to sign up with ${provider}.`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] relative overflow-hidden">
      {/* Liquid Glass Background - Match Landing Page */}
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

      <div className="flex min-h-screen items-center justify-center p-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Create your account
            </h1>
            <p className="text-slate-400">
              Start building amazing projects with RUX
            </p>
          </div>

          {/* Auth Card */}
          <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
            {/* OAuth Providers */}
            {providers.length > 0 && (
              <div className="space-y-3 mb-6">
                {providers.map((provider) => (
                  <Button
                    key={provider.provider}
                    type="button"
                    onClick={() => handleOAuthSignUp(provider.provider)}
                    disabled={isLoading}
                    className={`w-full bg-white/5 border border-white/10 ${provider.color} text-white transition-all duration-200`}
                    variant="outline"
                  >
                    {provider.icon}
                    <span className="ml-3">Continue with {provider.name}</span>
                  </Button>
                ))}
              </div>
            )}

            {/* Divider */}
            {providers.length > 0 && (
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-slate-900/50 px-4 text-slate-400">
                    Or create with email
                  </span>
                </div>
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-slate-300 flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Full name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={isLoading}
                  autoComplete="name"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 transition-colors"
                />
              </div>

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

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-slate-300 flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowPasswordRequirements(true)}
                  placeholder="Create a strong password"
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 transition-colors"
                />
                {showPasswordRequirements && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <p className="text-xs text-slate-400 mb-2 font-medium">
                      Password must have:
                    </p>
                    <ul className="space-y-1">
                      {PASSWORD_REQUIREMENTS.map((req, idx) => {
                        const isValid = req.test(password);
                        return (
                          <li
                            key={idx}
                            className={`text-xs flex items-center gap-2 transition-colors ${
                              isValid ? "text-green-400" : "text-slate-500"
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
                <Label
                  htmlFor="confirmPassword"
                  className="text-slate-300 flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 transition-colors"
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
                    Creating account...
                  </span>
                ) : (
                  "Create account"
                )}
              </Button>

              <p className="text-xs text-center text-slate-500 pt-2">
                By creating an account, you agree to our{" "}
                <Link
                  href="/terms"
                  className="text-violet-400 hover:text-violet-300 transition-colors underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-violet-400 hover:text-violet-300 transition-colors underline"
                >
                  Privacy Policy
                </Link>
              </p>
            </form>
          </div>

          {/* Sign In Link */}
          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
