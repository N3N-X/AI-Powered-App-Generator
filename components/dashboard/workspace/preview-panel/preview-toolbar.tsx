"use client";

import {
  Monitor,
  Smartphone,
  QrCode,
  ExternalLink,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Database,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PreviewMode } from "../mobile-utils";

interface PreviewToolbarProps {
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
  isPreviewLoading: boolean;
  isOnline: boolean;
  qrCodeUrl: string | null;
  platform: string;
  snackUrl: string | undefined;
  isPreviewFullscreen: boolean;
  setIsPreviewFullscreen: (val: boolean) => void;
  setShowQrModal: (val: boolean) => void;
  setWorkspaceMode: (mode: "simple" | "advanced") => void;
  onManageClick: () => void;
  onRefreshPreview?: () => void;
}

export function PreviewToolbar({
  previewMode,
  setPreviewMode,
  isPreviewLoading,
  isOnline,
  qrCodeUrl,
  platform,
  snackUrl,
  isPreviewFullscreen,
  setIsPreviewFullscreen,
  setShowQrModal,
  setWorkspaceMode,
  onManageClick,
  onRefreshPreview,
}: PreviewToolbarProps) {
  return (
    <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isPreviewLoading
                ? "bg-yellow-500 animate-pulse"
                : isOnline
                  ? "bg-emerald-500"
                  : "bg-slate-500",
            )}
          />
          <span className="text-sm font-semibold text-white">Preview</span>
        </div>
        <div className="flex items-center liquid-glass-pill liquid-shadow rounded-full p-0.5 gap-0.5">
          <button
            className={cn(
              "h-7 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all duration-200",
              previewMode === "web"
                ? "bg-white/15 dark:bg-white/10 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/[0.05]",
            )}
            onClick={() => setPreviewMode("web")}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Web</span>
          </button>
          <button
            className={cn(
              "h-7 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all duration-200",
              previewMode === "device"
                ? "bg-white/15 dark:bg-white/10 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/[0.05]",
            )}
            onClick={() => setPreviewMode("device")}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Device</span>
          </button>
        </div>
        <Badge
          variant="outline"
          className="text-xs liquid-glass-pill px-2.5 py-0.5"
        >
          {platform}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-slate-400 hover:text-white"
              onClick={() => setShowQrModal(true)}
              disabled={!qrCodeUrl}
            >
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">QR Code</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Scan to preview on device</TooltipContent>
        </Tooltip>
        {snackUrl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-white"
                onClick={() => window.open(snackUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in Expo Snack</TooltipContent>
          </Tooltip>
        )}
        {onRefreshPreview && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-white"
                onClick={onRefreshPreview}
              >
                <RotateCcw className="h-4 w-4" />
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
              onClick={onManageClick}
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
              className="h-8 gap-2 text-slate-400 hover:text-white"
              onClick={() => setWorkspaceMode("advanced")}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Switch to Advanced IDE Mode</TooltipContent>
        </Tooltip>
        <div className="w-px h-5 bg-white/10" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
            >
              {isPreviewFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isPreviewFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
