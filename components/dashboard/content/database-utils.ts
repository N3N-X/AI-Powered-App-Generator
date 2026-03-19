import type { Document } from "./types";

export const formatCellValue = (value: unknown): string => {
  if (value === null || value === undefined) return "\u2014";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (value.length > 60) return value.slice(0, 60) + "...";
    return value;
  }
  if (typeof value === "object") {
    const s = JSON.stringify(value);
    if (s.length > 60) return s.slice(0, 60) + "...";
    return s;
  }
  return String(value);
};

const IMAGE_KEY_HINTS =
  /image|img|photo|avatar|icon|logo|thumbnail|banner|cover|picture|poster/i;

const isSingleImageUrl = (value: string, key?: string): boolean => {
  if (
    value.startsWith("https://cdn.rulxy.space/") ||
    /\.(png|jpg|jpeg|gif|webp|svg|avif|ico|bmp|tiff?)(\?|$)/i.test(value) ||
    value.startsWith("data:image/") ||
    /^https?:\/\/.*\/(image|img|photo)\//i.test(value)
  ) {
    return true;
  }
  if (
    key &&
    IMAGE_KEY_HINTS.test(key) &&
    (value.startsWith("http://") || value.startsWith("https://"))
  ) {
    return true;
  }
  return false;
};

export const isImageValue = (value: unknown, key?: string): boolean => {
  if (typeof value === "string") return isSingleImageUrl(value, key);
  if (Array.isArray(value) && value.length > 0) {
    return value.every(
      (v) => typeof v === "string" && isSingleImageUrl(v, key),
    );
  }
  return false;
};

export const getImageUrls = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
  return [];
};

export const inferColumns = (documents: Document[]): string[] => {
  if (documents.length === 0) return [];
  const keySet = new Set<string>();
  for (const doc of documents) {
    if (doc.data && typeof doc.data === "object") {
      Object.keys(doc.data).forEach((k) => keySet.add(k));
    }
  }
  return Array.from(keySet);
};
