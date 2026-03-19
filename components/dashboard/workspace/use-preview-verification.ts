"use client";

import { useState, useEffect, useCallback } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useProjectStore } from "@/stores/project-store";
import { generatePreviewHtml } from "@/lib/preview-html";

export type PreviewPhase = "idle" | "generating" | "verifying" | "ready";

/**
 * Manages preview HTML generation, console error listening,
 * and verification.
 */
export function usePreviewVerification() {
  const { currentProject, isGenerating } = useProjectStore();
  const { addConsoleError, clearConsoleErrors, previewReady, setPreviewReady } =
    useUIStore();

  const [previewPhase, setPreviewPhase] = useState<PreviewPhase>("idle");
  const [previewHtml, setPreviewHtml] = useState("");
  const [refreshNonce, setRefreshNonce] = useState(0);

  const codeFiles = currentProject?.codeFiles;
  const codeFileCount = Object.keys(codeFiles || {}).length;

  // Generate preview HTML (debounced)
  useEffect(() => {
    if (!codeFiles || codeFileCount === 0) {
      setPreviewHtml("");
      return;
    }
    const timer = setTimeout(() => {
      const base =
        typeof window !== "undefined" ? window.location.origin : undefined;
      const html = generatePreviewHtml(
        codeFiles,
        currentProject?.name || "App",
        base,
      );
      setPreviewHtml(`${html}\n<!-- refresh:${refreshNonce} -->`);
    }, 500);
    return () => clearTimeout(timer);
  }, [codeFiles, codeFileCount, currentProject?.name, refreshNonce]);

  // Listen for console errors from preview iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type === "rux-console" && event.data.level === "error") {
        addConsoleError({
          level: event.data.level,
          message: event.data.message,
          timestamp: event.data.timestamp || Date.now(),
        });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [addConsoleError]);

  // Clear console errors and hide preview when generation starts
  useEffect(() => {
    if (isGenerating) {
      clearConsoleErrors();
      setPreviewReady(false);
      setPreviewPhase("generating");
    }
  }, [isGenerating, clearConsoleErrors, setPreviewReady]);

  // If generation ended but preview never switched to verifying, recover.
  useEffect(() => {
    if (isGenerating) return;
    if (!previewHtml) return;
    if (previewPhase === "generating") {
      setPreviewPhase("verifying");
    }
  }, [isGenerating, previewHtml, previewPhase]);

  // Verification: wait for console errors then mark ready
  useEffect(() => {
    if (previewPhase !== "verifying") return;
    if (!currentProject?.codeFiles) return;

    const timer = setTimeout(() => {
      setPreviewReady(true);
      setPreviewPhase("ready");
    }, 3000);

    return () => clearTimeout(timer);
  }, [previewPhase, currentProject?.codeFiles, setPreviewReady]);

  const refreshPreview = useCallback(() => {
    clearConsoleErrors();
    setPreviewReady(false);
    setPreviewPhase("verifying");
    setRefreshNonce((prev) => prev + 1);
  }, [clearConsoleErrors, setPreviewReady]);

  return {
    previewHtml,
    previewPhase,
    setPreviewPhase,
    previewReady,
    clearConsoleErrors,
    refreshPreview,
  };
}
