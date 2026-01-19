"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ChatInterface } from "@/components/dashboard/chat-interface";
import { CodeEditor } from "@/components/dashboard/code-editor";
import { PreviewPane } from "@/components/dashboard/preview-pane";
import { WelcomeScreen } from "@/components/dashboard/welcome-screen";
import { useProjectStore } from "@/stores/project-store";
import { useUserStore } from "@/stores/user-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user: clerkUser } = useUser();
  const { currentProject, setProjects } = useProjectStore();
  const { setUser, setConnectedServices } = useUserStore();
  const { showPreview, rightPanelWidth } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user data and projects
    async function fetchData() {
      try {
        // Fetch user data from database
        const userResponse = await fetch("/api/user");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
          setConnectedServices({
            github: userData.user.hasGitHub,
            customClaudeKey: userData.user.hasCustomClaudeKey,
          });
        }

        // Fetch projects
        const projectsResponse = await fetch("/api/projects");
        if (projectsResponse.ok) {
          const data = await projectsResponse.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (clerkUser) {
      fetchData();
    }
  }, [clerkUser, setProjects, setUser, setConnectedServices]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return <WelcomeScreen />;
  }

  return (
    <div className="h-full flex">
      {/* Chat Interface - Left side */}
      <div className="flex-1 min-w-[400px] border-r border-white/5">
        <ChatInterface />
      </div>

      {/* Code Editor - Right side */}
      <div
        className={cn("flex flex-col", showPreview ? "h-full" : "h-full")}
        style={{ width: rightPanelWidth }}
      >
        <div className={cn("flex-1 min-h-0", showPreview && "h-1/2")}>
          <CodeEditor />
        </div>

        {/* Preview Pane - Bottom right */}
        {showPreview && (
          <div className="h-1/2 border-t border-white/5">
            <PreviewPane />
          </div>
        )}
      </div>
    </div>
  );
}
