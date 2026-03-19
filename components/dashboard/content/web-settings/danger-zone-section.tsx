"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DangerZoneSectionProps {
  onDeleteProject: () => void;
}

export function DangerZoneSection({ onDeleteProject }: DangerZoneSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-red-400 border-b border-red-500/20 pb-2">
        Danger Zone
      </h4>
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300 font-medium">
            Delete this project
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Permanently delete the project and all its data. This cannot be
            undone.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10"
          onClick={onDeleteProject}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete Project
        </Button>
      </div>
    </div>
  );
}
