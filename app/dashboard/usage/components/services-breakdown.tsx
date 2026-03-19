"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  Mail,
  MapPin,
  MessageSquare,
  Shield,
  HardDrive,
  Brain,
  CreditCard,
} from "lucide-react";
import { getServiceColor } from "@/components/dashboard/content/types";
import type { UsageStats } from "@/components/dashboard/content/types";

const SERVICE_ICONS: Record<string, typeof Database> = {
  db: Database,
  auth: Shield,
  email: Mail,
  storage: HardDrive,
  maps: MapPin,
  sms: MessageSquare,
  openai: Brain,
  payments: CreditCard,
};

interface ServicesBreakdownProps {
  stats: UsageStats;
}

export function ServicesBreakdown({ stats }: ServicesBreakdownProps) {
  if (Object.keys(stats.byService).length === 0) {
    return null;
  }

  return (
    <Card className="liquid-glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-gray-900 dark:text-white">
          Services Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(stats.byService)
            .sort((a, b) => b[1].calls - a[1].calls)
            .map(([service, data]) => {
              const Icon = SERVICE_ICONS[service] || Database;
              const percentage =
                stats.totalCalls > 0
                  ? Math.round((data.calls / stats.totalCalls) * 100)
                  : 0;
              return (
                <div key={service} className="flex items-center gap-4">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg ${getServiceColor(service)}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {service}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-slate-400">
                        {data.calls.toLocaleString()} calls
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                  <div className="text-right min-w-[60px]">
                    <span className="text-xs text-gray-500 dark:text-slate-500">
                      {data.credits} cr
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
