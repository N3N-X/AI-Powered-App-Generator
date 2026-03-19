export interface Document {
  id: string;
  data: Record<string, unknown>;
  ownerType: string;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null; // null = creating new
  existingDocuments: Document[]; // used to infer field names
  onSave: (data: Record<string, unknown>) => Promise<void>;
  projectId?: string; // needed for image uploads
}

export type FieldType =
  | "text"
  | "number"
  | "boolean"
  | "textarea"
  | "image"
  | "images";

export interface FieldEntry {
  key: string;
  value: string;
  type: FieldType;
}

const IMAGE_KEY_HINTS =
  /image|img|photo|avatar|icon|logo|thumbnail|banner|cover|picture|poster/i;

export function isImageUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return (
    value.startsWith("https://cdn.rulxy.space/") ||
    /\.(png|jpg|jpeg|gif|webp|svg|avif|ico|bmp|tiff?)(\?|$)/i.test(value) ||
    value.startsWith("data:image/") ||
    /^https?:\/\/.*\/(image|img|photo)\//i.test(value)
  );
}

export function inferFieldType(value: unknown, key?: string): FieldType {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (v) =>
        typeof v === "string" &&
        (isImageUrl(v) ||
          (key &&
            IMAGE_KEY_HINTS.test(key) &&
            (v.startsWith("http://") || v.startsWith("https://")))),
    )
  ) {
    return "images";
  }
  if (isImageUrl(value)) return "image";
  if (
    key &&
    IMAGE_KEY_HINTS.test(key) &&
    typeof value === "string" &&
    (value.startsWith("http://") || value.startsWith("https://"))
  ) {
    return "image";
  }
  if (typeof value === "string" && value.length > 100) return "textarea";
  return "text";
}

export function parseFieldValue(value: string, type: string): unknown {
  switch (type) {
    case "number":
      return Number(value) || 0;
    case "boolean":
      return value === "true";
    case "images":
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return value
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    default:
      return value;
  }
}
