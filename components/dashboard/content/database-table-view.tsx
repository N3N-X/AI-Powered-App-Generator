"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, User, Pencil, Trash2, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document, Pagination } from "./types";
import { formatDate } from "./types";
import {
  formatCellValue,
  isImageValue,
  getImageUrls,
  inferColumns,
} from "./database-utils";

interface DatabaseTableViewProps {
  documents: Document[];
  pagination: Pagination;
  onEditDocument: (doc: Document) => void;
  onDeleteDocument: (docId: string) => void;
}

export function DatabaseTableView({
  documents,
  pagination,
  onEditDocument,
  onDeleteDocument,
}: DatabaseTableViewProps) {
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const columns = inferColumns(documents);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-white/10 bg-background">
            <th className="text-left p-2.5 font-medium text-xs text-slate-500 uppercase tracking-wider w-[60px]">
              <Hash className="h-3 w-3 inline" />
            </th>
            <th className="text-left p-2.5 font-medium text-xs text-slate-500 uppercase tracking-wider w-[70px]">
              Type
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="text-left p-2.5 font-medium text-xs text-slate-500 uppercase tracking-wider max-w-[200px]"
              >
                {col}
              </th>
            ))}
            <th className="text-right p-2.5 font-medium text-xs text-slate-500 uppercase tracking-wider w-[80px] sticky right-0 bg-background">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {documents.map((doc, idx) => (
            <React.Fragment key={doc.id || `doc-${idx}`}>
              <tr
                className={cn(
                  "hover:bg-white/[0.02] group cursor-pointer transition-colors",
                  expandedDocId === doc.id && "bg-violet-500/5",
                )}
                onClick={() =>
                  setExpandedDocId(expandedDocId === doc.id ? null : doc.id)
                }
              >
                <td className="p-2.5 text-xs text-slate-600 font-mono">
                  {(pagination.page - 1) * pagination.limit + idx + 1}
                </td>
                <td className="p-2.5">
                  {doc.ownerType === "global" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-400/10 text-blue-400">
                      <Globe className="h-2.5 w-2.5" />
                      Global
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-400/10 text-green-400">
                      <User className="h-2.5 w-2.5" />
                      User
                    </span>
                  )}
                </td>
                {columns.map((col) => {
                  const val = doc.data?.[col];
                  return (
                    <td key={col} className="p-2.5 max-w-[200px]">
                      {isImageValue(val, col) ? (
                        <div className="flex items-center gap-1">
                          {getImageUrls(val)
                            .slice(0, 3)
                            .map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt={`${col} ${i + 1}`}
                                className="h-8 w-8 rounded object-cover border border-white/10"
                                loading="lazy"
                              />
                            ))}
                          {getImageUrls(val).length > 3 && (
                            <span className="text-[10px] text-slate-500">
                              +{getImageUrls(val).length - 3}
                            </span>
                          )}
                        </div>
                      ) : typeof val === "boolean" ? (
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            val
                              ? "bg-green-400/10 text-green-400"
                              : "bg-white/5 text-slate-500",
                          )}
                        >
                          {val ? "true" : "false"}
                        </span>
                      ) : typeof val === "number" ? (
                        <span className="text-xs font-mono text-slate-300">
                          {val}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 truncate block max-w-[180px]">
                          {formatCellValue(val)}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="p-2.5 text-right sticky right-0 bg-background group-hover:bg-background transition-colors">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditDocument(doc);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDocument(doc.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
              {expandedDocId === doc.id && (
                <tr key={`${doc.id}-expanded`}>
                  <td colSpan={columns.length + 3} className="p-0">
                    <div className="bg-white/[0.02] border-y border-white/5 p-4">
                      <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
                        <span>ID: {doc.id.slice(0, 12)}...</span>
                        <span>Created: {formatDate(doc.createdAt)}</span>
                        {doc.updatedAt && doc.updatedAt !== doc.createdAt && (
                          <span>Updated: {formatDate(doc.updatedAt)}</span>
                        )}
                        {doc.ownerId && (
                          <span>Owner: {doc.ownerId.slice(0, 8)}...</span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(doc.data || {}).map(([key, val]) => (
                          <div
                            key={key}
                            className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                          >
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-medium">
                              {key}
                            </div>
                            {isImageValue(val, key) ? (
                              <div className="flex flex-wrap gap-2">
                                {getImageUrls(val).map((url, i) => (
                                  <img
                                    key={i}
                                    src={url}
                                    alt={`${key} ${i + 1}`}
                                    className="h-20 w-auto rounded-lg border border-white/10 object-cover"
                                    loading="lazy"
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-300 break-all whitespace-pre-wrap">
                                {typeof val === "object"
                                  ? JSON.stringify(val, null, 2)
                                  : String(val ?? "\u2014")}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
