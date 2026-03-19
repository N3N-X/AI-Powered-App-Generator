"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { BlogPost, Pagination, CARD_CLASS } from "./types";

interface BlogPostListProps {
  posts: BlogPost[];
  pagination: Pagination;
  isLoading: boolean;
  onEdit: (post: BlogPost) => void;
  onDelete: (post: BlogPost) => void;
  onNewPost: () => void;
  onPageChange: (page: number) => void;
}

export function BlogPostList({
  posts,
  pagination,
  isLoading,
  onEdit,
  onDelete,
  onNewPost,
  onPageChange,
}: BlogPostListProps) {
  return (
    <Card className={CARD_CLASS}>
      <CardHeader>
        <CardTitle>Posts</CardTitle>
        <CardDescription>
          Showing {posts.length} of {pagination.total} posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {post.cover_image && (
                    <img
                      src={post.cover_image}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-gray-900 dark:text-white font-medium truncate">
                      {post.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                      /blog/{post.slug}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex gap-1">
                    {post.tags?.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Badge
                    variant={
                      post.status === "published" ? "success" : "secondary"
                    }
                  >
                    {post.status}
                  </Badge>
                  <span className="text-xs text-slate-500 w-24 text-right">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : "—"}
                  </span>
                  <div className="flex gap-1">
                    {post.status === "published" && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(post)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(post)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {posts.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-slate-400">
                  No blog posts yet
                </p>
                <Button onClick={onNewPost} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first post
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
