"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useProjectStore } from "@/stores/project-store";
import { useRemainingCredits } from "@/stores/user-store";
import { generatePreviewHtml } from "@/lib/preview-html";
import { getLanguageForFile } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
  Zap,
  Code2,
  Eye,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  X,
  File,
  Folder,
  FolderOpen,
  Maximize2,
  Minimize2,
  FolderTree,
  FileCode,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ChatMessage } from "@/types";

// File tree node type for recursive structure
type FileTreeNode = {
  [key: string]: FileTreeNode | string[] | undefined;
};

interface WebWorkspaceProps {
  className?: string;
}

export function WebWorkspace({ className }: WebWorkspaceProps) {
  // DEBUG: Log when component renders
  console.log("[WebWorkspace] Component rendering");

  const {
    currentProject,
    currentFile,
    setCurrentFile,
    messages,
    addMessage,
    isGenerating,
    setIsGenerating,
    setCodeFiles,
    updateCodeFile,
  } = useProjectStore();

  const remainingCredits = useRemainingCredits();

  // UI State
  const [input, setInput] = useState("");
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showExplorer, setShowExplorer] = useState(true);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["src"]),
  );
  const [pendingSpec, setPendingSpec] = useState<{
    name: string;
    description: string;
    features: string[];
    screens: { name: string; description: string }[];
    api: {
      collections: { name: string }[];
      authRequired: boolean;
      paymentsRequired: boolean;
    };
    styling: {
      primaryColor: string;
      style: string;
    };
  } | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);

  // Spec editing state
  const [editingFeature, setEditingFeature] = useState<number | null>(null);
  const [newFeature, setNewFeature] = useState("");
  const [newScreenName, setNewScreenName] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate preview HTML from current code
  const previewHtml = useMemo(() => {
    if (!currentProject?.codeFiles) return "";
    return generatePreviewHtml(currentProject.codeFiles, currentProject.name);
  }, [currentProject?.codeFiles, currentProject?.name]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Initialize tabs when showing code editor
  useEffect(() => {
    if (showCodeEditor && openTabs.length === 0 && currentProject?.codeFiles) {
      const files = Object.keys(currentProject.codeFiles);
      const firstFile =
        files.find((f) => f === "App.tsx" || f === "App.js") || files[0];
      if (firstFile) {
        setOpenTabs([firstFile]);
        setCurrentFile(firstFile);
      }
    }
  }, [
    showCodeEditor,
    currentProject?.codeFiles,
    openTabs.length,
    setCurrentFile,
  ]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log("[WebWorkspace] handleSubmit called", {
      input: input.trim(),
      projectId: currentProject?.id,
      isGenerating,
    });

    if (!input.trim() || !currentProject || isGenerating) {
      console.log("[WebWorkspace] Early return - conditions not met");
      return;
    }

    const userMessage = input.trim();
    setInput("");

    addMessage({ role: "user", content: userMessage });
    setIsGenerating(true);
    setProgressMessage("Analyzing your request...");

    try {
      console.log("[WebWorkspace] Making fetch request...");
      const response = await fetch("/api/vibe/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          projectId: currentProject.id,
        }),
      });

      console.log(
        "[WebWorkspace] Response received:",
        response.status,
        response.ok,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[WebWorkspace] Response error:", errorText);
        throw new Error(`Failed to generate code: ${response.status}`);
      }

      console.log("[WebWorkspace] Starting to read SSE stream...");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        console.error("[WebWorkspace] No reader available from response body");
        throw new Error("No response body");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        console.log("[WebWorkspace] Stream read:", {
          done,
          hasValue: !!value,
          valueLength: value?.length,
        });

        if (done) {
          console.log("[WebWorkspace] Stream complete - resetting state");
          // Stream ended - reset generating state if no pending spec
          setIsGenerating(false);
          setProgressMessage(null);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        console.log("[WebWorkspace] Chunk received:", chunk.substring(0, 100));

        // Process complete lines from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            console.log("[WebWorkspace] SSE data:", jsonStr.substring(0, 100));

            if (jsonStr === "[DONE]") {
              console.log("[WebWorkspace] Received DONE signal");
              continue;
            }

            try {
              const data = JSON.parse(jsonStr);
              console.log(
                "[WebWorkspace] Parsed SSE event:",
                data.type,
                data.phase,
              );

              // Handle phase updates (multi-agent format)
              if (data.type === "phase") {
                setCurrentPhase(data.phase);
                setProgressMessage(
                  `${data.icon} ${data.message}: ${data.detail || ""}`,
                );

                // Check if awaiting confirmation with appSpec
                if (data.phase === "awaiting_confirmation" && data.appSpec) {
                  console.log(
                    "[WebWorkspace] Received app spec for confirmation:",
                    data.appSpec.name,
                  );
                  setPendingSpec(data.appSpec);
                  setIsGenerating(false);
                }
              }

              // Handle legacy progress updates
              if (data.type === "progress") {
                setProgressMessage(data.message);
              }

              if (data.type === "error") {
                console.error("[WebWorkspace] Error from server:", data.error);
                addMessage({
                  role: "assistant",
                  content: `Sorry, there was an error: ${data.error}`,
                });
                toast({
                  title: "Generation failed",
                  description: data.error,
                  variant: "destructive",
                });
              }

              if (data.type === "complete") {
                console.log(
                  "[WebWorkspace] Generation complete:",
                  Object.keys(data.codeFiles || {}).length,
                  "files",
                );
                addMessage({
                  role: "assistant",
                  content:
                    data.message ||
                    "I've updated your app! Check out the preview.",
                  model: data.model,
                  codeChanges: data.codeFiles,
                });

                if (data.codeFiles) {
                  setCodeFiles({
                    ...currentProject.codeFiles,
                    ...data.codeFiles,
                  });
                }

                setPendingSpec(null);
                toast({
                  title: "App updated!",
                  description: "Your changes are live in the preview",
                });
              }
            } catch (e) {
              console.error(
                "[WebWorkspace] Failed to parse SSE:",
                e,
                "Raw:",
                jsonStr.substring(0, 200),
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("[WebWorkspace] Generation error:", error);
      addMessage({
        role: "assistant",
        content: `Sorry, something went wrong: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      toast({
        title: "Generation failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      // Only reset on error
      setIsGenerating(false);
      setProgressMessage(null);
    }
    // Note: Don't use finally - isGenerating is set to false in the stream handlers
    // when awaiting_confirmation or complete is received
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log("[WebWorkspace] Key pressed:", e.key);
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      console.log("[WebWorkspace] Enter pressed, calling handleSubmit");
      handleSubmit();
    }
  };

  // Spec editing functions
  const addFeature = () => {
    if (!pendingSpec || !newFeature.trim()) return;
    setPendingSpec({
      ...pendingSpec,
      features: [...pendingSpec.features, newFeature.trim()],
    });
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    if (!pendingSpec) return;
    setPendingSpec({
      ...pendingSpec,
      features: pendingSpec.features.filter((_, i) => i !== index),
    });
  };

  const addScreen = () => {
    if (!pendingSpec || !newScreenName.trim()) return;
    setPendingSpec({
      ...pendingSpec,
      screens: [
        ...pendingSpec.screens,
        { name: newScreenName.trim(), description: "" },
      ],
    });
    setNewScreenName("");
  };

  const removeScreen = (index: number) => {
    if (!pendingSpec) return;
    setPendingSpec({
      ...pendingSpec,
      screens: pendingSpec.screens.filter((_, i) => i !== index),
    });
  };

  // Confirm app spec and build
  const handleConfirmSpec = async () => {
    if (!pendingSpec || !currentProject) return;

    setIsGenerating(true);
    setProgressMessage("🔨 Building your app...");

    try {
      const response = await fetch("/api/vibe/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: currentProject.id,
          spec: pendingSpec,
        }),
      });

      if (!response.ok) throw new Error("Build request failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6);
              if (jsonStr === "[DONE]") continue;

              try {
                const data = JSON.parse(jsonStr);

                if (data.type === "phase") {
                  setProgressMessage(
                    `${data.icon} ${data.message}: ${data.detail || ""}`,
                  );
                }

                if (data.type === "error") {
                  toast({
                    title: "Build failed",
                    description: data.error,
                    variant: "destructive",
                  });
                }

                if (data.type === "complete") {
                  addMessage({
                    role: "assistant",
                    content: data.message || "Your app is ready!",
                    model: "grok",
                    codeChanges: data.codeFiles,
                  });

                  if (data.codeFiles) {
                    setCodeFiles({
                      ...currentProject.codeFiles,
                      ...data.codeFiles,
                    });
                  }

                  setPendingSpec(null);
                  toast({
                    title: "App built successfully!",
                    description: `Generated ${Object.keys(data.codeFiles || {}).length} files`,
                  });
                }
              } catch (e) {
                console.error("Failed to parse SSE:", e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Build error:", error);
      toast({
        title: "Build failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgressMessage(null);
    }
  };

  // Cancel spec and start over
  const handleCancelSpec = () => {
    setPendingSpec(null);
    setCurrentPhase(null);
    toast({
      title: "Cancelled",
      description: "You can describe your app again",
    });
  };

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined && currentFile && currentProject) {
        updateCodeFile(currentFile, value);
      }
    },
    [currentFile, currentProject, updateCodeFile],
  );

  const handleCloseTab = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenTabs((prev) => prev.filter((tab) => tab !== filePath));
    if (currentFile === filePath) {
      const remaining = openTabs.filter((tab) => tab !== filePath);
      setCurrentFile(remaining[remaining.length - 1] || null);
    }
  };

  const openFileInEditor = (filePath: string) => {
    if (!openTabs.includes(filePath)) {
      setOpenTabs((prev) => [...prev, filePath]);
    }
    setCurrentFile(filePath);
    setShowCodeEditor(true);
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  // Build file tree structure
  const fileTree = useMemo((): FileTreeNode => {
    if (!currentProject?.codeFiles) return {};

    const tree: FileTreeNode = {};
    const files = Object.keys(currentProject.codeFiles);

    files.forEach((filePath) => {
      const parts = filePath.split("/");
      let current: FileTreeNode = tree;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          const files = current._files as string[] | undefined;
          if (!files) current._files = [];
          (current._files as string[]).push(filePath);
        } else {
          if (!current[part]) current[part] = {};
          current = current[part] as FileTreeNode;
        }
      });
    });

    return tree;
  }, [currentProject?.codeFiles]);

  // Render file tree
  const renderFileTree = useCallback(
    (tree: FileTreeNode, basePath = ""): React.ReactNode[] => {
      const items: React.ReactNode[] = [];

      Object.keys(tree).forEach((key) => {
        if (key === "_files") return;

        const folderPath = basePath ? `${basePath}/${key}` : key;
        const isExpanded = expandedFolders.has(folderPath);

        items.push(
          <div key={folderPath}>
            <button
              onClick={() => toggleFolder(folderPath)}
              className="w-full flex items-center gap-1.5 px-2 py-1 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-violet-400" />
              ) : (
                <Folder className="h-4 w-4 text-violet-400" />
              )}
              <span>{key}</span>
            </button>
            {isExpanded && (
              <div className="ml-4 border-l border-white/10 pl-2">
                {renderFileTree(tree[key] as FileTreeNode, folderPath)}
              </div>
            )}
          </div>,
        );
      });

      const filesInTree = tree._files as string[] | undefined;
      if (filesInTree) {
        filesInTree.forEach((filePath: string) => {
          const fileName = filePath.split("/").pop() || filePath;
          const isActive = currentFile === filePath;
          const isOpen = openTabs.includes(filePath);

          items.push(
            <button
              key={filePath}
              onClick={() => openFileInEditor(filePath)}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors",
                isActive
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5",
              )}
            >
              <File className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{fileName}</span>
              {isOpen && (
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 ml-auto" />
              )}
            </button>,
          );
        });
      }

      return items;
    },
    [expandedFolders, currentFile, openTabs],
  );

  // Platform-specific quick prompts
  const getQuickPrompts = () => {
    const platform = currentProject?.platform;

    if (platform === "WEB") {
      return [
        "Create a landing page with hero section",
        "Add a responsive navigation bar",
        "Build a contact form with validation",
        "Add dark mode toggle",
        "Create a pricing table",
        "Add smooth scroll animations",
      ];
    } else if (platform === "IOS") {
      return [
        "Create a tab bar navigation",
        "Add a settings screen with toggles",
        "Build a list with pull to refresh",
        "Add haptic feedback on buttons",
        "Create a profile screen",
        "Add iOS-style modal sheets",
      ];
    } else if (platform === "ANDROID") {
      return [
        "Create a bottom navigation bar",
        "Add a floating action button",
        "Build a card-based list view",
        "Create a drawer navigation menu",
        "Add Material Design buttons",
        "Build a search bar with filters",
      ];
    }

    return [
      "Add a navigation bar",
      "Make it dark mode",
      "Add a contact form",
      "Add animations",
    ];
  };

  const quickPrompts = getQuickPrompts();

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center text-slate-400">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No project selected</p>
        </div>
      </div>
    );
  }

  const currentContent = currentFile
    ? currentProject.codeFiles?.[currentFile] || ""
    : "";
  const language = currentFile ? getLanguageForFile(currentFile) : "typescript";

  return (
    <TooltipProvider>
      <div className={cn("h-full flex bg-[#0a0a0f]", className)}>
        {/* Left Panel: Chat */}
        <div className="w-96 flex flex-col border-r border-white/5 bg-black/20">
          {/* Chat Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-medium text-white">
                  AI Builder
                </span>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span className="text-xs text-slate-500">
                    {remainingCredits.toLocaleString()} credits
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="py-8">
                  <div className="text-center mb-6">
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 mb-4">
                      <Sparkles className="h-8 w-8 text-violet-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">
                      What do you want to build?
                    </h3>
                    <p className="text-sm text-slate-400">
                      Describe your app and watch it come to life
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                      Try these
                    </p>
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setInput(prompt)}
                        className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/30 hover:bg-white/10 transition-all text-sm text-slate-300 hover:text-white flex items-center gap-2 group"
                      >
                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-violet-400" />
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    onViewCode={
                      message.codeChanges
                        ? () => {
                            const files = Object.keys(
                              message.codeChanges || {},
                            );
                            if (files[0]) openFileInEditor(files[0]);
                          }
                        : undefined
                    }
                  />
                ))
              )}

              {isGenerating && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 rounded-2xl rounded-tl-sm bg-white/5 border border-white/5 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                      {progressMessage || "Generating..."}
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Spec Confirmation with Editing */}
              {pendingSpec && !isGenerating && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 rounded-2xl rounded-tl-sm bg-white/5 border border-white/5 px-4 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">📋</span>
                      <span className="font-medium text-white">
                        Review & Edit Your App
                      </span>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-white font-medium">
                          {pendingSpec.name}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {pendingSpec.description}
                        </p>
                      </div>

                      {/* Editable Features */}
                      <div>
                        <p className="text-slate-300 text-xs font-medium mb-2">
                          Features (click to edit)
                        </p>
                        <div className="space-y-1">
                          {pendingSpec.features.map((feature, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1 group"
                            >
                              {editingFeature === i ? (
                                <Input
                                  value={feature}
                                  onChange={(e) => {
                                    const updated = [...pendingSpec.features];
                                    updated[i] = e.target.value;
                                    setPendingSpec({
                                      ...pendingSpec,
                                      features: updated,
                                    });
                                  }}
                                  onBlur={() => setEditingFeature(null)}
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && setEditingFeature(null)
                                  }
                                  className="h-6 text-xs bg-white/10 border-violet-500/50"
                                  autoFocus
                                />
                              ) : (
                                <>
                                  <Badge
                                    variant="outline"
                                    className="text-xs cursor-pointer hover:border-violet-500/50"
                                    onClick={() => setEditingFeature(i)}
                                  >
                                    {feature}
                                  </Badge>
                                  <button
                                    onClick={() => removeFeature(i)}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          ))}
                          <div className="flex items-center gap-1 mt-2">
                            <Input
                              value={newFeature}
                              onChange={(e) => setNewFeature(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && addFeature()
                              }
                              placeholder="Add feature..."
                              className="h-6 text-xs bg-white/5 border-white/10 flex-1"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={addFeature}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Editable Screens */}
                      <div>
                        <p className="text-slate-300 text-xs font-medium mb-2">
                          Screens
                        </p>
                        <div className="space-y-1">
                          {pendingSpec.screens.map((screen, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1 group"
                            >
                              <Badge variant="secondary" className="text-xs">
                                {screen.name}
                              </Badge>
                              <button
                                onClick={() => removeScreen(i)}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center gap-1 mt-2">
                            <Input
                              value={newScreenName}
                              onChange={(e) => setNewScreenName(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && addScreen()
                              }
                              placeholder="Add screen..."
                              className="h-6 text-xs bg-white/5 border-white/10 flex-1"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={addScreen}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {pendingSpec.api.authRequired && <span>🔐 Auth</span>}
                        {pendingSpec.api.paymentsRequired && (
                          <span>💳 Payments</span>
                        )}
                        {pendingSpec.api.collections.length > 0 && (
                          <span>
                            📦 {pendingSpec.api.collections.length} collections
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{
                            backgroundColor: pendingSpec.styling.primaryColor,
                          }}
                        />
                        <span className="text-xs text-slate-400 capitalize">
                          {pendingSpec.styling.style} style
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600"
                        onClick={handleConfirmSpec}
                      >
                        ✓ Build This
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelSpec}
                      >
                        ✕ Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-white/5">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to build..."
                className="min-h-[52px] max-h-[120px] pr-12 resize-none bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                disabled={isGenerating}
              />
              <Button
                size="icon"
                className="absolute right-2 bottom-2 h-8 w-8 bg-gradient-to-r from-violet-600 to-indigo-600"
                onClick={() => handleSubmit()}
                disabled={!input.trim() || isGenerating}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-600">Enter to send</p>
          </div>
        </div>

        {/* Right Panel: Preview + Optional Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 bg-black/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-white">
                  Live Preview
                </span>
              </div>
              {currentProject.subdomain && (
                <span className="text-xs text-slate-500">
                  {currentProject.subdomain}.rux.sh
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 gap-2",
                      showCodeEditor
                        ? "text-violet-400 bg-violet-500/10"
                        : "text-slate-400 hover:text-white",
                    )}
                    onClick={() => setShowCodeEditor(!showCodeEditor)}
                  >
                    <Code2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Code</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showCodeEditor ? "Hide Code" : "Show Code"}
                </TooltipContent>
              </Tooltip>

              {showCodeEditor && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 gap-2",
                        showExplorer
                          ? "text-violet-400"
                          : "text-slate-400 hover:text-white",
                      )}
                      onClick={() => setShowExplorer(!showExplorer)}
                    >
                      <FolderTree className="h-4 w-4" />
                      <span className="hidden sm:inline">Files</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showExplorer ? "Hide Files" : "Show Files"}
                  </TooltipContent>
                </Tooltip>
              )}

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

              {currentProject.subdomain && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-white"
                      onClick={() =>
                        window.open(
                          `/api/serve?subdomain=${currentProject.subdomain}`,
                          "_blank",
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open in New Tab</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Code Editor (collapsible) - takes 50% when open, better balance */}
            {showCodeEditor && (
              <div className="flex w-1/2 border-r border-white/5">
                {/* File Explorer */}
                {showExplorer && (
                  <div className="w-56 border-r border-white/5 bg-black/20 flex flex-col">
                    <div className="h-10 px-3 flex items-center justify-between border-b border-white/5">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Files
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {Object.keys(currentProject.codeFiles || {}).length}
                      </Badge>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-2 space-y-0.5">
                        {renderFileTree(fileTree)}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Editor Section */}
                <div className="flex-1 flex flex-col">
                  {/* Tabs */}
                  <div className="flex items-center border-b border-white/5 bg-black/20 overflow-x-auto">
                    {openTabs.map((filePath) => {
                      const fileName = filePath.split("/").pop() || filePath;
                      const isActive = filePath === currentFile;
                      return (
                        <div
                          key={filePath}
                          onClick={() => setCurrentFile(filePath)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 text-sm border-r border-white/5 cursor-pointer group",
                            isActive
                              ? "bg-white/5 text-white border-b-2 border-b-violet-500"
                              : "text-slate-400 hover:text-white hover:bg-white/5",
                          )}
                        >
                          <File className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[100px]">
                            {fileName}
                          </span>
                          <button
                            onClick={(e) => handleCloseTab(filePath, e)}
                            className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Editor */}
                  <div className="flex-1">
                    {currentFile ? (
                      <Editor
                        height="100%"
                        language={language}
                        value={currentContent}
                        onChange={handleEditorChange}
                        theme="vs-dark"
                        options={{
                          fontSize: 14,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          wordWrap: "on",
                          tabSize: 2,
                          padding: { top: 16 },
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500">
                        <div className="text-center">
                          <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Select a file from explorer</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            <div
              className={cn(
                "flex-1 p-4 relative",
                isPreviewFullscreen && "fixed inset-0 z-50 bg-[#0a0a0f] p-0",
              )}
            >
              {/* Fullscreen exit button */}
              {isPreviewFullscreen && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-4 right-4 z-10 bg-black/80 border-white/20 text-white hover:bg-black/90"
                  onClick={() => setIsPreviewFullscreen(false)}
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Exit Fullscreen
                </Button>
              )}

              <div
                className={cn(
                  "h-full rounded-xl overflow-hidden border border-white/10 bg-white",
                  isPreviewFullscreen && "rounded-none border-0",
                )}
              >
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full border-0"
                    title="Live Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-slate-100">
                    <div className="text-center text-slate-500">
                      <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Start building to see your app here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Chat Bubble Component
function ChatBubble({
  message,
  onViewCode,
}: {
  message: ChatMessage;
  onViewCode?: () => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl shrink-0",
          isUser
            ? "bg-slate-700"
            : "bg-gradient-to-br from-violet-600 to-indigo-600",
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      <div
        className={cn(
          "flex-1 rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-violet-600/20 border border-violet-500/20 rounded-tr-sm text-white"
            : "bg-white/5 border border-white/5 rounded-tl-sm text-slate-200",
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

        {message.codeChanges && Object.keys(message.codeChanges).length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            >
              <Zap className="h-3 w-3 mr-1" />
              {Object.keys(message.codeChanges).length} files updated
            </Badge>
            {onViewCode && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-slate-400 hover:text-white"
                onClick={onViewCode}
              >
                <Code2 className="h-3 w-3 mr-1" />
                View Code
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
