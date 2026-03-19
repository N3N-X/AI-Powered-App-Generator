import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const limited = await withRateLimit(request, { limit: 60, window: 60_000 });
  if (limited) return limited;

  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(
        "id, title, slug, excerpt, content, cover_image, tags, status, published_at, created_at, updated_at, meta_title, meta_description, author_id, users!blog_posts_author_id_fkey(name, avatar_url)",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const users = post.users as unknown;
    const author = (Array.isArray(users) ? users[0] : users) as Record<
      string,
      unknown
    > | null;

    const response = NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.cover_image,
        tags: post.tags,
        publishedAt: post.published_at,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        metaTitle: post.meta_title,
        metaDescription: post.meta_description,
        author: author
          ? { name: author.name, avatarUrl: author.avatar_url }
          : null,
      },
    });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300",
    );

    return response;
  } catch (error) {
    console.error("Blog post fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 },
    );
  }
}
