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
import { Mail, ArrowLeft } from "lucide-react";
import { RuxLogo } from "@/components/shared/rux-logo";

interface ForgotPasswordViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forgotEmail: string;
  setForgotEmail: (email: string) => void;
  forgotLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function ForgotPasswordView({
  open,
  onOpenChange,
  forgotEmail,
  setForgotEmail,
  forgotLoading,
  onSubmit,
  onBack,
}: ForgotPasswordViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <RuxLogo className="h-12 w-12" showBackground={false} />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Reset Password
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
              <Input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            disabled={forgotLoading}
          >
            {forgotLoading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
