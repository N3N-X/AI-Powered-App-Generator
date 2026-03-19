"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { useUserStore } from "@/stores/user-store";
import { NotConnectedView, CreateRepoView, PushCodeView } from "./github";

interface GitHubTabProps {
  projectId: string;
  projectName: string;
  githubRepo: string | null;
  githubUrl: string | null;
  onRepoLinked: (repo: string, url: string) => void;
  onRepoUnlinked: () => void;
}

interface RepoInfo {
  fullName: string;
  url: string;
  lastPushed: string | null;
}

export function GitHubTab({
  projectId,
  projectName,
  githubRepo,
  githubUrl,
  onRepoLinked,
  onRepoUnlinked,
}: GitHubTabProps) {
  const { hasGitHub } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Create repo form state
  const [repoName, setRepoName] = useState(
    projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
  );
  const [repoDescription, setRepoDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  // Push form state
  const [commitMessage, setCommitMessage] = useState("");

  // Repo info
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);

  const fetchRepoInfo = useCallback(async () => {
    if (!githubRepo) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/github/repo-info?repo=${encodeURIComponent(githubRepo)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setRepoInfo({
          fullName: data.fullName,
          url: data.htmlUrl,
          lastPushed: data.pushedAt,
        });
      }
    } catch (error) {
      console.error("Failed to fetch repo info:", error);
    } finally {
      setIsLoading(false);
    }
  }, [githubRepo]);

  useEffect(() => {
    if (githubRepo) {
      fetchRepoInfo();
    }
  }, [githubRepo, fetchRepoInfo]);

  const handleCreateRepo = async () => {
    if (!repoName.trim()) {
      toast({ title: "Repository name required", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/github/create-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          repoName: repoName.trim(),
          description: repoDescription.trim() || undefined,
          isPrivate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create repository");

      toast({
        title: "Repository created",
        description: `Successfully created ${data.repository.fullName}`,
      });

      onRepoLinked(data.repository.fullName, data.repository.url);
      setRepoInfo({
        fullName: data.repository.fullName,
        url: data.repository.url,
        lastPushed: new Date().toISOString(),
      });
    } catch (error) {
      toast({
        title: "Failed to create repository",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handlePushCode = async () => {
    if (!commitMessage.trim()) {
      toast({ title: "Commit message required", variant: "destructive" });
      return;
    }

    setIsPushing(true);
    try {
      const res = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          commitMessage: commitMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to push code");

      toast({
        title: "Code pushed successfully",
        description: `Commit: ${data.commit.sha.substring(0, 7)}`,
      });

      setCommitMessage("");
      setRepoInfo((prev) =>
        prev ? { ...prev, lastPushed: new Date().toISOString() } : null,
      );
    } catch (error) {
      toast({
        title: "Failed to push code",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handleUnlinkRepo = async () => {
    if (
      !confirm(
        "Are you sure you want to unlink this repository? The repository will not be deleted.",
      )
    ) {
      return;
    }

    setIsUnlinking(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/github`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unlink repository");
      }

      toast({
        title: "Repository unlinked",
        description: "The repository has been disconnected from this project",
      });

      onRepoUnlinked();
      setRepoInfo(null);
    } catch (error) {
      toast({
        title: "Failed to unlink repository",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUnlinking(false);
    }
  };

  if (!hasGitHub) {
    return <NotConnectedView />;
  }

  if (!githubRepo) {
    return (
      <CreateRepoView
        repoName={repoName}
        setRepoName={setRepoName}
        repoDescription={repoDescription}
        setRepoDescription={setRepoDescription}
        isPrivate={isPrivate}
        setIsPrivate={setIsPrivate}
        isCreating={isCreating}
        onCreateRepo={handleCreateRepo}
      />
    );
  }

  return (
    <PushCodeView
      githubRepo={githubRepo}
      githubUrl={githubUrl}
      repoInfo={repoInfo}
      commitMessage={commitMessage}
      setCommitMessage={setCommitMessage}
      isLoading={isLoading}
      isPushing={isPushing}
      isUnlinking={isUnlinking}
      onRefresh={fetchRepoInfo}
      onPushCode={handlePushCode}
      onUnlinkRepo={handleUnlinkRepo}
    />
  );
}
