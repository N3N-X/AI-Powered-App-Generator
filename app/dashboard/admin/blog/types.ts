export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author_id: string;
  status: string;
  tags: string[];
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type GenerationType =
  | "full"
  | "title"
  | "content"
  | "seo"
  | "excerpt"
  | "image";

export interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string;
  status: string;
  metaTitle: string;
  metaDescription: string;
}

export const CARD_CLASS = "liquid-glass-card";

export const defaultForm: BlogFormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  tags: "",
  status: "draft",
  metaTitle: "",
  metaDescription: "",
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
