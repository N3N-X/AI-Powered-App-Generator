"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import dynamic from "next/dynamic";
import { useProjectStore } from "@/stores/project-store";
import { useUserStore } from "@/stores/user-store";
import { Loader2 } from "lucide-react";

// Dynamically import workspaces with SSR disabled
const MobileWorkspace = dynamic(
  () =>
    import("@/components/dashboard/mobile-workspace").then(
      (mod) => mod.MobileWorkspace,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading workspace...</p>
        </div>
      </div>
    ),
  },
);

const WebWorkspace = dynamic(
  () =>
    import("@/components/dashboard/web-workspace").then(
      (mod) => mod.WebWorkspace,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading workspace...</p>
        </div>
      </div>
    ),
  },
);

export default function ProjectWorkspace() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const { user: authUser, loading: authLoading } = useAuth();
  const { currentProject, setCurrentProject, setProjects } = useProjectStore();
  const { setUser, setConnectedServices } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!authUser || authLoading) return;

      try {
        setIsLoading(true);
        setError(null);

        const userResponse = await fetch("/api/user");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
          setConnectedServices({
            github: userData.user.hasGitHub,
            customApiKey: userData.user.hasCustomApiKey,
          });
        }

        const projectsResponse = await fetch("/api/projects");
        if (projectsResponse.ok) {
          const data = await projectsResponse.json();
          setProjects(data.projects || []);

          const project = data.projects.find(
            (p: { id: string }) => p.id === projectId,
          );
          if (project) {
            setCurrentProject(project);
          } else {
            setError("Project not found");
            setTimeout(() => router.push("/dashboard"), 2000);
          }
        } else {
          throw new Error("Failed to fetch projects");
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [
    authUser,
    authLoading,
    projectId,
    setProjects,
    setCurrentProject,
    setUser,
    setConnectedServices,
    router,
  ]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-white">
            {error || "Project not found"}
          </h2>
          <p className="text-sm text-slate-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Use WebWorkspace for WEB projects
  if (currentProject.platform === "WEB") {
    return <WebWorkspace />;
  }

  // Use MobileWorkspace for iOS/Android projects (same layout as Web, with Snack preview)
  return <MobileWorkspace />;
}
