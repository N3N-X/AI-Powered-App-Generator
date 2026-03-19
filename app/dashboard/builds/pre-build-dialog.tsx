"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  Loader2,
  Lightbulb,
  Sparkles,
  Hammer,
} from "lucide-react";
import type { PreBuildCheckResponse } from "@/app/api/vibe/pre-build-check/route";
import { IssueSection } from "./issue-section";

interface ExpandedSections {
  critical: boolean;
  warning: boolean;
  tip: boolean;
}

interface PreBuildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preBuildResult: PreBuildCheckResponse | null;
  expandedSections: ExpandedSections;
  setExpandedSections: React.Dispatch<React.SetStateAction<ExpandedSections>>;
  fixingIssues: boolean;
  fixProgress: string[];
  fixIssuesWithAI: () => void;
  executeBuild: () => void;
  startingBuild: boolean;
  onCancel: () => void;
}

export function PreBuildDialog({
  open,
  onOpenChange,
  preBuildResult,
  expandedSections,
  setExpandedSections,
  fixingIssues,
  fixProgress,
  fixIssuesWithAI,
  executeBuild,
  startingBuild,
  onCancel,
}: PreBuildDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a24] border-white/10 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {preBuildResult && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <DialogTitle>Pre-Build Check Results</DialogTitle>
                  <DialogDescription>
                    {preBuildResult.summary.criticalCount} critical,{" "}
                    {preBuildResult.summary.warningCount} warnings,{" "}
                    {preBuildResult.summary.tipCount} tips
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="overflow-y-auto max-h-[50vh] space-y-4">
              {fixingIssues && (
                <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                    <span className="font-medium text-violet-400">
                      Fixing issues with AI...
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-400">
                    {fixProgress.map((msg, i) => (
                      <p key={i}>{msg}</p>
                    ))}
                  </div>
                </div>
              )}

              {preBuildResult.preBuild.critical.length > 0 && (
                <IssueSection
                  title="Critical Issues"
                  description="Must be fixed before building"
                  icon={<XCircle className="h-4 w-4 text-red-500" />}
                  issues={preBuildResult.preBuild.critical}
                  expanded={expandedSections.critical}
                  onToggle={() =>
                    setExpandedSections((prev) => ({
                      ...prev,
                      critical: !prev.critical,
                    }))
                  }
                  badgeColor="bg-red-500/10 text-red-500"
                />
              )}

              {preBuildResult.preBuild.warnings.length > 0 && (
                <IssueSection
                  title="Warnings"
                  description="May cause store rejection"
                  icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
                  issues={preBuildResult.preBuild.warnings}
                  expanded={expandedSections.warning}
                  onToggle={() =>
                    setExpandedSections((prev) => ({
                      ...prev,
                      warning: !prev.warning,
                    }))
                  }
                  badgeColor="bg-amber-500/10 text-amber-500"
                />
              )}

              {preBuildResult.preBuild.tips.length > 0 && (
                <IssueSection
                  title="Tips"
                  description="Recommendations for improvement"
                  icon={<Lightbulb className="h-4 w-4 text-blue-400" />}
                  issues={preBuildResult.preBuild.tips}
                  expanded={expandedSections.tip}
                  onToggle={() =>
                    setExpandedSections((prev) => ({
                      ...prev,
                      tip: !prev.tip,
                    }))
                  }
                  badgeColor="bg-blue-500/10 text-blue-400"
                />
              )}

              {preBuildResult.storeGuidelines &&
                preBuildResult.storeGuidelines.issues.length > 0 && (
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <h3 className="font-medium text-white mb-2">
                      Store Guidelines
                    </h3>
                    <div className="space-y-2">
                      {preBuildResult.storeGuidelines.issues.map((issue) => (
                        <div
                          key={issue.id}
                          className="flex items-start gap-2 text-sm"
                        >
                          {issue.tier === "critical" ? (
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          ) : issue.tier === "warning" ? (
                            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          ) : (
                            <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <span className="text-white">{issue.title}</span>
                            <p className="text-slate-400">{issue.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <div className="text-sm text-slate-400">
                {preBuildResult.summary.autoFixableCount > 0 && (
                  <span>
                    {preBuildResult.summary.autoFixableCount} issues can be
                    auto-fixed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {preBuildResult.summary.autoFixableCount > 0 && (
                  <Button
                    onClick={fixIssuesWithAI}
                    disabled={fixingIssues}
                    className="gap-2 bg-violet-600 hover:bg-violet-700"
                  >
                    {fixingIssues ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Fix All with AI
                  </Button>
                )}
                {preBuildResult.summary.criticalCount === 0 && (
                  <Button
                    onClick={executeBuild}
                    disabled={startingBuild}
                    variant="outline"
                    className="gap-2"
                  >
                    {startingBuild ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Hammer className="h-4 w-4" />
                    )}
                    Build Anyway
                  </Button>
                )}
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
