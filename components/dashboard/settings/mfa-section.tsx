"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Shield,
  Loader2,
  ShieldCheck,
  Copy,
  AlertTriangle,
} from "lucide-react";

export function MfaSection() {
  const {
    mfaEnabled,
    mfaEnroll,
    mfaChallenge,
    mfaVerify,
    mfaUnenroll,
    mfaListFactors,
  } = useAuth();

  const [mfaEnrolling, setMfaEnrolling] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaTotpCode, setMfaTotpCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [mfaDisabling, setMfaDisabling] = useState(false);
  const [showMfaDisableDialog, setShowMfaDisableDialog] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<
    Array<{ id: string; friendly_name?: string; status: string }>
  >([]);

  const loadMfaFactors = async () => {
    try {
      const factors = await mfaListFactors();
      setMfaFactors(factors.totp?.filter((f) => f.status === "verified") ?? []);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    loadMfaFactors();
  }, []);

  const handleEnableMfa = async () => {
    setMfaEnrolling(true);
    try {
      const data = await mfaEnroll("Rulxy Authenticator");
      setMfaFactorId(data.id);
      const qrDataUrl = await QRCode.toDataURL(data.totp.uri, {
        width: 200,
        margin: 2,
        color: { dark: "#ffffff", light: "#00000000" },
      });
      setMfaQrCode(qrDataUrl);
      setMfaSecret(data.totp.secret);
    } catch (error) {
      toast({
        title: "Failed to set up 2FA",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      setMfaEnrolling(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaFactorId || !mfaTotpCode || mfaTotpCode.length !== 6) return;
    setMfaVerifying(true);
    try {
      const challengeId = await mfaChallenge(mfaFactorId);
      await mfaVerify(mfaFactorId, challengeId, mfaTotpCode);
      toast({
        title: "2FA enabled",
        description: "Two-factor authentication is now active on your account.",
      });
      setMfaEnrolling(false);
      setMfaQrCode(null);
      setMfaSecret(null);
      setMfaTotpCode("");
      setMfaFactorId(null);
      loadMfaFactors();
    } catch {
      toast({
        title: "Verification failed",
        description: "Invalid code. Please try again.",
        variant: "destructive",
      });
      setMfaTotpCode("");
    } finally {
      setMfaVerifying(false);
    }
  };

  const handleCancelMfaEnroll = async () => {
    if (mfaFactorId) {
      try {
        await mfaUnenroll(mfaFactorId);
      } catch {
        /* Silently fail cleanup */
      }
    }
    setMfaEnrolling(false);
    setMfaQrCode(null);
    setMfaSecret(null);
    setMfaTotpCode("");
    setMfaFactorId(null);
  };

  const handleDisableMfa = async () => {
    const factor = mfaFactors[0];
    if (!factor) return;
    setMfaDisabling(true);
    try {
      await mfaUnenroll(factor.id);
      toast({
        title: "2FA disabled",
        description:
          "Two-factor authentication has been removed from your account.",
      });
      setShowMfaDisableDialog(false);
      loadMfaFactors();
    } catch (error) {
      toast({
        title: "Failed to disable 2FA",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setMfaDisabling(false);
    }
  };

  const handleCopySecret = () => {
    if (mfaSecret) {
      navigator.clipboard.writeText(mfaSecret);
      toast({ title: "Copied", description: "Secret key copied to clipboard" });
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <p className="font-medium text-white flex items-center gap-2">
            {mfaEnabled || mfaFactors.length > 0 ? (
              <ShieldCheck className="h-4 w-4 text-green-400" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            Two-Factor Authentication
            {(mfaEnabled || mfaFactors.length > 0) && (
              <Badge variant="success" className="ml-2">
                Enabled
              </Badge>
            )}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {mfaEnabled || mfaFactors.length > 0
              ? "A verification code is required from your authenticator app every time you sign in."
              : "Add an extra layer of security to your account."}
          </p>
        </div>

        {!mfaEnrolling && !mfaEnabled && mfaFactors.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300">
                Once enabled, you&apos;ll be asked to enter a verification code
                from your authenticator app every time you sign in.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleEnableMfa}>
              <Shield className="h-4 w-4 mr-2" />
              Enable Two-Factor Authentication
            </Button>
          </div>
        )}

        {mfaEnrolling && mfaQrCode && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Scan this QR code with your authenticator app (Google
              Authenticator, Authy, etc.)
            </p>
            <div className="flex justify-center">
              <div className="rounded-lg bg-white/5 p-4">
                <img
                  src={mfaQrCode}
                  alt="TOTP QR Code"
                  width={200}
                  height={200}
                />
              </div>
            </div>
            {mfaSecret && (
              <div className="space-y-1">
                <p className="text-xs text-slate-400">
                  Can&apos;t scan? Use this secret key:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm text-slate-300 bg-white/5 rounded px-3 py-2 break-all">
                    {mfaSecret}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopySecret}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="mfaCode">Enter 6-digit verification code</Label>
              <Input
                id="mfaCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={mfaTotpCode}
                onChange={(e) =>
                  setMfaTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                maxLength={6}
                className="bg-white/5 font-mono text-center text-lg tracking-widest"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleVerifyMfa}
                disabled={mfaVerifying || mfaTotpCode.length !== 6}
                variant="gradient"
                size="sm"
              >
                {mfaVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-2" />
                )}
                Verify & Activate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelMfaEnroll}
                disabled={mfaVerifying}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!mfaEnrolling && (mfaEnabled || mfaFactors.length > 0) && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            onClick={() => setShowMfaDisableDialog(true)}
          >
            <Shield className="h-4 w-4 mr-2" />
            Disable Two-Factor Authentication
          </Button>
        )}
      </div>

      {/* Disable MFA Confirmation Dialog */}
      <Dialog
        open={showMfaDisableDialog}
        onOpenChange={setShowMfaDisableDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              This will remove the extra security layer from your account. You
              will no longer need a verification code when signing in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMfaDisableDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisableMfa}
              disabled={mfaDisabling}
            >
              {mfaDisabling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
