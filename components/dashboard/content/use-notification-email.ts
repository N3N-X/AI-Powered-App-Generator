"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export function useNotificationEmail(projectId: string) {
  const [notificationEmail, setNotificationEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchEmail = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/proxy-config`);
      if (res.ok) {
        const data = await res.json();
        setNotificationEmail(
          data.configs?.notifications?.notificationEmail || "",
        );
      }
    } catch {
      /* ignore */
    }
  }, [projectId]);

  useEffect(() => {
    fetchEmail();
  }, [fetchEmail]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/proxy-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "notifications",
          config: { notificationEmail: notificationEmail.trim() },
        }),
      });
      if (res.ok) toast({ title: "Notification email saved" });
      else toast({ title: "Failed to save", variant: "destructive" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return { notificationEmail, setNotificationEmail, saving, handleSave };
}
