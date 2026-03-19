import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import {
  generateSubdomainFromName,
  RESERVED_SUBDOMAINS,
} from "@/lib/subdomain";
import { generateApiKey } from "@/lib/proxy";
import { handleCorsOptions, withCors } from "@/lib/cors";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import {
  DEFAULT_PROJECT_SERVICES,
  createProjectSchema,
  transformProject,
  transformNewProject,
} from "./helpers";
import { getTemplateCode } from "./templates";

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsOptions();
}

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return withCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }

    const supabase = await createClient();

    const { data: projects, error } = await supabase
      .from("projects")
      .select(
        `
        id,
        name,
        slug,
        description,
        platform,
        subdomain,
        custom_domain,
        domain_verified,
        github_repo,
        code_files,
        app_config,
        chat_history,
        created_at,
        updated_at
      `,
      )
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch projects:", error);
      return withCors(
        NextResponse.json(
          { error: "Failed to fetch projects" },
          { status: 500 },
        ),
      );
    }

    const transformedProjects = (projects || []).map(transformProject);

    return withCors(NextResponse.json({ projects: transformedProjects }));
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return withCors(
      NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 }),
    );
  }
}

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return withCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }

    const body = await request.json();
    const data = createProjectSchema.parse(body);
    const supabase = await createClient();

    // Generate unique slug
    let slug = slugify(data.name);
    let counter = 1;

    while (true) {
      const { data: existing } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existing) break;
      slug = `${slugify(data.name)}-${counter}`;
      counter++;
    }

    // Get template code if specified
    const codeFiles = getTemplateCode(data.template, data.platform);

    // Auto-assign subdomain for WEB projects
    let subdomain: string | null = null;
    if (data.platform === "WEB") {
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const candidate = generateSubdomainFromName(data.name);

        if (!RESERVED_SUBDOMAINS.has(candidate)) {
          const { data: existing } = await supabase
            .from("projects")
            .select("id")
            .eq("subdomain", candidate)
            .single();

          if (!existing) {
            subdomain = candidate;
            break;
          }
        }
        attempts++;
      }
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        name: data.name,
        description: data.description,
        slug,
        platform: data.platform,
        code_files: codeFiles,
        user_id: uid,
        subdomain,
        app_config: {
          name: data.name,
          slug,
          version: "1.0.0",
        },
      })
      .select()
      .single();

    if (projectError || !project) {
      console.error("Failed to create project:", projectError);
      return withCors(
        NextResponse.json(
          { error: "Failed to create project" },
          { status: 500 },
        ),
      );
    }

    // Auto-generate API key for the project
    const { rawKey, keyPrefix } = await generateApiKey(
      project.id,
      "Auto-generated",
      DEFAULT_PROJECT_SERVICES,
    );

    return withCors(
      NextResponse.json(
        {
          project: transformNewProject(project),
          apiKey: {
            key: rawKey,
            keyPrefix,
            services: DEFAULT_PROJECT_SERVICES,
            warning: "Save this key securely - it will not be shown again!",
          },
        },
        { status: 201 },
      ),
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withCors(
        NextResponse.json(
          { error: "Validation error", details: error.errors },
          { status: 400 },
        ),
      );
    }

    console.error("Failed to create project:", error);
    return withCors(
      NextResponse.json({ error: "Failed to create project" }, { status: 500 }),
    );
  }
}
