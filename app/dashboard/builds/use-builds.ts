"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { useProjectStore } from "@/stores/project-store";
import { useUserStore } from "@/stores/user-store";
import { CREDIT_COSTS } from "@/types";
import type { PreBuildCheckResponse } from "@/app/api/vibe/pre-build-check/route";
import type { Build } from "./types";

export function useBuilds() {
  const { projects } = useProjectStore();
  const { user, hasAppleDev, hasGoogleDev } = useUserStore();
  const [buildProjectId, setBuildProjectId] = useState<string>("");
  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingBuild, setStartingBuild] = useState(false);
  const [publishingBuildId, setPublishingBuildId] = useState<string | null>(null);

  const [checkingBuild, setCheckingBuild] = useState(false);
  const [preBuildResult, setPreBuildResult] = useState<PreBuildCheckResponse | null>(null);
  const [showIssuesModal, setShowIssuesModal] = useState(false);
  const [pendingPlatform, setPendingPlatform] = useState<"ANDROID" | "IOS" | null>(null);
  const [fixingIssues, setFixingIssues] = useState(false);
  const [fixProgress, setFixProgress] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    critical: true,
    warning: true,
    tip: false,
  });

  const selectedBuildProject = projects.find((p) => p.id === buildProjectId);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBuilds = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const url =
          filterProjectId === "all"
            ? "/api/builds"
            : `/api/builds?projectId=${filterProjectId}`;
        const response = await fetch(url);
        if (response.ok) {
          const result = await response.json();
          setBuilds(result.builds || []);
        }
      } catch (err) {
        console.error("Failed to fetch builds:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filterProjectId],
  );

  useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  useEffect(() => {
    const hasActiveBuilds = builds.some((b) =>
      ["PENDING", "QUEUED", "BUILDING"].includes(b.status),
    );
    if (hasActiveBuilds) {
      pollingRef.current = setInterval(() => fetchBuilds(true), 15000);
    } else if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [builds, fetchBuilds]);

  const hasEnoughCredits = (platform: "ANDROID" | "IOS") => {
    if (!user) return false;
    const cost = platform === "ANDROID" ? CREDIT_COSTS.buildAndroid : CREDIT_COSTS.buildIOS;
    return user.credits >= cost;
  };

  const executeBuild = async (platform: "ANDROID" | "IOS") => {
    if (!buildProjectId || !selectedBuildProject) return;
    setStartingBuild(true);
    setShowIssuesModal(false);
    try {
      const response = await fetch(`/api/build/${platform.toLowerCase()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: buildProjectId, profile: "preview" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      toast({
        title: "Build started",
        description: `${platform} build for ${selectedBuildProject.name} has been queued`,
      });
      fetchBuilds();
      setPreBuildResult(null);
      setPendingPlatform(null);
    } catch (error) {
      toast({
        title: "Build failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setStartingBuild(false);
    }
  };

  const runPreBuildCheck = async (platform: "ANDROID" | "IOS") => {
    if (!buildProjectId || !selectedBuildProject) {
      toast({ title: "No project selected", description: "Please select a project to build", variant: "destructive" });
      return;
    }
    if (!hasEnoughCredits(platform)) {
      const cost = platform === "ANDROID" ? CREDIT_COSTS.buildAndroid : CREDIT_COSTS.buildIOS;
      toast({ title: "Insufficient credits", description: `This build requires ${cost} credits. You have ${user?.credits ?? 0} credits.`, variant: "destructive" });
      return;
    }
    setCheckingBuild(true);
    setPendingPlatform(platform);
    try {
      const response = await fetch("/api/vibe/pre-build-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: buildProjectId, platform: platform.toLowerCase() }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Pre-build check failed");
      }
      const result: PreBuildCheckResponse = await response.json();
      setPreBuildResult(result);
      if (result.summary.criticalCount === 0 && result.summary.warningCount === 0) {
        toast({ title: "All checks passed", description: "Starting build..." });
        await executeBuild(platform);
      } else {
        setShowIssuesModal(true);
      }
    } catch (error) {
      toast({ title: "Pre-build check failed", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" });
    } finally {
      setCheckingBuild(false);
    }
  };

  const fixIssuesWithAI = async (issueIds?: string[]) => {
    if (!buildProjectId || !pendingPlatform) return;
    setFixingIssues(true);
    setFixProgress([]);
    try {
      const response = await fetch("/api/vibe/fix-build-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: buildProjectId, platform: pendingPlatform.toLowerCase(), issueIds, fixAll: !issueIds }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fix issues");
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "progress") {
                setFixProgress((prev) => [...prev, data.message]);
              } else if (data.type === "complete") {
                toast({ title: "Issues fixed", description: `Fixed ${data.fixedCount} issues. Re-running checks...` });
                await runPreBuildCheck(pendingPlatform);
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      toast({ title: "Fix failed", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" });
    } finally {
      setFixingIssues(false);
      setFixProgress([]);
    }
  };

  const publishToStore = async (build: Build) => {
    const isIOS = build.platform === "IOS";
    const hasCredentials = isIOS ? hasAppleDev : hasGoogleDev;
    const storeName = isIOS ? "App Store" : "Play Store";
    if (!hasCredentials) {
      toast({
        title: "Submission credentials required",
        description: `Connect your ${isIOS ? "App Store Connect API Key" : "Google Play Service Account"} in Settings > Integrations to publish to the ${storeName}.`,
        variant: "destructive",
      });
      return;
    }
    setPublishingBuildId(build.id);
    try {
      const response = await fetch("/api/build/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildId: build.id, platform: build.platform }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      toast({ title: "Submission started", description: `Your build is being submitted to the ${storeName}. This may take a few minutes.` });
    } catch (error) {
      toast({ title: "Publish failed", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" });
    } finally {
      setPublishingBuildId(null);
    }
  };

  const handleDialogCancel = () => {
    setShowIssuesModal(false);
    setPreBuildResult(null);
    setPendingPlatform(null);
  };

  return {
    projects,
    user,
    buildProjectId,
    setBuildProjectId,
    filterProjectId,
    setFilterProjectId,
    builds,
    loading,
    startingBuild,
    publishingBuildId,
    checkingBuild,
    preBuildResult,
    showIssuesModal,
    pendingPlatform,
    fixingIssues,
    fixProgress,
    expandedSections,
    setExpandedSections,
    fetchBuilds,
    hasEnoughCredits,
    runPreBuildCheck,
    executeBuild,
    fixIssuesWithAI,
    publishToStore,
    handleDialogCancel,
  };
}
