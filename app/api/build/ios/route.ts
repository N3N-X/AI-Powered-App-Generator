import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  triggerEASBuild,
  prepareProjectForBuild,
  estimateBuildTime,
} from "@/lib/eas";
import { CodeFiles, AppConfig } from "@/types";

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 5, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = z
      .object({
        projectId: z.string(),
        profile: z
          .enum(["development", "preview", "production"])
          .default("production"),
      })
      .parse(body);

    const supabase = await createClient();

    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check user has enough credits
    const { CREDIT_COSTS } = await import("@/types");
    if (user.credits < CREDIT_COSTS.buildIOS) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: CREDIT_COSTS.buildIOS,
          available: user.credits,
        },
        { status: 403 },
      );
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", data.projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Prepare project files for build
    const codeFiles = project.code_files as CodeFiles;
    const appConfig = project.app_config as AppConfig;
    const preparedFiles = prepareProjectForBuild(
      codeFiles,
      appConfig,
      data.profile,
      "IOS",
    );

    // Trigger EAS build (platform handles signing)
    const { buildId, buildUrl } = await triggerEASBuild({
      platform: "IOS",
      profile: data.profile,
      codeFiles: preparedFiles,
      appConfig,
    });

    // Create build record
    const { data: build, error: buildError } = await supabase
      .from("builds")
      .insert({
        platform: "IOS",
        status: "QUEUED",
        eas_build_id: buildId,
        build_url: buildUrl,
        build_profile: data.profile,
        user_id: user.id,
        project_id: project.id,
      })
      .select()
      .single();

    if (buildError || !build) {
      console.error("Failed to create build record:", buildError);
      return NextResponse.json(
        { error: "Failed to create build record" },
        { status: 500 },
      );
    }

    const estimate = estimateBuildTime("IOS", data.profile);

    return NextResponse.json({
      success: true,
      buildId: build.id,
      easBuildId: buildId,
      buildUrl,
      status: "QUEUED",
      estimate: {
        min: estimate.min,
        max: estimate.max,
        unit: estimate.unit,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("iOS build error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Build failed" },
      { status: 500 },
    );
  }
}
