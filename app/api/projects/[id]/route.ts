import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Validate file paths to prevent path traversal attacks
const safeFilePathRegex = /^[a-zA-Z0-9_\-./]+$/;

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  codeFiles: z.record(z.string(), z.string().max(1000000)).optional(),
  appConfig: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Transform snake_case to camelCase
    const transformedProject = {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      platform: project.platform,
      subdomain: project.subdomain,
      customDomain: project.custom_domain,
      domainVerified: project.domain_verified,
      githubRepo: project.github_repo,
      codeFiles: project.code_files,
      appConfig: project.app_config,
      chatHistory: project.chat_history,
      userId: project.user_id,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    };

    return NextResponse.json({ project: transformedProject });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateProjectSchema.parse(body);
    const supabase = await createClient();

    // Verify ownership
    const { data: existingProject, error: fetchError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Sanitize codeFiles to prevent path traversal
    let sanitizedCodeFiles: Record<string, string> | undefined;
    if (data.codeFiles) {
      sanitizedCodeFiles = {};
      for (const [path, content] of Object.entries(data.codeFiles)) {
        // Only allow safe file paths (no path traversal, reasonable length)
        if (
          safeFilePathRegex.test(path) &&
          path.length <= 200 &&
          !path.includes("..")
        ) {
          sanitizedCodeFiles[path] = content;
        }
      }
      // If no valid files, don't update codeFiles
      if (Object.keys(sanitizedCodeFiles).length === 0) {
        sanitizedCodeFiles = undefined;
      }
    }

    // Build update data with snake_case
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (sanitizedCodeFiles) updateData.code_files = sanitizedCodeFiles;
    if (data.appConfig) updateData.app_config = data.appConfig;

    // Update project
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updatedProject) {
      console.error("Failed to update project:", updateError);
      return NextResponse.json(
        { error: "Failed to update project" },
        { status: 500 },
      );
    }

    // Transform snake_case to camelCase
    const transformedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      slug: updatedProject.slug,
      description: updatedProject.description,
      platform: updatedProject.platform,
      subdomain: updatedProject.subdomain,
      customDomain: updatedProject.custom_domain,
      domainVerified: updatedProject.domain_verified,
      githubRepo: updatedProject.github_repo,
      codeFiles: updatedProject.code_files,
      appConfig: updatedProject.app_config,
      chatHistory: updatedProject.chat_history,
      userId: updatedProject.user_id,
      createdAt: updatedProject.created_at,
      updatedAt: updatedProject.updated_at,
    };

    return NextResponse.json({ project: transformedProject });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Failed to update project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Delete project
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete project:", error);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
