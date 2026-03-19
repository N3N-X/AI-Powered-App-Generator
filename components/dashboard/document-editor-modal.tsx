"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2 } from "lucide-react";
import type {
  Document,
  DocumentEditorModalProps,
  FieldEntry,
} from "./document-editor-types";
import { inferFieldType, parseFieldValue } from "./document-editor-types";
import { DocumentFieldRenderer } from "./document-field-renderer";

// Re-export types for consumers
export type { Document, DocumentEditorModalProps };

export function DocumentEditorModal({
  open,
  onOpenChange,
  document,
  existingDocuments,
  onSave,
  projectId,
}: DocumentEditorModalProps) {
  const [fields, setFields] = useState<FieldEntry[]>([]);
  const [saving, setSaving] = useState(false);

  // Initialize fields when modal opens
  useEffect(() => {
    if (!open) return;

    if (document) {
      const entries = Object.entries(document.data).map(([key, value]) => {
        const type = inferFieldType(value, key);
        let strValue: string;
        if (type === "images" && Array.isArray(value)) {
          strValue = JSON.stringify(value);
        } else if (typeof value === "boolean") {
          strValue = String(value);
        } else {
          strValue = String(value ?? "");
        }
        return { key, value: strValue, type };
      });
      setFields(
        entries.length > 0
          ? entries
          : [{ key: "", value: "", type: "text" as const }],
      );
    } else {
      const sampleDoc = existingDocuments.find(
        (d) => d.data && Object.keys(d.data).length > 0,
      );
      if (sampleDoc) {
        const entries = Object.entries(sampleDoc.data).map(([key, value]) => ({
          key,
          value: "",
          type: inferFieldType(value, key),
        }));
        setFields(entries);
      } else {
        setFields([{ key: "", value: "", type: "text" as const }]);
      }
    }
  }, [open, document, existingDocuments]);

  const addField = () => {
    setFields([...fields, { key: "", value: "", type: "text" }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, update: Partial<FieldEntry>) => {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...update } : f)));
  };

  const handleSave = async () => {
    const data: Record<string, unknown> = {};
    for (const field of fields) {
      if (!field.key.trim()) continue;
      data[field.key.trim()] = parseFieldValue(field.value, field.type);
    }

    if (Object.keys(data).length === 0) return;

    setSaving(true);
    try {
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {document ? "Edit Document" : "Add Document"}
          </DialogTitle>
          <DialogDescription>
            {document
              ? "Update the document fields below."
              : "Fill in the fields for your new document."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {fields.map((field, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Field name"
                    value={field.key}
                    onChange={(e) =>
                      updateField(index, { key: e.target.value })
                    }
                    className="h-8 text-sm font-mono"
                    disabled={!!document}
                  />
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(index, {
                        type: e.target.value as FieldEntry["type"],
                      })
                    }
                    className="h-8 px-2 text-xs rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-slate-300"
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Long Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="image">Image</option>
                    <option value="images">Images</option>
                  </select>
                </div>

                <DocumentFieldRenderer
                  field={field}
                  index={index}
                  projectId={projectId}
                  onUpdate={updateField}
                />
              </div>
              {!document && fields.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 mt-0.5 text-red-400 hover:text-red-300"
                  onClick={() => removeField(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}

          {!document && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addField}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Field
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {document ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
