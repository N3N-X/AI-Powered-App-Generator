"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, HardDrive, Plus, X } from "lucide-react";
import type { StorageProxyConfig } from "@/types/proxy-config";
import { DEFAULT_STORAGE_CONFIG } from "@/types/proxy-config";

const COMMON_MIME_TYPES = [
  "image/*",
  "application/pdf",
  "video/*",
  "audio/*",
  "text/*",
  "application/zip",
  "application/json",
];

interface StorageConfigTabProps {
  projectId: string;
  config: StorageProxyConfig | null;
  onSave: (config: Partial<StorageProxyConfig>) => Promise<void>;
}

export function StorageConfigTab({
  projectId,
  config,
  onSave,
}: StorageConfigTabProps) {
  const [form, setForm] = useState<StorageProxyConfig>(
    config || DEFAULT_STORAGE_CONFIG,
  );
  const [saving, setSaving] = useState(false);
  const [newMimeType, setNewMimeType] = useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      toast({ title: "Storage settings saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addMimeType = (type: string) => {
    const mime = type.trim();
    if (!mime || form.allowedMimeTypes.includes(mime)) return;
    setForm({
      ...form,
      allowedMimeTypes: [...form.allowedMimeTypes, mime],
    });
    setNewMimeType("");
  };

  const removeMimeType = (type: string) => {
    setForm({
      ...form,
      allowedMimeTypes: form.allowedMimeTypes.filter((t) => t !== type),
    });
  };

  return (
    <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-xl">
      <div className="p-6 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <HardDrive className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Storage Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Configure file storage for your app
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
          size="sm"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </Button>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Default Visibility
          </label>
          <div className="flex gap-3">
            <Button
              variant={
                form.defaultVisibility === "public" ? "default" : "outline"
              }
              size="sm"
              onClick={() => setForm({ ...form, defaultVisibility: "public" })}
            >
              Public
            </Button>
            <Button
              variant={
                form.defaultVisibility === "private" ? "default" : "outline"
              }
              size="sm"
              onClick={() => setForm({ ...form, defaultVisibility: "private" })}
            >
              Private
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Default access level for uploaded files
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Max File Size (MB)
          </label>
          <Input
            type="number"
            min={1}
            max={100}
            value={form.maxFileSizeMB}
            onChange={(e) =>
              setForm({
                ...form,
                maxFileSizeMB: Math.min(
                  100,
                  Math.max(1, parseInt(e.target.value) || 1),
                ),
              })
            }
            className="bg-white/80 dark:bg-white/5 w-32"
          />
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Maximum upload size per file (1-100 MB)
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Allowed File Types
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {COMMON_MIME_TYPES.filter(
              (t) => !form.allowedMimeTypes.includes(t),
            ).map((type) => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => addMimeType(type)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {type}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Custom MIME type..."
              value={newMimeType}
              onChange={(e) => setNewMimeType(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMimeType(newMimeType)}
              className="bg-white/80 dark:bg-white/5"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => addMimeType(newMimeType)}
              disabled={!newMimeType.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {form.allowedMimeTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.allowedMimeTypes.map((type) => (
                <Badge key={type} variant="secondary" className="gap-1">
                  {type}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeMimeType(type)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-white/10 dark:bg-white/5 border border-gray-200/50 dark:border-white/10">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Auto-Optimize Images
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-500">
              Automatically compress and resize uploaded images
            </p>
          </div>
          <Button
            variant={form.autoOptimizeImages ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setForm({
                ...form,
                autoOptimizeImages: !form.autoOptimizeImages,
              })
            }
          >
            {form.autoOptimizeImages ? "On" : "Off"}
          </Button>
        </div>
      </div>
    </div>
  );
}
