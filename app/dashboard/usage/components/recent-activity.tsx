"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Database,
  Mail,
  MapPin,
  MessageSquare,
  Shield,
  HardDrive,
  Brain,
  CreditCard,
  Clock,
} from "lucide-react";
import {
  getServiceColor,
  formatDate,
} from "@/components/dashboard/content/types";
import type { UsageLog, Pagination } from "@/components/dashboard/content/types";

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

interface RecentActivityProps {
  logs: UsageLog[];
  pagination: Pagination | null;
  onPageChange: (page: number) => void;
}

export function RecentActivity({
  logs,
  pagination,
  onPageChange,
}: RecentActivityProps) {
  if (logs.length === 0) {
    return null;
  }

  return (
    <Card className="liquid-glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {logs.map((log) => {
            const Icon = SERVICE_ICONS[log.service] || Database;
            return (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-lg ${getServiceColor(log.service)}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.operation}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 capitalize">
                      {log.service}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {log.creditsUsed} credits
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-500">
                    {formatDate(log.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <p className="text-xs text-gray-500 dark:text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
