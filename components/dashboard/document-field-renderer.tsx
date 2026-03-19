"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, X } from "lucide-react";
import type { FieldEntry } from "./document-editor-types";

interface DocumentFieldRendererProps {
  field: FieldEntry;
  index: number;
  projectId?: string;
  onUpdate: (index: number, update: Partial<FieldEntry>) => void;
}

export function DocumentFieldRenderer({
  field,
  index,
  projectId,
  onUpdate,
}: DocumentFieldRendererProps) {
  const [uploadingField, setUploadingField] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = async (file: File) => {
    if (!projectId) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;

    setUploadingField(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/projects/${projectId}/images`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(index, { value: data.file.url });
      }
    } catch {
      // silent fail
    } finally {
      setUploadingField(false);
    }
  };

  if (field.type === "boolean") {
    return (
      <div className="flex items-center gap-2 px-1">
        <Switch
          checked={field.value === "true"}
          onCheckedChange={(checked) =>
            onUpdate(index, { value: String(checked) })
          }
        />
        <span className="text-xs text-gray-500 dark:text-slate-400">
          {field.value === "true" ? "True" : "False"}
        </span>
      </div>
    );
  }

  if (field.type === "image") {
    return (
      <div className="space-y-2">
        {field.value ? (
          <div className="relative group">
            <img
              src={field.value}
              alt={field.key || "Image"}
              className="h-24 w-auto rounded-lg border border-gray-200 dark:border-white/10 object-cover"
            />
            <button
              type="button"
              onClick={() => onUpdate(index, { value: "" })}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Image URL or upload"
            value={field.value}
            onChange={(e) => onUpdate(index, { value: e.target.value })}
            className="h-8 text-sm flex-1"
          />
          {projectId && (
            <>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 shrink-0"
                disabled={uploadingField}
                onClick={() => imageInputRef.current?.click()}
              >
                {uploadingField ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Upload
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (field.type === "images") {
    return (
      <ImagesFieldRenderer
        field={field}
        index={index}
        projectId={projectId}
        onUpdate={onUpdate}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        placeholder="Value"
        value={field.value}
        onChange={(e) => onUpdate(index, { value: e.target.value })}
        className="text-sm min-h-[80px]"
      />
    );
  }

  // text / number
  return (
    <Input
      placeholder="Value"
      type={field.type === "number" ? "number" : "text"}
      value={field.value}
      onChange={(e) => onUpdate(index, { value: e.target.value })}
      className="h-8 text-sm"
    />
  );
}

// Separated to keep complexity manageable
function ImagesFieldRenderer({
  field,
  index,
  projectId,
  onUpdate,
}: DocumentFieldRendererProps) {
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  let urls: string[] = [];
  try {
    const parsed = JSON.parse(field.value);
    if (Array.isArray(parsed)) urls = parsed;
  } catch {
    urls = field.value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const handleMultiUpload = async (files: FileList) => {
    if (!projectId) return;
    setUploading(true);
    let currentUrls: string[] = [];
    try {
      currentUrls = JSON.parse(field.value);
      if (!Array.isArray(currentUrls)) currentUrls = [];
    } catch {
      currentUrls = [];
    }
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024)
        continue;
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/projects/${projectId}/images`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          currentUrls.push(data.file.url);
        }
      } catch {
        // skip failed uploads
      }
    }
    onUpdate(index, { value: JSON.stringify(currentUrls) });
    setUploading(false);
  };

  const imageCount = urls.length;

  return (
    <div className="space-y-2">
      {urls.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`${field.key || "Image"} ${i + 1}`}
                className="h-16 w-16 rounded-lg border border-gray-200 dark:border-white/10 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  const next = urls.filter((_, j) => j !== i);
                  onUpdate(index, { value: JSON.stringify(next) });
                }}
                className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        {projectId && (
          <>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files) handleMultiUpload(files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              disabled={uploading}
              onClick={() => imageInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Upload Images
            </Button>
          </>
        )}
        <span className="text-xs text-gray-400 dark:text-slate-500">
          {imageCount} image{imageCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
