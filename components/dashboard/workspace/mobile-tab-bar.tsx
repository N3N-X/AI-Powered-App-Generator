"use client";

import { MessageSquare, Eye, Code2, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MobileSimpleTab } from "./mobile-utils";

interface MobileTabBarProps {
  activeTab: MobileSimpleTab;
  setActiveTab: (tab: MobileSimpleTab) => void;
  onManageClick: () => void;
}

const TABS = [
  { id: "chat" as const, icon: MessageSquare, label: "Chat" },
  { id: "preview" as const, icon: Eye, label: "Preview" },
  { id: "code" as const, icon: Code2, label: "Code" },
  { id: "manage" as const, icon: Database, label: "Manage" },
] as const;

export function MobileTabBar({ activeTab, setActiveTab, onManageClick }: MobileTabBarProps) {
  return (
    <div className="shrink-0 px-3 pb-3 pt-1.5 flex items-center justify-center gap-2">
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === "manage") {
                onManageClick();
              } else {
                setActiveTab(tab.id as MobileSimpleTab);
              }
            }}
            className={cn(
              "liquid-glass-pill liquid-shadow flex items-center gap-1.5 px-4 py-2 h-10 transition-all duration-300 text-sm font-medium",
              isActive
                ? "liquid-glass-hover text-violet-400 border-violet-500/20"
                : "text-slate-400 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
