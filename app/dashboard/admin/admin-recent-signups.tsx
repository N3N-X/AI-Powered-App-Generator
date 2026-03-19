import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import type { AdminStats } from "./types";

interface AdminRecentSignupsProps {
  recentSignups: AdminStats["recentSignups"];
}

export function AdminRecentSignups({ recentSignups }: AdminRecentSignupsProps) {
  return (
    <Card className="liquid-glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Signups
        </CardTitle>
        <CardDescription>Latest users to join the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentSignups.map((signup) => (
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
                  <p className="text-gray-900 dark:text-white font-medium">
                    {signup.name || "No name"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {signup.email}
                  </p>
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
  );
}
