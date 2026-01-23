"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProjectStore } from "@/stores/project-store";
import { useUserStore } from "@/stores/user-store";
import {
  Sparkles,
  FolderOpen,
  ArrowRight,
  Loader2,
  Plus,
  Clock,
  Globe,
  Smartphone,
  Apple,
} from "lucide-react";
import { Platform } from "@/types";
import { toast } from "@/hooks/use-toast";

export default function GenerateStartPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const { projects, setProjects, setCurrentProject } = useProjectStore();
  const { setUser, setConnectedServices } = useUserStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [platform, setPlatform] = useState<Platform>("WEB");

  useEffect(() => {
    async function fetchData() {
      if (!authUser || authLoading) return;

      try {
        // Fetch user data
        const userResponse = await fetch("/api/user");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
          setConnectedServices({
            github: userData.user.hasGitHub,
            customApiKey: userData.user.hasCustomApiKey,
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

    fetchData();
  }, [authUser, authLoading, setProjects, setUser, setConnectedServices]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a name for your project",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          description: `AI-generated project: ${projectName.trim()}`,
          platform,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const data = await response.json();

      // Update projects list
      setProjects([data.project, ...projects]);
      setCurrentProject(data.project);

      toast({
        title: "Project created",
        description: `${projectName} is ready to build. API key created automatically.`,
      });

      // Navigate to the new project
      router.push(`/dashboard/generate/${data.project.id}`);
    } catch (error) {
      console.error("Create project error:", error);
      toast({
        title: "Failed to create project",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      router.push(`/dashboard/generate/${projectId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-sm text-gray-700 dark:text-slate-400">
            Loading projects...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/25 mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Create Your App with AI
          </h1>
          <p className="text-lg text-gray-700 dark:text-slate-400 max-w-2xl mx-auto">
            Start a new project or continue working on an existing one. Just
            describe what you want to build and watch RUX bring it to life.
          </p>
        </div>

        {/* Create New Project Card */}
        <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Plus className="w-5 h-5" />
              Start New Project
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-slate-400">
              Give your project a name and start building with AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="My Awesome App"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={isCreating}
                  className="text-base"
                  autoFocus
                />
              </div>

              {/* Platform Selection */}
              <div className="space-y-3">
                <Label>Target Platform</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: "WEB" as Platform,
                      label: "Web",
                      icon: Globe,
                      desc: "React web app",
                    },
                    {
                      value: "IOS" as Platform,
                      label: "iOS",
                      icon: Apple,
                      desc: "iPhone & iPad",
                    },
                    {
                      value: "ANDROID" as Platform,
                      label: "Android",
                      icon: Smartphone,
                      desc: "Android devices",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPlatform(opt.value)}
                      disabled={isCreating}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        platform === opt.value
                          ? "border-violet-500 bg-violet-500/10 dark:bg-violet-500/20"
                          : "border-gray-200/50 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-white/50 dark:bg-white/5"
                      }`}
                    >
                      <opt.icon
                        className={`w-6 h-6 ${platform === opt.value ? "text-violet-500" : "text-gray-500 dark:text-slate-400"}`}
                      />
                      <span
                        className={`text-sm font-medium ${platform === opt.value ? "text-violet-600 dark:text-violet-400" : "text-gray-700 dark:text-white"}`}
                      >
                        {opt.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-500">
                        {opt.desc}
                      </span>
                      {platform === opt.value && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-500" />
                      )}
                    </button>
                  ))}
                </div>
                {platform !== "WEB" && (
                  <p className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1.5 mt-2">
                    <Smartphone className="w-3.5 h-3.5" />
                    {platform === "IOS"
                      ? "Requires Expo Go app on your iPhone/iPad to preview"
                      : "Requires Expo Go app on your Android device to preview"}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isCreating || !projectName.trim()}
                className="w-full gap-2"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Create Project
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        {projects.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-700 dark:text-slate-400" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Recent Projects
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((project) => (
                <Card
                  key={project.id}
                  className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
                  onClick={() => handleOpenProject(project.id)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 shrink-0">
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate text-gray-900 dark:text-white">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-600 dark:text-slate-400">
                          {Object.keys(project.codeFiles || {}).length} files
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                      <span>
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {projects.length > 6 && (
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/projects")}
                className="w-full"
              >
                View All Projects ({projects.length})
              </Button>
            )}
          </div>
        )}

        {/* Empty State */}
        {projects.length === 0 && (
          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 border-dashed">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto">
                  <FolderOpen className="w-8 h-8 text-gray-400 dark:text-slate-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No projects yet
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Create your first project to start building with AI
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
