"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Save, Loader2 } from "lucide-react";

interface NotificationsSectionProps {
  email: string;
  onEmailChange: (value: string) => void;
  saving: boolean;
  onSave: () => void;
}

export function NotificationsSection({
  email,
  onEmailChange,
  saving,
  onSave,
}: NotificationsSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-200 border-b border-white/10 pb-2 flex items-center gap-2">
        <Bell className="h-4 w-4" />
        Notifications
      </h4>
      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">
          Notification Email
        </label>
        <div className="flex items-center gap-2">
          <Input
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Email for app notifications"
            className="h-9 text-sm bg-white/5 border-white/10 max-w-xs"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save
          </Button>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Where to receive app notifications (bookings, orders, etc.). Defaults
          to your account email.
        </p>
      </div>
    </div>
  );
}
