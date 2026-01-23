import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
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
 * /api/build/ios:
 *   post:
 *     summary: Trigger iOS EAS build
 *     description: Builds an iOS app using Expo Application Services (EAS) for a specific project. Requires authentication, valid credentials (Expo and Apple), and adherence to plan limits. Prepares project files, validates credentials, and submits the build.
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

    // Get user with credentials
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: {
        projects: {
          where: { id: data.projectId },
        },
        credentials: {
          where: { platform: { in: ["expo", "apple"] } },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check plan allows builds
    if (!PLAN_LIMITS[user.plan as Plan].buildAccess) {
      return NextResponse.json(
        { error: "Build access requires Pro or Elite plan" },
        { status: 403 },
      );
    }

    const project = user.projects[0];
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get credentials
    const expoCred = user.credentials.find((c) => c.platform === "expo");
    const appleCred = user.credentials.find((c) => c.platform === "apple");

    // Decrypt credentials
    const credentials: {
      expo?: { accessToken: string };
      apple?: {
        keyId: string;
        issuerId: string;
        p8Key: string;
        teamId: string;
      };
    } = {};

    if (expoCred) {
      try {
        const decrypted = await decryptJson<{ accessToken: string }>(
          expoCred.encryptedData,
        );
        credentials.expo = decrypted;
      } catch (error) {
        console.error("Failed to decrypt Expo credentials:", error);
      }
    }

    if (appleCred) {
      try {
        const decrypted = await decryptJson<{
          keyId: string;
          issuerId: string;
          p8Key: string;
          teamId: string;
        }>(appleCred.encryptedData);
        credentials.apple = decrypted;
      } catch (error) {
        console.error("Failed to decrypt Apple credentials:", error);
      }
    }

    // Validate credentials for iOS build
    const validation = validateBuildCredentials("IOS", credentials);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Invalid or missing credentials",
          details: validation.errors,
          hint: "iOS builds require both Expo and Apple Developer credentials",
        },
        { status: 400 },
      );
    }

    // Prepare project files for build
    const codeFiles = project.codeFiles as CodeFiles;
    const appConfig = project.appConfig as AppConfig;
    const preparedFiles = prepareProjectForBuild(codeFiles, appConfig);

    // Trigger EAS build
    const { buildId, buildUrl } = await triggerEASBuild({
      platform: "IOS",
      profile: data.profile,
      codeFiles: preparedFiles,
      appConfig,
      credentials,
    });

    // Create build record
    const build = await prisma.build.create({
      data: {
        platform: "IOS",
        status: "QUEUED",
        easBuildId: buildId,
        buildUrl,
        buildProfile: data.profile,
        userId: user.id,
        projectId: project.id,
      },
    });

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
