"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserStore, useIsAdmin } from "@/stores/user-store";
import {
  Users,
  CreditCard,
  FolderOpen,
  Zap,
  DollarSign,
  Loader2,
  Shield,
  Clock,
  Smartphone,
  Settings,
  Activity,
  Database,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface AdminStats {
  users: {
    total: number;
    byPlan: {
      free: number;
      pro: number;
      elite: number;
    };
  };
  projects: {
    total: number;
  };
  builds: {
    total: number;
    byStatus: Record<string, number>;
  };
  credits: {
    totalUsed: number;
    totalRemaining: number;
    avgPerUser: number;
  };
  revenue: {
    monthlyEstimate: number;
  };
  recentSignups: Array<{
    id: string;
    email: string;
    name: string | null;
    plan: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { user } = useUserStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);

  useEffect(() => {
    // Redirect non-admins
    if (user && !isAdmin) {
      router.push("/dashboard");
      return;
    }

    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/stats");
        if (!response.ok) {
          if (response.status === 403) {
            router.push("/dashboard");
            return;
          }
          throw new Error("Failed to fetch stats");
        }
        const data = await response.json();
        setStats(data);

        // Check maintenance mode status from environment (you'd need an API endpoint for this)
        setMaintenanceMode(data.maintenanceMode || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchStats();
    }
  }, [user, isAdmin, router]);

  const toggleMaintenanceMode = async () => {
    setIsTogglingMaintenance(true);
    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !maintenanceMode }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle maintenance mode");
      }

      setMaintenanceMode(!maintenanceMode);
    } catch (error) {
      console.error("Failed to toggle maintenance mode:", error);
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Access Denied
          </h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="h-full overflow-auto bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-violet-500" />
              Admin Dashboard
            </h1>
            <p className="text-slate-400">Platform overview and management</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/admin/users">Manage Users</Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.users.total.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.users.byPlan.pro + stats.users.byPlan.elite} paid users
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${stats.revenue.monthlyEstimate.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                From {stats.users.byPlan.pro + stats.users.byPlan.elite}{" "}
                subscriptions
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Total Projects
              </CardTitle>
              <FolderOpen className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.projects.total.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {(stats.projects.total / stats.users.total).toFixed(1)} per user
                avg
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Credits Used
              </CardTitle>
              <Zap className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.credits.totalUsed.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.credits.avgPerUser.toLocaleString()} avg per user
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Settings */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>Platform-wide configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${maintenanceMode ? "bg-red-500/20" : "bg-green-500/20"} flex items-center justify-center`}
                >
                  <Activity
                    className={`h-5 w-5 ${maintenanceMode ? "text-red-400" : "text-green-400"}`}
                  />
                </div>
                <div>
                  <p className="text-white font-medium">Maintenance Mode</p>
                  <p className="text-sm text-slate-400">
                    {maintenanceMode
                      ? "Site is currently in maintenance mode (admins only)"
                      : "Site is operational"}
                  </p>
                </div>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={toggleMaintenanceMode}
                disabled={isTogglingMaintenance}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <Database className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Database</p>
                  <p className="text-sm text-slate-400">
                    {stats.users.total} users, {stats.projects.total} projects
                  </p>
                </div>
              </div>
              <Badge variant="success">Connected</Badge>
            </div>
          </CardContent>
        </Card>

        {/* User Distribution & Builds */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass border-white/10">
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
                  <span className="text-white">{stats.users.byPlan.free}</span>
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
                  <span className="text-white">{stats.users.byPlan.pro}</span>
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
                  <span className="text-white">{stats.users.byPlan.elite}</span>
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

          <Card className="glass border-white/10">
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
                    <span className="text-white">{count}</span>
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

        {/* Recent Signups */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Signups
            </CardTitle>
            <CardDescription>Latest users to join the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentSignups.map((signup) => (
                <div
                  key={signup.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center">
                      <span className="text-violet-400 font-medium">
                        {signup.name?.[0] || signup.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {signup.name || "No name"}
                      </p>
                      <p className="text-sm text-slate-400">{signup.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        signup.plan === "ELITE"
                          ? "premium"
                          : signup.plan === "PRO"
                            ? "success"
                            : "secondary"
                      }
                    >
                      {signup.plan}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {new Date(signup.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
