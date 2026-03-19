"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ProviderIcon } from "@/components/auth/provider-icon";
import { getEnabledProviders } from "@/lib/auth-providers";
import { Shield, Check, Loader2, Lock, Mail, Link2 } from "lucide-react";
import { MfaSection } from "./mfa-section";

export function SecurityCard() {
  const { user: authUser, changePassword, linkOAuthProvider } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isLinkingProvider, setIsLinkingProvider] = useState<string | null>(
    null,
  );

  const hasPasswordIdentity = authUser?.identities?.some(
    (identity) => identity.provider === "email",
  );

  const linkedProviders =
    authUser?.identities
      ?.filter((identity) => identity.provider !== "email")
      .map((identity) => identity.provider) || [];

  const enabledProviders = getEnabledProviders();
  const unlinkableProviders = enabledProviders.filter(
    (p) => !linkedProviders.includes(p.provider),
  );

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Password required",
        description: "Please fill in both password fields",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    setIsSavingPassword(true);
    try {
      await changePassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });
    } catch (error) {
      toast({
        title: "Password update failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLinkProvider = async (provider: string) => {
    setIsLinkingProvider(provider);
    try {
      await linkOAuthProvider(
        provider as
          | "google"
          | "github"
          | "azure"
          | "apple"
          | "gitlab"
          | "bitbucket",
      );
    } catch (error) {
      toast({
        title: "Failed to link provider",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      setIsLinkingProvider(null);
    }
  };

  const getProviderDisplayName = (provider: string) => {
    const names: Record<string, string> = {
      google: "Google",
      github: "GitHub",
      azure: "Azure",
      apple: "Apple",
      gitlab: "GitLab",
      bitbucket: "Bitbucket",
    };
    return (
      names[provider] || provider.charAt(0).toUpperCase() + provider.slice(1)
    );
  };

  return (
    <Card className="liquid-glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security
        </CardTitle>
        <CardDescription>
          Manage your password and linked accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasPasswordIdentity && (
          <>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-white flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Change Password
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Update your account password
                </p>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="bg-white/5"
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="bg-white/5"
                    minLength={8}
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={
                    isSavingPassword || !newPassword || !confirmPassword
                  }
                  variant="outline"
                  size="sm"
                >
                  {isSavingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Update password
                </Button>
              </div>
            </div>
            <Separator className="bg-white/10" />
          </>
        )}

        <MfaSection />

        <Separator className="bg-white/10" />

        {/* Connected Accounts */}
        <div className="space-y-4">
          <div>
            <p className="font-medium text-white flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Connected Accounts
            </p>
            <p className="text-sm text-slate-400 mt-1">
              OAuth providers linked to your account
            </p>
          </div>
          <div className="space-y-3">
            {linkedProviders.map((provider) => (
              <div
                key={provider}
                className="flex items-center justify-between rounded-lg bg-white/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <ProviderIcon
                    provider={provider}
                    className="h-5 w-5 text-slate-300"
                  />
                  <span className="text-white font-medium">
                    {getProviderDisplayName(provider)}
                  </span>
                </div>
                <Badge variant="success">
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
            ))}
            {hasPasswordIdentity && (
              <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-slate-300" />
                  <span className="text-white font-medium">
                    Email & Password
                  </span>
                </div>
                <Badge variant="success">
                  <Check className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            )}
            {unlinkableProviders.map((config) => (
              <div
                key={config.provider}
                className="flex items-center justify-between rounded-lg bg-white/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <ProviderIcon
                    provider={config.provider}
                    className="h-5 w-5 text-slate-500"
                  />
                  <span className="text-slate-400 font-medium">
                    {config.name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLinkProvider(config.provider)}
                  disabled={isLinkingProvider !== null}
                >
                  {isLinkingProvider === config.provider ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Link
                </Button>
              </div>
            ))}
            {linkedProviders.length === 0 &&
              !hasPasswordIdentity &&
              unlinkableProviders.length === 0 && (
                <p className="text-sm text-slate-500">
                  No authentication providers configured.
                </p>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
