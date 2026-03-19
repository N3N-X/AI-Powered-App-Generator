"use client";

import { useUserStore } from "@/stores/user-store";
import { GitHubCard } from "./integrations/github-card";
import { ClaudeKeyCard } from "./integrations/claude-key-card";
import { StoreCredentials } from "./integrations/store-credentials";

export function IntegrationsTab() {
  const { user } = useUserStore();

  return (
    <div className="space-y-6">
      <GitHubCard />
      {user?.plan === "ELITE" && <ClaudeKeyCard />}
      <StoreCredentials />
    </div>
  );
}
