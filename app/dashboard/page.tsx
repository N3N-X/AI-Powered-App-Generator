"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProjectStore } from "@/stores/project-store";
import { useUserStore } from "@/stores/user-store";
import { Sparkles, Loader2 } from "lucide-react";
import { CREDIT_COSTS, Platform } from "@/types";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { RecentProjects } from "./recent-projects";
import { CreditsGate } from "@/components/dashboard/workspace/credits-gate";

// ---------------------------------------------------------------------------
// Auto-name generation
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set(
  "build create make design develop generate a an the me my for with that this app application website site page project i want need would like to please can you and or but is it of on in at by".split(
    " ",
  ),
);

function generateProjectName(prompt: string): string {
  const stopWords = STOP_WORDS;

  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  if (words.length === 0) return "Untitled Project";

  return words
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Chat state machine
// ---------------------------------------------------------------------------

type ChatState = "idle" | "awaiting_platform" | "creating";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, setProjects, setCurrentProject } = useProjectStore();
  const { user, isLoaded } = useUserStore();

  const [chatState, setChatState] = useState<ChatState>("idle");
  const [input, setInput] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [showCreditsGate, setShowCreditsGate] = useState(false);
  const isOutOfCredits = !!user && user.credits < CREDIT_COSTS.codeGeneration;
  useEffect(() => {
    if (!isOutOfCredits) setShowCreditsGate(false);
  }, [isOutOfCredits]);

  // -------------------------------------------------------------------------
  // Pick up inbound prompt (query param or sessionStorage)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!isLoaded) return;

    const queryPrompt = searchParams.get("prompt");
    if (queryPrompt) {
      setUserPrompt(queryPrompt);
      setChatState("awaiting_platform");
      window.history.replaceState({}, "", "/dashboard");
      return;
    }

    try {
      const stored = sessionStorage.getItem("rux_pending_prompt");
      if (stored) {
        sessionStorage.removeItem("rux_pending_prompt");
        setUserPrompt(stored);
        setChatState("awaiting_platform");
      }
    } catch {
      // sessionStorage unavailable
    }
  }, [isLoaded, searchParams]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleSubmitPrompt = () => {
    const prompt = input.trim();
    if (!prompt) return;
    if (isOutOfCredits) {
      setShowCreditsGate(true);
      return;
    }

    setUserPrompt(prompt);
    setInput("");
    setChatState("awaiting_platform");
  };

  const handleSelectPlatform = useCallback(
    async (platform: Platform) => {
      if (chatState !== "awaiting_platform") return;
      if (isOutOfCredits) {
        setShowCreditsGate(true);
        return;
      }
      setChatState("creating");

      const projectName = generateProjectName(userPrompt);

      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: projectName,
            description: `AI-generated project: ${projectName}`,
            platform,
          }),
        });

        if (!response.ok) throw new Error("Failed to create project");

        const data = await response.json();

        setProjects([data.project, ...projects]);
        setCurrentProject(data.project);

        toast({
          title: "Project created",
          description: `${projectName} is ready. Starting generation...`,
        });

        router.push(
          `/dashboard/${data.project.id}?prompt=${encodeURIComponent(userPrompt)}`,
        );
      } catch (error) {
        console.error("Create project error:", error);
        toast({
          title: "Failed to create project",
          description:
            error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
        setChatState("awaiting_platform");
      }
    },
    [
      chatState,
      userPrompt,
      projects,
      setProjects,
      setCurrentProject,
      router,
      isOutOfCredits,
    ],
  );

  // -------------------------------------------------------------------------
  // Loading state — wait for the layout-client to populate the user store
  // -------------------------------------------------------------------------

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const isIdle = chatState === "idle";

  return (
    <div className="h-full flex flex-col">
      <div
        className={`flex-1 flex flex-col overflow-auto ${
          isIdle ? "justify-center" : "justify-start pt-12"
        }`}
      >
        <div className="max-w-2xl w-full mx-auto px-4 sm:px-6">
          {/* Greeting */}
          <motion.div
            layout
            className={`text-center mb-8 ${isIdle ? "" : "mb-6"}`}
          >
            {isIdle ? (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/25 mb-5">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  What would you like to build?
                </h1>
                <p className="text-gray-500 dark:text-slate-400 text-base">
                  Describe your app idea and we&apos;ll bring it to life.
                </p>
              </>
            ) : (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                New Project
              </h2>
            )}
          </motion.div>

          {/* Chat Messages */}
          <AnimatePresence mode="wait">
            {chatState !== "idle" && (
              <ChatMessages
                userPrompt={userPrompt}
                chatState={chatState}
                onSelectPlatform={handleSelectPlatform}
                disabled={isOutOfCredits}
                onDisabledClick={() => setShowCreditsGate(true)}
              />
            )}
          </AnimatePresence>

          {/* Chat Input */}
          {isIdle && (
            <ChatInput
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmitPrompt}
              disabled={isOutOfCredits}
            />
          )}

          {(showCreditsGate || isOutOfCredits) && (
            <div className="mt-4">
              <CreditsGate plan={user?.plan} />
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects */}
      {isIdle && <RecentProjects />}
    </div>
  );
}
