"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UsageStats } from "./types";
import { getServiceColor } from "./types";

interface UsageTabProps {
  projectId: string;
}

export function UsageTab({ projectId }: UsageTabProps) {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const fetchUsage = useCallback(async () => {
    if (!projectId) return;
    setUsageLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/usage?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setUsageStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setUsageLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return (
    <div className="space-y-4">
      {usageStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="liquid-glass-card rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">Total API Calls</div>
            <div className="text-2xl font-bold text-white">{usageStats.totalCalls.toLocaleString()}</div>
          </div>
          <div className="liquid-glass-card rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">Credits Used</div>
            <div className="text-2xl font-bold text-white">{usageStats.totalCredits.toLocaleString()}</div>
          </div>
          {Object.entries(usageStats.byService)
            .sort((a, b) => b[1].calls - a[1].calls)
            .slice(0, 2)
            .map(([service, data]) => (
              <div key={service} className="liquid-glass-card rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-1 capitalize">{service}</div>
                <div className="text-2xl font-bold text-white">{data.calls.toLocaleString()}</div>
                <div className="text-xs text-slate-500">{data.credits} credits</div>
              </div>
            ))}
        </div>
      )}

      {usageStats && Object.keys(usageStats.byService).length > 0 && (
        <div className="liquid-glass-card rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Services Used</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(usageStats.byService).map(([service, data]) => (
              <div key={service} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium", getServiceColor(service))}>
                {service}: {data.calls} calls ({data.credits} credits)
              </div>
            ))}
          </div>
        </div>
      )}

      {usageLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}

      {!usageLoading && !usageStats && (
        <div className="liquid-glass-card rounded-xl p-12">
          <div className="text-center text-slate-500">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No usage data yet. Generate and use your app to see stats here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
