"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
// Link import removed - not used directly
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Badge import removed - not used directly
import { useProjectStore } from "@/stores/project-store";
import { useUserStore } from "@/stores/user-store";
import { useUIStore } from "@/stores/ui-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  FolderOpen,
  Search,
  MoreVertical,
  ExternalLink,
  Trash2,
  Globe,
  Smartphone,
  Apple,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ProjectsPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { projects, setProjects, setCurrentProject } = useProjectStore();
  const { setUser, setConnectedServices } = useUserStore();
  const { openModal } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"updated" | "created" | "name">(
    "updated",
  );

  useEffect(() => {
    async function fetchData() {
      try {
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

  const handleOpenProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentProject(data.project);
        router.push(`/dashboard/generate/${projectId}`);
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    }
  };

  const handleDeleteProject = async (
    projectId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      // Remove from local state
      setProjects(projects.filter((p) => p.id !== projectId));

      toast({
        title: "Project deleted",
        description: "The project has been permanently deleted",
      });
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "IOS":
        return <Apple className="h-3.5 w-3.5" />;
      case "ANDROID":
        return <Smartphone className="h-3.5 w-3.5" />;
      default:
        return <Globe className="h-3.5 w-3.5" />;
    }
  };

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case "IOS":
        return "iOS";
      case "ANDROID":
        return "Android";
      default:
        return "Web";
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "created":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "updated":
      default:
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    }
  });

  const filteredProjects = sortedProjects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-700 dark:text-slate-400">
            Loading your projects...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-[#0a0a0f]">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Projects
            </h1>
            <p className="text-gray-700 dark:text-slate-400">
              {projects.length} projects •{" "}
              {projects.length === 1
                ? "1 project"
                : `${projects.length} projects`}{" "}
              total
            </p>
          </div>
          <Button onClick={() => openModal("new-project")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Controls */}
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? "No projects found" : "No projects yet"}
              </h3>
              <p className="text-gray-600 dark:text-slate-400 text-center max-w-sm mb-6">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first project to start building amazing apps with AI"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => openModal("new-project")}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200 cursor-pointer group"
                onClick={() => handleOpenProject(project.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-violet-500/20">
                        <FolderOpen className="h-5 w-5 text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base text-gray-900 dark:text-white truncate">
                          {project.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-400">
                            {getPlatformIcon(project.platform || "WEB")}
                            {getPlatformLabel(project.platform || "WEB")}
                          </span>
                          <CardDescription className="text-gray-500 dark:text-slate-500 text-xs">
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0"
                          disabled={deletingId === project.id}
                        >
                          {deletingId === project.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProject(project.id);
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {/* Create new project card */}
            <Card
              className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 border-dashed hover:border-violet-500/30 transition-all duration-200 cursor-pointer flex items-center justify-center min-h-[160px]"
              onClick={() => openModal("new-project")}
            >
              <div className="text-center">
                <div className="p-3 rounded-full bg-white/10 dark:bg-white/5 inline-flex mb-3">
                  <Plus className="h-6 w-6 text-gray-600 dark:text-slate-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Create new project
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
