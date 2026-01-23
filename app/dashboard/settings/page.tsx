"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserStore, useRemainingCredits } from "@/stores/user-store";
import { toast } from "@/hooks/use-toast";
import { PLAN_LIMITS } from "@/types";
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
  Bell,
  Zap,
  Sparkles,
  Loader2,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "account";
  const { user: authUser, loading: authLoading } = useAuth();
  const { user, hasGitHub, setConnectedServices, updateUser } = useUserStore();
  const remainingCredits = useRemainingCredits();

  const [name, setName] = useState(user?.name || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    builds: true,
    marketing: false,
  });

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    setIsSavingName(true);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update name");
      }

      updateUser({ name: name.trim() });
      toast({
        title: "Name updated",
        description: "Your name has been saved",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleUpgrade = () => {
    // Redirect to billing portal or Stripe checkout
    window.location.href = "/dashboard/settings?tab=billing";
  };

  const handleManageSubscription = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/billing/portal", {
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

  return (
    <div className="h-full overflow-auto bg-[#0a0a0f]">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="bg-white/5 p-1">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            {/* Credits Overview Card */}
            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Zap className="h-5 w-5 text-amber-400" />
                  Credits Balance
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-slate-400">
                  Your available credits for AI generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">
                      {remainingCredits.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      credits remaining
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Plan limit
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {PLAN_LIMITS[
                        user?.plan || "FREE"
                      ].monthlyCredits.toLocaleString()}
                      <span className="text-sm text-gray-600 dark:text-slate-400 ml-1">
                        {PLAN_LIMITS[user?.plan || "FREE"].creditsRefresh
                          ? "/month"
                          : " (one-time)"}
                      </span>
                    </p>
                  </div>
                </div>
                {user?.totalCreditsUsed && user.totalCreditsUsed > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-white/10">
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Total credits used:{" "}
                      <span className="text-gray-900 dark:text-white font-medium">
                        {user.totalCreditsUsed.toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
              {user?.plan === "FREE" && (
                <CardFooter>
                  <Button
                    variant="gradient"
                    className="w-full"
                    onClick={handleUpgrade}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade to get more credits
                  </Button>
                </CardFooter>
              )}
            </Card>

            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <User className="h-5 w-5" />
                  Profile
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-slate-400">
                  Your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                    {authUser?.user_metadata?.avatar_url ? (
                      <img
                        src={authUser.user_metadata.avatar_url}
                        alt="Profile"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      user?.name?.[0] ||
                      authUser?.user_metadata?.display_name?.[0] ||
                      authUser?.email?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {user?.name ||
                        authUser?.user_metadata?.display_name ||
                        authUser?.user_metadata?.full_name ||
                        "User"}
                    </h3>
                    <p className="text-sm text-slate-400">{authUser?.email}</p>
                    <Badge
                      variant={
                        user?.plan === "ELITE"
                          ? "premium"
                          : user?.plan === "PRO"
                            ? "success"
                            : "secondary"
                      }
                      className="mt-2"
                    >
                      {user?.plan || "FREE"} Plan
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="bg-white/5"
                      />
                      <Button
                        onClick={handleSaveName}
                        disabled={isSavingName || name === user?.name}
                        variant="outline"
                      >
                        {isSavingName ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={authUser?.email || ""}
                      disabled
                      className="bg-white/5"
                    />
                    <p className="text-xs text-slate-500">
                      Email cannot be changed at this time
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>Manage your security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">
                      Two-factor authentication
                    </p>
                    <p className="text-sm text-slate-400">
                      Add an extra layer of security
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Active sessions</p>
                    <p className="text-sm text-slate-400">
                      Manage your active sessions
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  GitHub
                </CardTitle>
                <CardDescription>
                  Connect your GitHub account to create repos and push code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasGitHub ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-white">Connected</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      type="password"
                      placeholder="GitHub Personal Access Token"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      className="bg-white/5"
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleConnectGitHub}
                        disabled={isConnecting}
                      >
                        {isConnecting ? "Connecting..." : "Connect GitHub"}
                      </Button>
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-400 hover:underline flex items-center gap-1"
                      >
                        Create token <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {user?.plan === "ELITE" && (
              <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Claude API Key
                    <Badge variant="premium">Elite</Badge>
                  </CardTitle>
                  <CardDescription>
                    Use your own Claude API key for faster generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    type="password"
                    placeholder="sk-ant-..."
                    value={claudeKey}
                    onChange={(e) => setClaudeKey(e.target.value)}
                    className="bg-white/5"
                  />
                  <Button disabled={isConnecting}>
                    {isConnecting ? "Saving..." : "Save Key"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Apple className="h-5 w-5" />
                  Apple Developer
                </CardTitle>
                <CardDescription>Required for iOS app builds</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">Connect Apple Developer</Button>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Google Play
                </CardTitle>
                <CardDescription>
                  Required for Play Store distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">Connect Google Play</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Choose what emails you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">
                      Build notifications
                    </p>
                    <p className="text-sm text-slate-400">
                      Get notified when builds complete
                    </p>
                  </div>
                  <Switch
                    checked={notifications.builds}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, builds: checked })
                    }
                  />
                </div>
                <Separator className="bg-white/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Product updates</p>
                    <p className="text-sm text-slate-400">
                      New features and improvements
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email: checked })
                    }
                  />
                </div>
                <Separator className="bg-white/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Marketing emails</p>
                    <p className="text-sm text-slate-400">
                      Tips, offers, and promotions
                    </p>
                  </div>
                  <Switch
                    checked={notifications.marketing}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, marketing: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {user?.plan || "FREE"}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {user?.plan === "FREE"
                        ? "You're on the free plan"
                        : `You're subscribed to ${user?.plan}`}
                    </p>
                  </div>
                  {user?.plan !== "FREE" && (
                    <Button
                      variant="outline"
                      onClick={handleManageSubscription}
                    >
                      Manage Subscription
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {user?.plan !== "ELITE" && (
              <div className="grid gap-4 md:grid-cols-2">
                {user?.plan === "FREE" && (
                  <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Zap className="h-5 w-5 text-violet-400" />
                        Pro Plan
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-slate-400">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          $39
                        </span>
                        <span className="text-gray-600 dark:text-slate-400">
                          /month
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          20,000 credits/month
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          20 projects
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          GitHub integration
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Android builds
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="gradient"
                        className="w-full"
                        onClick={handleUpgrade}
                      >
                        Upgrade to Pro
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Sparkles className="h-5 w-5 text-amber-400" />
                        Elite Plan
                      </CardTitle>
                      <Badge variant="premium">Best Value</Badge>
                    </div>
                    <CardDescription className="text-gray-600 dark:text-slate-400">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        $89
                      </span>
                      <span className="text-gray-600 dark:text-slate-400">
                        /month
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        50,000 credits/month
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Unlimited projects
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        iOS & Android builds
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Custom Claude API key
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="gradient"
                      className="w-full"
                      onClick={handleUpgrade}
                    >
                      Upgrade to Elite
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
