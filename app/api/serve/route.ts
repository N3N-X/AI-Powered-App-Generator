import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { CodeFiles } from "@/types";
import { isDevHost } from "@/lib/utils";
import {
  serveRateLimiter,
  SUBDOMAIN_REGEX,
  isValidHost,
  getSecurityHeaders,
} from "./helpers/security";
import { generateErrorHtml } from "./helpers/error-html";
import { bundleCodeFiles } from "./helpers/esbuild-bundle";
import { generateServeHtml } from "./helpers/serve-html";

export const runtime = "nodejs";

/**
 * Serve web app by subdomain or custom domain
 *
 * Production: Accessed via subdomain.rulxy.com or custom domain
 * Localhost testing: /api/serve?subdomain=happy-panda-42
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const host = request.headers.get("host") || "";
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Validate host header
    if (!isValidHost(host)) {
      console.warn(`[serve] Invalid host header: ${host} from IP: ${clientIp}`);
      return new NextResponse(
        generateErrorHtml("Invalid Request", "Host header validation failed"),
        { status: 400, headers: getSecurityHeaders(false) },
      );
    }

    // Determine subdomain/domain from request
    let subdomain: string | null = searchParams.get("subdomain");
    let customDomain: string | null = searchParams.get("domain");

    // In production, extract from host header
    if (!subdomain && !customDomain) {
      // Check if it's a subdomain of rulxy.com
      if (host.endsWith(".rulxy.com")) {
        subdomain = host.replace(".rulxy.com", "").split(":")[0];
      } else if (!isDevHost(host)) {
        // Assume it's a custom domain
        customDomain = host.split(":")[0]; // Remove port if present
      }
    }

    // Validate subdomain format
    if (subdomain && !SUBDOMAIN_REGEX.test(subdomain)) {
      console.warn(
        `[serve] Invalid subdomain format: ${subdomain} from IP: ${clientIp}`,
      );
      return new NextResponse(
        generateErrorHtml(
          "Invalid Subdomain",
          "Subdomain contains invalid characters",
        ),
        { status: 400, headers: getSecurityHeaders(false) },
      );
    }

    if (!subdomain && !customDomain) {
      return new NextResponse(
        generateErrorHtml(
          "No subdomain or domain specified",
          "Add ?subdomain=your-subdomain to test locally",
        ),
        { status: 400, headers: getSecurityHeaders(false) },
      );
    }

    // Rate limiting by subdomain/domain and IP
    const rateLimitKey = `${subdomain || customDomain}:${clientIp}`;
    const { success, limit, remaining, reset } =
      await serveRateLimiter.limit(rateLimitKey);

    if (!success) {
      console.warn(`[serve] Rate limit exceeded for ${rateLimitKey}`);
      return new NextResponse(
        generateErrorHtml(
          "Too Many Requests",
          "Please slow down. Try again in a minute.",
        ),
        {
          status: 429,
          headers: {
            ...getSecurityHeaders(false),
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
          },
        },
      );
    }

    const supabase = createAdminClient();

    // Find project by subdomain or custom domain
    const query = supabase
      .from("projects")
      .select(
        "id, name, description, subdomain, custom_domain, domain_verified, code_files, platform",
      )
      .eq("platform", "WEB");

    if (subdomain) {
      query.eq("subdomain", subdomain);
    } else {
      query.eq("custom_domain", customDomain);
    }

    const { data: project, error } = await query.single();

    if (error || !project) {
      // Log potential probing attempts
      console.info(
        `[serve] Project not found: ${subdomain || customDomain} from IP: ${clientIp}`,
      );
      return new NextResponse(
        generateErrorHtml(
          "App not found",
          subdomain
            ? `No web app found at ${subdomain}.rulxy.com`
            : `Domain ${customDomain} is not configured or verified`,
        ),
        { status: 404, headers: getSecurityHeaders(!!customDomain) },
      );
    }

    // Verify custom domain is actually verified (double-check)
    if (customDomain && !project.domain_verified) {
      console.warn(
        `[serve] Unverified custom domain access attempt: ${customDomain} from IP: ${clientIp}`,
      );
      return new NextResponse(
        generateErrorHtml(
          "Domain Not Verified",
          "This custom domain has not been verified yet",
        ),
        { status: 403, headers: getSecurityHeaders(true) },
      );
    }

    const codeFiles = (project.code_files as CodeFiles) || {};

    // Check if there's any code to serve
    if (Object.keys(codeFiles).length === 0) {
      return new NextResponse(
        generateErrorHtml(
          "App is empty",
          "This web app doesn't have any code yet",
        ),
        { status: 404, headers: getSecurityHeaders(!!customDomain) },
      );
    }

    // Log successful serve for analytics
    console.info(
      `[serve] Serving ${subdomain || customDomain} (project: ${project.id}) to IP: ${clientIp}`,
    );

    const runtimeApiKey = await getProjectApiKey(supabase, project.id);
    // Use the public app URL or derive from host header (request.url is internal localhost in dev)
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const runtimeApiBase =
      process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
    const servedFiles = injectRuntimeConfig(
      codeFiles,
      runtimeApiBase,
      runtimeApiKey || undefined,
    );

    // Bundle code with esbuild and generate flat HTML
    const bundle = await bundleCodeFiles(servedFiles);
    const html = generateServeHtml(
      bundle.js,
      project.name,
      { description: project.description || undefined },
      {
        apiKey: runtimeApiKey || undefined,
        apiBase: runtimeApiBase,
      },
    );

    return new NextResponse(html, {
      status: 200,
      headers: getSecurityHeaders(!!customDomain),
    });
  } catch (error) {
    console.error("Serve error:", error);
    return new NextResponse(
      generateErrorHtml("Server Error", "Something went wrong"),
      { status: 500, headers: getSecurityHeaders(false) },
    );
  }
}

function injectRuntimeConfig(
  files: CodeFiles,
  apiBase: string,
  apiKey?: string,
): CodeFiles {
  const updated = { ...files };
  const paths = ["src/services/api.ts", "services/api.ts"];
  const apiBasePattern = /const\s+API_BASE\s*=\s*[^;]+;/;
  const apiKeyPattern = /const\s+API_KEY\s*=\s*[^;]+;/;

  for (const path of paths) {
    const content = updated[path];
    if (!content) continue;
    let next = content;
    next = next.replace(apiBasePattern, `const API_BASE = '${apiBase}';`);
    if (apiKey) {
      next = next.replace(apiKeyPattern, `const API_KEY = '${apiKey}';`);
    }
    updated[path] = next;
  }

  return updated;
}

async function getProjectApiKey(
  supabase: ReturnType<typeof createAdminClient>,
  projectId: string,
): Promise<string | null> {
  try {
    const { data: keys } = await supabase
      .from("project_api_keys")
      .select("key_encrypted")
      .eq("project_id", projectId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    const encrypted = keys?.[0]?.key_encrypted;
    if (!encrypted) return null;

    const { decrypt } = await import("@/lib/encrypt");
    return await decrypt(encrypted);
  } catch (error) {
    console.error("[serve] Failed to decrypt API key:", error);
    return null;
  }
}
