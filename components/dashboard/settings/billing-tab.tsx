"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserStore } from "@/stores/user-store";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "@/hooks/use-toast";
import { CreditCard, Check, Zap, Sparkles } from "lucide-react";

export function BillingTab() {
  const { user } = useUserStore();
  const { openModal } = useUIStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleManageSubscription = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to open billing portal");
      }
      const { url } = await response.json();
      if (url) window.location.href = url;
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

  const handleUpgrade = () => {
    window.location.href = "/dashboard/settings?tab=billing";
  };

  return (
    <div className="space-y-6">
      <Card className="liquid-glass-card">
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
              <Button variant="outline" onClick={handleManageSubscription}>
                Manage Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {user?.plan !== "FREE" && (
        <Card className="liquid-glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-violet-400" />
              Refill Credits
            </CardTitle>
            <CardDescription className="text-slate-400">
              Add one-time credits to keep generating without interruption.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="gradient"
              onClick={() => openModal("refill-credits")}
            >
              Refill credits
            </Button>
          </CardFooter>
        </Card>
      )}

      {user?.plan !== "ELITE" && (
        <div className="grid gap-4 md:grid-cols-2">
          {user?.plan === "FREE" && (
            <Card className="liquid-glass-card liquid-glass-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Zap className="h-5 w-5 text-violet-400" />
                  Pro Plan
                </CardTitle>
                <CardDescription className="text-slate-400">
                  <span className="text-2xl font-bold text-white">$39</span>
                  <span className="text-slate-400">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-400">
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
                    Priority build queue
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

          <Card className="liquid-glass-card liquid-glass-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  Elite Plan
                </CardTitle>
                <Badge variant="premium">Best Value</Badge>
              </div>
              <CardDescription className="text-slate-400">
                <span className="text-2xl font-bold text-white">$89</span>
                <span className="text-slate-400">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-400">
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
                  Priority build queue
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
    </div>
  );
}
