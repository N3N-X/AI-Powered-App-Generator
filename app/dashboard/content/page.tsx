"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { Database, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { ContentProject } from "@/components/dashboard/content/types";
import { useProjectStore } from "@/stores/project-store";
import { useServiceDetection } from "./use-service-detection";
import { ProjectSelector } from "./project-selector";
import { TabNavigation } from "./tab-navigation";
import { TabPanels } from "./tab-panels";

export default function AppManagerPage() {
  const searchParams = useSearchParams();
  const preselectedProject = searchParams.get("project");
  const storeProjects = useProjectStore((s) => s.projects);

  const [projects, setProjects] = useState<ContentProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("database");

  const {
    availableTabs,
    detectingServices,
    proxyConfigs,
    projectPaymentPlatform,
    handleSaveProxyConfig,
  } = useServiceDetection({
    selectedProjectId,
    projects,
    activeTab,
    setActiveTab,
  });

  // Seed from store when available, fetch fresh otherwise
  useEffect(() => {
    if (storeProjects.length > 0) {
      setProjects(
        storeProjects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          platform: p.platform,
          codeFiles: p.codeFiles,
          appConfig: p.appConfig,
          githubRepo: p.githubRepo ?? null,
          githubUrl: p.githubUrl ?? null,
          createdAt:
            p.createdAt instanceof Date
              ? p.createdAt.toISOString()
              : String(p.createdAt),
        })),
      );
      if (preselectedProject) {
        setSelectedProjectId(preselectedProject);
      } else if (!selectedProjectId) {
        setSelectedProjectId(storeProjects[0].id);
      }
      setLoading(false);
    }
  }, [storeProjects, preselectedProject, selectedProjectId]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        if (preselectedProject) {
          setSelectedProjectId(preselectedProject);
        } else if (data.projects?.length > 0) {
          setSelectedProjectId(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  }, [preselectedProject]);

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return;
    const project = projects.find((p) => p.id === selectedProjectId);
    if (
      !confirm(
        `Delete "${project?.name || "this project"}"? This cannot be undone.`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Project deleted" });
        setSelectedProjectId("");
        fetchProjects();
      } else {
        toast({ title: "Failed to delete project", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to delete project", variant: "destructive" });
    }
  };

  const handleProjectUpdate = (updated: Partial<ContentProject>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === selectedProjectId ? { ...p, ...updated } : p)),
    );
  };

  const handleGitHubRepoLinked = (repo: string, url: string) => {
    handleProjectUpdate({ githubRepo: repo, githubUrl: url });
  };

  const handleGitHubRepoUnlinked = () => {
    handleProjectUpdate({ githubRepo: null, githubUrl: null });
  };

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="h-full p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">App Manager</h1>
          <p className="text-sm text-slate-400">
            Manage your app&apos;s data, users, and services
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="liquid-glass-card rounded-xl p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400 mb-4" />
              <p className="text-sm text-slate-400">Loading projects...</p>
            </div>
          </div>
        )}

        {!loading && (
          <>
            <ProjectSelector
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              onDeleteProject={handleDeleteProject}
            />

            {selectedProjectId && availableTabs.length > 0 ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabNavigation availableTabs={availableTabs} />
                <TabPanels
                  selectedProjectId={selectedProjectId}
                  currentProject={currentProject}
                  proxyConfigs={proxyConfigs}
                  projectPaymentPlatform={projectPaymentPlatform}
                  onSaveProxyConfig={handleSaveProxyConfig}
                  onProjectUpdate={handleProjectUpdate}
                  onDeleteProject={handleDeleteProject}
                  onGitHubRepoLinked={handleGitHubRepoLinked}
                  onGitHubRepoUnlinked={handleGitHubRepoUnlinked}
                />
              </Tabs>
            ) : selectedProjectId &&
              (detectingServices || availableTabs.length === 0) ? (
              <div className="liquid-glass-card rounded-xl p-12">
                {detectingServices ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-400 mb-4" />
                    <p className="text-sm text-slate-400">
                      Loading services...
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <h3 className="text-lg font-medium text-slate-200 mb-2">
                      No backend services used yet
                    </h3>
                    <p className="text-sm max-w-md mx-auto">
                      Generate your app to start seeing data here. Once your app
                      uses database, authentication, or other services,
                      you&apos;ll be able to manage everything from this
                      dashboard.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="liquid-glass-card rounded-xl p-12">
                <div className="text-center text-slate-400">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>Select a project to manage its services</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
