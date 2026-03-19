/**
 * Codex SDK client — multi-key pool with sandbox isolation.
 *
 * Supports multiple OpenAI API keys via OPENAI_API_KEYS (comma-separated).
 * Falls back to single OPENAI_API_KEY. Picks the least-recently-used key
 * via a simple round-robin counter to spread rate limits across keys.
 *
 * Each project runs in its own /tmp/rux-{projectId}/ directory.
 */

import {
  Codex,
  type ThreadOptions,
  type CodexOptions,
} from "@openai/codex-sdk";

// ── Types ────────────────────────────────────────────────────────────

export type Platform = "IOS" | "ANDROID" | "WEB";

export interface CodexGenerateInput {
  projectId: string;
  prompt: string;
  platform: Platform;
  apiBaseUrl: string;
  existingCode: Record<string, string>;
  chatHistory: Array<{ role: string; content: string }>;
  appSpec?: Record<string, unknown> | null;
  projectName?: string;
}

export interface CodexGenerateOutput {
  /** All files after generation (existing + new/modified). */
  finalFiles: Record<string, string>;
  /** Only the files that changed or were created. */
  newFiles: Record<string, string>;
  /** Paths that were newly created (not present before). */
  createdFiles: string[];
}

// ── Key Pool ─────────────────────────────────────────────────────────

interface KeyEntry {
  key: string;
  client: Codex;
}

let _pool: KeyEntry[] | null = null;
let _roundRobin = 0;

function getApiKeys(): string[] {
  const multi = process.env.OPENAI_API_KEYS;
  if (multi) {
    const keys = multi
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (keys.length > 0) return keys;
  }
  const single = process.env.OPENAI_API_KEY;
  if (!single) throw new Error("OPENAI_API_KEY or OPENAI_API_KEYS not set");
  return [single];
}

function getPool(): KeyEntry[] {
  if (!_pool) {
    _pool = getApiKeys().map((key) => ({
      key,
      client: new Codex({ apiKey: key } as CodexOptions),
    }));
    console.log(`[Codex] Initialized key pool with ${_pool.length} key(s)`);
  }
  return _pool;
}

/** Pick the next client via round-robin. */
function getCodexClient(): Codex {
  const pool = getPool();
  const index = _roundRobin % pool.length;
  _roundRobin = (_roundRobin + 1) % pool.length;
  return pool[index].client;
}

/** Number of API keys in the pool. */
export function getKeyPoolSize(): number {
  return getPool().length;
}

// ── Thread factory ───────────────────────────────────────────────────

/**
 * Create a sandboxed Codex thread scoped to a project workspace.
 *
 * - `workspace-write`: agent can only write within workingDirectory
 * - `networkAccessEnabled: false`: no outbound network calls
 * - `approvalPolicy: "never"`: fully autonomous, no human approval prompts
 * - `skipGitRepoCheck: true`: tmp dirs aren't git repos
 */
export function createProjectThread(
  workspacePath: string,
  modelOverride?: string,
) {
  const codex = getCodexClient();

  const threadOptions: ThreadOptions = {
    workingDirectory: workspacePath,
    sandboxMode: "workspace-write",
    networkAccessEnabled: false,
    webSearchMode: "disabled",
    approvalPolicy: "never",
    skipGitRepoCheck: true,
    model: modelOverride || process.env.CODEX_MODEL || undefined,
  };

  return codex.startThread(threadOptions);
}
