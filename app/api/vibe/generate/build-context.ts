/**
 * Build generation context from request + DB data.
 * Extracted from route.ts to keep it under 300 lines.
 */

import { NextRequest } from "next/server";
import type { Platform } from "@/lib/codex/client";
import type { CodeFiles } from "@/types";

export interface GenerationContext {
  platform: Platform;
  apiBaseUrl: string;
  existingCode: CodeFiles;
  hasExistingCode: boolean;
  fullChatHistory: Array<{ role: string; content: string }>;
}

export async function buildGenerationContext(
  request: NextRequest,
  project: {
    platform: unknown;
    code_files: unknown;
    chat_history: unknown;
  },
  chatHistory: Array<{ role: string; content: string }>,
  prompt: string,
): Promise<GenerationContext> {
  const existingCode = (project.code_files as CodeFiles) || {};
  const platform = project.platform as Platform;

  const configuredBase =
    process.env.NEXT_PUBLIC_APP_URL || process.env.RUX_API_BASE_URL;
  const normalizedConfigured = configuredBase
    ? configuredBase.replace(/\/$/, "")
    : null;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || "rulxy.com";
  const hostWithoutPort = host.split(":")[0];
  const isPlainLocalhost =
    hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1";
  const protocol = isPlainLocalhost
    ? "http"
    : request.headers.get("x-forwarded-proto") || "https";
  const derivedBaseUrl = `${protocol}://${host}`;
  const apiBaseUrl = normalizedConfigured || derivedBaseUrl;

  const hasExistingCode = Object.values(existingCode).some(
    (content) => typeof content === "string" && content.trim().length > 0,
  );

  const existingHistory =
    (project.chat_history as Array<{ role: string; content: string }>) || [];
  const fullChatHistory = [
    ...existingHistory,
    ...chatHistory,
    { role: "user" as const, content: prompt },
  ];

  return {
    platform,
    apiBaseUrl,
    existingCode,
    hasExistingCode,
    fullChatHistory,
  };
}
