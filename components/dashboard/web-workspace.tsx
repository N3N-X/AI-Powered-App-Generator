"use client";

import { Sparkles } from "lucide-react";
import { useWorkspaceState } from "./workspace/use-workspace-state";
import { getQuickPrompts } from "./workspace/quick-prompts";
import { AdvancedLayout } from "./workspace/advanced-layout";
import { MobileLayout } from "./workspace/mobile-layout";
import { SimpleLayout } from "./workspace/simple-layout";

interface WebWorkspaceProps {
  className?: string;
}

export function WebWorkspace({ className }: WebWorkspaceProps) {
  const ws = useWorkspaceState();

  const hasGeneratedCode = ws.hasGeneratedCode;
  const quickPrompts = getQuickPrompts(
    ws.currentProject?.platform,
    hasGeneratedCode,
  );
  const promptsLabel = hasGeneratedCode ? "Add features" : "Example ideas";

  if (!ws.currentProject) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-slate-400">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No project selected</p>
        </div>
      </div>
    );
  }

  // Advanced mode (desktop only)
  if (ws.workspaceMode === "advanced" && !ws.isMobile) {
    return (
      <AdvancedLayout
        ws={ws}
        quickPrompts={quickPrompts}
        promptsLabel={promptsLabel}
        className={className}
      />
    );
  }

  // Mobile layout
  if (ws.isMobile) {
    return (
      <MobileLayout
        ws={ws}
        quickPrompts={quickPrompts}
        promptsLabel={promptsLabel}
        className={className}
      />
    );
  }

  // Simple mode (default desktop)
  return (
    <SimpleLayout
      ws={ws}
      quickPrompts={quickPrompts}
      promptsLabel={promptsLabel}
      className={className}
    />
  );
}
