import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import FormData from "form-data";
import prisma from "@/lib/db";
import {
  getDefaultAppJson,
  getDefaultPackageJson,
  getDefaultTsconfig,
  getDefaultAssets,
  slugify,
} from "@/lib/utils";

/**
 * @swagger
 * /api/build:
 *   post:
 *     summary: Submit a project for EAS build
 *     description: Builds a project using Expo Application Services (EAS), requiring authentication and a project ID. Submits a ZIP archive of the project files to EAS for building.
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
 *             required:
 *               - projectId
 *     responses:
 *       200:
 *         description: Build submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 buildId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request, missing project ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or project not found
 *       500:
 *         description: Build failed or EAS not configured
 */
export async function POST(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { projectId } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Project ID required" },
        { status: 400 },
      );
    }

    // Validate projectId format
    if (!/^[a-zA-Z0-9_-]{10,40}$/.test(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID format" },
        { status: 400 },
      );
    }

    // Get user and project
    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
      include: {
        projects: {
          where: { id: projectId },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = user.projects[0];
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get EAS credentials
    const easToken = process.env.EAS_ACCESS_TOKEN;
    const expoProjectId = process.env.EXPO_PROJECT_ID;

    if (!easToken || !expoProjectId) {
      return NextResponse.json(
        { error: "EAS build not configured" },
        { status: 500 },
      );
    }

    // Prepare project files
    let projectFiles = { ...(project.codeFiles as Record<string, string>) };

    // Add default files if missing
    if (!projectFiles["app.json"]) {
      projectFiles["app.json"] = getDefaultAppJson(
        project.name,
        slugify(project.name),
      );
    }

    if (!projectFiles["package.json"]) {
      projectFiles["package.json"] = getDefaultPackageJson(
        project.name,
        slugify(project.name),
      );
    }

    if (!projectFiles["tsconfig.json"]) {
      projectFiles["tsconfig.json"] = getDefaultTsconfig();
    }

    // Add default assets
    const defaultAssets = getDefaultAssets();
    projectFiles = { ...defaultAssets, ...projectFiles };

    // Create ZIP archive
    const { PassThrough } = await import("stream");
    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = new PassThrough();

    // Pipe archive to stream
    archive.pipe(stream);

    // Add files to archive
    for (const [filePath, content] of Object.entries(projectFiles)) {
      archive.append(content, { name: filePath });
    }

    // Add expo AppEntry.js if missing
    if (!projectFiles["expo/AppEntry.js"]) {
      archive.append(
        'import "expo/build/Expo.fx";\nimport { registerRootComponent } from "expo";\nimport App from "../App";\n\nregisterRootComponent(App);',
        { name: "expo/AppEntry.js" },
      );
    }

    await archive.finalize();

    // Submit to EAS build
    const formData = new FormData();
    formData.append("buildType", "development-client");
    formData.append("platform", "web");
    formData.append("archive", stream, {
      filename: "project.zip",
      contentType: "application/zip",
    });

    const buildResponse = await fetch(
      `https://api.expo.dev/v2/projects/${expoProjectId}/builds`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${easToken}`,
          ...formData.getHeaders(),
        },
        body: formData as unknown as BodyInit,
      },
    );

    if (!buildResponse.ok) {
      const error = await buildResponse.text();
      console.error("EAS build error:", error);
      return NextResponse.json(
        { error: "Failed to submit build" },
        { status: 500 },
      );
    }

    const buildData = await buildResponse.json();

    return NextResponse.json({
      success: true,
      buildId: buildData.id,
      status: buildData.status,
      message: "Build submitted successfully",
    });
  } catch (error) {
    console.error("Build submission error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Build failed" },
      { status: 500 },
    );
  }
}

// GET /api/build - Check build status
/**
 * @swagger
 * /api/build:
 *   get:
 *     summary: Check EAS build status
 *     description: Retrieves the status of an EAS build by build ID, requiring authentication. Returns build details including phase, URL, and error if any.
 *     parameters:
 *       - in: query
 *         name: buildId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the build to check
 *     responses:
 *       200:
 *         description: Build status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 buildId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 phase:
 *                   type: string
 *                 platform:
 *                   type: string
 *                 url:
 *                   type: string
 *                 qrCodeUrl:
 *                   type: string
 *                 error:
 *                   type: string
 *       400:
 *         description: Bad request, missing build ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to get build status or EAS not configured
 */
export async function GET(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildId = searchParams.get("buildId");

    if (!buildId) {
      return NextResponse.json({ error: "Build ID required" }, { status: 400 });
    }

    // Validate buildId format (UUID format for EAS builds)
    if (!/^[a-zA-Z0-9-]{20,50}$/.test(buildId)) {
      return NextResponse.json(
        { error: "Invalid build ID format" },
        { status: 400 },
      );
    }

    // Get EAS credentials
    const easToken = process.env.EAS_ACCESS_TOKEN;
    const expoProjectId = process.env.EXPO_PROJECT_ID;

    if (!easToken || !expoProjectId) {
      return NextResponse.json(
        { error: "EAS build not configured" },
        { status: 500 },
      );
    }

    // Check build status
    const statusResponse = await fetch(
      `https://api.expo.dev/v2/projects/${expoProjectId}/builds/${buildId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${easToken}`,
        },
      },
    );

    if (!statusResponse.ok) {
      const error = await statusResponse.text();
      console.error("EAS status error:", error);
      return NextResponse.json(
        { error: "Failed to get build status" },
        { status: 500 },
      );
    }

    const buildData = await statusResponse.json();

    return NextResponse.json({
      success: true,
      buildId: buildData.id,
      status: buildData.status,
      phase: buildData.phase,
      platform: buildData.platform,
      url: buildData.artifacts?.buildUrl,
      qrCodeUrl: buildData.qrCodeUrl,
      error: buildData.error,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status check failed" },
      { status: 500 },
    );
  }
}
