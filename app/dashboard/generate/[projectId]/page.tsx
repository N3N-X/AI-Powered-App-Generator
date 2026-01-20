"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
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
import { useProjectStore } from "@/stores/project-store";
import { useUserStore, useRemainingCredits } from "@/stores/user-store";
import { ChatMessage } from "@/types";
import {
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
  Zap,
  PanelLeftClose,
  PanelLeft,
  Download,
  Github,
  ChevronRight,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Dynamically import editors with SSR disabled
const SnackEditor = dynamic(
  () =>
    import("@/components/dashboard/snack-editor").then(
      (mod) => mod.SnackEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-white/5 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading editor...</p>
        </div>
      </div>
    ),
  },
);

const WebWorkspace = dynamic(
  () =>
    import("@/components/dashboard/web-workspace").then(
      (mod) => mod.WebWorkspace,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading workspace...</p>
        </div>
      </div>
    ),
  },
);

export default function ProjectWorkspace() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const { user: clerkUser } = useUser();
  const { currentProject, setCurrentProject, setProjects } = useProjectStore();
  const { setUser, setConnectedServices } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!clerkUser) return;

      try {
        setIsLoading(true);
        setError(null);

        const userResponse = await fetch("/api/user");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
          setConnectedServices({
            github: userData.user.hasGitHub,
            customApiKey: userData.user.hasCustomApiKey,
          });
        }

        const projectsResponse = await fetch("/api/projects");
        if (projectsResponse.ok) {
          const data = await projectsResponse.json();
          setProjects(data.projects || []);

          const project = data.projects.find(
            (p: { id: string }) => p.id === projectId,
          );
          if (project) {
            setCurrentProject(project);
          } else {
            setError("Project not found");
            setTimeout(() => router.push("/dashboard"), 2000);
          }
        } else {
          throw new Error("Failed to fetch projects");
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [
    clerkUser,
    projectId,
    setProjects,
    setCurrentProject,
    setUser,
    setConnectedServices,
    router,
  ]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-white">
            {error || "Project not found"}
          </h2>
          <p className="text-sm text-slate-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Use WebWorkspace for WEB projects (simpler, user-friendly UI)
  if (currentProject.platform === "WEB") {
    return <WebWorkspace />;
  }

  // Use SnackEditor for iOS/Android projects (needs Expo Snack)
  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="h-14 px-4 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            {/* Chat Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setChatOpen(!chatOpen)}
                >
                  {chatOpen ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <PanelLeft className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {chatOpen ? "Hide AI Chat" : "Show AI Chat"}
              </TooltipContent>
            </Tooltip>

            <div className="h-6 w-px bg-white/10" />

            {/* Project Info */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white">
                  {currentProject.name}
                </h1>
                <p className="text-xs text-slate-500">
                  {Object.keys(currentProject.codeFiles || {}).length} files
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-slate-400 hover:text-white"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-slate-400 hover:text-white"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">Push</span>
            </Button>

            <div className="h-6 w-px bg-white/10 mx-1" />

            <Button variant="gradient" size="sm" className="h-8 gap-2">
              <Play className="h-3.5 w-3.5" />
              Build
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* AI Chat Panel */}
          <div
            className={cn(
              "border-r border-white/5 flex flex-col bg-black/20 backdrop-blur-xl transition-all duration-300 ease-in-out shrink-0",
              chatOpen ? "w-80" : "w-0 overflow-hidden",
            )}
          >
            {chatOpen && <ChatPanel />}
          </div>

          {/* Editor + Preview */}
          <div className="flex-1 overflow-hidden bg-black/10">
            <SnackEditor />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Chat Panel Component
function ChatPanel() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  const {
    currentProject,
    messages,
    addMessage,
    isGenerating,
    setIsGenerating,
    setCodeFiles,
  } = useProjectStore();

  const remainingCredits = useRemainingCredits();

  // Auto-scroll to bottom
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
        120,
      )}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || !currentProject || isGenerating) return;

    const userMessage = input.trim();
    setInput("");

    addMessage({
      role: "user",
      content: userMessage,
    });

    setIsGenerating(true);
    setProgressMessage("Analyzing request...");

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

                if (data.type === "progress") {
                  setProgressMessage(data.message);
                }

                if (data.type === "error") {
                  addMessage({
                    role: "assistant",
                    content: `Error: ${data.error}`,
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
                    content: data.message || "Code updated successfully!",
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
                    title: "Code generated",
                    description: `${Object.keys(data.codeFiles || {}).length} files updated`,
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
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
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

  const quickPrompts = [
    "Add user authentication",
    "Create a settings screen",
    "Add dark mode support",
    "Implement pull to refresh",
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-medium text-white">AI Assistant</span>
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
                  Describe your app and I&apos;ll generate the code
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                  Quick prompts
                </p>
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/30 hover:bg-white/10 transition-all text-sm text-slate-300 hover:text-white flex items-center gap-2 group"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
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
            className="min-h-[52px] max-h-[120px] pr-12 resize-none bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20"
            disabled={isGenerating || !currentProject}
          />
          <Button
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25"
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isGenerating || !currentProject}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// Chat Bubble Component
function ChatBubble({ message }: { message: ChatMessage }) {
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
          </div>
        )}

        {message.model && (
          <div className="mt-2">
            <Badge
              variant="outline"
              className="text-xs border-white/10 text-slate-500"
            >
              {message.model === "claude" ? "Claude" : "Grok"}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
