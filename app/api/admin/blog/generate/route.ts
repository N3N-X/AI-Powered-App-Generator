import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { callGrok, generateCoverImage, parseJsonResponse } from "./helpers";
import { SYSTEM_PROMPTS } from "./prompts";

const GenerateSchema = z.object({
  type: z.enum(["title", "excerpt", "content", "seo", "full", "image"]),
  topic: z.string().optional(),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 5, window: 60_000 });
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
    const data = GenerateSchema.parse(body);

    // Handle image generation separately
    if (data.type === "image") {
      const title = data.title || data.topic || "technology";
      const excerptContext = data.excerpt ? ` ${data.excerpt}` : "";
      const imagePrompt = `Professional blog cover image for an article titled '${title}'.${excerptContext} Modern, clean, tech-themed, minimalist illustration style with vibrant purple and indigo gradients, suitable for a tech blog header. No text in the image.`;

      const imageUrl = await generateCoverImage(imagePrompt);
      return NextResponse.json({ imageUrl });
    }

    // Text generation
    const systemPrompt = SYSTEM_PROMPTS[data.type];
    if (!systemPrompt) {
      return NextResponse.json(
        { error: "Invalid generation type" },
        { status: 400 },
      );
    }

    let userPrompt = "";

    switch (data.type) {
      case "title":
        userPrompt = `Generate 5 blog post title ideas about: ${data.topic || "AI and app development"}`;
        if (data.keywords?.length) {
          userPrompt += `\n\nTarget keywords: ${data.keywords.join(", ")}`;
        }
        break;

      case "excerpt":
        userPrompt = `Write an excerpt for a blog post titled: "${data.title || "Untitled"}"`;
        if (data.content) {
          userPrompt += `\n\nPost content preview:\n${data.content.slice(0, 1000)}`;
        }
        break;

      case "content":
        userPrompt = `Write a full blog post titled: "${data.title || "Untitled"}"`;
        if (data.excerpt) {
          userPrompt += `\n\nPost summary: ${data.excerpt}`;
        }
        if (data.keywords?.length) {
          userPrompt += `\n\nTarget keywords: ${data.keywords.join(", ")}`;
        }
        break;

      case "seo":
        userPrompt = `Generate SEO metadata for a blog post titled: "${data.title || "Untitled"}"`;
        if (data.excerpt) {
          userPrompt += `\n\nExcerpt: ${data.excerpt}`;
        }
        if (data.content) {
          userPrompt += `\n\nContent preview:\n${data.content.slice(0, 500)}`;
        }
        break;

      case "full":
        userPrompt = `Write a complete blog post about: ${data.topic || "AI and app development"}`;
        if (data.keywords?.length) {
          userPrompt += `\n\nTarget keywords: ${data.keywords.join(", ")}`;
        }
        break;
    }

    const rawResponse = await callGrok(systemPrompt, userPrompt);

    try {
      const parsed = parseJsonResponse(rawResponse);

      // For full post, also generate cover image
      if (data.type === "full" && parsed.title) {
        try {
          const imagePrompt = `Professional blog cover image for an article titled '${parsed.title}'. Modern, clean, tech-themed, minimalist illustration style with vibrant purple and indigo gradients, suitable for a tech blog header. No text in the image.`;
          const coverImage = await generateCoverImage(imagePrompt);
          parsed.coverImage = coverImage;
        } catch (imgError) {
          console.error("Image generation failed, skipping:", imgError);
        }
      }

      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ raw: rawResponse });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Blog generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 },
    );
  }
}
