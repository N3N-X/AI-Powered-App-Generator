"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ContentProject } from "@/components/dashboard/content/types";

interface ProjectSelectorProps {
  projects: ContentProject[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onDeleteProject: () => void;
}

export function ProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
  onDeleteProject,
}: ProjectSelectorProps) {
  const router = useRouter();
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="liquid-glass-card rounded-xl p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[140px] md:min-w-[200px]">
          <label className="text-xs text-slate-400 mb-2 block">
            Select Project
          </label>
          <Select value={selectedProjectId} onValueChange={onSelectProject}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Choose a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentProject && (
          <div className="flex items-center gap-3">
            <Badge variant="outline">{currentProject.platform}</Badge>
            <span className="text-xs text-slate-500">
              ID: {currentProject.id.slice(0, 8)}...
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => router.push(`/dashboard/${currentProject.id}`)}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Workspace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10"
              onClick={onDeleteProject}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
