"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, ImagePlus } from "lucide-react";
import { BlogPost, BlogFormData, GenerationType, slugify } from "./types";
import { AiGenerationBar } from "./ai-generation-bar";

interface BlogEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPost: BlogPost | null;
  form: BlogFormData;
  onFormChange: React.Dispatch<React.SetStateAction<BlogFormData>>;
  isSaving: boolean;
  onSave: () => void;
  genType: GenerationType;
  onGenTypeChange: (type: GenerationType) => void;
  genTopic: string;
  onGenTopicChange: (topic: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  titleSuggestions: string[];
  onTitleSuggestionsClear: () => void;
}

export function BlogEditorDialog({
  open,
  onOpenChange,
  editingPost,
  form,
  onFormChange,
  isSaving,
  onSave,
  genType,
  onGenTypeChange,
  genTopic,
  onGenTopicChange,
  isGenerating,
  onGenerate,
  titleSuggestions,
  onTitleSuggestionsClear,
}: BlogEditorDialogProps) {
  const handleGenerateImage = () => {
    onGenTypeChange("image");
    setTimeout(() => onGenerate(), 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f0f15] border-white/10 max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {editingPost ? "Edit Post" : "New Blog Post"}
          </DialogTitle>
          <DialogDescription>
            {editingPost
              ? `Editing "${editingPost.title}"`
              : "Create a new blog post — use AI to generate content"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <AiGenerationBar
            genType={genType}
            onGenTypeChange={onGenTypeChange}
            genTopic={genTopic}
            onGenTopicChange={onGenTopicChange}
            isGenerating={isGenerating}
            onGenerate={onGenerate}
            titleSuggestions={titleSuggestions}
            onTitleSuggestionsClear={onTitleSuggestionsClear}
            onFormChange={onFormChange}
          />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => {
                  onFormChange((prev) => ({
                    ...prev,
                    title: e.target.value,
                    slug: editingPost ? prev.slug : slugify(e.target.value),
                  }));
                }}
                placeholder="Post title"
                className="bg-white/5"
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  onFormChange((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="post-url-slug"
                className="bg-white/5"
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) =>
                  onFormChange((prev) => ({ ...prev, excerpt: e.target.value }))
                }
                placeholder="Brief summary of the post..."
                className="bg-white/5"
                rows={2}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label>Content (HTML)</Label>
              <Textarea
                value={form.content}
                onChange={(e) =>
                  onFormChange((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                placeholder="<h2>Introduction</h2><p>Your content here...</p>"
                className="bg-white/5 font-mono text-sm"
                rows={12}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Cover Image URL</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateImage}
                  disabled={isGenerating || !form.title}
                  className="text-violet-400 hover:text-violet-300"
                >
                  <ImagePlus className="h-4 w-4 mr-1" />
                  Generate Image
                </Button>
              </div>
              <Input
                value={form.coverImage}
                onChange={(e) =>
                  onFormChange((prev) => ({
                    ...prev,
                    coverImage: e.target.value,
                  }))
                }
                placeholder="https://..."
                className="bg-white/5"
                disabled={isGenerating}
              />
              {form.coverImage && (
                <img
                  src={form.coverImage}
                  alt="Cover preview"
                  className="h-32 w-auto object-cover rounded-lg mt-2"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={form.tags}
                  onChange={(e) =>
                    onFormChange((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  placeholder="ai, mobile, development"
                  className="bg-white/5"
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    onFormChange((prev) => ({ ...prev, status: v }))
                  }
                  disabled={isGenerating}
                >
                  <SelectTrigger className="bg-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Meta Title (SEO)</Label>
              <Input
                value={form.metaTitle}
                onChange={(e) =>
                  onFormChange((prev) => ({
                    ...prev,
                    metaTitle: e.target.value,
                  }))
                }
                placeholder="SEO title (defaults to post title)"
                className="bg-white/5"
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label>Meta Description (SEO)</Label>
              <Textarea
                value={form.metaDescription}
                onChange={(e) =>
                  onFormChange((prev) => ({
                    ...prev,
                    metaDescription: e.target.value,
                  }))
                }
                placeholder="SEO description for search engines..."
                className="bg-white/5"
                rows={2}
                disabled={isGenerating}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving || isGenerating}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {editingPost ? "Update Post" : "Create Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
