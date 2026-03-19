import { z } from "zod";

export { requireAdmin } from "@/lib/admin-helpers";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Schemas
export const CreatePostSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(500).optional(),
  excerpt: z.string().max(1000).optional(),
  content: z.string().default(""),
  coverImage: z.string().max(2000).optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
});

export const UpdatePostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  slug: z.string().min(1).max(500).optional(),
  excerpt: z.string().max(1000).optional(),
  content: z.string().optional(),
  coverImage: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published"]).optional(),
  metaTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
});

export const DeletePostSchema = z.object({
  id: z.string().uuid(),
});

export function mapPostWithAuthor(post: Record<string, unknown>) {
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
    content: post.content,
    cover_image: post.cover_image,
    tags: post.tags,
    status: post.status,
    published_at: post.published_at,
    meta_title: post.meta_title,
    meta_description: post.meta_description,
    created_at: post.created_at,
    updated_at: post.updated_at,
    author_id: post.author_id,
    author: author ? { name: author.name } : null,
  };
}
