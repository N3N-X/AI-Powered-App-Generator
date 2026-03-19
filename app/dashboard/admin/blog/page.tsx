"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUserStore, useIsAdmin } from "@/stores/user-store";
import { toast } from "@/hooks/use-toast";
import { FileText, Plus, ArrowLeft, Sparkles } from "lucide-react";
import {
  BlogPost,
  Pagination,
  BlogFormData,
  defaultForm,
  slugify,
} from "./types";
import { BlogFilters } from "./blog-filters";
import { BlogPostList } from "./blog-post-list";
import { BlogEditorDialog } from "./blog-editor-dialog";
import { DeleteDialog } from "./delete-dialog";
import { BatchGenerateDialog } from "./batch-generate-dialog";
import { useBlogGeneration } from "./use-blog-generation";

export default function AdminBlogPage() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { isLoaded } = useUserStore();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogFormData>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const generation = useBlogGeneration(form, setForm);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isLoaded, isAdmin, router]);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      const response = await fetch(`/api/admin/blog?${params}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    if (isLoaded) fetchPosts();
  }, [isLoaded, fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPosts();
  };
  const openNewPost = () => {
    setEditingPost(null);
    setForm(defaultForm);
    generation.setTitleSuggestions([]);
    generation.setGenTopic("");
    setEditorOpen(true);
  };

  const openEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      coverImage: post.cover_image || "",
      tags: post.tags?.join(", ") || "",
      status: post.status,
      metaTitle: post.meta_title || "",
      metaDescription: post.meta_description || "",
    });
    generation.setTitleSuggestions([]);
    generation.setGenTopic("");
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    const parseTags = (s: string) =>
      s
        ? s
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt || undefined,
        content: form.content,
        coverImage: form.coverImage || undefined,
        tags: parseTags(form.tags),
        status: form.status,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
      };
      if (editingPost) body.id = editingPost.id;
      const response = await fetch("/api/admin/blog", {
        method: editingPost ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save post");
      }
      const action = editingPost ? "updated" : "created";
      toast({
        title: editingPost ? "Post updated" : "Post created",
        description: `"${form.title}" has been ${action}`,
      });
      setEditorOpen(false);
      fetchPosts();
    } catch (error) {
      toast({
        title: "Save failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPost) return;
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/blog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingPost.id }),
      });
      if (!response.ok) throw new Error("Failed to delete post");
      toast({
        title: "Post deleted",
        description: `"${deletingPost.title}" has been deleted`,
      });
      setDeletingPost(null);
      fetchPosts();
    } catch {
      toast({
        title: "Delete failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-violet-500" />
              Blog Management
            </h1>
            <p className="text-gray-500 dark:text-slate-400">
              {pagination.total} total posts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/admin")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={() => setBatchDialogOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Batch Generate
            </Button>
            <Button onClick={openNewPost}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>

        <BlogFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => {
            setStatusFilter(v);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          onSubmit={handleSearch}
        />

        <BlogPostList
          posts={posts}
          pagination={pagination}
          isLoading={isLoading}
          onEdit={openEditPost}
          onDelete={setDeletingPost}
          onNewPost={openNewPost}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        />
      </div>

      <BlogEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editingPost={editingPost}
        form={form}
        onFormChange={setForm}
        isSaving={isSaving}
        onSave={handleSave}
        genType={generation.genType}
        onGenTypeChange={generation.setGenType}
        genTopic={generation.genTopic}
        onGenTopicChange={generation.setGenTopic}
        isGenerating={generation.isGenerating}
        onGenerate={generation.handleGenerate}
        titleSuggestions={generation.titleSuggestions}
        onTitleSuggestionsClear={() => generation.setTitleSuggestions([])}
      />

      <DeleteDialog
        post={deletingPost}
        isDeleting={isDeleting}
        onClose={() => setDeletingPost(null)}
        onConfirm={handleDelete}
      />

      <BatchGenerateDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        onComplete={fetchPosts}
      />
    </div>
  );
}
