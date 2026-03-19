import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/proxy";
import { DEFAULT_PROJECT_SERVICES } from "@/app/api/projects/helpers";
import { CodeFiles } from "@/types";
import {
  generateEmptyStateHtml,
  generateErrorHtml,
  generatePreviewHtml,
} from "./html-generators";

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return new NextResponse("Project ID required", { status: 400 });
    }

    // Validate projectId format (basic UUID/CUID validation)
    if (!/^[a-zA-Z0-9_-]{10,40}$/.test(projectId)) {
      return new NextResponse("Invalid project ID format", { status: 400 });
    }

    const supabase = await createClient();

    // Get project owned by user
    const { data: project, error } = await supabase
      .from("projects")
      .select("id, name, code_files, platform")
      .eq("id", projectId)
      .single();

    if (error || !project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    let codeFiles: CodeFiles = {};
    try {
      codeFiles = (project.code_files as CodeFiles) || {};
    } catch {
      codeFiles = {};
    }

    // Check if codeFiles is valid
    if (!codeFiles || typeof codeFiles !== "object") {
      console.error("Invalid codeFiles:", codeFiles);
      return new NextResponse(generateEmptyStateHtml(project.name), {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store",
        },
      });
    }

    // Check if project has any meaningful code
    const appCode = codeFiles["App.tsx"] || codeFiles["App.js"] || "";
    const hasCode =
      Object.keys(codeFiles).length > 0 && appCode && appCode.trim().length > 0;

    if (!hasCode) {
      return new NextResponse(generateEmptyStateHtml(project.name), {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store",
        },
      });
    }

    // Inject preview API key (only for preview rendering)
    const previewFiles = await injectPreviewRuntimeConfig(
      projectId,
      codeFiles,
      new URL(request.url).origin,
    );

    const previewHtml = generatePreviewHtml(
      previewFiles,
      project.name,
      project.platform,
    );

    return new NextResponse(previewHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Security-Policy": [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://snack.expo.dev https://unpkg.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: blob:",
          "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
          "frame-src https://snack.expo.dev",
          "frame-ancestors 'self' https://rulxy.com https://*.rulxy.com http://localhost:*",
        ].join("; "),
      },
    });
  } catch (error) {
    console.error("Preview error:", error);
    return new NextResponse(
      generateErrorHtml("Preview generation failed. Please try again."),
      {
        status: 500,
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

async function injectPreviewRuntimeConfig(
  projectId: string,
  files: CodeFiles,
  apiBase: string,
): Promise<CodeFiles> {
  try {
    // Use admin client to bypass RLS — auth is already verified by getAuthenticatedUser() above
    const adminClient = createAdminClient();
    const { data: keys } = await adminClient
      .from("project_api_keys")
      .select("key_encrypted")
      .eq("project_id", projectId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    let encrypted = keys?.[0]?.key_encrypted;
    if (!encrypted) {
      const { rawKey } = await generateApiKey(
        projectId,
        "Auto-generated for preview",
        DEFAULT_PROJECT_SERVICES,
      );
      if (!rawKey) return files;
      encrypted = rawKey;
    }

    const apiKey = encrypted.startsWith("rux_")
      ? encrypted
      : await (await import("@/lib/encrypt")).decrypt(encrypted);
    if (!apiKey) return files;

    const updated = { ...files };
    const paths = ["src/services/api.ts", "services/api.ts"];
    const apiKeyPattern = /const\s+API_KEY\s*=\s*[^;]+;/;
    const apiBasePattern = /const\s+API_BASE\s*=\s*[^;]+;/;
    for (const path of paths) {
      const content = updated[path];
      if (!content) continue;
      let next = content.replace(apiKeyPattern, `const API_KEY = '${apiKey}';`);
      next = next.replace(apiBasePattern, `const API_BASE = '${apiBase}';`);
      updated[path] = next;
    }
    return updated;
  } catch (error) {
    console.error("Preview API key injection failed:", error);
    return files;
  }
}
