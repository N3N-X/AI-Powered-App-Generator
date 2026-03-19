/**
 * Main generation function — orchestrates workspace, Codex agent, and result collection.
 */

import {
  createProjectThread,
  type CodexGenerateInput,
  type CodexGenerateOutput,
} from "./client";
import {
  hydrateWorkspace,
  writeAgentsMd,
  collectWorkspace,
  diffFiles,
  cleanupWorkspace,
} from "./workspace";
import { buildAgentsMd } from "./agents-md";
import {
  buildThreadPrompt,
  forwardEvent,
  resetEventTracking,
  type ProgressCallback,
} from "./generate-helpers";
import {
  CodexRateLimitError,
  getRateLimitInfo,
  formatRateLimitMessage,
  isTransientProviderError,
} from "./error-utils";

export type { ProgressCallback };

/**
 * Run Codex generation for a project.
 *
 * 1. Hydrate CodeFiles to disk
 * 2. Write AGENTS.md with platform context
 * 3. Start sandboxed Codex thread
 * 4. Stream agent execution, forwarding progress
 * 5. Collect resulting files
 * 6. Clean up workspace
 */
export async function runCodexGeneration(
  input: CodexGenerateInput,
  onProgress?: ProgressCallback,
  signal?: AbortSignal,
): Promise<CodexGenerateOutput | null> {
  const {
    projectId,
    prompt,
    platform,
    apiBaseUrl,
    existingCode,
    chatHistory,
    appSpec,
    projectName,
  } = input;

  const hasExistingCode = Object.values(existingCode).some(
    (content) => typeof content === "string" && content.trim().length > 0,
  );
  const retryNoChangesEnv = (
    process.env.CODEX_RETRY_NO_CHANGES || "true"
  ).toLowerCase();
  const shouldRetryNoChanges =
    retryNoChangesEnv !== "0" && retryNoChangesEnv !== "false";

  // Phase 1: Hydrate workspace
  onProgress?.({
    type: "phase",
    phase: "preparing",
    message: "Setting up workspace...",
    progress: 5,
  });

  const wsPath = await hydrateWorkspace(projectId, existingCode);

  // Write AGENTS.md
  const agentsMd = buildAgentsMd({
    platform,
    apiBaseUrl,
    projectName,
    appSpec,
    hasExistingCode,
  });
  await writeAgentsMd(wsPath, agentsMd);

  // Phase 2: Run Codex
  onProgress?.({
    type: "phase",
    phase: "generating",
    message: "Starting code generation...",
    progress: 15,
  });

  // Emit initial activity to show progress immediately
  onProgress?.({
    type: "thinking",
    phase: "generating",
    message: "Analyzing requirements...",
    status: "active",
    progress: 16,
  });

  // Build the prompt with context
  const fullPrompt = buildThreadPrompt(
    prompt,
    chatHistory,
    platform,
    hasExistingCode,
  );

  // Keepalive heartbeat to prevent proxy/tunnel timeouts
  const keepalive = setInterval(() => {
    onProgress?.({
      type: "phase",
      phase: "generating",
      message: "Agent is working...",
      progress: 20,
    });
  }, 15000);

  const sleep = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      if (!signal) return;
      const onAbort = () => {
        clearTimeout(timeout);
        reject(new Error("aborted"));
      };
      if (signal.aborted) onAbort();
      signal.addEventListener("abort", onAbort, { once: true });
    });

  const runWithModel = async (promptText: string, modelOverride?: string) => {
    const thread = createProjectThread(wsPath, modelOverride);
    const { events } = await thread.runStreamed(promptText, { signal });

    let progress = 15;
    let thinkingDone = false;
    let lastTurnError: string | null = null;
    resetEventTracking();
    try {
      for await (const event of events) {
        if (!thinkingDone && event.type === "item.started") {
          thinkingDone = true;
          onProgress?.({
            type: "thinking",
            phase: "generating",
            message: "Analyzing requirements...",
            status: "done",
            progress,
          });
        }
        if (event.type === "turn.failed") {
          lastTurnError =
            (event as { error?: { message?: string } }).error?.message || null;
        }
        if (signal?.aborted) break;
        progress = Math.min(progress + 1, 85);
        forwardEvent(event, progress, onProgress);
      }
    } catch (streamError) {
      // Prefer the turn.failed message over the generic stream error
      if (lastTurnError) {
        throw new Error(lastTurnError);
      }
      throw streamError;
    }
  };

  const runWithRetries = async (promptText: string, modelOverride?: string) => {
    const maxRetriesEnv = Number(process.env.CODEX_RATE_LIMIT_RETRIES ?? 3);
    const maxRetries =
      Number.isFinite(maxRetriesEnv) && maxRetriesEnv > 0 ? maxRetriesEnv : 3;
    let attempts = 0;
    while (true) {
      try {
        await runWithModel(promptText, modelOverride);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const info = getRateLimitInfo(message);
        const isTransient = isTransientProviderError(message);
        if (
          (!info.isRateLimit && !info.isQuota && !isTransient) ||
          signal?.aborted
        ) {
          throw error;
        }
        attempts += 1;
        if (maxRetries && attempts > maxRetries) {
          throw new CodexRateLimitError(
            formatRateLimitMessage(info.retryAfterMs),
            info.retryAfterMs,
            info.rawMessage,
          );
        }
        const baseBackoff = info.isQuota ? 5000 : isTransient ? 1200 : 600;
        const backoffMs = Math.min(
          30_000,
          Math.max(baseBackoff, info.retryAfterMs ?? attempts * 1000 + 250),
        );
        onProgress?.({
          type: "phase",
          phase: "generating",
          message: `We’re at capacity. Retrying in ${Math.ceil(
            backoffMs / 1000,
          )}s...`,
          progress: 20,
        });
        await sleep(backoffMs);
      }
    }
  };

  try {
    await runWithRetries(fullPrompt);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const shouldFallback =
      message.toLowerCase().includes("must be verified") ||
      message.toLowerCase().includes("organization must be verified");
    const fallbackModel = process.env.CODEX_MODEL_FALLBACK;

    if (shouldFallback && fallbackModel) {
      onProgress?.({
        type: "phase",
        phase: "generating",
        message: `Retrying with fallback model...`,
        progress: 20,
      });
      try {
        await runWithRetries(fullPrompt, fallbackModel);
      } catch (fallbackError) {
        clearInterval(keepalive);
        await cleanupWorkspace(wsPath).catch(() => {});
        if (signal?.aborted) return null;
        throw fallbackError;
      }
    } else {
      clearInterval(keepalive);
      await cleanupWorkspace(wsPath).catch(() => {});
      if (signal?.aborted) return null;
      throw error;
    }
  }

  clearInterval(keepalive);

  // Phase 3: Collect results
  onProgress?.({
    type: "phase",
    phase: "collecting",
    message: "Collecting generated files...",
    progress: 90,
  });

  let finalFiles = await collectWorkspace(wsPath);
  let newFiles = diffFiles(existingCode, finalFiles);
  let createdFiles = Object.keys(newFiles).filter(
    (path) => existingCode[path] === undefined,
  );
  if (
    shouldRetryNoChanges &&
    Object.keys(newFiles).length === 0 &&
    !signal?.aborted
  ) {
    onProgress?.({
      type: "phase",
      phase: "generating",
      message: "No changes detected. Retrying with stricter instructions...",
      progress: 25,
    });
    resetEventTracking();
    const forcedPrompt = buildThreadPrompt(
      prompt,
      chatHistory,
      platform,
      hasExistingCode,
      {
        forceChange: true,
      },
    );
    try {
      await runWithRetries(forcedPrompt);
      const retryFiles = await collectWorkspace(wsPath);
      finalFiles = retryFiles;
      newFiles = diffFiles(existingCode, finalFiles);
      createdFiles = Object.keys(newFiles).filter(
        (path) => existingCode[path] === undefined,
      );
    } catch (retryError) {
      if (!signal?.aborted) throw retryError;
    }
  }
  if (Object.keys(newFiles).length === 0 && !signal?.aborted) {
    throw new Error("Generation produced no code changes. Please retry.");
  }

  // Clean up
  await cleanupWorkspace(wsPath).catch(() => {});

  if (Object.keys(finalFiles).length === 0) {
    return null;
  }

  return { finalFiles, newFiles, createdFiles };
}
