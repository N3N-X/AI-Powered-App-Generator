import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import prisma from "@/lib/db";
import { prepareProjectForBuild } from "@/lib/eas";
import { generateGitignore, generateReadme } from "@/lib/github";
import { CodeFiles, AppConfig } from "@/types";

/**
 * @swagger
 * /api/export:
 *   get:
 *     summary: Export project as ZIP
 *     description: Downloads a complete project as a ZIP file, including all code files, configurations, and additional files like README and .gitignore. Requires authentication and ownership of the project.
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project to export
 *     responses:
 *       200:
 *         description: ZIP file download
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Project ID required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or project not found
 *       500:
 *         description: Export failed
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID required" },
        { status: 400 },
      );
    }

    // Get user and project
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
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

    // Get code files and prepare for export
    const codeFiles = project.codeFiles as CodeFiles;
    const appConfig = (project.appConfig as AppConfig) || {
      name: project.name,
      slug: project.slug,
      version: "1.0.0",
    };

    // Prepare complete project files
    const preparedFiles = prepareProjectForBuild(codeFiles, appConfig);

    // Add additional files
    const exportFiles: CodeFiles = {
      ...preparedFiles,
      ".gitignore": generateGitignore(),
      "README.md": generateReadme(
        project.name,
        project.description || undefined,
      ),
    };

    // Create ZIP file
    const zip = new JSZip();
    const projectFolder = zip.folder(project.slug);

    if (!projectFolder) {
      return NextResponse.json(
        { error: "Failed to create ZIP" },
        { status: 500 },
      );
    }

    // Add all files to ZIP
    for (const [filePath, content] of Object.entries(exportFiles)) {
      projectFolder.file(filePath, content);
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    // Return ZIP file
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${project.slug}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
