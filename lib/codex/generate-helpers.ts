import type {
  ThreadEvent,
  FileChangeItem,
  CommandExecutionItem,
} from "@openai/codex-sdk";
import type { Platform } from "./client";
import { generateFileChangeLabel, formatCommandForUI } from "./stream-labels";
import {
  formatRateLimitMessage,
  getRateLimitInfo,
  isTransientProviderError,
} from "./error-utils";

export type ProgressCallback = (update: {
  type: string;
  phase?: string;
  message?: string;
  progress?: number;
  [key: string]: unknown;
}) => void;

export function buildThreadPrompt(
  prompt: string,
  chatHistory: Array<{ role: string; content: string }>,
  platform: Platform,
  hasExistingCode: boolean,
  options?: { forceChange?: boolean },
): string {
  const parts: string[] = [];

  const recentHistory = chatHistory.slice(-5);
  if (recentHistory.length > 0) {
    parts.push("## Previous conversation:");
    for (const msg of recentHistory) {
      parts.push(`${msg.role}: ${msg.content}`);
    }
    parts.push("");
  }

  if (hasExistingCode) {
    parts.push(
      "## Task:",
      `Modify the existing app based on this request: ${prompt}`,
      "",
      "The existing files are already in your working directory.",
      "Read only the files you need to change, then apply edits directly.",
      "Do NOT run ls, find, or rg to explore — you already know the file structure from AGENTS.md.",
      "Write all changes in as few steps as possible. Batch multiple file edits together.",
      "You must apply concrete code changes in at least one file.",
      "Follow the instructions in AGENTS.md for platform rules and conventions.",
    );
  } else {
    parts.push(
      "## Task:",
      `Build a complete app based on this request: ${prompt}`,
      "",
      "Write all files directly — do NOT explore the directory first.",
      "Do NOT run ls, find, rg, or cat commands. Just create the files.",
      "Write all files in as few steps as possible. Batch multiple file writes together.",
      "You must produce actual file changes; do not return with no changes.",
      "Follow the instructions in AGENTS.md for platform rules, file structure, and conventions.",
      "Generate all necessary files with real, working code.",
    );
  }

  if (platform === "IOS") {
    parts.push(
      "",
      "## iOS Hard Requirements:",
      "App.tsx must use NavigationContainer + createBottomTabNavigator + SafeAreaProvider + ThemeProvider.",
      "Use native tab bar (no custom bottom navbar component).",
      "For iOS Liquid Glass behavior keep tabBarStyle minimal: backgroundColor + borderTopColor only.",
      "Theme provider should be in src/theme.tsx and imported by App.tsx.",
    );
  }

  if (options?.forceChange) {
    parts.push(
      "",
      "IMPORTANT:",
      "You must produce real code changes in the files.",
      "If the feature already exists, still improve or extend it (e.g., add a new field, UI option, or logic).",
      "Do not respond with 'no changes' or skip edits.",
    );
  }

  return parts.join("\n");
}

const itemTextLengths = new Map<string, number>();

export function forwardEvent(
  event: ThreadEvent,
  progress: number,
  onProgress?: ProgressCallback,
): void {
  if (!onProgress) return;

  const item = (event as { item?: { type?: string } }).item;
  console.log(
    `[Codex Event] type=${event.type} item.type=${item?.type || "none"}`,
  );

  switch (event.type) {
    case "thread.started":
      onProgress({
        type: "phase",
        phase: "generating",
        message: "Starting agent...",
        progress,
      });
      break;
    case "item.started":
    case "item.updated":
    case "item.completed": {
      const item = event.item;

      if (item.type === "file_change") {
        const paths = (item as FileChangeItem).changes.map((c) => c.path);
        const label = generateFileChangeLabel(paths);
        onProgress({
          type: "file_change",
          phase: "generating",
          paths,
          status:
            (item as { status?: string }).status === "completed"
              ? "done"
              : "active",
          message: label,
          progress,
        });
      } else if (item.type === "agent_message") {
        const prevLen = itemTextLengths.get(item.id) || 0;
        const delta = item.text.slice(prevLen);
        itemTextLengths.set(item.id, item.text.length);
        if (delta) {
          onProgress({ type: "content", delta, progress });
        }
      } else if (item.type === "reasoning") {
        const thinkingStatus =
          event.type === "item.completed" ? "done" : "active";
        onProgress({
          type: "thinking",
          phase: "generating",
          message: "Thinking...",
          status: thinkingStatus,
          progress,
        });
      } else if (item.type === "todo_list") {
        const list =
          (item as { items?: Array<{ text: string; completed: boolean }> })
            .items || [];
        const detail = list
          .map((entry) => `${entry.completed ? "✓" : "•"} ${entry.text}`)
          .join("\n");
        const status = event.type === "item.completed" ? "done" : "active";
        onProgress({
          type: "todo_list",
          phase: "generating",
          status,
          label: "Plan",
          detail,
          progress,
        });
      } else if (item.type === "command_execution") {
        const rawCmd = (item as CommandExecutionItem).command || "";
        console.log(`[Codex Command] raw: ${rawCmd.slice(0, 100)}`);
        const friendlyMessage =
          formatCommandForUI(rawCmd) || "Running command...";
        const cmdStatus = item.status === "completed" ? "done" : "active";
        onProgress({
          type: "command",
          phase: "generating",
          message: friendlyMessage,
          status: cmdStatus,
          progress,
        });
      }
      break;
    }
    case "turn.started":
      onProgress({
        type: "phase",
        phase: "generating",
        message: "Agent is working...",
        progress,
      });
      break;
    case "turn.completed":
      onProgress({
        type: "phase",
        phase: "generating",
        message: "Finalizing...",
        progress,
      });
      break;
    case "turn.failed":
      {
        const message = event.error.message || "Generation failed";
        console.error(
          `[Codex] turn.failed: ${message}`,
          JSON.stringify(event.error, null, 2),
        );
        const info = getRateLimitInfo(message);
        if (
          info.isRateLimit ||
          info.isQuota ||
          isTransientProviderError(message)
        ) {
          onProgress({
            type: "warning",
            phase: "generating",
            message: formatRateLimitMessage(info.retryAfterMs),
            warningType: "codex",
          });
        } else {
          onProgress({
            type: "error",
            phase: "error",
            error: message,
          });
        }
      }
      break;
    case "error":
      onProgress({
        type: "warning",
        phase: "generating",
        message: event.message || "Generation notice",
        warningType: "codex",
      });
      break;
    default:
      console.log(
        `[Codex Event] Unhandled event type: ${(event as { type: string }).type}`,
      );
      break;
  }
}

export function resetEventTracking(): void {
  itemTextLengths.clear();
}
