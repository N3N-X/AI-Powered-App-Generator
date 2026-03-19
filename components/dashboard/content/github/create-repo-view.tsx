"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Github, Loader2, GitBranch, CheckCircle2 } from "lucide-react";

interface CreateRepoViewProps {
  repoName: string;
  setRepoName: (name: string) => void;
  repoDescription: string;
  setRepoDescription: (desc: string) => void;
  isPrivate: boolean;
  setIsPrivate: (isPrivate: boolean) => void;
  isCreating: boolean;
  onCreateRepo: () => void;
}

export function CreateRepoView({
  repoName,
  setRepoName,
  repoDescription,
  setRepoDescription,
  isPrivate,
  setIsPrivate,
  isCreating,
  onCreateRepo,
}: CreateRepoViewProps) {
  return (
    <div className="liquid-glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Github className="h-4 w-4" />
          GitHub Integration
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Create a new repository for this project
        </p>
      </div>
      <ScrollArea className="max-h-[500px]">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            <span className="text-sm text-green-400">GitHub connected</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repo-name" className="text-xs text-slate-400">
                Repository Name
              </Label>
              <Input
                id="repo-name"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="my-app"
                className="h-9 text-sm bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="repo-desc" className="text-xs text-slate-400">
                Description (optional)
              </Label>
              <Input
                id="repo-desc"
                value={repoDescription}
                onChange={(e) => setRepoDescription(e.target.value)}
                placeholder="A brief description of your project"
                className="h-9 text-sm bg-white/5 border-white/10"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm text-slate-300">Private Repository</Label>
                <p className="text-xs text-slate-500">
                  Only you will be able to see this repository
                </p>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>

            <Button
              className="w-full gap-2"
              onClick={onCreateRepo}
              disabled={isCreating || !repoName.trim()}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GitBranch className="h-4 w-4" />
              )}
              Create Repository & Push Code
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
