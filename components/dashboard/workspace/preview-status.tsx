"use client";

import { Loader2, Smartphone, Monitor } from "lucide-react";
import { PreviewPhase } from "./mobile-utils";

interface PreviewStatusProps {
  previewPhase: PreviewPhase;
  isGenerating: boolean;
  progressMessage?: string | null;
  iconSize?: "sm" | "lg";
}

export function PreviewStatus({
  previewPhase,
  isGenerating,
  progressMessage,
  iconSize = "lg",
}: PreviewStatusProps) {
  const iconClass =
    iconSize === "sm"
      ? "h-10 w-10 mx-auto mb-3 opacity-50"
      : "h-12 w-12 mx-auto mb-4 opacity-50";

  if (previewPhase === "verifying") {
    return (
      <div className="text-center text-slate-400">
        <Loader2 className={`${iconClass} animate-spin`} />
        <p className={iconSize === "sm" ? "text-sm" : "font-medium"}>
          Verifying preview...
        </p>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="text-center text-slate-400">
        <Loader2 className={`${iconClass} animate-spin`} />
        <p className={iconSize === "sm" ? "text-sm" : "font-medium"}>
          Building your app...
        </p>
        {progressMessage && <p className="text-xs mt-2">{progressMessage}</p>}
      </div>
    );
  }

  return (
    <div className="text-center text-slate-400">
      {iconSize === "sm" ? (
        <Smartphone className={iconClass} />
      ) : (
        <Monitor className={iconClass} />
      )}
      <p className={iconSize === "sm" ? "text-sm" : "font-medium"}>
        {iconSize === "sm"
          ? "Build something to preview"
          : "Initializing preview..."}
      </p>
      {iconSize === "lg" && (
        <p className="text-xs mt-2">Connecting to Expo Snack</p>
      )}
    </div>
  );
}
