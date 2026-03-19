"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UsageLog, Pagination } from "./types";
import { formatDate, getServiceColor } from "./types";

interface LogsTabProps {
  projectId: string;
}

export function LogsTab({ projectId }: LogsTabProps) {
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [usageLogsPagination, setUsageLogsPagination] = useState<Pagination>({
    page: 1, limit: 50, total: 0, totalPages: 0,
  });
  const [usageServiceFilter, setUsageServiceFilter] = useState<string>("all");
  const [usageLoading, setUsageLoading] = useState(false);

  const fetchUsage = useCallback(
    async (page = 1) => {
      if (!projectId) return;
      setUsageLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "50" });
        if (usageServiceFilter && usageServiceFilter !== "all") params.set("service", usageServiceFilter);
        const res = await fetch(`/api/projects/${projectId}/usage?${params}`);
        if (res.ok) {
          const data = await res.json();
          setUsageLogs(data.logs || []);
          setUsageLogsPagination(data.pagination);
        }
      } catch (error) {
        console.error("Failed to fetch usage:", error);
      } finally {
        setUsageLoading(false);
      }
    },
    [projectId, usageServiceFilter],
  );

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return (
    <div className="liquid-glass-card rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <Select value={usageServiceFilter} onValueChange={setUsageServiceFilter}>
          <SelectTrigger className="w-[160px] h-8 text-sm bg-white/5 border-white/10">
            <SelectValue placeholder="All services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All services</SelectItem>
            <SelectItem value="db">Database</SelectItem>
            <SelectItem value="auth">Auth</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="storage">Storage</SelectItem>
            <SelectItem value="payments">Payments</SelectItem>
            <SelectItem value="openai">AI</SelectItem>
            <SelectItem value="maps">Maps</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => fetchUsage(usageLogsPagination.page)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-320px)] md:h-[500px]">
        {usageLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : usageLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Activity className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">No log entries yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-500 uppercase">
                  <th className="text-left p-3 font-medium">Service</th>
                  <th className="text-left p-3 font-medium">Operation</th>
                  <th className="text-left p-3 font-medium">Credits</th>
                  <th className="text-left p-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usageLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getServiceColor(log.service))}>{log.service}</span>
                    </td>
                    <td className="p-3 text-sm text-slate-300 font-mono">{log.operation}</td>
                    <td className="p-3 text-sm text-slate-400">{log.creditsUsed}</td>
                    <td className="p-3 text-xs text-slate-500">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ScrollArea>

      {usageLogsPagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-white/10">
          <span className="text-xs text-slate-500">{usageLogsPagination.total} entries</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7" disabled={usageLogsPagination.page <= 1} onClick={() => fetchUsage(usageLogsPagination.page - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-slate-400">{usageLogsPagination.page} / {usageLogsPagination.totalPages}</span>
            <Button variant="outline" size="sm" className="h-7" disabled={usageLogsPagination.page >= usageLogsPagination.totalPages} onClick={() => fetchUsage(usageLogsPagination.page + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
