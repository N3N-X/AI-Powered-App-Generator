"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "@/hooks/use-toast";
import type { PreviewPhase } from "./use-preview-verification";
import { createGenerationEventHandler } from "./generation-events";
import { normalizeGenerationErrorMessage } from "@/lib/codex/error-utils";

/**
 * Handles the 3-phase SSE generation flow (plan -> generate -> validate+fix).
 * Returns the submit handler and progress message state.
 */
export function useGeneration(
  setPreviewPhase: (phase: PreviewPhase) => void,
  clearConsoleErrorsOverride?: () => void,
) {
  const {
    currentProject,
    messages,
    addMessage,
    isGenerating,
    setIsGenerating,
    setCodeFiles,
    setGenerationPhase,
    setGenerationNotice,
    appendStreamText,
    addActivityItem,
    updateActivityItem,
    clearGenerationState,
  } = useProjectStore();
  const { clearConsoleErrors: storeClearConsoleErrors } = useUIStore();
  const clearConsoleErrors =
    clearConsoleErrorsOverride ?? storeClearConsoleErrors;

  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const recoveryAttempted = useRef(false);
  const activityCounter = useRef(0);
  const jobIdRef = useRef<string | null>(null);
  const lastEventIdRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);
  const cancelRequestedRef = useRef(false);
  /** Create a unique activity item ID. */
  const nextId = () => `act-${++activityCounter.current}`;

  /** Track active file_change items by path for updating status. */
  const activeFileItems = useRef<Map<string, string>>(new Map());

  const handleSubmitWithMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage || !currentProject || isGenerating) return;

      addMessage({ role: "user", content: userMessage });
      clearGenerationState();
      activityCounter.current = 0;
      activeFileItems.current.clear();
      jobIdRef.current = null;
      lastEventIdRef.current = 0;
      cancelRequestedRef.current = false;
      setIsCanceling(false);
      setIsGenerating(true);
      setGenerationPhase("planning", "Designing app architecture...");
      setProgressMessage("Designing app architecture...");

      const controller = new AbortController();
      abortRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000);
      let streamComplete = false;
      let reattachAttempted = false;
      const setStreamComplete = (done: boolean) => {
        streamComplete = done;
      };

      const handleSseEvent = createGenerationEventHandler({
        setCurrentPhase,
        setGenerationPhase,
        setProgressMessage,
        setGenerationNotice,
        setIsGenerating,
        setIsCanceling,
        setPreviewPhase,
        addMessage,
        setCodeFiles,
        appendStreamText,
        addActivityItem,
        updateActivityItem,
        clearConsoleErrors,
        nextId,
        activeFileItems,
        jobIdRef,
        lastEventIdRef,
        setStreamComplete,
      });

      const consumeSseStream = async (reader: ReadableStreamDefaultReader) => {
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") continue;

            try {
              const data = JSON.parse(jsonStr);
              handleSseEvent(data);
            } catch (e) {
              console.error("[WebWorkspace] Failed to parse SSE:", e);
            }
          }
          if (streamComplete) break;
        }
      };

      const reattachStream = async (): Promise<boolean> => {
        if (cancelRequestedRef.current) return false;
        if (!jobIdRef.current) return false;
        setProgressMessage("Reconnecting to generation...");
        try {
          const params = new URLSearchParams({
            jobId: jobIdRef.current,
            afterEventId: String(lastEventIdRef.current || 0),
          });
          const response = await fetch(`/api/vibe/generate/stream?${params}`);
          if (!response.ok) {
            throw new Error(`Failed to reattach: ${response.status}`);
          }
          const reader = response.body?.getReader();
          if (!reader) throw new Error("No stream body");
          await consumeSseStream(reader);
          return streamComplete;
        } catch (error) {
          console.error("[WebWorkspace] Reattach failed:", error);
          return false;
        }
      };

      const tryReattach = async (): Promise<boolean> => {
        if (cancelRequestedRef.current) return false;
        if (reattachAttempted) return false;
        reattachAttempted = true;
        return reattachStream();
      };

      try {
        const response = await fetch("/api/vibe/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userMessage,
            projectId: currentProject.id,
            chatHistory: messages,
          }),
          signal: controller.signal,
        });
        if (timeout) clearTimeout(timeout);

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          const rawMessage =
            errorPayload?.error ||
            errorPayload?.message ||
            "Failed to generate code";
          let friendlyMessage = rawMessage;
          if (response.status === 402) {
            friendlyMessage = "You’re out of credits. Add credits to generate.";
          } else if (response.status === 429) {
            friendlyMessage =
              "You’re doing that too fast. Please wait a minute and try again.";
          } else if (response.status === 401) {
            friendlyMessage = "Your session expired. Please refresh the page.";
          }
          console.error("[WebWorkspace] Response error:", rawMessage);
          throw new Error(friendlyMessage);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");
        await consumeSseStream(reader);
        if (!streamComplete) {
          const reattached = await tryReattach();
          if (reattached) return;
          throw new Error("Stream disconnected");
        }
      } catch (error) {
        if (streamComplete) return;
        if (timeout) clearTimeout(timeout);
        const isTimeout = error instanceof Error && error.name === "AbortError";
        if (cancelRequestedRef.current) {
          setIsGenerating(false);
          setProgressMessage(null);
          setGenerationPhase("error", "Generation canceled");
          setIsCanceling(false);
          return;
        }
        console.error("[WebWorkspace] Generation error:", error);
        const reattached = await tryReattach();
        if (reattached) return;
        addMessage({
          role: "assistant",
          content: isTimeout
            ? "Generation timed out. Please try again."
            : `Sorry, something went wrong: ${normalizeGenerationErrorMessage(
                error instanceof Error ? error.message : "Unknown error",
              )}`,
        });
        toast({
          title: isTimeout ? "Request timed out" : "Generation failed",
          description: isTimeout
            ? "The request took too long. Please try again."
            : normalizeGenerationErrorMessage(
                error instanceof Error ? error.message : "Please try again",
              ),
          variant: "destructive",
        });
        setIsGenerating(false);
        setProgressMessage(null);
        setIsCanceling(false);
        clearGenerationState();
      }
    },
    [
      currentProject,
      isGenerating,
      messages,
      addMessage,
      clearGenerationState,
      setIsGenerating,
      setGenerationPhase,
      setGenerationNotice,
      appendStreamText,
      setCodeFiles,
      addActivityItem,
      updateActivityItem,
      clearConsoleErrors,
      setPreviewPhase,
    ],
  );

  // Auto-recover: on mount, check if there's a running generation for this project
  useEffect(() => {
    if (!currentProject?.id || isGenerating || recoveryAttempted.current)
      return;
    recoveryAttempted.current = true;

    let cancelled = false;
    const recover = async () => {
      try {
        const res = await fetch(
          `/api/vibe/generate/status?projectId=${currentProject.id}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!data.running || !data.jobId || cancelled) return;

        setIsRecovering(true);
        setIsGenerating(true);
        setGenerationPhase("generating", "Reconnecting to generation...");
        setProgressMessage("Reconnecting to generation...");
        jobIdRef.current = data.jobId;
        lastEventIdRef.current = 0;

        const handler = createGenerationEventHandler({
          setCurrentPhase,
          setGenerationPhase,
          setProgressMessage,
          setGenerationNotice,
          setIsGenerating,
          setIsCanceling,
          setPreviewPhase,
          addMessage,
          setCodeFiles,
          appendStreamText,
          addActivityItem,
          updateActivityItem,
          clearConsoleErrors,
          nextId,
          activeFileItems,
          jobIdRef,
          lastEventIdRef,
          setStreamComplete: () => {},
        });

        const streamRes = await fetch(
          `/api/vibe/generate/stream?jobId=${data.jobId}&afterEventId=0`,
        );
        if (!streamRes.ok || !streamRes.body) {
          setIsGenerating(false);
          setIsRecovering(false);
          return;
        }

        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") continue;
            try {
              handler(JSON.parse(jsonStr));
            } catch {}
          }
        }
      } catch (e) {
        console.error("[Generation] Recovery failed:", e);
      } finally {
        if (!cancelled) setIsRecovering(false);
      }
    };

    recover();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id]);

  return {
    progressMessage,
    currentPhase,
    isCanceling,
    isRecovering,
    handleSubmitWithMessage,
    cancelGeneration: async () => {
      if (!isGenerating) return;
      cancelRequestedRef.current = true;
      setIsCanceling(true);
      setProgressMessage("Canceling generation...");
      const delays = [0, 300, 800, 1500];
      let canceled = false;
      for (const delay of delays) {
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        try {
          if (jobIdRef.current) {
            const res = await fetch("/api/vibe/generate/cancel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jobId: jobIdRef.current }),
            });
            if (res.ok || res.status === 404) {
              canceled = true;
              break;
            }
            if (res.status === 401 || res.status === 403) {
              break;
            }
          } else {
            break;
          }
        } catch (error) {
          console.error("[WebWorkspace] Cancel failed:", error);
        }
      }
      if (!canceled) {
        toast({
          title: "Cancel failed",
          description: "Could not stop generation. Please try again.",
          variant: "destructive",
        });
      }
      abortRef.current?.abort();
    },
  };
}
