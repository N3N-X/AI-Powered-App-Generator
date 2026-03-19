"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard,
  FolderOpen,
  TrendingUp,
  Zap,
  Monitor,
  Smartphone,
} from "lucide-react";
import { PLANS } from "@/lib/billing";

interface StatsCardsProps {
  credits: number;
  creditsPercent: number;
  maxCredits: number;
  plan: keyof typeof PLANS;
  planConfig: (typeof PLANS)[keyof typeof PLANS];
  totalProjects: number;
  maxProjects: number;
  platformCounts: { web: number; ios: number; android: number };
  totalCreditsUsed: number;
}

export function StatsCards({
  credits,
  creditsPercent,
  maxCredits,
  plan,
  planConfig,
  totalProjects,
  maxProjects,
  platformCounts,
  totalCreditsUsed,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Credits */}
      <Card className="liquid-glass-card">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">
              Credits
            </span>
            <CreditCard className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {credits.toLocaleString()}
          </div>
          <Progress value={creditsPercent} className="h-1.5 mt-2" />
          <p className="text-xs text-slate-500 mt-1.5">
            {creditsPercent}% of {maxCredits.toLocaleString()}{" "}
            {plan === "FREE" ? "total" : "monthly"}
          </p>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card className="liquid-glass-card">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">
              Projects
            </span>
            <FolderOpen className="h-4 w-4 text-violet-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalProjects}
            <span className="text-sm font-normal text-slate-500">
              {maxProjects > 0 ? ` / ${maxProjects}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Monitor className="h-3 w-3" /> {platformCounts.web}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Smartphone className="h-3 w-3" />{" "}
              {platformCounts.ios + platformCounts.android}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Credits Used */}
      <Card className="liquid-glass-card">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">
              Credits Used
            </span>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalCreditsUsed.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-2">All time usage</p>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card className="liquid-glass-card">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">Plan</span>
            <Zap className="h-4 w-4 text-violet-500" />
          </div>
          <div className="flex items-center gap-2 mb-2">
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
              {planConfig.name}
            </Badge>
          </div>
          {plan === "FREE" ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-1 text-xs"
              asChild
            >
              <Link href="/pricing">Upgrade Plan</Link>
            </Button>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              ${planConfig.price}/mo
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
