"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { BlogFormData, GenerationType, slugify } from "./types";

export function useBlogGeneration(
  form: BlogFormData,
  setForm: React.Dispatch<React.SetStateAction<BlogFormData>>
) {
  const [genType, setGenType] = useState<GenerationType>("full");
  const [genTopic, setGenTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);

  const handleGenerate = async () => {
    const topic = genTopic.trim() || form.title.trim();
    if (
      !topic &&
      genType !== "seo" &&
      genType !== "excerpt" &&
      genType !== "content" &&
      genType !== "image"
    ) {
      toast({
        title: "Error",
        description: "Enter a topic or title first",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    setTitleSuggestions([]);
    try {
      const body: Record<string, unknown> = { type: genType };
      switch (genType) {
        case "full":
          body.topic = topic;
          if (form.tags)
            body.keywords = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
          break;
        case "title":
          body.topic = topic;
          break;
        case "content":
          body.title = form.title || topic;
          body.excerpt = form.excerpt || undefined;
          if (form.tags)
            body.keywords = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
          break;
        case "excerpt":
          body.title = form.title || topic;
          body.content = form.content || undefined;
          break;
        case "seo":
          body.title = form.title || topic;
          body.excerpt = form.excerpt || undefined;
          body.content = form.content || undefined;
          break;
        case "image":
          body.title = form.title || topic;
          body.excerpt = form.excerpt || undefined;
          break;
      }
      const response = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Generation failed");
      }
      const data = await response.json();
      switch (genType) {
        case "full":
          setForm({
            title: data.title || form.title,
            slug: data.slug || slugify(data.title || form.title),
            excerpt: data.excerpt || form.excerpt,
            content: data.content || form.content,
            coverImage: data.coverImage || form.coverImage,
            tags: data.tags?.join(", ") || form.tags,
            status: "draft",
            metaTitle: data.metaTitle || form.metaTitle,
            metaDescription: data.metaDescription || form.metaDescription,
          });
          toast({ title: "Generated", description: "Full blog post generated with AI" });
          break;
        case "title":
          if (data.titles?.length) {
            setTitleSuggestions(data.titles);
            toast({ title: "Generated", description: `${data.titles.length} title suggestions ready` });
          }
          break;
        case "content":
          setForm((prev) => ({ ...prev, content: data.content || prev.content }));
          toast({ title: "Generated", description: "Blog content generated" });
          break;
        case "excerpt":
          setForm((prev) => ({ ...prev, excerpt: data.excerpt || prev.excerpt }));
          toast({ title: "Generated", description: "Excerpt generated" });
          break;
        case "seo":
          setForm((prev) => ({
            ...prev,
            metaTitle: data.metaTitle || prev.metaTitle,
            metaDescription: data.metaDescription || prev.metaDescription,
            tags: data.tags?.join(", ") || prev.tags,
            slug: data.slug || prev.slug,
          }));
          toast({ title: "Generated", description: "SEO metadata generated" });
          break;
        case "image":
          if (data.imageUrl) {
            setForm((prev) => ({ ...prev, coverImage: data.imageUrl }));
            toast({ title: "Generated", description: "Cover image generated" });
          }
          break;
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    genType,
    setGenType,
    genTopic,
    setGenTopic,
    isGenerating,
    titleSuggestions,
    setTitleSuggestions,
    handleGenerate,
  };
}
