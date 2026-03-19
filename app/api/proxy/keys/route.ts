import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { generateApiKey } from "@/lib/proxy";
import type { ProxyService } from "@/types/proxy";
import { ProxyServiceEnum } from "@/types/proxy";
import { createAdminClient } from "@/lib/supabase/server";

const CreateKeySchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100).default("Default"),
  services: z
    .array(ProxyServiceEnum)
    .default(["database", "email", "sms", "maps", "storage", "xai"]),
  expiresInDays: z.number().min(1).max(365).optional(),
});

const RevokeKeySchema = z.object({
  keyId: z.string(),
});

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const { projectId, name, services, expiresInDays } = parsed.data;
    const supabase = createAdminClient();

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Calculate expiration date
    let expiresAt: string | undefined;
    if (expiresInDays) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expiresInDays);
      expiresAt = expDate.toISOString();
    }

    // Generate the API key
    const { rawKey, keyId, keyPrefix } = await generateApiKey(
      projectId,
      name,
      services,
    );

    // Update expiration if set
    if (expiresAt) {
      await supabase
        .from("project_api_keys")
        .update({ expires_at: expiresAt })
        .eq("id", keyId);
    }

    return NextResponse.json(
      {
        success: true,
        key: rawKey, // Only returned once!
        keyId,
        keyPrefix,
        services,
        expiresAt,
        warning: "Save this key securely - it will not be shown again!",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create API key error:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
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
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Verify user owns the project
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get all keys for the project
    const { data: keys } = await supabase
      .from("project_api_keys")
      .select(
        "id, name, key_prefix, services, active, last_used_at, created_at, expires_at",
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    // Transform to camelCase
    const transformedKeys = (keys || []).map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.key_prefix,
      services: k.services,
      active: k.active,
      lastUsedAt: k.last_used_at,
      createdAt: k.created_at,
      expiresAt: k.expires_at,
    }));

    return NextResponse.json({ keys: transformedKeys });
  } catch (error) {
    console.error("List API keys error:", error);
    return NextResponse.json(
      { error: "Failed to list API keys" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = RevokeKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const { keyId } = parsed.data;
    const supabase = createAdminClient();

    // Get the key and verify ownership
    const { data: key } = await supabase
      .from("project_api_keys")
      .select(
        `
        id,
        project:projects!project_id (
          id,
          user_id
        )
      `,
      )
      .eq("id", keyId)
      .single();

    if (!key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    const project = Array.isArray(key.project) ? key.project[0] : key.project;

    if (project.user_id !== uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the key
    await supabase.from("project_api_keys").delete().eq("id", keyId);

    return NextResponse.json({
      success: true,
      deleted: keyId,
    });
  } catch (error) {
    console.error("Revoke API key error:", error);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 },
    );
  }
}
