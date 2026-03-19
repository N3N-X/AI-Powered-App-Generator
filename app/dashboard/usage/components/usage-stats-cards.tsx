"use client";

import { Card, CardContent } from "@/components/ui/card";
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

interface UsageStatsCardsProps {
  stats: UsageStats;
}

export function UsageStatsCards({ stats }: UsageStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="liquid-glass-card">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Total API Calls
            </span>
            <Database className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalCalls.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card className="liquid-glass-card">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Credits Consumed
            </span>
            <CreditCard className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalCredits.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {Object.entries(stats.byService)
        .sort((a, b) => b[1].calls - a[1].calls)
        .slice(0, 2)
        .map(([service, data]) => {
          const Icon = SERVICE_ICONS[service] || Database;
          return (
            <Card key={service} className="liquid-glass-card">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-slate-400 capitalize">
                    {service}
                  </span>
                  <Icon className="h-4 w-4 text-violet-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.calls.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                  {data.credits} credits
                </p>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}
