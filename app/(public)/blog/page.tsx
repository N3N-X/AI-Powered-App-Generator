import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { generateBreadcrumbSchema, siteConfig } from "@/lib/seo";
import { FileText, X, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BlogPostCard, BlogPagination } from "./components";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; page?: string }>;
}): Promise<Metadata> {
  const { tag, page } = await searchParams;
  const currentPage = parseInt(page || "1");

  const title = tag
    ? `${tag} Articles - Rulxy Blog`
    : "Blog - AI App Development Tutorials & Insights";
  const description = tag
    ? `Articles and tutorials about ${tag} for mobile app development with Rulxy.`
    : "Articles, tutorials, and insights about AI-powered app development, mobile development, and building production-ready apps with Rulxy.";

  const canonicalPath =
    currentPage > 1
      ? `/blog?page=${currentPage}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`
      : `/blog${tag ? `?tag=${encodeURIComponent(tag)}` : ""}`;

  return {
    title,
    description,
    alternates: { canonical: `${siteConfig.url}${canonicalPath}` },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${siteConfig.url}${canonicalPath}`,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        { url: siteConfig.ogImage, width: 1200, height: 630, alt: title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [siteConfig.ogImage],
      creator: "@ruxsh",
      site: "@ruxsh",
    },
    robots: currentPage > 1 ? { index: false, follow: true } : undefined,
  };
}

const POSTS_PER_PAGE = 6;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; page?: string }>;
}) {
  const { tag, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1"));
  const supabase = await createClient();

  // Get total count
  let countQuery = supabase
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  if (tag) {
    countQuery = countQuery.contains("tags", [tag]);
  }

  const { count } = await countQuery;
  const totalPages = Math.ceil((count || 0) / POSTS_PER_PAGE);

  // Get paginated posts
  let query = supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, cover_image, tags, published_at, users!blog_posts_author_id_fkey(name, avatar_url)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(
      (currentPage - 1) * POSTS_PER_PAGE,
      currentPage * POSTS_PER_PAGE - 1,
    );

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data: posts } = await query;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: siteConfig.url },
    { name: "Blog", url: `${siteConfig.url}/blog` },
  ]);

  // Transform posts data
  const transformedPosts = posts?.map((post) => ({
    ...post,
    users: Array.isArray(post.users) ? post.users[0] : post.users,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/30">
            <FileText className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Blog
        </h1>
        <p className="text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
          Insights, tutorials, and updates on AI-powered app development
        </p>
      </div>

      {/* Active tag filter */}
      {tag && (
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-sm text-gray-500 dark:text-slate-400">
            Filtered by:
          </span>
          <Link href="/blog">
            <Badge
              variant="premium"
              className="gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              {tag}
              <X className="h-3 w-3" />
            </Badge>
          </Link>
        </div>
      )}

      {/* Posts Grid */}
      {transformedPosts && transformedPosts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {transformedPosts.map((post, index) => (
              <BlogPostCard
                key={post.id}
                post={post}
                index={index}
                activeTag={tag}
              />
            ))}
          </div>

          <BlogPagination
            currentPage={currentPage}
            totalPages={totalPages}
            tag={tag}
          />
        </>
      ) : (
        <div className="text-center py-20">
          <FileText className="h-16 w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {tag ? `No posts tagged "${tag}"` : "No posts yet"}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            {tag
              ? "Try a different tag or view all posts."
              : "Check back soon for articles and tutorials."}
          </p>
          {tag && (
            <Button variant="ghost" asChild>
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                View all posts
              </Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}
