import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  RESERVED_SUBDOMAINS,
  updateDomainSchema,
  buildDomainResponse,
  buildDnsRecords,
} from "./helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 20, window: 60_000 });
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
      .select("id, platform, subdomain, custom_domain, domain_verified, slug")
      .eq("id", id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.platform !== "WEB") {
      return NextResponse.json(
        { error: "Domain settings are only available for web projects" },
        { status: 400 },
      );
    }

    return NextResponse.json(buildDomainResponse(project));
  } catch (error) {
    console.error("Failed to fetch domain settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch domain settings" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 20, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateDomainSchema.parse(body);
    const supabase = await createClient();

    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id, platform, custom_domain")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.platform !== "WEB") {
      return NextResponse.json(
        { error: "Domain settings are only available for web projects" },
        { status: 400 },
      );
    }

    // Validate subdomain
    if (data.subdomain) {
      const lowerSubdomain = data.subdomain.toLowerCase();

      if (RESERVED_SUBDOMAINS.includes(lowerSubdomain)) {
        return NextResponse.json(
          { error: "This subdomain is reserved" },
          { status: 400 },
        );
      }

      const { data: existing } = await supabase
        .from("projects")
        .select("id")
        .eq("subdomain", lowerSubdomain)
        .neq("id", id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "This subdomain is already taken" },
          { status: 400 },
        );
      }

      data.subdomain = lowerSubdomain;
    }

    // Validate custom domain
    if (data.customDomain) {
      const lowerDomain = data.customDomain.toLowerCase();

      const { data: existing } = await supabase
        .from("projects")
        .select("id")
        .eq("custom_domain", lowerDomain)
        .neq("id", id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "This domain is already registered to another project" },
          { status: 400 },
        );
      }

      data.customDomain = lowerDomain;
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.subdomain !== undefined) updateData.subdomain = data.subdomain;
    if (data.customDomain !== undefined)
      updateData.custom_domain = data.customDomain;

    if (
      data.customDomain !== undefined &&
      data.customDomain !== project.custom_domain
    ) {
      updateData.domain_verified = false;
    }

    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .select("subdomain, custom_domain, domain_verified")
      .single();

    if (updateError || !updatedProject) {
      console.error("Failed to update domain settings:", updateError);
      return NextResponse.json(
        { error: "Failed to update domain settings" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ...buildDomainResponse(updatedProject),
      ...(updatedProject.custom_domain &&
        !updatedProject.domain_verified && {
          dnsRecords: buildDnsRecords(updatedProject.custom_domain, id),
        }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Failed to update domain settings:", error);
    return NextResponse.json(
      { error: "Failed to update domain settings" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 20, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const supabase = await createClient();

    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (type === "subdomain" || type === "all") {
      updateData.subdomain = null;
    }
    if (type === "customDomain" || type === "all") {
      updateData.custom_domain = null;
      updateData.domain_verified = false;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Specify type: subdomain, customDomain, or all" },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Failed to remove domain:", updateError);
      return NextResponse.json(
        { error: "Failed to remove domain" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove domain:", error);
    return NextResponse.json(
      { error: "Failed to remove domain" },
      { status: 500 },
    );
  }
}
