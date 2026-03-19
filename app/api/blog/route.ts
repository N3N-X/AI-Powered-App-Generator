import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per minute per IP
  const limited = await withRateLimit(request, { limit: 60, window: 60_000 });
  if (limited) return limited;

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "10")),
    );
    const tag = searchParams.get("tag");

    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from("blog_posts")
      .select(
        "id, title, slug, excerpt, cover_image, tags, published_at, created_at, author_id, users!blog_posts_author_id_fkey(name, avatar_url)",
        { count: "exact" },
      )
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });

    // Filter by tag if provided
    if (tag) {
      query = query.contains("tags", [tag]);
    }

    // Pagination
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error("Failed to fetch blog posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: 500 },
      );
    }

    const total = count || 0;

    const response = NextResponse.json({
      posts: (posts || []).map((post: Record<string, unknown>) => {
        const users = post.users as unknown;
        const author = (Array.isArray(users) ? users[0] : users) as Record<
          string,
          unknown
        > | null;
        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          coverImage: post.cover_image,
          tags: post.tags,
          publishedAt: post.published_at,
          author: author
            ? { name: author.name, avatarUrl: author.avatar_url }
            : null,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    // Cache for CDN/edge
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300",
    );

    return response;
  } catch (error) {
    console.error("Blog listing error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}
