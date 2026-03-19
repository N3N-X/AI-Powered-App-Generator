"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Code2,
  Eye,
  Loader2,
  Save,
  Database,
  PanelLeftClose,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface EditorToolbarProps {
  unsavedChanges: boolean;
  isSaving: boolean;
  showPreviewPanel: boolean;
  projectId?: string;
  router: AppRouterInstance;
  onSave: () => void;
  onTogglePreview: () => void;
  onSwitchToSimple: () => void;
  onRefreshPreview?: () => void;
}

export function EditorToolbar({
  unsavedChanges,
  isSaving,
  showPreviewPanel,
  projectId,
  router,
  onSave,
  onTogglePreview,
  onSwitchToSimple,
  onRefreshPreview,
}: EditorToolbarProps) {
  return (
    <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">Editor</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-2",
                unsavedChanges
                  ? "text-amber-400 hover:text-amber-300"
                  : "text-slate-400 hover:text-white",
              )}
              onClick={onSave}
              disabled={isSaving || !unsavedChanges}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isSaving ? "Saving..." : unsavedChanges ? "Save" : "Saved"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSaving
              ? "Saving..."
              : unsavedChanges
                ? "Save changes (auto-saves in 2s)"
                : "All changes saved"}
          </TooltipContent>
        </Tooltip>
        <div className="w-px h-5 bg-white/10" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-slate-400 hover:text-white"
              onClick={() =>
                router.push(`/dashboard/content?project=${projectId}`)
              }
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Manage</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Manage app data & services</TooltipContent>
        </Tooltip>
        <div className="w-px h-5 bg-white/10" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-2",
                showPreviewPanel
                  ? "text-violet-400 bg-violet-500/10"
                  : "text-slate-400 hover:text-white",
              )}
              onClick={onTogglePreview}
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {showPreviewPanel ? "Hide Preview" : "Show Preview"}
          </TooltipContent>
        </Tooltip>
        {showPreviewPanel && onRefreshPreview && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-slate-400 hover:text-white"
                onClick={onRefreshPreview}
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh Preview</TooltipContent>
          </Tooltip>
        )}
        <div className="w-px h-5 bg-white/10" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-slate-400 hover:text-white"
              onClick={onSwitchToSimple}
            >
              <PanelLeftClose className="h-4 w-4" />
              <span className="hidden sm:inline">Simple</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Switch to Simple Mode</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
