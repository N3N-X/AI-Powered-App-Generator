"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { sidebarOpen, sidebarWidth } = useUIStore();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Top bar */}
      <Topbar />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out",
            sidebarOpen ? "opacity-100" : "opacity-0 w-0"
          )}
          style={{ width: sidebarOpen ? sidebarWidth : 0 }}
        >
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
