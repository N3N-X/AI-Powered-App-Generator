import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// Increase timeout to 5 minutes for batch generation
export const maxDuration = 300;
import {
  callGrok,
  generateCoverImage,
  parseJsonResponse,
  slugify,
} from "../helpers";
import { SYSTEM_PROMPTS } from "../prompts";

const BatchGenerateSchema = z.object({
  topics: z.array(z.string()).min(1).max(10),
  status: z.enum(["draft", "published"]).default("draft"),
  generateImages: z.boolean().default(true),
});

interface GeneratedPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  coverImage?: string;
}

interface BatchResult {
  topic: string;
  success: boolean;
  post?: { id: string; title: string; slug: string };
  error?: string;
}

async function generateFullPost(topic: string): Promise<GeneratedPost> {
  const userPrompt = `Write a complete blog post about: ${topic}`;
  const rawResponse = await callGrok(SYSTEM_PROMPTS.full, userPrompt);
  const parsed = parseJsonResponse(rawResponse);

  const title = parsed.title as string | undefined;
  const content = parsed.content as string | undefined;

  if (!title || !content) {
    throw new Error("Invalid generated content: missing title or content");
  }

  return {
    title,
    slug: (parsed.slug as string) || slugify(title),
    excerpt: (parsed.excerpt as string) || "",
    content,
    tags: (parsed.tags as string[]) || [],
    metaTitle: (parsed.metaTitle as string) || title,
    metaDescription:
      (parsed.metaDescription as string) || (parsed.excerpt as string) || "",
  };
}

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 2, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", uid)
      .single();

    if (userError || !user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const data = BatchGenerateSchema.parse(body);

    const results: BatchResult[] = [];

    for (const topic of data.topics) {
      try {
        // Generate content
        const generated = await generateFullPost(topic);

        // Check slug uniqueness
        const { data: existing } = await supabase
          .from("blog_posts")
          .select("id")
          .eq("slug", generated.slug)
          .single();

        if (existing) {
          generated.slug = `${generated.slug}-${Date.now()}`;
        }

        // Generate cover image if enabled
        if (data.generateImages) {
          try {
            // 2s delay to stay under 30 rpm limit
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const imagePrompt = `Professional blog cover image for an article titled '${generated.title}'. Modern, clean, tech-themed, minimalist illustration style with vibrant purple and indigo gradients, suitable for a tech blog header. No text in the image.`;
            generated.coverImage = await generateCoverImage(imagePrompt);
          } catch (imgError) {
            console.error(`Image generation failed for "${topic}":`, imgError);
          }
        }

        // Insert post
        const insertData: Record<string, unknown> = {
          title: generated.title,
          slug: generated.slug,
          excerpt: generated.excerpt || null,
          content: generated.content,
          cover_image: generated.coverImage || null,
          tags: generated.tags,
          status: data.status,
          author_id: uid,
          meta_title: generated.metaTitle || null,
          meta_description: generated.metaDescription || null,
        };

        if (data.status === "published") {
          insertData.published_at = new Date().toISOString();
        }

        const { data: post, error: insertError } = await supabase
          .from("blog_posts")
          .insert(insertData)
          .select("id, title, slug")
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        results.push({
          topic,
          success: true,
          post: { id: post.id, title: post.title, slug: post.slug },
        });
      } catch (error) {
        console.error(`Failed to generate post for "${topic}":`, error);
        results.push({
          topic,
          success: false,
          error: error instanceof Error ? error.message : "Generation failed",
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Generated ${successful} posts, ${failed} failed`,
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Batch generate error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Batch generation failed",
      },
      { status: 500 },
    );
  }
}
