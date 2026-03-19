"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Database,
  Plus,
  Trash2,
  Globe,
  User,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Collection } from "./types";

interface DatabaseCollectionsSidebarProps {
  collections: Collection[];
  collectionsLoading: boolean;
  selectedCollectionId: string;
  showNewCollectionInput: boolean;
  newCollectionName: string;
  creatingCollection: boolean;
  showCollectionsSidebar: boolean;
  onSelectCollection: (id: string) => void;
  onSetShowNewCollectionInput: (show: boolean) => void;
  onSetNewCollectionName: (name: string) => void;
  onCreateCollection: () => void;
  onDeleteCollection: (id: string) => void;
  onSetShowCollectionsSidebar: (show: boolean) => void;
}

export function DatabaseCollectionsSidebar({
  collections,
  collectionsLoading,
  selectedCollectionId,
  showNewCollectionInput,
  newCollectionName,
  creatingCollection,
  showCollectionsSidebar,
  onSelectCollection,
  onSetShowNewCollectionInput,
  onSetNewCollectionName,
  onCreateCollection,
  onDeleteCollection,
  onSetShowCollectionsSidebar,
}: DatabaseCollectionsSidebarProps) {
  return (
    <div
      className={cn(
        "border-r border-white/10 flex flex-col bg-white/[0.02]",
        "md:w-56 lg:w-64 md:flex",
        showCollectionsSidebar ? "flex max-h-64 md:max-h-none border-b md:border-b-0" : "hidden",
      )}
    >
      <div className="hidden md:flex p-3 border-b border-white/10 items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Collections</h3>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onSetShowNewCollectionInput(!showNewCollectionInput)} title="New collection">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {showNewCollectionInput && (
        <div className="p-2 border-b border-white/10">
          <form onSubmit={(e) => { e.preventDefault(); onCreateCollection(); }} className="flex gap-1.5">
            <Input placeholder="Collection name" value={newCollectionName} onChange={(e) => onSetNewCollectionName(e.target.value)} className="h-7 text-xs bg-white/5 border-white/10" autoFocus />
            <Button type="submit" size="sm" className="h-7 px-2 shrink-0" disabled={creatingCollection || !newCollectionName.trim()}>
              {creatingCollection ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
          </form>
        </div>
      )}

      {collections.length > 0 && (
        <div className="px-3 py-2 border-b border-white/10 flex items-center gap-3 text-xs text-slate-500">
          <span>{collections.length} collection{collections.length !== 1 ? "s" : ""}</span>
          <span>{collections.reduce((s, c) => s + c.documentCount, 0)} docs</span>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {collectionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8 px-3">
              <Database className="h-8 w-8 text-slate-500 mx-auto mb-2 opacity-40" />
              <p className="text-xs text-slate-500">No collections yet</p>
              <Button variant="outline" size="sm" className="mt-3 text-xs h-7" onClick={() => onSetShowNewCollectionInput(true)}>
                <Plus className="h-3 w-3 mr-1" />Create first
              </Button>
            </div>
          ) : (
            collections.map((col) => (
              <div key={col.id} className={cn("group relative rounded-lg transition-colors", selectedCollectionId === col.id ? "bg-violet-500/20" : "hover:bg-white/5")}>
                <button
                  onClick={() => { onSelectCollection(col.id); onSetShowCollectionsSidebar(false); }}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left", selectedCollectionId === col.id ? "text-violet-300" : "text-slate-400")}
                >
                  <Database className={cn("h-3.5 w-3.5 shrink-0", selectedCollectionId === col.id ? "text-violet-500" : "text-slate-500")} />
                  <div className="flex-1 min-w-0">
                    <span className="block truncate font-medium">{col.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500">{col.documentCount} doc{col.documentCount !== 1 ? "s" : ""}</span>
                      {col.globalCount > 0 && (
                        <span className="text-[10px] text-blue-400 flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" />{col.globalCount}</span>
                      )}
                      {col.userCount > 0 && (
                        <span className="text-[10px] text-green-400 flex items-center gap-0.5"><User className="h-2.5 w-2.5" />{col.userCount}</span>
                      )}
                    </div>
                  </div>
                </button>
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400"
                  onClick={(e) => { e.stopPropagation(); onDeleteCollection(col.id); }} title="Delete collection">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
