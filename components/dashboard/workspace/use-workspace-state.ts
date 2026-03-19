"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProjectStore } from "@/stores/project-store";
import { useRemainingCredits, useUserStore } from "@/stores/user-store";
import { useUIStore } from "@/stores/ui-store";
import { isDevHost } from "@/lib/utils";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { toast } from "@/hooks/use-toast";
import { usePreviewVerification } from "./use-preview-verification";
import { useGeneration } from "./use-generation";
import { CREDIT_COSTS } from "@/types";
export type { PreviewPhase } from "./use-preview-verification";
export function useWorkspaceState() {
  const {
    currentProject,
    currentFile,
    fileTree,
    setCurrentFile,
    messages,
    isGenerating,
    updateCodeFile,
    unsavedChanges,
    setUnsavedChanges,
    generationPhase,
    generationMessage,
    generationNotice,
    streamText,
    activityItems,
  } = useProjectStore();
  const remainingCredits = useRemainingCredits();
  const userPlan = useUserStore((state) => state.user?.plan ?? "FREE");
  const { workspaceMode, setWorkspaceMode, previewReady } = useUIStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useResponsiveLayout();
  // Compose sub-hooks
  const preview = usePreviewVerification();
  const generation = useGeneration(
    preview.setPreviewPhase,
    preview.clearConsoleErrors,
  );
  const canGenerate = remainingCredits >= CREDIT_COSTS.codeGeneration;
  // Mobile tab state
  const [mobileSimpleTab, setMobileSimpleTab] = useState<
    "chat" | "preview" | "code"
  >("chat");
  const [mobileExplorerOpen, setMobileExplorerOpen] = useState(true);
  // UI State
  const [input, setInput] = useState("");
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  // File explorer state
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(
    new Set(),
  );
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialPromptSent = useRef(false);
  // Auto-scroll chat — also trigger on streaming updates
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
    const target = viewport || scrollRef.current;
    if (target)
      target.scrollTo({ top: target.scrollHeight, behavior: "smooth" });
  }, [messages, streamText, activityItems]);
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);
  // Initialize tabs when in advanced mode
  useEffect(() => {
    if (
      workspaceMode === "advanced" &&
      openTabs.length === 0 &&
      currentProject?.codeFiles
    ) {
      const files = Object.keys(currentProject.codeFiles);
      const firstFile =
        files.find((f) => f === "App.tsx" || f === "App.js") || files[0];
      if (firstFile) {
        setOpenTabs([firstFile]);
        setCurrentFile(firstFile);
      }
    }
  }, [
    workspaceMode,
    currentProject?.codeFiles,
    openTabs.length,
    setCurrentFile,
  ]);
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim()) return;
      if (!canGenerate) {
        toast({
          title: "Insufficient credits",
          description: `You need ${CREDIT_COSTS.codeGeneration} credits to generate. Add credits to continue.`,
          variant: "destructive",
        });
        return;
      }
      const msg = input.trim();
      setInput("");
      generation.handleSubmitWithMessage(msg);
    },
    [input, generation.handleSubmitWithMessage, canGenerate],
  );
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );
  // Auto-send prompt from ?prompt= query param
  useEffect(() => {
    if (initialPromptSent.current || !currentProject || isGenerating) return;

    const prompt = searchParams.get("prompt");
    if (!prompt) return;

    initialPromptSent.current = true;
    window.history.replaceState({}, "", window.location.pathname);
    if (!canGenerate) {
      toast({
        title: "Insufficient credits",
        description: `You need ${CREDIT_COSTS.codeGeneration} credits to generate. Add credits to continue.`,
        variant: "destructive",
      });
      return;
    }
    generation.handleSubmitWithMessage(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject, searchParams, canGenerate]);
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined && currentFile && currentProject) {
        updateCodeFile(currentFile, value);
        setUnsavedChanges(true);
      }
    },
    [currentFile, currentProject, updateCodeFile, setUnsavedChanges],
  );
  // Manual save
  const handleSave = useCallback(async () => {
    if (!currentProject?.id) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${currentProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeFiles: currentProject.codeFiles }),
      });
      if (response.ok) {
        setUnsavedChanges(false);
        toast({ title: "Saved", description: "Changes saved successfully" });
      } else {
        throw new Error("Save failed");
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        title: "Save failed",
        description: "Could not save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentProject?.id, currentProject?.codeFiles, setUnsavedChanges]);
  // Auto-save with debounce
  useEffect(() => {
    if (!unsavedChanges || !currentProject?.id) return;
    const autoSaveTimer = setTimeout(() => handleSave(), 2000);
    return () => clearTimeout(autoSaveTimer);
  }, [
    unsavedChanges,
    currentProject?.codeFiles,
    currentProject?.id,
    handleSave,
  ]);

  const handleCloseTab = useCallback(
    (filePath: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenTabs((prev) => prev.filter((tab) => tab !== filePath));
      if (currentFile === filePath) {
        const remaining = openTabs.filter((tab) => tab !== filePath);
        setCurrentFile(remaining[remaining.length - 1] || null);
      }
    },
    [currentFile, openTabs, setCurrentFile],
  );

  const openFileInEditor = useCallback(
    (filePath: string) => {
      if (!openTabs.includes(filePath)) {
        setOpenTabs((prev) => [...prev, filePath]);
      }
      setCurrentFile(filePath);
    },
    [openTabs, setCurrentFile],
  );

  const toggleFolder = useCallback((path: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const hasGeneratedCode = messages.length > 0;

  const isDev =
    typeof window !== "undefined" && isDevHost(window.location.hostname);
  const subdomainDisplayUrl = currentProject?.subdomain
    ? isDev
      ? `${window.location.origin}/api/serve?subdomain=${currentProject.subdomain}`
      : `${currentProject.subdomain}.rulxy.com`
    : null;
  const subdomainDisplayLabel = currentProject?.subdomain
    ? isDev
      ? `${window.location.host}/api/serve?subdomain=${currentProject.subdomain}`
      : `${currentProject.subdomain}.rulxy.com`
    : null;

  return {
    currentProject,
    currentFile,
    fileTree,
    setCurrentFile,
    messages,
    isGenerating,
    generationPhase,
    generationMessage,
    generationNotice,
    streamText,
    activityItems,
    unsavedChanges,
    remainingCredits,
    userPlan,
    canGenerate,
    workspaceMode,
    setWorkspaceMode,
    previewReady,
    router,
    isMobile,
    mobileSimpleTab,
    setMobileSimpleTab,
    mobileExplorerOpen,
    setMobileExplorerOpen,
    input,
    setInput,
    isPreviewFullscreen,
    setIsPreviewFullscreen,
    showPreviewPanel,
    setShowPreviewPanel,
    progressMessage: generation.progressMessage,
    isCanceling: generation.isCanceling,
    handleCancel: generation.cancelGeneration,
    openTabs,
    collapsedFolders,
    isSaving,
    previewPhase: preview.previewPhase,
    previewHtml: preview.previewHtml,
    refreshPreview: preview.refreshPreview,
    scrollRef,
    textareaRef,
    hasGeneratedCode,
    isDev,
    subdomainDisplayUrl,
    subdomainDisplayLabel,
    handleSubmit,
    handleKeyDown,
    handleEditorChange,
    handleSave,
    handleCloseTab,
    openFileInEditor,
    toggleFolder,
  };
}

export type WorkspaceState = ReturnType<typeof useWorkspaceState>;
