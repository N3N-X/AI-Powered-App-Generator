import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone } from "lucide-react";
import type { AdminStats } from "./types";

interface AdminDistributionCardsProps {
  stats: AdminStats;
}

export function AdminDistributionCards({ stats }: AdminDistributionCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="liquid-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Users by Plan
          </CardTitle>
          <CardDescription>Distribution of user plans</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Free</Badge>
              <span className="text-gray-900 dark:text-white">
                {stats.users.byPlan.free}
              </span>
            </div>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-500"
                style={{
                  width: `${(stats.users.byPlan.free / stats.users.total) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="success">Pro</Badge>
              <span className="text-gray-900 dark:text-white">
                {stats.users.byPlan.pro}
              </span>
            </div>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500"
                style={{
                  width: `${(stats.users.byPlan.pro / stats.users.total) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="premium">Elite</Badge>
              <span className="text-gray-900 dark:text-white">
                {stats.users.byPlan.elite}
              </span>
            </div>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500"
                style={{
                  width: `${(stats.users.byPlan.elite / stats.users.total) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="liquid-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Build Statistics
          </CardTitle>
          <CardDescription>
            Total builds: {stats.builds.total}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(stats.builds.byStatus).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    status === "success"
                      ? "success"
                      : status === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {status}
                </Badge>
                <span className="text-gray-900 dark:text-white">
                  {count}
                </span>
              </div>
              <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    status === "success"
                      ? "bg-green-500"
                      : status === "failed"
                        ? "bg-red-500"
                        : "bg-slate-500"
                  }`}
                  style={{
                    width: `${(count / stats.builds.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
          {Object.keys(stats.builds.byStatus).length === 0 && (
            <p className="text-slate-500 text-sm">No builds yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
