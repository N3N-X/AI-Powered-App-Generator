import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import {
  slugify,
  requireAdmin,
  CreatePostSchema,
  UpdatePostSchema,
  DeletePostSchema,
  mapPostWithAuthor,
} from "./helpers";

/**
 * GET /api/admin/blog — List all blog posts (admin)
 */
export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    const supabase = auth.supabase!;

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20")),
    );
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "";

    let query = supabase
      .from("blog_posts")
      .select(
        "id, title, slug, excerpt, content, cover_image, tags, status, published_at, created_at, updated_at, author_id, meta_title, meta_description, users!blog_posts_author_id_fkey(name)",
        { count: "exact" },
      )
      .order("updated_at", { ascending: false });

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    if (
      statusFilter &&
      (statusFilter === "draft" || statusFilter === "published")
    ) {
      query = query.eq("status", statusFilter);
    }

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

    return NextResponse.json({
      posts: (posts || []).map(mapPostWithAuthor),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin blog list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/blog — Create a blog post
 */
export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    const supabase = auth.supabase!;

    const body = await request.json();
    const data = CreatePostSchema.parse(body);

    const slug = data.slug || slugify(data.title);

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 409 },
      );
    }

    const insertData: Record<string, unknown> = {
      title: data.title,
      slug,
      excerpt: data.excerpt || null,
      content: data.content,
      cover_image: data.coverImage || null,
      tags: data.tags,
      status: data.status,
      author_id: auth.uid,
      meta_title: data.metaTitle || null,
      meta_description: data.metaDescription || null,
    };

    if (data.status === "published") {
      insertData.published_at = new Date().toISOString();
    }

    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Failed to create blog post:", error);
      return NextResponse.json(
        { error: "Failed to create post" },
        { status: 500 },
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Admin blog create error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/blog — Update a blog post
 */
export async function PATCH(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    const supabase = auth.supabase!;

    const body = await request.json();
    const data = UpdatePostSchema.parse(body);

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.coverImage !== undefined) updateData.cover_image = data.coverImage;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.metaTitle !== undefined) updateData.meta_title = data.metaTitle;
    if (data.metaDescription !== undefined)
      updateData.meta_description = data.metaDescription;

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "published") {
        const { data: current } = await supabase
          .from("blog_posts")
          .select("published_at")
          .eq("id", data.id)
          .single();

        if (!current?.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }
    }

    // Check slug uniqueness if changing
    if (data.slug) {
      const { data: existing } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", data.slug)
        .neq("id", data.id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "A post with this slug already exists" },
          { status: 409 },
        );
      }
    }

    const { data: post, error } = await supabase
      .from("blog_posts")
      .update(updateData)
      .eq("id", data.id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update blog post:", error);
      return NextResponse.json(
        { error: "Failed to update post" },
        { status: 500 },
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Admin blog update error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/blog — Delete a blog post
 */
export async function DELETE(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    const supabase = auth.supabase!;

    const body = await request.json();
    const data = DeletePostSchema.parse(body);

    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", data.id);

    if (error) {
      console.error("Failed to delete blog post:", error);
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Admin blog delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
}
