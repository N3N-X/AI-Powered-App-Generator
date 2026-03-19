"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserStore } from "@/stores/user-store";
import { useProjectStore } from "@/stores/project-store";
import { PLANS } from "@/lib/billing";
import { Loader2, RefreshCw, BarChart3 } from "lucide-react";
import type {
  UsageStats,
  UsageLog,
  Pagination,
} from "@/components/dashboard/content/types";
import {
  AccountOverviewCards,
  UsageStatsCards,
  ServicesBreakdown,
  RecentActivity,
} from "./components";

export default function UsagePage() {
  const { user } = useUserStore();
  const { projects } = useProjectStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [aggregatedStats, setAggregatedStats] = useState<UsageStats | null>(
    null,
  );

  const plan = (user?.plan || "FREE") as keyof typeof PLANS;
  const planConfig = PLANS[plan];
  const credits = user?.credits ?? 0;
  const totalCreditsUsed = user?.totalCreditsUsed ?? 0;
  const maxCredits = planConfig?.limits?.monthlyCredits ?? 3000;
  const creditsPercent = Math.min(
    Math.round((credits / maxCredits) * 100),
    100,
  );

  const fetchAggregatedStats = useCallback(async () => {
    if (projects.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const results = await Promise.allSettled(
        projects.map((project) =>
          fetch(`/api/projects/${project.id}/usage?limit=1`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null),
        ),
      );

      const allStats: UsageStats = {
        totalCalls: 0,
        totalCredits: 0,
        byService: {},
      };

      for (const result of results) {
        if (result.status !== "fulfilled" || !result.value?.stats) continue;
        const stats = result.value.stats;
        allStats.totalCalls += stats.totalCalls;
        allStats.totalCredits += stats.totalCredits;
        for (const [service, serviceData] of Object.entries(stats.byService)) {
          const svc = serviceData as { calls: number; credits: number };
          if (!allStats.byService[service]) {
            allStats.byService[service] = { calls: 0, credits: 0 };
          }
          allStats.byService[service].calls += svc.calls;
          allStats.byService[service].credits += svc.credits;
        }
      }

      setAggregatedStats(allStats);
    } finally {
      setLoading(false);
    }
  }, [projects]);

  const fetchProjectUsage = useCallback(async (projectId: string, page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/usage?page=${page}&limit=20`,
      );
      if (res.ok) {
        const data = await res.json();
        setUsageStats(data.stats);
        setUsageLogs(data.logs || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAggregatedStats();
  }, [fetchAggregatedStats]);

  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== "all") {
      fetchProjectUsage(selectedProjectId);
    } else {
      setUsageStats(null);
      setUsageLogs([]);
      setPagination(null);
    }
  }, [selectedProjectId, fetchProjectUsage]);

  const displayStats =
    selectedProjectId === "all" ? aggregatedStats : usageStats;

  const handlePageChange = (page: number) => {
    fetchProjectUsage(selectedProjectId, page);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Usage & Credits
            </h1>
            <p className="text-gray-500 dark:text-slate-400">
              Monitor your account usage and API consumption
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchAggregatedStats();
              if (selectedProjectId !== "all") {
                fetchProjectUsage(selectedProjectId);
              }
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Account Overview Cards */}
        <AccountOverviewCards
          credits={credits}
          totalCreditsUsed={totalCreditsUsed}
          maxCredits={maxCredits}
          creditsPercent={creditsPercent}
          plan={plan}
          planName={planConfig?.name || "Free"}
          projectCount={projects.length}
        />

        {/* API Usage Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-violet-500" />
              API Usage
            </h2>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger className="w-[200px] bg-white/5 border-gray-200 dark:border-white/10">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Usage Stats Cards */}
          {displayStats && <UsageStatsCards stats={displayStats} />}

          {/* Services Breakdown */}
          {displayStats && <ServicesBreakdown stats={displayStats} />}

          {/* Recent Activity */}
          {selectedProjectId !== "all" && (
            <RecentActivity
              logs={usageLogs}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}

          {/* Empty State */}
          {!loading && !displayStats && (
            <Card className="liquid-glass-card">
              <CardContent className="py-12">
                <div className="text-center text-gray-500 dark:text-slate-500">
                  <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No usage data yet.</p>
                  <p className="text-xs mt-1">
                    Start using proxy services to see stats here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
