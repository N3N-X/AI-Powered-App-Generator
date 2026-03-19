"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  User,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document } from "./types";
import { formatDate } from "./types";
import { isImageValue, getImageUrls } from "./database-utils";

interface DatabaseJsonViewProps {
  documents: Document[];
  onEditDocument: (doc: Document) => void;
  onDeleteDocument: (docId: string) => void;
}

export function DatabaseJsonView({
  documents,
  onEditDocument,
  onDeleteDocument,
}: DatabaseJsonViewProps) {
  return (
    <div className="divide-y divide-white/5">
      {documents.map((doc) => (
        <div key={doc.id} className="p-3 hover:bg-white/[0.02] group">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="outline" className={cn("text-xs", doc.ownerType === "global" ? "border-blue-500/30 text-blue-400" : "border-green-500/30 text-green-400")}>
                  {doc.ownerType === "global" ? (<><Globe className="h-3 w-3 mr-1" />Global</>) : (<><User className="h-3 w-3 mr-1" />User</>)}
                </Badge>
                <span className="text-xs text-slate-500 font-mono">{doc.id.slice(0, 8)}</span>
                <span className="text-xs text-slate-500">{formatDate(doc.createdAt)}</span>
              </div>
              {Object.entries(doc.data || {}).some(([k, v]) => isImageValue(v, k)) && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(doc.data || {}).filter(([k, v]) => isImageValue(v, k)).flatMap(([k, v]) =>
                    getImageUrls(v).map((url, i) => (
                      <img key={`${k}-${i}`} src={url} alt={`${k} ${i + 1}`} className="h-12 w-12 rounded-lg border border-white/10 object-cover" loading="lazy" />
                    )),
                  )}
                </div>
              )}
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-white/[0.03] rounded-lg p-2.5 max-h-32 overflow-hidden">
                {JSON.stringify(doc.data, null, 2)}
              </pre>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEditDocument(doc)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => onDeleteDocument(doc.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
