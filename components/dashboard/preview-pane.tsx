"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  ExternalLink,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DeviceType = "iphone" | "android" | "tablet" | "desktop" | "none";

const devices: Record<
  DeviceType,
  { width: number; height: number; label: string }
> = {
  iphone: { width: 375, height: 812, label: "iPhone 14" },
  android: { width: 360, height: 800, label: "Pixel 7" },
  tablet: { width: 768, height: 1024, label: "iPad" },
  desktop: { width: 1280, height: 720, label: "Desktop" },
  none: { width: 0, height: 0, label: "Responsive" },
};

export function PreviewPane() {
  const { currentProject } = useProjectStore();
  const { previewDeviceFrame, setPreviewDeviceFrame, setShowPreview } =
    useUIStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentDevice =
    devices[previewDeviceFrame as DeviceType] || devices.iphone;

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);

    // Reload the iframe
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }

    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Auto-refresh preview when project or code changes
  useEffect(() => {
    if (currentProject && iframeRef.current) {
      setIsLoading(true);
      // Use a hash of code files to detect changes
      const codeHash = JSON.stringify(currentProject.codeFiles).length;
      iframeRef.current.src = `/api/preview?projectId=${currentProject.id}&t=${Date.now()}&h=${codeHash}`;
      setTimeout(() => setIsLoading(false), 2000);
    }
  }, [currentProject, currentProject?.codeFiles]);

  // Generate preview URL (in production, this would be a separate preview server)
  const previewUrl = currentProject
    ? `/api/preview?projectId=${currentProject.id}`
    : "";

  return (
    <TooltipProvider>
      <div
        className={cn(
          "h-full flex flex-col bg-slate-900/50",
          isFullscreen && "fixed inset-0 z-50",
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">Preview</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Device selector */}
            <Select
              value={previewDeviceFrame}
              onValueChange={(v) => setPreviewDeviceFrame(v as DeviceType)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="iphone">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-3 w-3" />
                    iPhone 14
                  </div>
                </SelectItem>
                <SelectItem value="android">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-3 w-3" />
                    Pixel 7
                  </div>
                </SelectItem>
                <SelectItem value="tablet">
                  <div className="flex items-center gap-2">
                    <Tablet className="h-3 w-3" />
                    iPad
                  </div>
                </SelectItem>
                <SelectItem value="desktop">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-3 w-3" />
                    Desktop
                  </div>
                </SelectItem>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-3 w-3" />
                    Responsive
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Actions */}
            <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleRotate}
                    disabled={previewDeviceFrame === "none"}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rotate device</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleRefresh}
                    disabled={isLoading}
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
                    className="h-7 w-7"
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

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowPreview(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close preview</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#1a1a2e]">
          {!currentProject ? (
            <div className="text-center text-slate-500">
              <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Generate code to see the preview</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-400">
              <p className="mb-2">Preview error</p>
              <p className="text-sm text-slate-500">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleRefresh}
              >
                Retry
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "relative transition-all duration-300",
                previewDeviceFrame !== "none" && "device-frame-iphone",
              )}
              style={{
                width:
                  previewDeviceFrame === "none"
                    ? "100%"
                    : rotation % 180 === 0
                      ? currentDevice.width
                      : currentDevice.height,
                height:
                  previewDeviceFrame === "none"
                    ? "100%"
                    : rotation % 180 === 0
                      ? currentDevice.height
                      : currentDevice.width,
                transform: `rotate(${rotation}deg)`,
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            >
              {/* Device frame for mobile */}
              {previewDeviceFrame !== "none" &&
                previewDeviceFrame !== "desktop" && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Notch for iPhone */}
                    {previewDeviceFrame === "iphone" && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-2xl z-10" />
                    )}
                  </div>
                )}

              {/* Preview iframe */}
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className={cn(
                  "w-full h-full bg-white",
                  previewDeviceFrame !== "none" && "rounded-[inherit]",
                )}
                title="App Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-presentation allow-downloads"
                allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone"
                onLoad={() => setIsLoading(false)}
                onError={() => setError("Failed to load preview")}
              />

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/5 bg-black/20 text-xs text-slate-500">
          <span>
            {previewDeviceFrame !== "none"
              ? `${currentDevice.label} - ${currentDevice.width}x${currentDevice.height}`
              : "Responsive"}
          </span>
          <span>React Native Web</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
