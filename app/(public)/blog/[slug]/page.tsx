import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { generateBreadcrumbSchema, siteConfig } from "@/lib/seo";
import sanitizeHtml from "sanitize-html";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("blog_posts")
    .select(
      "title, excerpt, meta_title, meta_description, cover_image, tags, published_at",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) {
    return { title: "Post Not Found" };
  }

  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || "";
  const image = post.cover_image || siteConfig.ogImage;
  const url = `${siteConfig.url}/blog/${slug}`;
  const keywords = post.tags?.join(", ") || "";

  return {
    title,
    description,
    keywords,
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "en_US",
      url,
      title,
      description,
      siteName: siteConfig.name,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      publishedTime: post.published_at,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@ruxsh",
      site: "@ruxsh",
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*, users!blog_posts_author_id_fkey(name, avatar_url)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) {
    notFound();
  }

  const author = Array.isArray(post.users) ? post.users[0] : post.users;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: siteConfig.url },
    { name: "Blog", url: `${siteConfig.url}/blog` },
    { name: post.title, url: `${siteConfig.url}/blog/${slug}` },
  ]);

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.meta_description || "",
    image: post.cover_image || siteConfig.ogImage,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: author?.name || "Rulxy Team",
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/blog/${slug}`,
    },
    keywords: post.tags?.join(", ") || "",
    articleSection: "Technology",
    inLanguage: "en-US",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbSchema, blogPostingSchema]),
        }}
      />

      {/* Breadcrumb Navigation */}
      <nav className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
      </nav>

      {/* Cover Image */}
      {post.cover_image && (
        <div className="mb-8 rounded-3xl overflow-hidden">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-auto"
          />
        </div>
      )}

      {/* Post Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-gray-600 dark:text-slate-400 mb-6">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.name || "Author"}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center">
                <span className="text-sm text-violet-400 font-medium">
                  {author?.name?.[0] || "A"}
                </span>
              </div>
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              {author?.name || "Rulxy Team"}
            </span>
          </div>
          {post.published_at && (
            <>
              <span className="text-gray-300 dark:text-slate-600">|</span>
              <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag: string) => (
              <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Article Content */}
      <Card className="rounded-3xl">
        <CardContent className="p-8 md:p-12">
          <div
            className="prose prose-lg dark:prose-invert prose-violet max-w-none
              prose-headings:text-gray-900 dark:prose-headings:text-white
              prose-p:text-gray-700 dark:prose-p:text-slate-300
              prose-a:text-violet-600 dark:prose-a:text-violet-400
              prose-strong:text-gray-900 dark:prose-strong:text-white
              prose-code:bg-gray-100 dark:prose-code:bg-white/10 prose-code:text-violet-600 dark:prose-code:text-violet-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-gray-900 prose-pre:text-gray-100 dark:prose-pre:bg-black/60 dark:prose-pre:text-gray-100 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:overflow-x-auto
              prose-li:text-gray-700 dark:prose-li:text-slate-300
              prose-img:rounded-2xl"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(post.content, {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                  "img",
                  "h1",
                  "h2",
                  "iframe",
                ]),
                allowedAttributes: {
                  ...sanitizeHtml.defaults.allowedAttributes,
                  img: ["src", "alt", "title", "width", "height", "loading"],
                  a: ["href", "target", "rel"],
                  iframe: [
                    "src",
                    "width",
                    "height",
                    "frameborder",
                    "allow",
                    "allowfullscreen",
                  ],
                },
              }),
            }}
          />
        </CardContent>
      </Card>

      {/* Back to Blog */}
      <div className="mt-12 text-center">
        <Button variant="ghost" asChild>
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all posts
          </Link>
        </Button>
      </div>
    </>
  );
}
