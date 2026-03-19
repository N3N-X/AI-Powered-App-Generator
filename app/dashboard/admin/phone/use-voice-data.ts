"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserStore, useIsAdmin } from "@/stores/user-store";
import type { VoiceSettings, CallLog, CallStats, MessageLog, MessageStats } from "./types";

export function useVoiceData() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { user } = useUserStore();

  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [callStats, setCallStats] = useState<CallStats | null>(null);
  const [callPage, setCallPage] = useState(1);
  const [callTotalPages, setCallTotalPages] = useState(1);
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [msgStats, setMsgStats] = useState<MessageStats | null>(null);
  const [msgPage, setMsgPage] = useState(1);
  const [msgTotalPages, setMsgTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = useCallback(async (p: number) => {
    try {
      const res = await fetch(`/api/admin/voice/calls?page=${p}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls);
        setCallStats(data.stats);
        setCallTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error("fetchCalls failed:", err);
    }
  }, []);

  const fetchMessages = useCallback(async (p: number) => {
    try {
      const res = await fetch(`/api/admin/voice/messages?page=${p}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setMsgStats(data.stats);
        setMsgTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error("fetchMessages failed:", err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/admin/voice/settings");
    if (res.ok) setSettings(await res.json());
  }, []);

  useEffect(() => {
    if (user && !isAdmin) { router.push("/dashboard"); return; }
    if (user) {
      Promise.allSettled([fetchSettings(), fetchCalls(1), fetchMessages(1)])
        .finally(() => setIsLoading(false));
    }
  }, [user, isAdmin, router, fetchSettings, fetchCalls, fetchMessages]);

  const saveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/voice/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: settings.enabled,
          greeting_message: settings.greeting_message,
          pro_greeting_message: settings.pro_greeting_message,
          forwarding_number: settings.forwarding_number,
          system_prompt: settings.system_prompt,
          max_conversation_turns: settings.max_conversation_turns,
          sms_enabled: settings.sms_enabled,
          sms_auto_reply: settings.sms_auto_reply,
          sms_system_prompt: settings.sms_system_prompt,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSettings(await res.json());
    } catch {
      setError("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const syncFromTwilio = async () => {
    try {
      const res = await fetch("/api/admin/voice/sync", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Sync failed");
      }
      const data = await res.json();
      await Promise.allSettled([fetchCalls(1), fetchMessages(1)]);
      setError(null);
      console.log(`Synced ${data.syncedCalls} calls, ${data.syncedMessages} messages`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    }
  };

  const changeCallPage = (p: number) => { setCallPage(p); fetchCalls(p); };
  const changeMsgPage = (p: number) => { setMsgPage(p); fetchMessages(p); };

  return {
    settings, setSettings, isSaving, saveSettings,
    calls, callStats, callPage, callTotalPages, changeCallPage,
    messages, msgStats, msgPage, msgTotalPages, changeMsgPage,
    isLoading, error, setError,
    fetchCalls, syncFromTwilio,
  };
}
