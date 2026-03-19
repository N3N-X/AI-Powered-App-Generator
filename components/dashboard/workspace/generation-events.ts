import type { MutableRefObject } from "react";
import { toast } from "@/hooks/use-toast";
import type { PreviewPhase } from "./use-preview-verification";
import type {
  ActivityItem,
  GenerationPhase,
} from "@/stores/project-store-types";
import { formatFileEditLabel } from "./generation-labels";
import {
  formatRateLimitMessage,
  normalizeGenerationErrorMessage,
} from "@/lib/codex/error-utils";
interface GenerationEventHandlerParams {
  setCurrentPhase: (phase: string | null) => void;
  setGenerationPhase: (phase: GenerationPhase, message?: string) => void;
  setProgressMessage: (message: string | null) => void;
  setGenerationNotice: (notice: string | null) => void;
  setIsGenerating: (value: boolean) => void;
  setIsCanceling: (value: boolean) => void;
  setPreviewPhase: (phase: PreviewPhase) => void;
  addMessage: (message: {
    role: "user" | "assistant" | "system";
    content: string;
    codeChanges?: Record<string, string>;
  }) => void;
  setCodeFiles: (files: Record<string, string>) => void;
  appendStreamText: (delta: string) => void;
  addActivityItem: (item: ActivityItem) => void;
  updateActivityItem: (id: string, update: Partial<ActivityItem>) => void;
  clearConsoleErrors: () => void;
  nextId: () => string;
  activeFileItems: MutableRefObject<Map<string, string>>;
  jobIdRef: MutableRefObject<string | null>;
  lastEventIdRef: MutableRefObject<number>;
  setStreamComplete: (done: boolean) => void;
}
export function createGenerationEventHandler(
  params: GenerationEventHandlerParams,
): (data: any) => void {
  const {
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
  } = params;
  return (data: any) => {
    if (typeof data.eventId === "number") {
      lastEventIdRef.current = Math.max(lastEventIdRef.current, data.eventId);
    }
    if (data.type === "job" && data.jobId) {
      jobIdRef.current = data.jobId as string;
    }
    if (data.type === "queue") {
      const position = typeof data.position === "number" ? data.position : 0;
      const msg =
        typeof data.message === "string"
          ? data.message
          : position > 0
            ? `You are #${position} in queue`
            : "Waiting for slot...";
      setGenerationPhase("planning", msg);
      setProgressMessage(msg);
      if (position > 0) {
        setGenerationNotice(msg);
      } else {
        setGenerationNotice(null);
      }
    }
    if (data.type === "phase") {
      setCurrentPhase(data.phase);
      setGenerationPhase(data.phase as GenerationPhase, data.message);
      setProgressMessage(data.message || data.phase);
      if (
        typeof data.message === "string" &&
        data.message.toLowerCase().includes("capacity")
      ) {
        setGenerationNotice(data.message);
      } else {
        setGenerationNotice(null);
      }
    }
    if (data.type === "thinking") {
      if (data.status === "active") {
        const existing = activeFileItems.current.get("__thinking");
        if (existing) return;
        const id = nextId();
        addActivityItem({
          id,
          type: "thinking",
          label: "Thinking...",
          status: "active",
          timestamp: Date.now(),
        });
        activeFileItems.current.set("__thinking", id);
        setProgressMessage("Thinking...");
        setGenerationNotice(null);
      } else {
        const tid = activeFileItems.current.get("__thinking");
        if (tid) updateActivityItem(tid, { status: "done" });
      }
    }
    if (data.type === "todo_list") {
      const todoKey = "__todo_list";
      const existingId = activeFileItems.current.get(todoKey);
      const updates = {
        label: data.label || "Plan",
        detail: data.detail,
      };
      if (data.status === "active") {
        if (!existingId) {
          const id = nextId();
          addActivityItem({
            id,
            type: "todo_list",
            label: updates.label,
            detail: updates.detail,
            status: "active",
            timestamp: Date.now(),
          });
          activeFileItems.current.set(todoKey, id);
        } else {
          updateActivityItem(existingId, { ...updates, status: "active" });
        }
        setProgressMessage("Planning...");
        setGenerationNotice(null);
      } else if (existingId) {
        updateActivityItem(existingId, { ...updates, status: "done" });
      }
    }
    if (data.type === "file_change") {
      const paths: string[] = data.paths || [];
      const key = paths.join(",");
      if (data.status === "active" && !activeFileItems.current.has(key)) {
        const id = nextId();
        const fileNames = paths.map((p: string) => {
          const name = p.split("/").pop() || p;
          return name.replace(/\.(tsx?|jsx?)$/, "");
        });
        const label = formatFileEditLabel(fileNames, paths);
        addActivityItem({
          id,
          type: "file_edit",
          label,
          status: "active",
          paths,
          timestamp: Date.now(),
        });
        activeFileItems.current.set(key, id);
      } else if (data.status === "done") {
        const fid = activeFileItems.current.get(key);
        if (fid) updateActivityItem(fid, { status: "done" });
      }
      setProgressMessage(data.message || "Writing code...");
      setGenerationNotice(null);
    }
    if (data.type === "command") {
      const cmdKey = `__cmd:${data.message || "cmd"}`;
      if (data.status === "active" && !activeFileItems.current.has(cmdKey)) {
        const id = nextId();
        addActivityItem({
          id,
          type: "command",
          label: data.message || "Running command...",
          status: "active",
          timestamp: Date.now(),
        });
        activeFileItems.current.set(cmdKey, id);
      } else if (data.status === "done") {
        const cid = activeFileItems.current.get(cmdKey);
        if (cid) updateActivityItem(cid, { status: "done" });
      }
      if (data.message) {
        setProgressMessage(data.message);
      }
      setGenerationNotice(null);
    }
    if (data.type === "plan" && data.spec) {
      setProgressMessage(
        `Planning: ${data.spec.name} — ${data.spec.screens?.length || 0} screens`,
      );
      setGenerationNotice(null);
    }
    if (data.type === "content") {
      appendStreamText(data.delta || "");
      setGenerationNotice(null);
    }
    if (data.type === "warning") {
      const warningText =
        typeof data.message === "string"
          ? data.message
          : data.message?.message || "Generation notice";
      const normalized = normalizeGenerationErrorMessage(warningText);
      const normalizedLower = normalized.toLowerCase();
      if (
        normalizedLower.includes("capacity") ||
        normalizedLower.includes("rate limit")
      ) {
        setProgressMessage(normalized);
        setGenerationNotice(normalized);
      }
      console.warn("[WebWorkspace] Warning:", warningText);
      return;
    }
    if (data.type === "error") {
      const errorText =
        typeof data.error === "string"
          ? data.error
          : data.error?.message || "Generation failed";
      const friendly =
        data.errorType === "rate_limit"
          ? formatRateLimitMessage(
              typeof data.retryAfterMs === "number"
                ? data.retryAfterMs
                : undefined,
            )
          : normalizeGenerationErrorMessage(errorText);
      console.error("[WebWorkspace] Error:", errorText);
      addMessage({
        role: "assistant",
        content: `Sorry, there was an error: ${friendly}`,
      });
      toast({
        title: "Generation failed",
        description: friendly,
        variant: "destructive",
      });
      setIsGenerating(false);
      setProgressMessage(null);
      setGenerationPhase("error", friendly);
      setIsCanceling(false);
      setGenerationNotice(null);
      setStreamComplete(true);
    }
    if (data.type === "canceled") {
      addMessage({
        role: "assistant",
        content: "Generation was canceled.",
      });
      toast({
        title: "Generation canceled",
        description: "The generation was stopped.",
      });
      setIsGenerating(false);
      setProgressMessage(null);
      setGenerationPhase("error", "Generation canceled");
      setIsCanceling(false);
      setGenerationNotice(null);
      setStreamComplete(true);
    }
    if (data.type === "complete") {
      addMessage({
        role: "assistant",
        content: data.message || "Your app is ready!",
        codeChanges: data.changedFiles || data.codeFiles,
      });
      if (data.codeFiles) setCodeFiles(data.codeFiles);
      setIsGenerating(false);
      setProgressMessage(null);
      setPreviewPhase("verifying");
      clearConsoleErrors();
      setGenerationPhase("complete", data.message);
      setIsCanceling(false);
      setGenerationNotice(null);
      toast({
        title: "App updated!",
        description: "Verifying preview...",
      });
      setStreamComplete(true);
    }
  };
}
