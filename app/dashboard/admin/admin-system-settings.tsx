"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Activity, Database } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { AdminStats } from "./types";

interface AdminSystemSettingsProps {
  stats: AdminStats;
  maintenanceMode: boolean;
  isTogglingMaintenance: boolean;
  onToggleMaintenance: () => void;
}

export function AdminSystemSettings({
  stats,
  maintenanceMode,
  isTogglingMaintenance,
  onToggleMaintenance,
}: AdminSystemSettingsProps) {
  return (
    <Card className="liquid-glass-card">
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
              <p className="text-gray-900 dark:text-white font-medium">
                Maintenance Mode
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {maintenanceMode
                  ? "Site is currently in maintenance mode (admins only)"
                  : "Site is operational"}
              </p>
            </div>
          </div>
          <Switch
            checked={maintenanceMode}
            onCheckedChange={onToggleMaintenance}
            disabled={isTogglingMaintenance}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
              <Database className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-medium">
                Database
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {stats.users.total} users, {stats.projects.total} projects
              </p>
            </div>
          </div>
          <Badge variant="success">Connected</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
