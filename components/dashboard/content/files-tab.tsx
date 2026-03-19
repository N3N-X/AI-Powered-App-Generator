"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Download,
  FileCode,
  FolderOpen,
  FolderClosed,
  ChevronDown,
  ChevronRight,
  File,
  FileText,
} from "lucide-react";
import { cn, codeFilesToTree, formatFileSize } from "@/lib/utils";
import type { FileTreeNode } from "@/types";
import type { ContentProject } from "./types";

interface FilesTabProps {
  project: ContentProject;
}

export function FilesTab({ project }: FilesTabProps) {
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [filesSearch, setFilesSearch] = useState("");
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  useEffect(() => {
    if (project.codeFiles && Object.keys(project.codeFiles).length > 0) {
      setFileTree(codeFilesToTree(project.codeFiles));
      const topFolders = new Set<string>();
      for (const path of Object.keys(project.codeFiles)) {
        const first = path.split("/")[0];
        if (path.includes("/")) topFolders.add(first);
      }
      setExpandedFolders(topFolders);
    }
  }, [project.codeFiles]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const getFileExtIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const codeExts = ["ts", "tsx", "js", "jsx", "py", "swift", "kt", "java", "go", "rs", "rb", "php", "vue", "svelte"];
    if (codeExts.includes(ext)) return <FileCode className="h-4 w-4 text-blue-400" />;
    return <File className="h-4 w-4 text-slate-400" />;
  };

  const filteredFileTree = useCallback(
    (nodes: FileTreeNode[]): FileTreeNode[] => {
      if (!filesSearch) return nodes;
      const search = filesSearch.toLowerCase();
      return nodes
        .map((node) => {
          if (node.type === "folder") {
            const filteredChildren = filteredFileTree(node.children || []);
            if (filteredChildren.length > 0) return { ...node, children: filteredChildren };
            return null;
          }
          return node.path.toLowerCase().includes(search) ? node : null;
        })
        .filter(Boolean) as FileTreeNode[];
    },
    [filesSearch],
  );

  const handleDownloadFile = (path: string) => {
    if (!project.codeFiles?.[path]) return;
    const content = project.codeFiles[path];
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = path.split("/").pop() || "file";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    try {
      const res = await fetch(`/api/export?projectId=${project.id}`);
      if (!res.ok) {
        console.error("Export error:", res.status);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+)"/);
      a.download = match?.[1] || "project.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const renderTree = (nodes: FileTreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isFolder = node.type === "folder";
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = selectedFilePath === node.path;

      return (
        <div key={node.path}>
          <button
            onClick={() => { if (isFolder) toggleFolder(node.path); else setSelectedFilePath(node.path); }}
            className={cn("w-full flex items-center gap-1.5 px-2 py-1 rounded text-sm hover:bg-white/5 transition-colors", isSelected && !isFolder && "bg-violet-500/10 text-violet-300")}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {isFolder ? (
              <>
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                {isExpanded ? <FolderOpen className="h-4 w-4 text-yellow-500 shrink-0" /> : <FolderClosed className="h-4 w-4 text-yellow-500 shrink-0" />}
              </>
            ) : (
              <>
                <span className="w-3.5 shrink-0" />
                {getFileExtIcon(node.name)}
              </>
            )}
            <span className="truncate text-slate-300">{node.name}</span>
            {isFolder && node.children && <span className="ml-auto text-xs text-slate-600">{node.children.length}</span>}
            {!isFolder && project.codeFiles?.[node.path] && <span className="ml-auto text-xs text-slate-600">{formatFileSize(project.codeFiles[node.path].length)}</span>}
          </button>
          {isFolder && isExpanded && node.children && <div>{renderTree(node.children, depth + 1)}</div>}
        </div>
      );
    });
  };

  return (
    <div className="liquid-glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search files..." value={filesSearch} onChange={(e) => setFilesSearch(e.target.value)} className="pl-9 h-8 text-sm bg-white/5 border-white/10" />
          </div>
          {project.codeFiles && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{Object.keys(project.codeFiles).length} files</span>
              <span>{"\u00B7"}</span>
              <span>{formatFileSize(Object.values(project.codeFiles).reduce((sum, content) => sum + (content?.length || 0), 0))}</span>
              <Badge variant="outline" className="text-xs">{project.platform}</Badge>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleDownloadAll}>
          <Download className="h-3.5 w-3.5" />Download All
        </Button>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-320px)] md:h-[600px]">
        <div className="w-full md:w-72 max-h-[200px] md:max-h-none border-b md:border-b-0 md:border-r border-white/10">
          <ScrollArea className="h-full">
            <div className="p-2">{renderTree(filteredFileTree(fileTree))}</div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedFilePath && project.codeFiles?.[selectedFilePath] ? (
            <>
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  {getFileExtIcon(selectedFilePath)}
                  <span className="text-sm text-slate-300 font-mono">{selectedFilePath}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => handleDownloadFile(selectedFilePath)}>
                  <Download className="h-3 w-3" />Download
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <pre className="p-4 text-xs font-mono text-slate-300 whitespace-pre-wrap break-all">{project.codeFiles[selectedFilePath]}</pre>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <FileText className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">Select a file to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
