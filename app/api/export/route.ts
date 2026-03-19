import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { prepareProjectForBuild } from "@/lib/eas";
import { generateGitignore, generateReadme } from "@/lib/github";
import { CodeFiles, AppConfig } from "@/types";

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
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

    // Validate projectId is a non-empty alphanumeric/UUID string
    if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID format" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get project owned by user
    const { data: project, error } = await supabase
      .from("projects")
      .select("id, name, slug, description, code_files, app_config")
      .eq("id", projectId)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get code files and prepare for export
    const codeFiles = project.code_files as CodeFiles;
    const appConfig = (project.app_config as AppConfig) || {
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

    // Sanitize filename for Content-Disposition header
    const safeFilename = project.slug
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50);

    // Return ZIP file
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeFilename}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "[export] Error:",
      error instanceof Error ? error.message : error,
    );
    console.error("[export] Stack:", error instanceof Error ? error.stack : "");
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
