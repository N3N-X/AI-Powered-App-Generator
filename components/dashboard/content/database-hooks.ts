"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import type { Collection, Document, Pagination } from "./types";

export function useDatabaseData(projectId: string) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsPagination, setDocsPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [docsSearch, setDocsSearch] = useState("");
  const [docsLoading, setDocsLoading] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  const fetchCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collections`);
      if (res.ok) {
        const data = await res.json();
        const cols = data.collections || [];
        setCollections(cols);
        if (cols.length > 0 && !selectedCollectionId) {
          setSelectedCollectionId(cols[0].id);
        }
      }
    } catch { /* ignore */ } finally { setCollectionsLoading(false); }
  }, [projectId, selectedCollectionId]);

  const fetchDocuments = useCallback(async (page = 1) => {
    if (!projectId || !selectedCollectionId) return;
    setDocsLoading(true);
    try {
      const params = new URLSearchParams({
        collectionId: selectedCollectionId, page: String(page), limit: "20",
      });
      if (docsSearch) params.set("search", docsSearch);
      const res = await fetch(`/api/projects/${projectId}/documents?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        setDocsPagination(data.pagination);
      }
    } catch (error) { console.error("Failed to fetch documents:", error); }
    finally { setDocsLoading(false); }
  }, [projectId, selectedCollectionId, docsSearch]);

  useEffect(() => { fetchCollections(); }, [projectId]);
  useEffect(() => { if (selectedCollectionId) fetchDocuments(); }, [selectedCollectionId, fetchDocuments]);

  const handleCreateCollection = useCallback(async (name: string) => {
    if (!projectId || !name.trim()) return null;
    try {
      const res = await fetch(`/api/projects/${projectId}/collections`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `Collection "${name.trim()}" created` });
        fetchCollections();
        if (data.collection?.id) setSelectedCollectionId(data.collection.id);
        return data.collection;
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: err.error || "Failed to create collection", variant: "destructive" });
      }
    } catch { toast({ title: "Failed to create collection", variant: "destructive" }); }
    return null;
  }, [projectId, fetchCollections]);

  const handleDeleteCollection = useCallback(async (collectionId: string) => {
    const col = collections.find((c) => c.id === collectionId);
    if (!confirm(`Delete collection "${col?.name || "this collection"}" and all its documents? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/collections?collectionId=${collectionId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Collection deleted" });
        if (selectedCollectionId === collectionId) { setSelectedCollectionId(""); setDocuments([]); }
        fetchCollections();
      } else { toast({ title: "Failed to delete collection", variant: "destructive" }); }
    } catch { toast({ title: "Failed to delete collection", variant: "destructive" }); }
  }, [projectId, collections, selectedCollectionId, fetchCollections]);

  const handleDeleteDocument = useCallback(async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/documents?documentId=${docId}`, { method: "DELETE" });
      if (res.ok) { toast({ title: "Document deleted" }); fetchDocuments(docsPagination.page); fetchCollections(); }
      else { toast({ title: "Failed to delete", variant: "destructive" }); }
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  }, [projectId, docsPagination.page, fetchDocuments, fetchCollections]);

  const handleSaveDocument = useCallback(async (
    data: Record<string, unknown>,
    editingDocument: Document | null,
  ) => {
    try {
      if (editingDocument) {
        const res = await fetch(`/api/projects/${projectId}/documents`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId: editingDocument.id, data }),
        });
        if (!res.ok) throw new Error("Update failed");
        toast({ title: "Document updated" });
      } else {
        const res = await fetch(`/api/projects/${projectId}/documents`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collectionId: selectedCollectionId, data }),
        });
        if (!res.ok) throw new Error("Create failed");
        toast({ title: "Document created" });
      }
      fetchDocuments(docsPagination.page); fetchCollections();
      return true;
    } catch { toast({ title: "Failed to save", variant: "destructive" }); return false; }
  }, [projectId, selectedCollectionId, docsPagination.page, fetchDocuments, fetchCollections]);

  return {
    collections, selectedCollectionId, setSelectedCollectionId,
    documents, docsPagination, docsSearch, setDocsSearch,
    docsLoading, collectionsLoading,
    fetchDocuments, fetchCollections,
    handleCreateCollection, handleDeleteCollection,
    handleDeleteDocument, handleSaveDocument,
  };
}
