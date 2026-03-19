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

interface RequestAccessViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestEmail: string;
  setRequestEmail: (email: string) => void;
  requestLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function RequestAccessView({
  open,
  onOpenChange,
  requestEmail,
  setRequestEmail,
  requestLoading,
  onSubmit,
  onBack,
}: RequestAccessViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <RuxLogo className="h-12 w-12" showBackground={false} />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Request Early Access
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">
            Enter your email and we&apos;ll notify you when a spot opens up
          </p>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="request-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
              <Input
                id="request-email"
                type="email"
                placeholder="you@example.com"
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            disabled={requestLoading}
          >
            {requestLoading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              "Request Access"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign up
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
