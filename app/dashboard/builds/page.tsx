"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useBuilds } from "./use-builds";
import { BuildActions } from "./build-actions";
import { BuildFilter, BuildList } from "./build-list";
import { BuildInfo } from "./build-info";
import { PreBuildDialog } from "./pre-build-dialog";

export default function BuildsPage() {
  const {
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
  } = useBuilds();

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Builds</h1>
            <p className="text-slate-400">
              Build and deploy your apps to iOS and Android
            </p>
          </div>
          <Button onClick={() => fetchBuilds()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <BuildActions
          projects={projects}
          buildProjectId={buildProjectId}
          setBuildProjectId={setBuildProjectId}
          startBuild={runPreBuildCheck}
          startingBuild={startingBuild}
          checkingBuild={checkingBuild}
          pendingPlatform={pendingPlatform}
          hasEnoughCredits={hasEnoughCredits}
          userCredits={user?.credits ?? 0}
        />

        <BuildFilter
          projects={projects}
          filterProjectId={filterProjectId}
          setFilterProjectId={setFilterProjectId}
        />

        <BuildList
          builds={builds}
          loading={loading}
          publishingBuildId={publishingBuildId}
          publishToStore={publishToStore}
        />

        <BuildInfo />
      </div>

      <PreBuildDialog
        open={showIssuesModal && !!preBuildResult}
        onOpenChange={(open) => {
          if (!open) handleDialogCancel();
        }}
        preBuildResult={preBuildResult}
        expandedSections={expandedSections}
        setExpandedSections={setExpandedSections}
        fixingIssues={fixingIssues}
        fixProgress={fixProgress}
        fixIssuesWithAI={() => fixIssuesWithAI()}
        executeBuild={() => pendingPlatform && executeBuild(pendingPlatform)}
        startingBuild={startingBuild}
        onCancel={handleDialogCancel}
      />
    </div>
  );
}
