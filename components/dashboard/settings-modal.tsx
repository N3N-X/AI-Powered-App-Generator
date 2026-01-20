"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/stores/ui-store";
import { useUserStore } from "@/stores/user-store";
import {
  User,
  CreditCard,
  Key,
  Github,
  Apple,
  Smartphone,
  Shield,
  Check,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function SettingsModal() {
  const { activeModal, closeModal } = useUIStore();
  const { user, hasGitHub, hasAppleDev, hasGoogleDev, setConnectedServices } =
    useUserStore();

  const [githubToken, setGithubToken] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const isOpen = activeModal === "settings";

  const handleUpgrade = async (plan: "PRO" | "ELITE") => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      toast({
        title: "Upgrade failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to open billing portal");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      toast({
        title: "Failed to open billing portal",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectGitHub = async () => {
    if (!githubToken.trim()) {
      toast({
        title: "Token required",
        description: "Please enter your GitHub personal access token",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch("/api/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: githubToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect GitHub");
      }

      const data = await response.json();
      setConnectedServices({ github: true });
      setGithubToken("");
      toast({
        title: "GitHub connected",
        description: `Connected as ${data.github.login}`,
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Please check your token and try again",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveClaudeKey = async () => {
    if (!claudeKey.trim()) {
      toast({
        title: "API key required",
        description: "Please enter your Claude API key",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch("/api/settings/claude-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: claudeKey }),
      });

      if (!response.ok) {
        throw new Error("Failed to save Claude key");
      }

      setConnectedServices({ customApiKey: true });
      setClaudeKey("");
      toast({
        title: "Claude API key saved",
        description: "You can now use Claude for code generation",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Please check your API key and try again",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => closeModal()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account, integrations, and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {user?.name || user?.email}
                  </h3>
                  <p className="text-sm text-slate-400">{user?.email}</p>
                  <Badge
                    variant={user?.plan === "ELITE" ? "premium" : "secondary"}
                    className="mt-1"
                  >
                    {user?.plan || "FREE"} Plan
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Usage</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass rounded-lg p-4">
                    <p className="text-2xl font-bold text-white">
                      {user?.credits?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-slate-400">Credits remaining</p>
                  </div>
                  <div className="glass rounded-lg p-4">
                    <p className="text-2xl font-bold text-white">
                      {user?.totalCreditsUsed?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-slate-400">Total credits used</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4 mt-4">
            {/* GitHub */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Github className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">GitHub</h4>
                    <p className="text-sm text-slate-400">
                      Create repos and push code
                    </p>
                  </div>
                </div>
                {hasGitHub ? (
                  <Badge variant="success">
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not connected</Badge>
                )}
              </div>

              {!hasGitHub && (
                <div className="mt-4 space-y-2">
                  <Input
                    type="password"
                    placeholder="GitHub Personal Access Token"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleConnectGitHub}
                      disabled={isConnecting}
                    >
                      Connect
                    </Button>
                    <a
                      href="https://github.com/settings/tokens/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-violet-400 hover:underline flex items-center gap-1"
                    >
                      Get token <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Claude API Key (Elite only) */}
            {user?.plan === "ELITE" && (
              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5">
                      <Key className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Claude API Key</h4>
                      <p className="text-sm text-slate-400">
                        Use your own Claude API key
                      </p>
                    </div>
                  </div>
                  <Badge variant="premium">Elite</Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <Input
                    type="password"
                    placeholder="sk-ant-..."
                    value={claudeKey}
                    onChange={(e) => setClaudeKey(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveClaudeKey}
                    disabled={isConnecting}
                  >
                    Save Key
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="credentials" className="space-y-4 mt-4">
            <p className="text-sm text-slate-400">
              Connect your developer accounts to build and deploy apps.
            </p>

            {/* Apple Developer */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Apple className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Apple Developer</h4>
                    <p className="text-sm text-slate-400">
                      Required for iOS builds
                    </p>
                  </div>
                </div>
                {hasAppleDev ? (
                  <Badge variant="success">
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      closeModal();
                      // Open Apple connect modal
                    }}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>

            {/* Google Play */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Google Play</h4>
                    <p className="text-sm text-slate-400">
                      Required for Android distribution
                    </p>
                  </div>
                </div>
                {hasGoogleDev ? (
                  <Badge variant="success">
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      closeModal();
                      // Open Google connect modal
                    }}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-4">
              <Shield className="h-4 w-4" />
              All credentials are encrypted with AES-256-GCM
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4 mt-4">
            {/* Current Plan */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-white">Current Plan</h4>
                  <p className="text-sm text-slate-400">
                    {user?.plan === "FREE"
                      ? "You're on the free plan"
                      : `You're subscribed to ${user?.plan}`}
                  </p>
                </div>
                <Badge
                  variant={
                    user?.plan === "ELITE"
                      ? "premium"
                      : user?.plan === "PRO"
                        ? "success"
                        : "secondary"
                  }
                  className="text-sm"
                >
                  {user?.plan || "FREE"}
                </Badge>
              </div>

              {user?.plan !== "FREE" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={isConnecting}
                >
                  Manage Subscription
                </Button>
              )}
            </div>

            {/* Upgrade Options */}
            {user?.plan !== "ELITE" && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">
                  Upgrade Your Plan
                </h4>

                {user?.plan === "FREE" && (
                  <div className="glass rounded-xl p-4 border border-violet-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-white">Pro Plan</h5>
                        <p className="text-sm text-slate-400">$19/month</p>
                        <ul className="text-xs text-slate-500 mt-2 space-y-1">
                          <li>100 prompts per day</li>
                          <li>20 projects</li>
                          <li>GitHub integration</li>
                          <li>Android builds</li>
                        </ul>
                      </div>
                      <Button
                        variant="gradient"
                        size="sm"
                        onClick={() => handleUpgrade("PRO")}
                        disabled={isConnecting}
                      >
                        {isConnecting ? "Loading..." : "Upgrade"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="glass rounded-xl p-4 border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-white flex items-center gap-2">
                        Elite Plan
                        <Badge variant="premium" className="text-xs">
                          Best Value
                        </Badge>
                      </h5>
                      <p className="text-sm text-slate-400">$49/month</p>
                      <ul className="text-xs text-slate-500 mt-2 space-y-1">
                        <li>500 prompts per day</li>
                        <li>Unlimited projects</li>
                        <li>iOS & Android builds</li>
                        <li>Custom Claude API key</li>
                      </ul>
                    </div>
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={() => handleUpgrade("ELITE")}
                      disabled={isConnecting}
                    >
                      {isConnecting ? "Loading..." : "Upgrade"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {user?.plan === "ELITE" && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400">
                  You&apos;re on the highest plan. Thank you for your support!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
