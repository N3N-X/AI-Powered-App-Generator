"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface SettingsBillingTabProps {
  user: {
    plan?: string | null;
  } | null;
}

export function SettingsBillingTab({ user }: SettingsBillingTabProps) {
  const [isConnecting, setIsConnecting] = useState(false);

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

  return (
    <>
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
                  <p className="text-sm text-slate-400">$39/month</p>
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
                <p className="text-sm text-slate-400">$89/month</p>
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
    </>
  );
}
