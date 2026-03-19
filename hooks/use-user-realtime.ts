"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/stores/user-store";

type UserRow = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  plan: string | null;
  role: string | null;
  credits: number | null;
  total_credits_used: number | null;
  last_credit_reset: string | null;
  github_token_encrypted?: string | null;
  claude_key_encrypted?: string | null;
};

export function useUserRealtime(userId?: string | null) {
  const updateUser = useUserStore((state) => state.updateUser);
  const setConnectedServices = useUserStore(
    (state) => state.setConnectedServices,
  );

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`user-updates:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as UserRow | undefined;
          if (!next) return;
          updateUser({
            email: next.email || "",
            name: next.name || null,
            avatarUrl: next.avatar_url || null,
            plan: (next.plan || "FREE") as "FREE" | "PRO" | "ELITE",
            role: (next.role || "USER") as "USER" | "ADMIN",
            credits: next.credits ?? 0,
            totalCreditsUsed: next.total_credits_used ?? 0,
            lastCreditReset: next.last_credit_reset
              ? new Date(next.last_credit_reset)
              : null,
          });
          setConnectedServices({
            github: !!next.github_token_encrypted,
            customApiKey: !!next.claude_key_encrypted,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
