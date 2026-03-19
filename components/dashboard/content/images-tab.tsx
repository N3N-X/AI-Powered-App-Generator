"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Loader2,
  ImageIcon,
  Upload,
  Copy,
  Check,
} from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { ImageFile } from "./types";

interface ImagesTabProps {
  projectId: string;
}

export function ImagesTab({ projectId }: ImagesTabProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageDragOver, setImageDragOver] = useState(false);
  const [storageTotalSize, setStorageTotalSize] = useState(0);
  const [storageLimit, setStorageLimit] = useState(0);
  const [copiedImageId, setCopiedImageId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    if (!projectId) return;
    setImagesLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/images`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.files || []);
        setStorageTotalSize(data.totalSize || 0);
        setStorageLimit(data.storageLimit || 0);
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setImagesLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleImageUpload = async (files: FileList | File[]) => {
    if (!projectId) return;
    setUploadingImage(true);
    let successCount = 0;
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast({ title: `${file.name}: only image files allowed`, variant: "destructive" });
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: `${file.name}: too large (max 10MB)`, variant: "destructive" });
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/projects/${projectId}/images`, { method: "POST", body: formData });
        if (res.ok) {
          successCount++;
        } else {
          const err = await res.json().catch(() => ({}));
          toast({ title: err.error || `Failed to upload ${file.name}`, variant: "destructive" });
        }
      }
      if (successCount > 0) {
        toast({ title: `${successCount} image${successCount > 1 ? "s" : ""} uploaded` });
        fetchImages();
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (fileId: string) => {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      if (res.ok) {
        toast({ title: "Image deleted" });
        fetchImages();
      } else {
        toast({ title: "Failed to delete image", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to delete image", variant: "destructive" });
    }
  };

  const handleCopyImageUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedImageId(id);
    toast({ title: "URL copied to clipboard" });
    setTimeout(() => setCopiedImageId(null), 2000);
  };

  return (
    <div className="liquid-glass-card rounded-xl overflow-hidden">
      {storageLimit > 0 && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Storage: {formatFileSize(storageTotalSize)} / {formatFileSize(storageLimit)}</span>
            <span className="text-xs text-slate-500">{Math.round((storageTotalSize / storageLimit) * 100)}% used</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, (storageTotalSize / storageLimit) * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="p-4 border-b border-white/10">
        <div
          onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
          onDragLeave={() => setImageDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setImageDragOver(false); if (e.dataTransfer.files.length > 0) handleImageUpload(e.dataTransfer.files); }}
          className={cn("border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer", imageDragOver ? "border-violet-500 bg-violet-500/10" : "border-white/10 hover:border-white/20")}
          onClick={() => imageInputRef.current?.click()}
        >
          <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { if (e.target.files && e.target.files.length > 0) { handleImageUpload(e.target.files); e.target.value = ""; } }} />
          {uploadingImage ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
              <p className="text-sm text-slate-400">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-slate-500" />
              <p className="text-sm text-slate-300">Drop images here or <span className="text-violet-500 font-medium">browse</span></p>
              <p className="text-xs text-slate-500">PNG, JPG, GIF, WebP up to 10MB each</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        {imagesLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <ImageIcon className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">No images uploaded yet</p>
            <p className="text-xs mt-1 text-slate-500">Upload images to use in your app</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {images.map((img) => (
              <div key={img.id} className="group relative rounded-xl border border-white/10 overflow-hidden bg-white/[0.02] hover:border-violet-500/30 transition-all">
                <div className="aspect-square bg-white/5 overflow-hidden">
                  <img src={img.url} alt={img.filename} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-2">
                  <p className="text-xs text-slate-300 truncate font-medium">{img.filename}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(img.size)}</p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="sm" className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80 border-0 text-white"
                    onClick={(e) => { e.stopPropagation(); handleCopyImageUrl(img.id, img.url); }}>
                    {copiedImageId === img.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="secondary" size="sm" className="h-7 w-7 p-0 bg-black/60 hover:bg-red-600 border-0 text-white"
                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
