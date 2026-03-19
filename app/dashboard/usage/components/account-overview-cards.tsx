"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, TrendingUp, Zap, FolderOpen } from "lucide-react";

interface AccountOverviewCardsProps {
  credits: number;
  totalCreditsUsed: number;
  maxCredits: number;
  creditsPercent: number;
  plan: string;
  planName: string;
  projectCount: number;
}

export function AccountOverviewCards({
  credits,
  totalCreditsUsed,
  maxCredits,
  creditsPercent,
  plan,
  planName,
  projectCount,
}: AccountOverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Credits Remaining */}
      <Card className="liquid-glass-card">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Credits Remaining
            </span>
            <CreditCard className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {credits.toLocaleString()}
          </div>
          <Progress value={creditsPercent} className="h-1.5 mt-2" />
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-1.5">
            {creditsPercent}% of {maxCredits.toLocaleString()}{" "}
            {plan === "FREE" ? "total" : "monthly"}
          </p>
        </CardContent>
      </Card>

      {/* Total Credits Used */}
      <Card className="liquid-glass-card">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Credits Used
            </span>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalCreditsUsed.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
            All-time usage
          </p>
        </CardContent>
      </Card>

      {/* Current Plan */}
      <Card className="liquid-glass-card">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Current Plan
            </span>
            <Zap className="h-4 w-4 text-violet-500" />
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                plan === "ELITE"
                  ? "premium"
                  : plan === "PRO"
                    ? "default"
                    : "secondary"
              }
              className="text-sm px-2.5 py-0.5"
            >
              {planName}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
            {plan === "FREE"
              ? "3,000 one-time credits"
              : `${maxCredits.toLocaleString()} credits/mo`}
          </p>
        </CardContent>
      </Card>

      {/* Total Projects */}
      <Card className="liquid-glass-card">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Projects
            </span>
            <FolderOpen className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {projectCount}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
            Active projects
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
