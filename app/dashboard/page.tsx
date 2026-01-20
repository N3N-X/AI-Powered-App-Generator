"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjectStore } from "@/stores/project-store";
import { useUserStore } from "@/stores/user-store";
import { useUIStore } from "@/stores/ui-store";
import {
  Plus,
  FolderOpen,
  Zap,
  BarChart3,
  Sparkles,
  Clock,
  Github,
  Smartphone,
  Globe,
} from "lucide-react";

export default function DashboardOverview() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { projects, setProjects, setCurrentProject } = useProjectStore();
  const { user, setUser, setConnectedServices } = useUserStore();
  const { openModal } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);

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

  // Recent projects (last 6)
  const recentProjects = projects
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 6);

  // Quick stats
  const totalProjects = projects.length;
  const plan = user?.plan || "FREE";

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-700 dark:text-slate-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-violet-400" />
            Overview
          </h1>
          <p className="text-gray-700 dark:text-slate-400">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
            Here&apos;s your dashboard overview.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-400">
                Total Projects
              </CardTitle>
              <FolderOpen className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalProjects}
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-400">
                {totalProjects === 0
                  ? "Start your first project"
                  : "Keep building!"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-400">
                Current Plan
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {plan}
                {plan === "FREE" && (
                  <Badge variant="secondary" className="text-xs">
                    Free
                  </Badge>
                )}
                {plan === "PRO" && (
                  <Badge variant="secondary" className="text-xs text-blue-400">
                    Pro
                  </Badge>
                )}
                {plan === "ELITE" && (
                  <Badge variant="secondary" className="text-xs text-amber-400">
                    Elite
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-400">
                {plan === "FREE"
                  ? "Upgrade for more features"
                  : "Enjoy your benefits!"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-400">
                Quick Actions
              </CardTitle>
              <Zap className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => openModal("new-project")}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  New Project
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/dashboard/projects">
                    <FolderOpen className="h-3 w-3 mr-2" />
                    View All Projects
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-400">
                Recent Activity
              </CardTitle>
              <Clock className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 dark:text-slate-400">
                {recentProjects.length > 0 ? (
                  <>
                    Last updated: {recentProjects[0].name}
                    <br />
                    <span className="text-xs">
                      {new Date(
                        recentProjects[0].updatedAt,
                      ).toLocaleDateString()}
                    </span>
                  </>
                ) : (
                  "No recent activity"
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              Recent Projects
            </h2>
            <Button
              variant="ghost"
              asChild
              className="text-gray-700 dark:text-slate-400 hover:text-black dark:hover:text-white"
            >
              <Link href="/dashboard/projects">
                View all <Sparkles className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          {recentProjects.length === 0 ? (
            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No projects yet
                </h3>
                <p className="text-gray-600 dark:text-slate-400 text-center mb-4">
                  Create your first AI-powered app and see the magic happen.
                </p>
                <Button
                  className="gap-2"
                  onClick={() => openModal("new-project")}
                >
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.map((project) => (
                <Card
                  key={project.id}
                  className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        `/api/projects/${project.id}`,
                      );
                      if (response.ok) {
                        const data = await response.json();
                        setCurrentProject(data.project);
                        router.push(`/dashboard/generate/${project.id}`);
                      }
                    } catch (error) {
                      console.error("Failed to load project:", error);
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-gray-900 dark:text-white text-lg truncate">
                      {project.name}
                    </CardTitle>
                    <p className="text-xs text-gray-500 dark:text-slate-500">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button className="w-full gap-2" variant="outline">
                      <FolderOpen className="h-4 w-4" />
                      Open Project
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Getting Started */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Getting Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-400" />
                  Create Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-slate-400 mb-4">
                  Start by creating your first project and describing what you
                  want to build.
                </p>
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => openModal("new-project")}
                >
                  <Plus className="h-4 w-4" />
                  Create New
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white text-lg flex items-center gap-2">
                  <Github className="h-5 w-5 text-blue-400" />
                  Connect GitHub
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-slate-400 mb-4">
                  Link your GitHub account to push your projects and
                  collaborate.
                </p>
                <Button className="w-full gap-2" variant="outline" asChild>
                  <Link href="/dashboard/settings?tab=github">
                    <Github className="h-4 w-4" />
                    Connect
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white text-lg flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-purple-400" />
                  Build Apps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-slate-400 mb-4">
                  Generate production-ready React Native apps and deploy them.
                </p>
                <Button className="w-full gap-2" variant="outline" asChild>
                  <Link href="/dashboard/usage">
                    <Globe className="h-4 w-4" />
                    Learn More
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
