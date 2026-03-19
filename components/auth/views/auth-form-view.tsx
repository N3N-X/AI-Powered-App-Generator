"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Ticket, Sparkles } from "lucide-react";
import { RuxLogo } from "@/components/shared/rux-logo";

type InviteStatus = "idle" | "validating" | "valid" | "invalid";

interface AuthFormViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: "signin" | "signup";
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  name: string;
  setName: (name: string) => void;
  inviteCode: string;
  setInviteCode: (code: string) => void;
  inviteStatus: InviteStatus;
  inviterName?: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchView: () => void;
  onForgotPassword: () => void;
  onRequestAccess: () => void;
}

export function AuthFormView({
  open,
  onOpenChange,
  view,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  inviteCode,
  setInviteCode,
  inviteStatus,
  inviterName,
  loading,
  onSubmit,
  onSwitchView,
  onForgotPassword,
  onRequestAccess,
}: AuthFormViewProps) {
  const canSubmit = () => {
    if (view === "signin") return !loading;
    return inviteStatus === "valid" && !loading;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <RuxLogo className="h-12 w-12" showBackground={false} />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            {view === "signin" ? "Welcome back" : "Join Early Access"}
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">
            {view === "signin" ? (
              "Sign in to continue to Rulxy"
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                Rulxy is in early access — invite code required
              </span>
            )}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            {view === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="modal-invite">
                    Invite Code <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                    <Input
                      id="modal-invite"
                      type="text"
                      placeholder="RULXY-XXXXXX"
                      value={inviteCode}
                      onChange={(e) =>
                        setInviteCode(e.target.value.toUpperCase())
                      }
                      required
                      className="pl-10"
                    />
                  </div>
                  {inviteStatus === "validating" && (
                    <p className="text-xs text-muted-foreground">
                      Validating...
                    </p>
                  )}
                  {inviteStatus === "valid" && inviterName && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Invited by {inviterName}
                    </p>
                  )}
                  {inviteStatus === "invalid" && (
                    <p className="text-xs text-destructive">
                      Invalid or expired code
                    </p>
                  )}
                  {inviteStatus === "idle" && (
                    <p className="text-xs text-muted-foreground">
                      Don&apos;t have a code?{" "}
                      <button
                        type="button"
                        onClick={onRequestAccess}
                        className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
                      >
                        Request access
                      </button>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modal-name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                    <Input
                      id="modal-name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="modal-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <Input
                  id="modal-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="modal-password">
                  Password <span className="text-destructive">*</span>
                </Label>
                {view === "signin" && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <Input
                  id="modal-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              disabled={!canSubmit()}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {view === "signin" ? "Signing in..." : "Creating account..."}
                </span>
              ) : view === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {view === "signin"
                ? "Don't have an account?"
                : "Already have an account?"}
            </span>{" "}
            <button
              type="button"
              onClick={onSwitchView}
              className="font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              {view === "signin" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
