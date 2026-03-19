"use client";

import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SettingsAccountTabProps {
  user: {
    name?: string | null;
    email?: string | null;
    plan?: string | null;
    credits?: number | null;
    totalCreditsUsed?: number | null;
  } | null;
}

export function SettingsAccountTab({ user }: SettingsAccountTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          <User className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">
            {user?.name || user?.email}
          </h3>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <Badge
            variant={user?.plan === "ELITE" ? "premium" : "secondary"}
            className="mt-1"
          >
            {user?.plan || "FREE"} Plan
          </Badge>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-white">Usage</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-lg p-4">
            <p className="text-2xl font-bold text-white">
              {user?.credits?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-slate-400">Credits remaining</p>
          </div>
          <div className="glass rounded-lg p-4">
            <p className="text-2xl font-bold text-white">
              {user?.totalCreditsUsed?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-slate-400">Total credits used</p>
          </div>
        </div>
      </div>
    </div>
  );
}
