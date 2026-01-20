"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import {
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PreviewPane() {
  const { currentProject } = useProjectStore();
  const { setShowPreview } = useUIStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const prevProjectIdRef = useRef<string | null>(null);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const loadPreview = useCallback(() => {
    if (iframeRef.current && currentProject) {
      setIsLoading(true);
      setError(null);
      const codeHash = JSON.stringify(currentProject.codeFiles || {}).length;
      iframeRef.current.src = `/api/preview?projectId=${encodeURIComponent(currentProject.id)}&t=${Date.now()}&h=${codeHash}`;
    }
  }, [currentProject]);

  const handleRefresh = useCallback(() => {
    loadPreview();
    setTimeout(() => setIsLoading(false), 2000);
  }, [loadPreview]);

  const openInSnack = useCallback(() => {
    if (currentProject) {
      const previewUrl = `/api/preview?projectId=${encodeURIComponent(currentProject.id)}`;
      window.open(previewUrl, "_blank");
    }
  }, [currentProject]);

  // Auto-refresh preview when project changes (debounced for code changes)
  useEffect(() => {
    if (!currentProject) return;

    // Immediate load on project change
    if (prevProjectIdRef.current !== currentProject.id) {
      prevProjectIdRef.current = currentProject.id;
      loadPreview();
      setTimeout(() => setIsLoading(false), 3000);
      return;
    }

    // Debounced reload for code changes (500ms delay)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      loadPreview();
      setTimeout(() => setIsLoading(false), 3000);
    }, 500);
  }, [currentProject?.id, currentProject?.codeFiles, loadPreview]);

  const previewUrl = currentProject
    ? `/api/preview?projectId=${currentProject.id}`
    : "";

  return (
    <TooltipProvider>
      <div
        className={cn(
          "h-full flex flex-col bg-white dark:bg-[#0a0a0f]",
          isFullscreen && "fixed inset-0 z-50",
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                isLoading
                  ? "bg-yellow-500 animate-pulse"
                  : error
                    ? "bg-red-500"
                    : "bg-green-500",
              )}
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Live Preview
            </span>
            {currentProject && (
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {currentProject.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-white/10"
                  onClick={openInSnack}
                  disabled={!currentProject}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in new tab</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-white/10"
                  onClick={handleRefresh}
                  disabled={isLoading || !currentProject}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isLoading && "animate-spin")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh preview</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-white/10"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-5 bg-gray-300 dark:bg-white/10 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-white/10"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close preview</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Preview area - NO device frames, just the Expo Snack iframe */}
        <div className="flex-1 relative bg-white dark:bg-[#0a0a0f]">
          {!currentProject ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-slate-500">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <span className="text-3xl">📱</span>
                </div>
                <p className="font-medium mb-1">No preview available</p>
                <p className="text-sm">Generate code to see the preview</p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-red-500 dark:text-red-400">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p className="font-medium mb-2">Preview Error</p>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 max-w-xs">
                  {error}
                </p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <>
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="w-full h-full border-0"
                title="App Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-presentation allow-downloads"
                allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone"
                onLoad={() => setIsLoading(false)}
                onError={() => setError("Failed to load preview")}
              />

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-[#0a0a0f]/90 flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Loading preview...
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                    This may take a few moments
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info footer */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs text-gray-600 dark:text-slate-500 flex items-center justify-between">
          <span>React Native Web • Powered by Expo Snack</span>
          {currentProject && (
            <span className="text-gray-500 dark:text-slate-400">
              {Object.keys(currentProject.codeFiles || {}).length} files
            </span>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
