import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  triggerEASBuild,
  prepareProjectForBuild,
  validateBuildCredentials,
  estimateBuildTime,
} from "@/lib/eas";
import { decryptJson } from "@/lib/encrypt";
import {
  BuildRequestSchema,
  CodeFiles,
  AppConfig,
  PLAN_LIMITS,
  Plan,
} from "@/types";

/**
 * @swagger
 * /api/build/android:
 *   post:
 *     summary: Trigger Android EAS build
 *     description: Builds an Android app using Expo Application Services (EAS) for a specific project. Requires authentication, valid credentials, and adherence to plan limits. Prepares project files, validates credentials, and submits the build.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: ID of the project to build
 *               profile:
 *                 type: string
 *                 description: Build profile (e.g., development, production)
 *             required:
 *               - projectId
 *               - profile
 *     responses:
 *       200:
 *         description: Build triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 buildId:
 *                   type: string
 *                 easBuildId:
 *                   type: string
 *                 buildUrl:
 *                   type: string
 *                 status:
 *                   type: string
 *                 estimate:
 *                   type: object
 *                   properties:
 *                     min:
 *                       type: integer
 *                     max:
 *                       type: integer
 *                     unit:
 *                       type: string
 *       400:
 *         description: Validation error or invalid credentials
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Plan does not allow builds
 *       404:
 *         description: User or project not found
 *       500:
 *         description: Build failed
 */
export async function POST(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = BuildRequestSchema.parse(body);

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

    // Check plan allows builds
    if (!PLAN_LIMITS[user.plan as Plan].buildAccess) {
      return NextResponse.json(
        { error: "Build access requires Pro or Elite plan" },
        { status: 403 },
      );
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", data.projectId)
      .eq("user_id", uid)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get credentials
    const { data: credentials, error: credError } = await supabase
      .from("credentials")
      .select("*")
      .eq("user_id", uid)
      .in("platform", ["expo", "google"]);

    const expoCred = credentials?.find((c) => c.platform === "expo");
    const googleCred = credentials?.find((c) => c.platform === "google");

    // Decrypt credentials
    const buildCredentials: {
      expo?: { accessToken: string };
      google?: { serviceAccountJson: string };
    } = {};

    if (expoCred) {
      try {
        const decrypted = await decryptJson<{ accessToken: string }>(
          expoCred.encrypted_data,
        );
        buildCredentials.expo = decrypted;
      } catch (error) {
        console.error("Failed to decrypt Expo credentials:", error);
      }
    }

    if (googleCred) {
      try {
        const decrypted = await decryptJson<{ serviceAccountJson: string }>(
          googleCred.encrypted_data,
        );
        buildCredentials.google = decrypted;
      } catch (error) {
        console.error("Failed to decrypt Google credentials:", error);
      }
    }

    // Validate credentials
    const validation = validateBuildCredentials("ANDROID", {
      expo: buildCredentials.expo,
    });
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Invalid or missing credentials",
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    // Prepare project files for build
    const codeFiles = project.code_files as CodeFiles;
    const appConfig = project.app_config as AppConfig;
    const preparedFiles = prepareProjectForBuild(codeFiles, appConfig);

    // Trigger EAS build
    const { buildId, buildUrl } = await triggerEASBuild({
      platform: "ANDROID",
      profile: data.profile,
      codeFiles: preparedFiles,
      appConfig,
      credentials: buildCredentials,
    });

    // Create build record
    const { data: build, error: buildError } = await supabase
      .from("builds")
      .insert({
        platform: "ANDROID",
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
      throw new Error("Failed to create build record");
    }

    const estimate = estimateBuildTime("ANDROID", data.profile);

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

    console.error("Android build error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Build failed" },
      { status: 500 },
    );
  }
}
