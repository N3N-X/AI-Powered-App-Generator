"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useProjectStore } from "@/stores/project-store";
import { useUserStore } from "@/stores/user-store";
import {
  Hammer,
  Smartphone,
  Apple,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface Build {
  id: string;
  platform: "ANDROID" | "IOS";
  status:
    | "PENDING"
    | "QUEUED"
    | "BUILDING"
    | "SUCCESS"
    | "FAILED"
    | "CANCELLED";
  buildProfile: string;
  version: string | null;
  buildNumber: number | null;
  artifactUrl: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  project: {
    id: string;
    name: string;
  };
}

export default function BuildsPage() {
  const { projects, currentProject } = useProjectStore();
  const { user } = useUserStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingBuild, setStartingBuild] = useState(false);

  const fetchBuilds = async () => {
    setLoading(true);
    try {
      const url =
        selectedProjectId === "all"
          ? "/api/builds"
          : `/api/builds?projectId=${selectedProjectId}`;
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        setBuilds(result.builds || []);
      }
    } catch (err) {
      console.error("Failed to fetch builds:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const startBuild = async (platform: "ANDROID" | "IOS") => {
    if (!currentProject) {
      toast({
        title: "No project selected",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }

    if (user?.plan === "FREE") {
      toast({
        title: "Upgrade required",
        description: "Builds require a Pro or Elite plan",
        variant: "destructive",
      });
      return;
    }

    if (platform === "IOS" && user?.plan !== "ELITE") {
      toast({
        title: "Elite plan required",
        description: "iOS builds require an Elite plan",
        variant: "destructive",
      });
      return;
    }

    setStartingBuild(true);
    try {
      const response = await fetch(`/api/build/${platform.toLowerCase()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: currentProject.id,
          profile: "preview",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      toast({
        title: "Build started",
        description: `${platform} build has been queued`,
      });
      fetchBuilds();
    } catch (error) {
      toast({
        title: "Build failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setStartingBuild(false);
    }
  };

  const getStatusIcon = (status: Build["status"]) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "FAILED":
      case "CANCELLED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "BUILDING":
        return <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: Build["status"]) => {
    switch (status) {
      case "SUCCESS":
        return "success";
      case "FAILED":
      case "CANCELLED":
        return "destructive";
      case "BUILDING":
        return "warning";
      default:
        return "secondary";
    }
  };

  const isPlanLimited = user?.plan === "FREE";

  return (
    <div className="h-full overflow-auto bg-[#0a0a0f]">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Builds
            </h1>
            <p className="text-gray-600 dark:text-slate-400">
              Build and deploy your apps to iOS and Android
            </p>
          </div>
          <Button onClick={fetchBuilds} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Plan Upgrade Banner */}
        {isPlanLimited && (
          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Hammer className="h-8 w-8 text-violet-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Upgrade to build apps
                  </p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Pro plan includes Android builds. Elite includes iOS too.
                  </p>
                </div>
              </div>
              <Button variant="gradient" asChild>
                <Link href="/dashboard/settings?tab=billing">Upgrade</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Build */}
        {!isPlanLimited && currentProject && (
          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Quick Build
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-slate-400">
                Start a new build for {currentProject.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                onClick={() => startBuild("ANDROID")}
                disabled={startingBuild}
                className="gap-2"
              >
                {startingBuild ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Smartphone className="h-4 w-4" />
                )}
                Build Android APK
              </Button>
              <Button
                onClick={() => startBuild("IOS")}
                disabled={startingBuild || user?.plan !== "ELITE"}
                variant="outline"
                className="gap-2"
              >
                <Apple className="h-4 w-4" />
                Build iOS IPA
                {user?.plan !== "ELITE" && (
                  <Badge variant="premium" className="ml-2">
                    Elite
                  </Badge>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-slate-400">
                Filter by project:
              </span>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Builds List */}
        <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Hammer className="h-5 w-5" />
              Build History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto mb-4 text-violet-400 animate-spin" />
                <p className="text-gray-600 dark:text-slate-400">
                  Loading builds...
                </p>
              </div>
            ) : builds.length === 0 ? (
              <div className="text-center py-8">
                <Hammer className="h-12 w-12 mx-auto mb-4 text-gray-600 dark:text-slate-600" />
                <p className="text-gray-600 dark:text-slate-400 mb-2">
                  No builds yet
                </p>
                <p className="text-sm text-gray-700 dark:text-slate-500">
                  {isPlanLimited
                    ? "Upgrade to start building apps"
                    : "Start a build to see it here"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {builds.map((build) => (
                  <div
                    key={build.id}
                    className="p-4 rounded-lg bg-white/10 dark:bg-white/5 border border-gray-200/50 dark:border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {getStatusIcon(build.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {build.project.name}
                            </span>
                            <Badge
                              variant={
                                build.platform === "IOS"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {build.platform === "IOS" ? (
                                <>
                                  <Apple className="h-3 w-3 mr-1" /> iOS
                                </>
                              ) : (
                                <>
                                  <Smartphone className="h-3 w-3 mr-1" />{" "}
                                  Android
                                </>
                              )}
                            </Badge>
                            <Badge
                              variant={
                                getStatusColor(build.status) as
                                  | "success"
                                  | "destructive"
                                  | "secondary"
                                  | "default"
                              }
                            >
                              {build.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-slate-400">
                            <span>Profile: {build.buildProfile}</span>
                            {build.version && <span>v{build.version}</span>}
                            <span>
                              {new Date(build.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {build.status === "BUILDING" && (
                            <Progress value={45} className="mt-2 w-48" />
                          )}
                          {build.errorMessage && (
                            <p className="mt-2 text-sm text-red-400">
                              {build.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                      {build.status === "SUCCESS" && build.artifactUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={build.artifactUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Build Info */}
        <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Build Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600 dark:text-slate-400">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Android Builds
                  </span>
                </div>
                <ul className="space-y-1 text-sm">
                  <li>APK for sideloading and testing</li>
                  <li>Build time: ~5-15 minutes</li>
                  <li>Available on Pro and Elite plans</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Apple className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    iOS Builds
                  </span>
                </div>
                <ul className="space-y-1 text-sm">
                  <li>IPA for App Store or TestFlight</li>
                  <li>Build time: ~10-25 minutes</li>
                  <li>Requires Apple Developer credentials</li>
                  <li>Available on Elite plan only</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
