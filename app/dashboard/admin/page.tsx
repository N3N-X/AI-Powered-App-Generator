"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUserStore, useIsAdmin } from "@/stores/user-store";
import { Loader2, Shield, FileText, Phone, Ticket } from "lucide-react";
import type { AdminStats } from "./types";
import { AdminStatsCards } from "./admin-stats-cards";
import { AdminQuickActions } from "./admin-quick-actions";
import { AdminSystemSettings } from "./admin-system-settings";
import { AdminDistributionCards } from "./admin-distribution-cards";
import { AdminRecentSignups } from "./admin-recent-signups";

export default function AdminDashboard() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { isLoaded } = useUserStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isAdmin) {
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
        setMaintenanceMode(data.maintenanceMode || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [isLoaded, isAdmin, router]);

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
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-violet-500" />
              Admin Dashboard
            </h1>
            <p className="text-gray-500 dark:text-slate-400">
              Platform overview and management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard/admin/invites">
                <Ticket className="h-4 w-4 mr-2" />
                Invites
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/admin/phone">
                <Phone className="h-4 w-4 mr-2" />
                Voice Agent
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/admin/blog">
                <FileText className="h-4 w-4 mr-2" />
                Manage Blog
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/admin/users">Manage Users</Link>
            </Button>
          </div>
        </div>

        <AdminStatsCards stats={stats} />
        <AdminQuickActions />
        <AdminSystemSettings
          stats={stats}
          maintenanceMode={maintenanceMode}
          isTogglingMaintenance={isTogglingMaintenance}
          onToggleMaintenance={toggleMaintenanceMode}
        />
        <AdminDistributionCards stats={stats} />
        <AdminRecentSignups recentSignups={stats.recentSignups} />
      </div>
    </div>
  );
}
