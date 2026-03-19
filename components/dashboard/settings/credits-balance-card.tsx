"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserStore, useRemainingCredits } from "@/stores/user-store";
import { PLAN_LIMITS } from "@/types";
import { Zap, Sparkles } from "lucide-react";

export function CreditsBalanceCard() {
  const { user } = useUserStore();
  const remainingCredits = useRemainingCredits();

  const handleUpgrade = () => {
    window.location.href = "/dashboard/settings?tab=billing";
  };

  return (
    <Card className="liquid-glass-card liquid-glass-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Zap className="h-5 w-5 text-amber-400" />
          Credits Balance
        </CardTitle>
        <CardDescription className="text-slate-400">
          Your available credits for AI generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-bold text-white">
              {remainingCredits.toLocaleString()}
            </p>
            <p className="text-sm text-slate-400">credits remaining</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Plan limit</p>
            <p className="text-lg font-semibold text-white">
              {PLAN_LIMITS[user?.plan || "FREE"].monthlyCredits.toLocaleString()}
              <span className="text-sm text-slate-400 ml-1">
                {PLAN_LIMITS[user?.plan || "FREE"].creditsRefresh ? "/month" : " (one-time)"}
              </span>
            </p>
          </div>
        </div>
        {user?.totalCreditsUsed && user.totalCreditsUsed > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm text-slate-400">
              Total credits used:{" "}
              <span className="text-white font-medium">{user.totalCreditsUsed.toLocaleString()}</span>
            </p>
          </div>
        )}
      </CardContent>
      {user?.plan === "FREE" && (
        <CardFooter>
          <Button variant="gradient" className="w-full" onClick={handleUpgrade}>
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade to get more credits
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
