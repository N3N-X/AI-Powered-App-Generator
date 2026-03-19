"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProjectStore } from "@/stores/project-store";
import { useRemainingCredits, useUserStore } from "@/stores/user-store";
import { useUIStore } from "@/stores/ui-store";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { toast } from "@/hooks/use-toast";
import { getPrompts } from "./mobile-utils";
import type { MobileSimpleTab } from "./mobile-utils";
import { useSnackPreview } from "./use-snack-preview";
import { useGeneration } from "./use-generation";
import { CREDIT_COSTS } from "@/types";

export function useMobileWorkspace() {
  const {
    currentProject,
    currentFile,
    fileTree,
    setCurrentFile,
    updateCodeFile,
    unsavedChanges,
    setUnsavedChanges,
    messages,
    isGenerating,
    generationPhase,
    generationMessage,
    streamText,
    activityItems,
  } = useProjectStore();

  const remainingCredits = useRemainingCredits();
  const userPlan = useUserStore((state) => state.user?.plan ?? "FREE");
  const { isMobile } = useResponsiveLayout();
  const { workspaceMode, setWorkspaceMode } = useUIStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const snackPreview = useSnackPreview();
  const generation = useGeneration(snackPreview.setPreviewPhase);
  const initialPromptSent = useRef(false);
  const canGenerate = remainingCredits >= CREDIT_COSTS.codeGeneration;

  const [input, setInput] = useState("");
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [mobileSimpleTab, setMobileSimpleTab] =
    useState<MobileSimpleTab>("chat");
  const [mobileExplorerOpen, setMobileExplorerOpen] = useState(true);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Initialize tabs in advanced mode
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
      generation.handleSubmitWithMessage(input.trim());
      setInput("");
    },
    [input, generation, canGenerate],
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

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined && currentFile && currentProject) {
        updateCodeFile(currentFile, value);
        setUnsavedChanges(true);
        if (snackPreview.snack) {
          snackPreview.snack.updateFiles({
            [currentFile]: { type: "CODE", contents: value },
          });
        }
      }
    },
    [
      currentFile,
      currentProject,
      updateCodeFile,
      setUnsavedChanges,
      snackPreview.snack,
    ],
  );

  const handleSave = useCallback(async () => {
    if (!currentProject?.id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${currentProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeFiles: currentProject.codeFiles }),
      });
      if (res.ok) {
        setUnsavedChanges(false);
        toast({ title: "Saved", description: "Changes saved successfully" });
      } else throw new Error("Save failed");
    } catch {
      toast({
        title: "Save failed",
        description: "Could not save changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentProject?.id, currentProject?.codeFiles, setUnsavedChanges]);

  // Auto-save debounce
  useEffect(() => {
    if (!unsavedChanges || !currentProject?.id) return;
    const t = setTimeout(() => handleSave(), 2000);
    return () => clearTimeout(t);
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
      if (!openTabs.includes(filePath))
        setOpenTabs((prev) => [...prev, filePath]);
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
  const quickPrompts = getPrompts(hasGeneratedCode, currentProject?.platform);
  const promptsLabel = hasGeneratedCode ? "Add features" : "Example ideas";

  return {
    currentProject,
    currentFile,
    fileTree,
    remainingCredits,
    userPlan,
    canGenerate,
    isMobile,
    workspaceMode,
    setWorkspaceMode,
    router,
    messages,
    isGenerating,
    generationPhase,
    generationMessage,
    streamText,
    activityItems,
    input,
    setInput,
    isPreviewFullscreen,
    setIsPreviewFullscreen,
    showPreviewPanel,
    setShowPreviewPanel,
    openTabs,
    mobileSimpleTab,
    setMobileSimpleTab,
    mobileExplorerOpen,
    setMobileExplorerOpen,
    collapsedFolders,
    isSaving,
    unsavedChanges,
    scrollRef,
    textareaRef,
    hasGeneratedCode,
    quickPrompts,
    promptsLabel,
    handleSubmit,
    handleKeyDown,
    handleEditorChange,
    handleSave,
    handleCloseTab,
    openFileInEditor,
    toggleFolder,
    setCurrentFile,
    ...snackPreview,
    ...generation,
  };
}

export type MobileWorkspaceHook = ReturnType<typeof useMobileWorkspace>;
