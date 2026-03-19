"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Eye, ExternalLink, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PreviewPhase } from "./use-workspace-state";

interface PreviewContentProps {
  previewHtml: string;
  previewReady: boolean;
  previewPhase: PreviewPhase;
  isGenerating: boolean;
}

/** Shared preview iframe + placeholder content (no chrome/toolbar). */
export function PreviewContent({
  previewHtml,
  previewReady,
  previewPhase,
  isGenerating,
}: PreviewContentProps) {
  if (previewHtml && previewReady) {
    return (
      <iframe
        srcDoc={previewHtml}
        className="w-full h-full border-0"
        title="Live Preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
      />
    );
  }

  return (
    <div className="h-full flex items-center justify-center bg-slate-100 relative">
      {/* Hidden iframe for verification */}
      {previewHtml && previewPhase === "verifying" && (
        <iframe
          srcDoc={previewHtml}
          className="absolute inset-0 w-full h-full border-0 opacity-0 pointer-events-none"
          title="Verification Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
        />
      )}
      <PreviewPlaceholder
        previewPhase={previewPhase}
        isGenerating={isGenerating}
      />
    </div>
  );
}

interface PreviewPlaceholderProps {
  previewPhase: PreviewPhase;
  isGenerating: boolean;
  iconSize?: string;
}

export function PreviewPlaceholder({
  previewPhase,
  isGenerating,
  iconSize = "h-12 w-12",
}: PreviewPlaceholderProps) {
  if (previewPhase === "verifying") {
    return (
      <div className="text-center text-slate-500">
        <Loader2
          className={cn(iconSize, "mx-auto mb-4 opacity-50 animate-spin")}
        />
        <p>Verifying preview...</p>
      </div>
    );
  }
  if (isGenerating) {
    return (
      <div className="text-center text-slate-500">
        <Loader2
          className={cn(iconSize, "mx-auto mb-4 opacity-50 animate-spin")}
        />
        <p>Building your app...</p>
      </div>
    );
  }
  return (
    <div className="text-center text-slate-500">
      <Eye className={cn(iconSize, "mx-auto mb-4 opacity-50")} />
      <p>Start building to see your app here</p>
    </div>
  );
}

/** Dark-themed preview wrapper used in advanced mode's split panel. */
export function DarkPreviewWrapper({
  previewHtml,
  previewReady,
  previewPhase,
  isGenerating,
}: PreviewContentProps) {
  return (
    <div className="h-full rounded-xl liquid-glass liquid-shadow overflow-hidden">
      {previewHtml && previewReady ? (
        <iframe
          srcDoc={previewHtml}
          className="w-full h-full border-0"
          title="Live Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
        />
      ) : (
        <div className="h-full flex items-center justify-center bg-slate-100/5 relative">
          {previewHtml && previewPhase === "verifying" && (
            <iframe
              srcDoc={previewHtml}
              className="absolute inset-0 w-full h-full border-0 opacity-0 pointer-events-none"
              title="Verification Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            />
          )}
          <PreviewPlaceholder
            previewPhase={previewPhase}
            isGenerating={isGenerating}
          />
        </div>
      )}
    </div>
  );
}
