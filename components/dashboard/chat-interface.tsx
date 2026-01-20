"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useProjectStore } from "@/stores/project-store";
import { useUserStore, useRemainingCredits } from "@/stores/user-store";
import { ChatMessage } from "@/types";
import { Send, Sparkles, User, Bot, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export function ChatInterface() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [, setBuildId] = useState<string | null>(null);
  const [buildStatus, setBuildStatus] = useState<string | null>(null);
  const [buildUrl, setBuildUrl] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    currentProject,
    messages,
    addMessage,
    isGenerating,
    setIsGenerating,
    setCodeFiles,
  } = useProjectStore();

  const deductCredits = useUserStore((state) => state.useCredits);
  const remainingCredits = useRemainingCredits();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200,
      )}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || !currentProject || isGenerating) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message using store
    addMessage({
      role: "user",
      content: userMessage,
    });

    setIsGenerating(true);
    setProgressMessage("Initializing AI generation...");

    try {
      const response = await fetch("/api/vibe/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          projectId: currentProject.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate code");
      }

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

                // Handle progress updates
                if (data.type === "progress") {
                  setProgressMessage(data.message);
                }

                // Handle error
                if (data.type === "error") {
                  addMessage({
                    role: "assistant",
                    content: `Sorry, I encountered an error: ${data.error}. Please try again.`,
                  });

                  toast({
                    title: "Generation failed",
                    description: data.error,
                    variant: "destructive",
                  });
                }

                // Handle final result
                if (data.type === "complete") {
                  // Add assistant message using store
                  addMessage({
                    role: "assistant",
                    content:
                      data.message ||
                      "I've updated your code based on your request.",
                    model: data.model,
                    codeChanges: data.codeFiles,
                  });

                  // Update code files
                  if (data.codeFiles) {
                    setCodeFiles({
                      ...currentProject.codeFiles,
                      ...data.codeFiles,
                    });
                  }

                  // Deduct credits locally for immediate UI feedback
                  // Server already deducted, this syncs local state
                  deductCredits(100); // CREDIT_COSTS.codeGeneration

                  toast({
                    title: "Code generated",
                    description: `${Object.keys(data.codeFiles || {}).length} files updated`,
                  });

                  // Reset build state on new generation
                  setBuildId(null);
                  setBuildStatus(null);
                  setBuildUrl(null);
                }
              } catch (e) {
                console.error("Failed to parse SSE data:", e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Generation error:", error);

      addMessage({
        role: "assistant",
        content: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try again.`,
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

  // Build web preview
  const handleBuildWebPreview = async () => {
    if (!currentProject || isBuilding) return;

    setIsBuilding(true);

    try {
      const response = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: currentProject.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start build");
      }

      const data = await response.json();
      setBuildId(data.buildId);
      setBuildStatus(data.status);

      toast({
        title: "Build started",
        description: "Building web preview...",
      });

      // Start polling for build status
      pollBuildStatus(data.buildId);
    } catch (error) {
      console.error("Build error:", error);
      toast({
        title: "Build failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsBuilding(false);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  // Poll build status with proper cleanup
  const pollBuildStatus = useCallback((id: string) => {
    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/build?buildId=${id}`);
        if (!response.ok) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          return;
        }

        const data = await response.json();

        setBuildStatus(data.status);

        if (data.status === "finished" && data.url) {
          setBuildUrl(data.url);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          toast({
            title: "Build complete!",
            description: "Your web preview is ready",
          });
        } else if (data.status === "errored") {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          toast({
            title: "Build failed",
            description: data.error || "Build encountered an error",
            variant: "destructive",
          });
        }
      } catch (error) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        console.error("Status check error:", error);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 10 minutes
    pollTimeoutRef.current = setTimeout(
      () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      },
      10 * 60 * 1000,
    );
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <h2 className="font-semibold text-white">Vibe Chat</h2>
        </div>
        <Badge variant="outline" className="text-xs">
          <Zap className="h-3 w-3 mr-1" />
          {remainingCredits.toLocaleString()} credits
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onBuildWebPreview={handleBuildWebPreview}
                isBuilding={isBuilding}
                buildStatus={buildStatus}
                buildUrl={buildUrl}
              />
            ))
          )}

          {isGenerating && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="glass rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressMessage || "Generating code..."}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-white/5">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            className="min-h-[60px] max-h-[200px] pr-12 resize-none"
            disabled={isGenerating || !currentProject}
          />
          <Button
            size="icon"
            variant="gradient"
            className="absolute right-2 bottom-2 h-8 w-8"
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating || !currentProject}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onBuildWebPreview,
  isBuilding,
  buildStatus,
  buildUrl,
}: {
  message: ChatMessage;
  onBuildWebPreview?: () => void;
  isBuilding?: boolean;
  buildStatus?: string | null;
  buildUrl?: string | null;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
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

      {/* Message content */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser ? "bg-violet-500/20 rounded-tr-none" : "glass rounded-tl-none",
        )}
      >
        <p className="text-sm text-slate-200 whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Code changes indicator */}
        {message.codeChanges && Object.keys(message.codeChanges).length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-xs text-slate-400">
              Updated {Object.keys(message.codeChanges).length} file(s)
            </p>
          </div>
        )}

        {/* Build controls for assistant messages with code changes */}
        {!isUser &&
          message.codeChanges &&
          Object.keys(message.codeChanges).length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onBuildWebPreview}
                  disabled={isBuilding}
                  className="gap-2"
                >
                  {isBuilding ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Zap className="h-3 w-3" />
                  )}
                  {isBuilding ? "Building..." : "Build Web Preview"}
                </Button>

                {buildStatus && (
                  <Badge variant="outline" className="text-xs">
                    {buildStatus}
                  </Badge>
                )}

                {buildUrl && (
                  <Button
                    size="sm"
                    variant="gradient"
                    onClick={() => window.open(buildUrl, "_blank")}
                    className="gap-2"
                  >
                    Open Preview
                  </Button>
                )}
              </div>

              {!buildUrl && buildStatus && buildStatus !== "finished" && (
                <p className="text-xs text-slate-400 mt-1">
                  This may take 2-3 minutes...
                </p>
              )}
            </div>
          )}

        {/* Model badge */}
        {message.model && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {message.model === "claude" ? "Claude" : "Grok"}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  const prompts = [
    "Build a todo app with categories and due dates",
    "Create a weather app with current location",
    "Make a recipe book with favorites",
    "Design a fitness tracker with progress charts",
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 mb-4">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white">
          Start building with AI
        </h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Describe your app idea in natural language and watch RUX generate
          production-ready React Native code.
        </p>
        <div className="grid grid-cols-1 gap-2 mt-6 max-w-sm mx-auto">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                // This would trigger the input to be set to this prompt
                // For now, just show it's interactive
              }}
              className="text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-colors text-sm text-slate-300 hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
