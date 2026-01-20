"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/stores/user-store";
import {
  BarChart3,
  Zap,
  TrendingUp,
  Clock,
  Activity,
  CreditCard,
  Sparkles,
} from "lucide-react";

interface UsageData {
  dailyPrompts: number;
  totalPrompts: number;
  projectCount: number;
  buildCount: number;
  storageUsed: number;
  creditsUsed: number;
  creditsRemaining: number;
}

export default function UsagePage() {
  const { user } = useUserStore();
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch("/api/user/usage");
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
        }
      } catch (error) {
        console.error("Failed to fetch usage:", error);
      }
    }
    fetchUsage();
  }, []);

  const planLimits = {
    FREE: { monthlyCredits: 3000, projects: 3, creditsRefresh: false },
    PRO: { monthlyCredits: 20000, projects: 20, creditsRefresh: true },
    ELITE: { monthlyCredits: 50000, projects: -1, creditsRefresh: true },
  };

  const limits =
    planLimits[user?.plan as keyof typeof planLimits] || planLimits.FREE;
  const creditsUsed = user?.totalCreditsUsed || 0;
  const creditsRemaining = user?.credits || 0;
  const creditsPercentage = Math.min(
    (creditsRemaining / limits.monthlyCredits) * 100,
    100,
  );

  return (
    <div className="h-full overflow-auto bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Usage & Analytics
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Track your resource consumption and limits
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-400">
                Credits Remaining
              </CardTitle>
              <Zap className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {creditsRemaining.toLocaleString()}
              </div>
              <Progress value={creditsPercentage} className="mt-2" />
              <p className="text-xs text-gray-600 dark:text-slate-500 mt-2">
                {limits.creditsRefresh
                  ? "Resets monthly"
                  : "One-time allocation"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-400">
                Credits Used
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {creditsUsed.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-500 mt-2">
                All time
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-400">
                Monthly Allowance
              </CardTitle>
              <CreditCard className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {limits.monthlyCredits.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-500 mt-2">
                credits per {limits.creditsRefresh ? "month" : "account"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-400">
                Current Plan
              </CardTitle>
              <Sparkles className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.plan || "FREE"}
                </span>
                {user?.plan === "ELITE" && (
                  <Badge variant="premium">Best</Badge>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-500 mt-2">
                {user?.plan === "FREE"
                  ? "Upgrade for more"
                  : "Premium features active"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Usage */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Prompt Usage Chart */}
          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <BarChart3 className="h-5 w-5" />
                Usage This Week
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-slate-400">
                Daily prompt consumption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getWeekDays().map((day, i) => {
                  const value = Math.floor(Math.random() * 500); // Sample data
                  const percentage = Math.min((value / 500) * 100, 100);
                  return (
                    <div key={day} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-slate-400">
                          {day}
                        </span>
                        <span className="text-black dark:text-white">
                          {value}
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Service Breakdown */}
          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Activity className="h-5 w-5" />
                Proxy Service Usage
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-slate-400">
                Credits used by service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "OpenAI", credits: 450, color: "bg-green-500" },
                  { name: "Maps", credits: 120, color: "bg-blue-500" },
                  { name: "Email", credits: 80, color: "bg-amber-500" },
                  { name: "SMS", credits: 25, color: "bg-pink-500" },
                  { name: "Storage", credits: 15, color: "bg-purple-500" },
                ].map((service) => (
                  <div key={service.name} className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${service.color}`} />
                    <span className="flex-1 text-sm text-gray-700 dark:text-slate-300">
                      {service.name}
                    </span>
                    <span className="text-sm font-medium text-black dark:text-white">
                      {service.credits} credits
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-300/50 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-slate-400">
                    Total used this month
                  </span>
                  <span className="text-lg font-bold text-black dark:text-white">
                    690 credits
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-slate-400">
              Your latest actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: "Code generated",
                  project: "Calculator App",
                  time: "2 minutes ago",
                  type: "generate",
                },
                {
                  action: "Project created",
                  project: "Weather App",
                  time: "1 hour ago",
                  type: "create",
                },
                {
                  action: "Build started",
                  project: "Todo App",
                  time: "3 hours ago",
                  type: "build",
                },
                {
                  action: "Code refined",
                  project: "Calculator App",
                  time: "5 hours ago",
                  type: "refine",
                },
                {
                  action: "GitHub push",
                  project: "Notes App",
                  time: "Yesterday",
                  type: "github",
                },
              ].map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg bg-white/10 dark:bg-white/5"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      activity.type === "generate"
                        ? "bg-violet-500/20 text-violet-400"
                        : activity.type === "create"
                          ? "bg-green-500/20 text-green-400"
                          : activity.type === "build"
                            ? "bg-amber-500/20 text-amber-400"
                            : activity.type === "refine"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400 dark:bg-slate-500/20 dark:text-slate-400"
                    }`}
                  >
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-slate-400">
                      {activity.project}
                    </p>
                  </div>
                  <span className="text-xs text-gray-700 dark:text-slate-500">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getWeekDays() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();
  return Array.from({ length: 7 }, (_, i) => days[(today - 6 + i + 7) % 7]);
}
