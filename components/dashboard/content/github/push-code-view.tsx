"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Github,
  Loader2,
  ExternalLink,
  Link2Off,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "../types";

interface RepoInfo {
  fullName: string;
  url: string;
  lastPushed: string | null;
}

interface PushCodeViewProps {
  githubRepo: string;
  githubUrl: string | null;
  repoInfo: RepoInfo | null;
  commitMessage: string;
  setCommitMessage: (msg: string) => void;
  isLoading: boolean;
  isPushing: boolean;
  isUnlinking: boolean;
  onRefresh: () => void;
  onPushCode: () => void;
  onUnlinkRepo: () => void;
}

export function PushCodeView({
  githubRepo,
  githubUrl,
  repoInfo,
  commitMessage,
  setCommitMessage,
  isLoading,
  isPushing,
  isUnlinking,
  onRefresh,
  onPushCode,
  onUnlinkRepo,
}: PushCodeViewProps) {
  return (
    <div className="liquid-glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub Integration
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Push your code changes to GitHub
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <ScrollArea className="max-h-[500px]">
        <div className="p-6 space-y-6">
          {/* Repository Info */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Repository</p>
                <a
                  href={githubUrl || repoInfo?.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-slate-200 hover:text-white flex items-center gap-1.5"
                >
                  {githubRepo}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {repoInfo?.lastPushed && (
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">Last pushed</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(repoInfo.lastPushed)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Push Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commit-msg" className="text-xs text-slate-400">
                Commit Message
              </Label>
              <Input
                id="commit-msg"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Update generated code"
                className="h-9 text-sm bg-white/5 border-white/10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && commitMessage.trim()) {
                    onPushCode();
                  }
                }}
              />
            </div>

            <Button
              className="w-full gap-2"
              onClick={onPushCode}
              disabled={isPushing || !commitMessage.trim()}
            >
              {isPushing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Github className="h-4 w-4" />
              )}
              Push to GitHub
            </Button>
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-400">
              Pushing will replace the repository contents with your current
              project code. This is a one-way sync from Rulxy to GitHub.
            </p>
          </div>

          {/* Unlink Section */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Unlink Repository</p>
                <p className="text-xs text-slate-500">
                  Disconnect this repo without deleting it
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={onUnlinkRepo}
                disabled={isUnlinking}
              >
                {isUnlinking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Link2Off className="h-3.5 w-3.5" />
                )}
                Unlink
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
