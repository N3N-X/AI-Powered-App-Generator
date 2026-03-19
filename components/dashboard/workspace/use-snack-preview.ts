"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Snack } from "snack-sdk";
import type { SnackState } from "snack-sdk";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import QRCode from "qrcode";
import {
  SNACK_SDK_VERSION,
  extractDependencies,
  convertToSnackFiles,
} from "./mobile-utils";
import type { PreviewMode, PreviewPhase } from "./mobile-utils";

// Module-level cache to avoid re-creating Snack instances on remount
const snackCache = new Map<string, { snack: Snack; cleanup: () => void }>();

export function useSnackPreview() {
  const { currentProject, isGenerating } = useProjectStore();
  const { addConsoleError, clearConsoleErrors, previewReady, setPreviewReady } =
    useUIStore();

  const [snack, setSnack] = useState<InstanceType<typeof Snack> | null>(null);
  const [snackState, setSnackState] = useState<SnackState | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("web");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [previewPhase, setPreviewPhase] = useState<PreviewPhase>("idle");

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const webPreviewRef = useRef<{ current: Window | null }>({ current: null });
  const prevSnackUrlRef = useRef<string | null>(null);

  // Initialize Snack SDK — reuse cached instance on remount
  useEffect(() => {
    if (!currentProject?.id) return;
    const codeFiles = currentProject.codeFiles;
    if (!codeFiles || Object.keys(codeFiles).length === 0) return;

    const projectId = currentProject.id;
    const cached = snackCache.get(projectId);

    if (cached) {
      // Reuse existing instance, just update files
      cached.snack.updateFiles(convertToSnackFiles(codeFiles));
      setSnack(cached.snack);
      return;
    }

    const codeDeps = extractDependencies(codeFiles);
    const snackInstance = new Snack({
      name: currentProject.name || "Rulxy App",
      description: currentProject.description || "Built with Rulxy",
      sdkVersion: SNACK_SDK_VERSION,
      files: convertToSnackFiles(codeFiles),
      dependencies: {
        "expo-status-bar": { version: "*" },
        "react-native-safe-area-context": { version: "*" },
        "@expo/vector-icons": { version: "*" },
        "@react-navigation/native": { version: "*" },
        "@react-navigation/native-stack": { version: "*" },
        "@react-navigation/bottom-tabs": { version: "*" },
        "react-native-screens": { version: "*" },
        ...codeDeps,
      },
      online: true,
      codeChangesDelay: 500,
      webPreviewRef: webPreviewRef.current,
      webPlayerURL: "https://run.rulxy.com/v2/%%SDK_VERSION%%",
    });

    setSnack(snackInstance);
    const unsubscribe = snackInstance.addStateListener((state) => {
      setSnackState(state);
      setIsPreviewLoading(false);
      if (state.online && state.url && state.url !== prevSnackUrlRef.current) {
        prevSnackUrlRef.current = state.url;
        QRCode.toDataURL(state.url, { width: 200, margin: 2 })
          .then(setQrCodeUrl)
          .catch(console.error);
        setIsOnline(true);
      }
    });

    const cleanup = () => {
      unsubscribe();
      snackInstance.setOnline(false);
    };
    snackCache.set(projectId, { snack: snackInstance, cleanup });

    return () => {
      // Don't clean up immediately — keep cached for remount
      // Only clean up if a different project takes its place
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id]);

  // Update snack files when code changes
  useEffect(() => {
    if (snack && currentProject?.codeFiles) {
      snack.updateFiles(convertToSnackFiles(currentProject.codeFiles));
      const codeDeps = extractDependencies(currentProject.codeFiles);
      const currentDeps = snack.getState().dependencies;
      const newDeps: Record<string, { version: string }> = {};
      for (const [pkg, ver] of Object.entries(codeDeps)) {
        if (!currentDeps[pkg]) newDeps[pkg] = ver;
      }
      if (Object.keys(newDeps).length > 0) snack.updateDependencies(newDeps);
    }
  }, [snack, currentProject?.codeFiles]);

  // Listen for console errors from Snack runtime
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "string") return;
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }
      if (parsed.type !== "MESSAGE" || !parsed.message) return;
      const msg = parsed.message as Record<string, unknown>;

      if (msg.type === "ERROR") {
        try {
          const errorData =
            typeof msg.error === "string"
              ? JSON.parse(msg.error)
              : msg.error || {};
          const ed = errorData as Record<string, unknown>;
          const errorMsg = ed.message || ed.name || "Unknown runtime error";
          const fileName = ed.fileName || "";
          const line = ed.lineNumber || "";
          addConsoleError({
            level: "error",
            message: `${errorMsg}${fileName ? ` in ${fileName}` : ""}${line ? `:${line}` : ""}`,
            timestamp: Date.now(),
          });
        } catch {
          // Malformed error payload
        }
        return;
      }

      if (
        msg.type === "CONSOLE" &&
        (msg.method === "error" || msg.method === "warn")
      ) {
        const payload = msg.payload as string[] | undefined;
        const errorMsg = payload?.length
          ? payload.join(" ")
          : "Unknown console error";
        addConsoleError({
          level: "error",
          message: errorMsg,
          timestamp: Date.now(),
        });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [addConsoleError]);

  // Clear console errors when generation starts
  useEffect(() => {
    if (isGenerating) {
      clearConsoleErrors();
      setPreviewReady(false);
      setPreviewPhase("generating");
    }
  }, [isGenerating, clearConsoleErrors, setPreviewReady]);

  // Verification phase
  useEffect(() => {
    if (previewPhase !== "verifying") return;
    if (!currentProject?.codeFiles) return;

    const timer = setTimeout(async () => {
      const errors = useUIStore.getState().consoleErrors;
      const meaningful = errors.filter((e) => {
        const msg = e.message.toLowerCase();
        if (msg.includes("content security policy")) return false;
        if (msg.includes("cloudflareinsights")) return false;
        return e.level === "error";
      });

      if (meaningful.length === 0) {
        setPreviewReady(true);
        setPreviewPhase("ready");
        return;
      }
      // No auto-fix — just mark as ready
      setPreviewReady(true);
      setPreviewPhase("ready");
    }, 6000);
    return () => clearTimeout(timer);
  }, [previewPhase]);

  const webPreviewUrl = snackState?.webPreviewURL;

  const refreshPreview = useCallback(() => {
    if (!snack || !currentProject?.codeFiles) return;
    clearConsoleErrors();
    setPreviewReady(false);
    setPreviewPhase("verifying");
    setIsPreviewLoading(true);
    snack.updateFiles(convertToSnackFiles(currentProject.codeFiles));
  }, [snack, currentProject?.codeFiles, clearConsoleErrors, setPreviewReady]);

  return {
    snack,
    snackState,
    previewMode,
    setPreviewMode,
    qrCodeUrl,
    showQrModal,
    setShowQrModal,
    isPreviewLoading,
    setIsPreviewLoading,
    isOnline,
    previewPhase,
    setPreviewPhase,
    iframeRef,
    webPreviewRef,
    previewReady,
    webPreviewUrl,
    refreshPreview,
  };
}
