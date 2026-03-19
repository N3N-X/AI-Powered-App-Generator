/**
 * Proxy Configuration API
 *
 * GET: Fetch all proxy configs for a project with detected services
 * POST: Create or update a proxy config for a specific service
 * DELETE: Remove a proxy config
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  getProxyConfigs,
  saveProxyConfig,
  deleteProxyConfig,
} from "@/lib/proxy-config";
import type { ProxyConfigService } from "@/types/proxy-config";

const serviceSchema = z.enum(["email", "sms", "push", "storage", "maps"]);

const saveConfigSchema = z.object({
  service: serviceSchema,
  config: z.record(z.unknown()),
});

// ---------------------------------------------------------------------------
// GET - Fetch all proxy configs with detection
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(_req, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get configs with detection
    const result = await getProxyConfigs(projectId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching proxy configs:", error);
    return NextResponse.json(
      { error: "Failed to fetch proxy configs" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST - Save a proxy config
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(req, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const parsed = saveConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { service, config } = parsed.data;

    // Save config
    const result = await saveProxyConfig(
      projectId,
      service as ProxyConfigService,
      config,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to save config" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving proxy config:", error);
    return NextResponse.json(
      { error: "Failed to save proxy config" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE - Remove a proxy config
// ---------------------------------------------------------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(req, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get service from query params
    const service = req.nextUrl.searchParams.get("service");

    if (!service) {
      return NextResponse.json(
        { error: "Missing service parameter" },
        { status: 400 },
      );
    }

    const parsedService = serviceSchema.safeParse(service);
    if (!parsedService.success) {
      return NextResponse.json({ error: "Invalid service" }, { status: 400 });
    }

    // Delete config
    const result = await deleteProxyConfig(
      projectId,
      parsedService.data as ProxyConfigService,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete config" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting proxy config:", error);
    return NextResponse.json(
      { error: "Failed to delete proxy config" },
      { status: 500 },
    );
  }
}
