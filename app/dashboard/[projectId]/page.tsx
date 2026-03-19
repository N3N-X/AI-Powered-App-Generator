"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useProjectStore } from "@/stores/project-store";
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
      <div className="h-full flex items-center justify-center">
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
      <div className="h-full flex items-center justify-center">
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

  const { currentProject, setCurrentProject, isGenerating } = useProjectStore();
  const hasFullProject =
    currentProject?.id === projectId &&
    Object.keys(currentProject.codeFiles || {}).length > 0;
  const [isLoading, setIsLoading] = useState(!hasFullProject);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip if we already have the full project or are mid-generation
    if (hasFullProject) {
      setIsLoading(false);
      return;
    }
    if (isGenerating && currentProject?.id === projectId) return;

    let cancelled = false;
    setIsLoading(true);

    async function fetchProject() {
      try {
        setError(null);
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Project not found");
            setTimeout(() => router.push("/dashboard"), 2000);
            return;
          }
          throw new Error("Failed to fetch project");
        }
        const data = await res.json();
        if (!cancelled) {
          setCurrentProject(data.project);
        }
      } catch (err) {
        console.error("Failed to fetch project:", err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load project",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchProject();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

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

  if (currentProject.platform === "WEB") {
    return <WebWorkspace />;
  }

  return <MobileWorkspace />;
}
