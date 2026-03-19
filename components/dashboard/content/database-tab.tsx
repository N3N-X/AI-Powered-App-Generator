"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Database,
  Search,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox,
  ChevronDown,
  Table2,
  LayoutList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentEditorModal } from "@/components/dashboard/document-editor-modal";
import type { Document } from "./types";
import { DatabaseCollectionsSidebar } from "./database-collections-sidebar";
import { DatabaseTableView } from "./database-table-view";
import { DatabaseJsonView } from "./database-json-view";
import { useDatabaseData } from "./database-hooks";

interface DatabaseTabProps {
  projectId: string;
  onRefreshCollections?: () => void;
}

export function DatabaseTab({
  projectId,
  onRefreshCollections,
}: DatabaseTabProps) {
  const db = useDatabaseData(projectId);

  const [dbViewMode, setDbViewMode] = useState<"table" | "json">("table");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [showCollectionsSidebar, setShowCollectionsSidebar] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    setCreatingCollection(true);
    const result = await db.handleCreateCollection(newCollectionName);
    if (result) {
      setNewCollectionName("");
      setShowNewCollectionInput(false);
    }
    setCreatingCollection(false);
  };

  const handleCreateDocument = () => {
    setEditingDocument(null);
    setEditorOpen(true);
  };
  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setEditorOpen(true);
  };

  const handleSaveDocument = async (data: Record<string, unknown>) => {
    const ok = await db.handleSaveDocument(data, editingDocument);
    if (ok) setEditorOpen(false);
  };

  return (
    <>
      <div className="liquid-glass-card rounded-xl overflow-hidden">
        <div className="flex flex-col md:flex-row h-[calc(100vh-280px)] md:h-[640px]">
          {/* Mobile collection selector */}
          <div className="md:hidden p-3 border-b border-white/10 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 flex-1 justify-between text-sm"
              onClick={() => setShowCollectionsSidebar(!showCollectionsSidebar)}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Database className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {db.collections.find((c) => c.id === db.selectedCollectionId)
                    ?.name || "Select collection"}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform",
                  showCollectionsSidebar && "rotate-180",
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => setShowNewCollectionInput(!showNewCollectionInput)}
              title="New collection"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <DatabaseCollectionsSidebar
            collections={db.collections}
            collectionsLoading={db.collectionsLoading}
            selectedCollectionId={db.selectedCollectionId}
            showNewCollectionInput={showNewCollectionInput}
            newCollectionName={newCollectionName}
            creatingCollection={creatingCollection}
            showCollectionsSidebar={showCollectionsSidebar}
            onSelectCollection={db.setSelectedCollectionId}
            onSetShowNewCollectionInput={setShowNewCollectionInput}
            onSetNewCollectionName={setNewCollectionName}
            onCreateCollection={handleCreateCollection}
            onDeleteCollection={db.handleDeleteCollection}
            onSetShowCollectionsSidebar={setShowCollectionsSidebar}
          />

          {/* Documents panel */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-white/10">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search documents..."
                  value={db.docsSearch}
                  onChange={(e) => db.setDocsSearch(e.target.value)}
                  className="pl-9 h-8 text-sm bg-white/5 border-white/10"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-white/10 rounded-md overflow-hidden">
                  <button
                    onClick={() => setDbViewMode("table")}
                    className={cn(
                      "h-8 w-8 flex items-center justify-center transition-colors",
                      dbViewMode === "table"
                        ? "bg-violet-500/15 text-violet-400"
                        : "text-slate-500 hover:bg-white/5",
                    )}
                    title="Table view"
                  >
                    <Table2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDbViewMode("json")}
                    className={cn(
                      "h-8 w-8 flex items-center justify-center transition-colors border-l border-white/10",
                      dbViewMode === "json"
                        ? "bg-violet-500/15 text-violet-400"
                        : "text-slate-500 hover:bg-white/5",
                    )}
                    title="JSON view"
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => db.fetchDocuments(db.docsPagination.page)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="sm"
                className="h-8 gap-1.5"
                onClick={handleCreateDocument}
                disabled={!db.selectedCollectionId}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Document
              </Button>
            </div>

            {/* Documents area */}
            <div className="flex-1 overflow-auto">
              {db.docsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : !db.selectedCollectionId ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <Database className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">
                    Select a collection to view documents
                  </p>
                </div>
              ) : db.documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <Inbox className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">No documents yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleCreateDocument}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add first document
                  </Button>
                </div>
              ) : dbViewMode === "table" ? (
                <DatabaseTableView
                  documents={db.documents}
                  pagination={db.docsPagination}
                  onEditDocument={handleEditDocument}
                  onDeleteDocument={db.handleDeleteDocument}
                />
              ) : (
                <DatabaseJsonView
                  documents={db.documents}
                  onEditDocument={handleEditDocument}
                  onDeleteDocument={db.handleDeleteDocument}
                />
              )}
            </div>

            {/* Pagination */}
            {db.docsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-white/10">
                <span className="text-xs text-slate-500">
                  {db.docsPagination.total} document
                  {db.docsPagination.total !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                    disabled={db.docsPagination.page <= 1}
                    onClick={() =>
                      db.fetchDocuments(db.docsPagination.page - 1)
                    }
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-slate-400">
                    {db.docsPagination.page} / {db.docsPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                    disabled={
                      db.docsPagination.page >= db.docsPagination.totalPages
                    }
                    onClick={() =>
                      db.fetchDocuments(db.docsPagination.page + 1)
                    }
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DocumentEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        document={editingDocument}
        existingDocuments={db.documents}
        onSave={handleSaveDocument}
        projectId={projectId}
      />
    </>
  );
}
