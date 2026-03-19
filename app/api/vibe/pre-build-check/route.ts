/**
 * Pre-Build Check API Endpoint
 *
 * Validates a project before EAS build to catch issues early.
 * Returns categorized issues (critical, warning, tip) with auto-fix options.
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  runPreBuildChecks,
  type BuildPlatform,
  type PreBuildCheckResult,
} from "@/lib/build/pre-build-checks";
import {
  checkStoreGuidelines,
  type StoreGuidelinesResult,
} from "@/lib/build/store-guidelines";

const requestSchema = z.object({
  projectId: z.string().trim().min(1),
  platform: z.enum(["ios", "android"]),
  includeStoreGuidelines: z.boolean().optional().default(true),
});

export interface PreBuildCheckResponse {
  success: boolean;
  preBuild: PreBuildCheckResult;
  storeGuidelines?: StoreGuidelinesResult;
  summary: {
    canBuild: boolean;
    criticalCount: number;
    warningCount: number;
    tipCount: number;
    autoFixableCount: number;
  };
}

export async function POST(req: NextRequest) {
  const limited = await withRateLimit(req, { limit: 20, window: 60_000 });
  if (limited) return limited;

  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { projectId, platform, includeStoreGuidelines } = parsed.data;

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, code_files, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify ownership
    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get code files
    const files = (project.code_files as Record<string, string>) || {};

    if (Object.keys(files).length === 0) {
      return NextResponse.json(
        { error: "Project has no code files" },
        { status: 400 },
      );
    }

    // Run pre-build checks
    const preBuildResult = runPreBuildChecks(files, platform as BuildPlatform);

    // Run store guidelines checks if requested
    let storeResult: StoreGuidelinesResult | undefined;
    if (includeStoreGuidelines) {
      storeResult = checkStoreGuidelines(files, platform as BuildPlatform);
    }

    // Calculate summary
    const allIssues = [
      ...preBuildResult.critical,
      ...preBuildResult.warnings,
      ...preBuildResult.tips,
      ...(storeResult?.issues || []),
    ];

    const response: PreBuildCheckResponse = {
      success: true,
      preBuild: preBuildResult,
      storeGuidelines: storeResult,
      summary: {
        canBuild: preBuildResult.canBuild && (storeResult?.compliant ?? true),
        criticalCount:
          preBuildResult.critical.length +
          (storeResult?.issues.filter((i) => i.tier === "critical").length ||
            0),
        warningCount:
          preBuildResult.warnings.length +
          (storeResult?.issues.filter((i) => i.tier === "warning").length || 0),
        tipCount:
          preBuildResult.tips.length +
          (storeResult?.issues.filter((i) => i.tier === "tip").length || 0),
        autoFixableCount: allIssues.filter((i) => i.autoFixable).length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Pre-build check error:", error);
    return NextResponse.json(
      { error: "Pre-build check failed" },
      { status: 500 },
    );
  }
}
