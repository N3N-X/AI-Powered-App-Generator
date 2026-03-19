"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Clock, FolderOpen } from "lucide-react";
import { useProjectStore } from "@/stores/project-store";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecentProjects() {
  const router = useRouter();
  const { projects, setCurrentProject } = useProjectStore();

  if (projects.length === 0) return null;

  const handleOpenProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      router.push(`/dashboard/${projectId}`);
    }
  };

  return (
    <div className="shrink-0 px-4 sm:px-6 lg:px-8 pb-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Recent Projects
            </span>
          </div>
          {projects.length > 4 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/content")}
              className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white h-auto py-0 px-0"
            >
              View all
            </Button>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {projects.slice(0, 5).map((project) => (
            <button
              key={project.id}
              onClick={() => handleOpenProject(project.id)}
              className="group liquid-glass-pill liquid-glass-hover liquid-shadow px-4 py-3 flex items-center gap-3 shrink-0 min-w-[200px] transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow duration-300">
                <FolderOpen className="w-4 h-4 text-white" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors duration-200">
                  {project.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-500">
                  {Object.keys(project.codeFiles || {}).length} files
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
