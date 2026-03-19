"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell } from "lucide-react";

export function NotificationsTab() {
  const [notifications, setNotifications] = useState({
    email: true,
    builds: true,
    marketing: false,
  });

  return (
    <div className="space-y-6">
      <Card className="liquid-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Choose what emails you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Build notifications</p>
              <p className="text-sm text-slate-400">Get notified when builds complete</p>
            </div>
            <Switch
              checked={notifications.builds}
              onCheckedChange={(checked) => setNotifications({ ...notifications, builds: checked })}
            />
          </div>
          <Separator className="bg-white/10" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Product updates</p>
              <p className="text-sm text-slate-400">New features and improvements</p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
            />
          </div>
          <Separator className="bg-white/10" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Marketing emails</p>
              <p className="text-sm text-slate-400">Tips, offers, and promotions</p>
            </div>
            <Switch
              checked={notifications.marketing}
              onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
