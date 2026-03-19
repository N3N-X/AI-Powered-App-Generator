/**
 * Completion: inject API service, post-process, save to DB, deduct credits.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { incrementUsage } from "@/lib/rate-limit";
import {
  buildApiServiceCodeForSpec,
  buildRevenueCatServiceCode,
} from "@/lib/codex/prompts/proxy-docs";
import type { Platform } from "@/lib/codex/client";
import type { CodeFiles } from "@/types";
import { buildCompletionSummary } from "./build-summary";
import { normalizeReactImports } from "./react-imports";
import { runMobileValidationAndFixes } from "./mobile-validation";

type SSESender = (update: { type: string; [key: string]: unknown }) => void;

export interface CompletionInput {
  finalFiles: CodeFiles;
  changedFiles: CodeFiles;
  changedFileCount: number;
  createdFileCount: number;
  platform: Platform;
  apiBaseUrl: string;
  fullChatHistory: Array<{ role: string; content: string }>;
  projectId: string;
  userId: string;
  prompt: string;
  projectName: string;
  projectSlug: string;
  appSpec?: Record<string, unknown> | null;
  send: SSESender;
}

export async function runCompletion(input: CompletionInput): Promise<void> {
  let { finalFiles } = input;
  let completionWarningNote = "";
  const {
    changedFiles,
    changedFileCount,
    createdFileCount,
    platform,
    apiBaseUrl,
    fullChatHistory,
    projectId,
    userId,
    prompt,
    projectName,
    projectSlug,
    send,
  } = input;

  const spec = (input.appSpec || {}) as {
    api?: {
      paymentsRequired?: boolean;
      authRequired?: boolean;
      externalApis?: string[];
    };
  };
  const paymentsRequired = spec?.api?.paymentsRequired === true;

  // Remove any LLM-generated api service file variants (we auto-inject the real one)
  const apiVariants = [
    "src/services/api.tsx",
    "src/services/api.jsx",
    "src/services/api.js",
    "services/api.tsx",
    "services/api.ts",
    "services/api.jsx",
    "services/api.js",
  ];
  for (const variant of apiVariants) {
    delete finalFiles[variant];
  }

  // Fetch the project's API key to hardcode into api.ts
  let projectApiKey: string | undefined;
  try {
    const adminClient = createAdminClient();
    const { data: keys } = await adminClient
      .from("project_api_keys")
      .select("key_encrypted")
      .eq("project_id", projectId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1);
    const encrypted = keys?.[0]?.key_encrypted;
    if (encrypted) {
      const { decrypt } = await import("@/lib/encrypt");
      projectApiKey = await decrypt(encrypted);
    }
  } catch (e) {
    console.error("Failed to fetch project API key for injection:", e);
  }

  // Force-inject the real API service file with proxy configuration
  finalFiles["src/services/api.ts"] = buildApiServiceCodeForSpec(apiBaseUrl, {
    platform,
    paymentsRequired,
    authRequired: spec?.api?.authRequired,
    externalApis: spec?.api?.externalApis,
    apiKey: projectApiKey,
  });

  // Inject RevenueCat payments service for mobile apps when needed
  const paymentsReferenced = Object.values(finalFiles).some(
    (content) =>
      content.includes("services/payments") || content.includes("payments."),
  );
  if (platform !== "WEB" && (paymentsRequired || paymentsReferenced)) {
    finalFiles["src/services/payments.ts"] = buildRevenueCatServiceCode();
  }

  // Run ensure-config-files to generate package.json, app.json, etc.
  try {
    const { ensureConfigFiles } =
      await import("@/lib/codex/ensure-config-files");
    finalFiles = ensureConfigFiles(
      finalFiles,
      projectName,
      projectSlug,
      platform,
    );
  } catch (error) {
    console.error("[Completion] ensureConfigFiles failed:", error);
  }

  // Validate essential files exist for mobile platforms
  if (platform !== "WEB") {
    const requiredFiles = ["package.json", "app.json"];
    const missing = requiredFiles.filter((f) => !finalFiles[f]);
    if (missing.length > 0) {
      console.error(
        `[Completion] Missing essential files after generation: ${missing.join(", ")}`,
      );
    }
  }

  // Post-process: fix hardcoded wrong API URLs in generated files
  const wrongUrlPattern = /const\s+API_BASE\s*=\s*['"][^'"]*['"]/g;
  const correctApiBaseTs = `const API_BASE = (globalThis as any).__RUX_API_BASE__ || (typeof window !== 'undefined' && window.location ? window.location.origin : '${apiBaseUrl}')`;
  const correctApiBaseJs = `const API_BASE = (typeof globalThis !== 'undefined' && globalThis.__RUX_API_BASE__) || (typeof window !== 'undefined' && window.location ? window.location.origin : '${apiBaseUrl}')`;
  for (const [fileName, content] of Object.entries(finalFiles)) {
    if (fileName === "src/services/api.ts") continue;
    const isTs = fileName.endsWith(".ts") || fileName.endsWith(".tsx");
    let fixed = content.replace(
      wrongUrlPattern,
      isTs ? correctApiBaseTs : correctApiBaseJs,
    );
    if (/from\s+['"]react['"]/.test(fixed)) {
      fixed = normalizeReactImports(fixed, fileName);
    }
    if (fixed !== content) finalFiles[fileName] = fixed;
  }

  // Mobile-only deterministic hardening pass (one pass, fail fast on critical issues)
  if (platform !== "WEB") {
    const mobileResult = runMobileValidationAndFixes(finalFiles, platform);
    finalFiles = mobileResult.files;
    for (const warning of mobileResult.warnings) {
      console.warn(`[Completion] ${warning}`);
    }
    if (mobileResult.warnings.length > 0) {
      const topWarnings = mobileResult.warnings.slice(0, 3);
      completionWarningNote = `\n\nMobile notes:\n- ${topWarnings.join("\n- ")}`;
    }
  }

  // Save to database
  const supabase = createAdminClient();

  // Build a descriptive summary of what was done (based on changed files only)
  const assistantMessage =
    buildCompletionSummary(
      changedFiles,
      createdFileCount,
      changedFileCount,
      projectName,
    ) + completionWarningNote;

  const chatWithAssistant = [
    ...fullChatHistory,
    {
      role: "assistant" as const,
      content: assistantMessage,
      timestamp: new Date().toISOString(),
    },
  ];

  const projectUpdate: Record<string, unknown> = {
    code_files: finalFiles,
    chat_history: chatWithAssistant,
    updated_at: new Date().toISOString(),
  };
  if (input.appSpec) {
    projectUpdate.app_spec = input.appSpec;
  }

  await supabase.from("projects").update(projectUpdate).eq("id", projectId);

  // Provision collections from app spec + code analysis
  await provisionCollections(supabase, projectId, finalFiles, input.appSpec);

  // Increment usage (rate-limit tracking)
  await incrementUsage(userId);

  // Save prompt history
  await supabase
    .from("prompt_history")
    .insert({
      prompt,
      response: JSON.stringify({ filesGenerated: changedFileCount }),
      model: "codex",
      tokens: 0,
      user_id: userId,
      project_id: projectId,
    })
    .then(({ error }) => {
      if (error) console.error("Failed to save prompt history:", error);
    });

  // Send completion - send changedFiles for UI display, but full files are already saved to DB
  send({
    type: "complete",
    success: true,
    codeFiles: finalFiles,
    changedFiles: changedFiles,
    message: assistantMessage,
    progress: 100,
  });
}

// ── Collection Provisioning ──────────────────────────────────────────

/**
 * Extract collection names from generated code and app spec,
 * then create them in app_collections if they don't exist yet.
 */
async function provisionCollections(
  supabase: ReturnType<typeof createAdminClient>,
  projectId: string,
  files: CodeFiles,
  appSpec?: Record<string, unknown> | null,
): Promise<void> {
  try {
    const collectionNames = new Set<string>();

    // 1. Extract from app spec
    const spec = appSpec as { api?: { collections?: Array<{ name: string }> } };
    if (spec?.api?.collections) {
      for (const col of spec.api.collections) {
        if (col.name) collectionNames.add(col.name);
      }
    }

    // 2. Extract from generated code (db.getAll/create/getOne/findMany calls)
    const dbCallPattern =
      /db\.(getAll|getOne|create|update|delete|findMany|findOne)\(\s*['"]([^'"]+)['"]/g;
    for (const content of Object.values(files)) {
      let match;
      while ((match = dbCallPattern.exec(content)) !== null) {
        collectionNames.add(match[2]);
      }
    }

    if (collectionNames.size === 0) return;

    // 3. Fetch existing collections for this project
    const { data: existing } = await supabase
      .from("app_collections")
      .select("name")
      .eq("project_id", projectId);

    const existingNames = new Set((existing || []).map((c) => c.name));

    // 4. Create missing collections
    const toCreate = [...collectionNames].filter((n) => !existingNames.has(n));
    if (toCreate.length === 0) return;

    await supabase.from("app_collections").insert(
      toCreate.map((name) => ({
        project_id: projectId,
        name,
      })),
    );

    console.log(
      `[Completion] Created ${toCreate.length} collections for project ${projectId}: ${toCreate.join(", ")}`,
    );
  } catch (error) {
    // Non-fatal — don't fail the generation if collection provisioning fails
    console.error("[Completion] Failed to provision collections:", error);
  }
}
