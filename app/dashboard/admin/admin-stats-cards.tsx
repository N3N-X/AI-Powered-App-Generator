import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  DollarSign,
  FolderOpen,
  Zap,
  FileText,
} from "lucide-react";
import type { AdminStats } from "./types";

interface AdminStatsCardsProps {
  stats: AdminStats;
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="liquid-glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
            Total Users
          </CardTitle>
          <Users className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.users.total.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats.users.byPlan.pro + stats.users.byPlan.elite} paid users
          </p>
        </CardContent>
      </Card>

      <Card className="liquid-glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
            Monthly Revenue
          </CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${stats.revenue.monthlyEstimate.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            From {stats.users.byPlan.pro + stats.users.byPlan.elite}{" "}
            subscriptions
          </p>
        </CardContent>
      </Card>

      <Card className="liquid-glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
            Total Projects
          </CardTitle>
          <FolderOpen className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.projects.total.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {(stats.projects.total / (stats.users.total || 1)).toFixed(1)}{" "}
            per user avg
          </p>
        </CardContent>
      </Card>

      <Card className="liquid-glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
            Credits Used
          </CardTitle>
          <Zap className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.credits.totalUsed.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats.credits.avgPerUser.toLocaleString()} avg per user
          </p>
        </CardContent>
      </Card>

      <Card className="liquid-glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
            Blog Posts
          </CardTitle>
          <FileText className="h-4 w-4 text-violet-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.blog?.total || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats.blog?.published || 0} published
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
