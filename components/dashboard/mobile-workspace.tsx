"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Snack, SnackFiles } from "snack-sdk";
import type { SnackState } from "snack-sdk";
import Editor from "@monaco-editor/react";
import { useProjectStore } from "@/stores/project-store";
import { useRemainingCredits } from "@/stores/user-store";
import { getLanguageForFile } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
  Zap,
  Code2,
  ChevronRight,
  X,
  File,
  Maximize2,
  Minimize2,
  FolderTree,
  Smartphone,
  Plus,
  Monitor,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ChatMessage } from "@/types";
import QRCode from "qrcode";

const SNACK_SDK_VERSION = "54.0.0";
type PreviewMode = "web" | "device";

// App Spec type for pending confirmation
interface AppSpec {
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
}

interface MobileWorkspaceProps {
  className?: string;
}

export function MobileWorkspace({ className }: MobileWorkspaceProps) {
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
  const [pendingSpec, setPendingSpec] = useState<AppSpec | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);

  // Spec editing state
  const [editingFeature, setEditingFeature] = useState<number | null>(null);
  const [newFeature, setNewFeature] = useState("");
  const [newScreenName, setNewScreenName] = useState("");

  // Snack SDK state
  const [snack, setSnack] = useState<InstanceType<typeof Snack> | null>(null);
  const [snackState, setSnackState] = useState<SnackState | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("web");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const webPreviewRef = useRef<{ current: Window | null }>({ current: null });

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convert project code files to Snack files format
  const convertToSnackFiles = useCallback(
    (codeFiles: Record<string, string>): SnackFiles => {
      const snackFiles: SnackFiles = {};
      Object.entries(codeFiles).forEach(([path, content]) => {
        snackFiles[path] = {
          type: "CODE",
          contents: content,
        };
      });
      return snackFiles;
    },
    [],
  );

  // Initialize Snack SDK
  useEffect(() => {
    if (
      !currentProject?.codeFiles ||
      Object.keys(currentProject.codeFiles).length === 0
    ) {
      return;
    }

    const snackInstance = new Snack({
      name: currentProject.name || "RUX App",
      description: currentProject.description || "Built with RUX",
      sdkVersion: SNACK_SDK_VERSION,
      files: convertToSnackFiles(currentProject.codeFiles),
      dependencies: {
        "expo-status-bar": { version: "*" },
        "expo-blur": { version: "*" },
        "expo-haptics": { version: "*" },
        "expo-linear-gradient": { version: "*" },
        "react-native-safe-area-context": { version: "*" },
        "@expo/vector-icons": { version: "*" },
        "@react-navigation/native": { version: "*" },
        "@react-navigation/native-stack": { version: "*" },
        "react-native-screens": { version: "*" },
      },
      online: true,
      codeChangesDelay: 500,
      webPreviewRef: webPreviewRef.current,
    });

    setSnack(snackInstance);

    const unsubscribe = snackInstance.addStateListener((state) => {
      setSnackState(state);
      setIsPreviewLoading(false);

      // Generate QR code when online
      if (state.online && state.url) {
        QRCode.toDataURL(state.url, { width: 200, margin: 2 })
          .then(setQrCodeUrl)
          .catch(console.error);
        setIsOnline(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentProject?.id, currentProject?.codeFiles, convertToSnackFiles]);

  // Update snack files when code changes
  useEffect(() => {
    if (snack && currentProject?.codeFiles) {
      snack.updateFiles(convertToSnackFiles(currentProject.codeFiles));
    }
  }, [snack, currentProject?.codeFiles, convertToSnackFiles]);

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
    console.log("[MobileWorkspace] handleSubmit called", {
      input: input.trim(),
      projectId: currentProject?.id,
      isGenerating,
    });

    if (!input.trim() || !currentProject || isGenerating) {
      console.log("[MobileWorkspace] Early return - conditions not met");
      return;
    }

    const userMessage = input.trim();
    setInput("");

    addMessage({ role: "user", content: userMessage });
    setIsGenerating(true);
    setProgressMessage("Analyzing your request...");

    try {
      console.log("[MobileWorkspace] Making fetch request...");
      const response = await fetch("/api/vibe/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          projectId: currentProject.id,
        }),
      });

      console.log(
        "[MobileWorkspace] Response received:",
        response.status,
        response.ok,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[MobileWorkspace] Response error:", errorText);
        throw new Error(`Failed to generate code: ${response.status}`);
      }

      console.log("[MobileWorkspace] Starting to read SSE stream...");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        console.error(
          "[MobileWorkspace] No reader available from response body",
        );
        throw new Error("No response body");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        console.log("[MobileWorkspace] Stream read:", {
          done,
          hasValue: !!value,
        });

        if (done) {
          console.log("[MobileWorkspace] Stream complete - resetting state");
          setIsGenerating(false);
          setProgressMessage(null);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        console.log(
          "[MobileWorkspace] Chunk received:",
          chunk.substring(0, 100),
        );

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            console.log(
              "[MobileWorkspace] SSE data:",
              jsonStr.substring(0, 100),
            );

            if (jsonStr === "[DONE]") {
              console.log("[MobileWorkspace] Received DONE signal");
              continue;
            }

            try {
              const data = JSON.parse(jsonStr);
              console.log(
                "[MobileWorkspace] Parsed SSE event:",
                data.type,
                data.phase,
              );

              if (data.type === "phase") {
                setCurrentPhase(data.phase);
                setProgressMessage(
                  `${data.icon} ${data.message}: ${data.detail || ""}`,
                );

                if (data.phase === "awaiting_confirmation" && data.appSpec) {
                  console.log(
                    "[MobileWorkspace] Received app spec for confirmation:",
                    data.appSpec.name,
                  );
                  setPendingSpec(data.appSpec);
                  setIsGenerating(false);
                }
              }

              if (data.type === "progress") {
                setProgressMessage(data.message);
              }

              if (data.type === "error") {
                console.error(
                  "[MobileWorkspace] Error from server:",
                  data.error,
                );
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
                  "[MobileWorkspace] Generation complete:",
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
              console.error("[MobileWorkspace] Failed to parse SSE:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("[MobileWorkspace] Generation error:", error);
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
      setIsGenerating(false);
      setProgressMessage(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
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

  const updateFeature = (index: number, value: string) => {
    if (!pendingSpec) return;
    const updated = [...pendingSpec.features];
    updated[index] = value;
    setPendingSpec({ ...pendingSpec, features: updated });
    setEditingFeature(null);
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
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

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

  // Platform-specific quick prompts
  const quickPrompts =
    currentProject?.platform === "IOS"
      ? [
          "Create a tab bar navigation",
          "Add a settings screen with toggles",
          "Build a list with pull to refresh",
          "Add haptic feedback on buttons",
        ]
      : [
          "Create a bottom navigation bar",
          "Add a floating action button",
          "Build a card-based list view",
          "Create a drawer navigation menu",
        ];

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
  const webPreviewUrl = snackState?.webPreviewURL;

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
            <Badge variant="outline" className="text-xs">
              {currentProject.platform}
            </Badge>
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
                      Describe your {currentProject.platform} app
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
              {/* Status Indicator */}
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
                <span className="text-sm font-medium text-white">Preview</span>
              </div>

              {/* Preview Mode Toggle */}
              <div className="flex items-center bg-white/5 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-3 gap-1.5",
                    previewMode === "web"
                      ? "bg-violet-500/20 text-violet-300"
                      : "text-slate-400 hover:text-white",
                  )}
                  onClick={() => setPreviewMode("web")}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span className="text-xs">Web</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-3 gap-1.5",
                    previewMode === "device"
                      ? "bg-violet-500/20 text-violet-300"
                      : "text-slate-400 hover:text-white",
                  )}
                  onClick={() => setPreviewMode("device")}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span className="text-xs">Device</span>
                </Button>
              </div>

              <Badge variant="outline" className="text-xs">
                {currentProject.platform}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* QR Code Button */}
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

              {/* Open in Expo Snack */}
              {snackState?.url && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-white"
                      onClick={() => window.open(snackState.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open in Expo Snack</TooltipContent>
                </Tooltip>
              )}

              <div className="w-px h-5 bg-white/10" />

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
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Code Editor (collapsible) */}
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
                        {Object.keys(currentProject.codeFiles || {}).map(
                          (filePath) => {
                            const fileName =
                              filePath.split("/").pop() || filePath;
                            const isActive = filePath === currentFile;
                            const isOpen = openTabs.includes(filePath);

                            return (
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
                              </button>
                            );
                          },
                        )}
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
                {/* Show empty state if no code files yet */}
                {!currentProject.codeFiles ||
                Object.keys(currentProject.codeFiles).length === 0 ? (
                  <div className="h-full flex items-center justify-center bg-slate-900">
                    <div className="text-center text-slate-400">
                      <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-white font-medium mb-2">
                        Start building to see your app
                      </p>
                      <p className="text-sm">
                        Describe what you want to build in the chat
                      </p>
                    </div>
                  </div>
                ) : previewMode === "web" ? (
                  // Web Preview (runs in browser via Snack)
                  webPreviewUrl ? (
                    <iframe
                      ref={iframeRef}
                      src={webPreviewUrl}
                      className="w-full h-full border-0 bg-white"
                      title="Web Preview"
                      allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                      onLoad={() => {
                        if (iframeRef.current?.contentWindow) {
                          webPreviewRef.current.current =
                            iframeRef.current.contentWindow;
                          setIsPreviewLoading(false);
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-slate-900">
                      <div className="text-center text-slate-400">
                        <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">Initializing preview...</p>
                        <p className="text-xs mt-2">Connecting to Expo Snack</p>
                      </div>
                    </div>
                  )
                ) : (
                  // Device Preview (QR code for Expo Go)
                  <div className="h-full flex items-center justify-center bg-slate-900">
                    <div className="text-center">
                      {qrCodeUrl ? (
                        <>
                          <div className="bg-white p-4 rounded-xl inline-block mb-4">
                            <img
                              src={qrCodeUrl}
                              alt="QR Code"
                              className="w-48 h-48"
                            />
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Scan with Expo Go
                          </h3>
                          <p className="text-sm text-slate-400 max-w-xs mx-auto">
                            Open the Expo Go app on your{" "}
                            {currentProject.platform === "IOS"
                              ? "iPhone"
                              : "Android"}{" "}
                            and scan this QR code to preview your app
                          </p>
                          {snackState?.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4"
                              onClick={() =>
                                window.open(snackState.url, "_blank")
                              }
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open in Expo Snack
                            </Button>
                          )}
                        </>
                      ) : (
                        <div className="text-slate-400">
                          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                          <p>Generating QR code...</p>
                          <p className="text-xs mt-2">Connecting to Expo...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQrModal && qrCodeUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setShowQrModal(false)}
          >
            <div
              className="bg-slate-900 rounded-2xl p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white p-6 rounded-xl inline-block mb-4">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Scan with Expo Go
              </h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
                Download Expo Go from the App Store or Play Store, then scan
                this code to preview on your device
              </p>
              <Button variant="outline" onClick={() => setShowQrModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
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
