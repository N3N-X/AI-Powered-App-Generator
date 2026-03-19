import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  tags: string[] | null;
  published_at: string | null;
  users: { name: string | null; avatar_url: string | null } | null;
}

interface BlogPostCardProps {
  post: BlogPost;
  index: number;
  activeTag?: string;
}

export function BlogPostCard({ post, index, activeTag }: BlogPostCardProps) {
  const author = post.users;

  return (
    <Card
      className="group rounded-3xl overflow-hidden hover:border-violet-500/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{
        animationDelay: `${index * 75}ms`,
        animationFillMode: "backwards",
      }}
    >
      <Link href={`/blog/${post.slug}`}>
        {post.cover_image && (
          <div className="overflow-hidden">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <CardContent className="p-6 pb-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-gray-600 dark:text-slate-400 mb-4 line-clamp-2">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {author?.avatar_url ? (
                <img
                  src={author.avatar_url}
                  alt={author.name || "Author"}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-violet-600/20 flex items-center justify-center">
                  <span className="text-xs text-violet-400 font-medium">
                    {author?.name?.[0] || "A"}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-500 dark:text-slate-500">
                {author?.name || "Rulxy Team"}
              </span>
            </div>
            {post.published_at && (
              <span className="text-sm text-gray-500 dark:text-slate-500">
                {new Date(post.published_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </CardContent>
      </Link>
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-6 pb-5">
          {post.tags.slice(0, 3).map((postTag: string) => (
            <Link
              key={postTag}
              href={`/blog?tag=${encodeURIComponent(postTag)}`}
            >
              <Badge
                variant={activeTag === postTag ? "premium" : "secondary"}
                className="text-[10px] cursor-pointer hover:opacity-80 transition-opacity"
              >
                {postTag}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
