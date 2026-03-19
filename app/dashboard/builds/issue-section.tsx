"use client";

import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { BuildIssue } from "@/lib/build/pre-build-checks";

interface IssueSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  issues: BuildIssue[];
  expanded: boolean;
  onToggle: () => void;
  badgeColor: string;
}

export function IssueSection({
  title,
  description,
  icon,
  issues,
  expanded,
  onToggle,
  badgeColor,
}: IssueSectionProps) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <div className="text-left">
            <span className="font-medium text-white">{title}</span>
            <span className="text-sm text-slate-400 ml-2">
              ({issues.length})
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={badgeColor}>{description}</Badge>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="p-3 space-y-3 border-t border-white/10">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-white/5"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{issue.title}</span>
                  {issue.autoFixable && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-violet-500/10 text-violet-400"
                    >
                      Auto-fixable
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1">{issue.message}</p>
                {issue.file && (
                  <p className="text-xs text-slate-500 mt-1">
                    File: {issue.file}
                    {issue.line && `:${issue.line}`}
                  </p>
                )}
                {issue.autoFixDescription && (
                  <p className="text-xs text-violet-400 mt-1">
                    Fix: {issue.autoFixDescription}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
