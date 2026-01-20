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
  X,
  File,
  Maximize2,
  Minimize2,
  FolderTree,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ChatMessage } from "@/types";

interface WebWorkspaceProps {
  className?: string;
}

export function WebWorkspace({ className }: WebWorkspaceProps) {
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
    if (!input.trim() || !currentProject || isGenerating) return;

    const userMessage = input.trim();
    setInput("");

    addMessage({ role: "user", content: userMessage });
    setIsGenerating(true);
    setProgressMessage("Analyzing your request...");

    try {
      const response = await fetch("/api/vibe/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          projectId: currentProject.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate code");

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

                if (data.type === "progress") {
                  setProgressMessage(data.message);
                }

                if (data.type === "error") {
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

                  toast({
                    title: "App updated!",
                    description: "Your changes are live in the preview",
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
      console.error("Generation error:", error);
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
    } finally {
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
