"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  File,
  Folder,
  Search,
  Download,
  Trash2,
  FileCode,
  FileJson,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  platform: string;
  codeFiles: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  size?: number;
  children?: FileNode[];
}

export default function FilesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["/"]),
  );

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        if (data.projects?.length > 0) {
          setSelectedProject(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast({
        title: "Failed to load projects",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentProject = projects.find((p) => p.id === selectedProject);

  // Build file tree from flat file paths
  const buildFileTree = (files: Record<string, string>): FileNode[] => {
    const root: FileNode[] = [];
    const folderMap = new Map<string, FileNode>();

    // Sort files by path
    const sortedPaths = Object.keys(files).sort();

    sortedPaths.forEach((path) => {
      const parts = path.split("/");
      let currentLevel = root;
      let currentPath = "";

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isFile = index === parts.length - 1;

        if (isFile) {
          currentLevel.push({
            name: part,
            path: currentPath,
            type: "file",
            size: files[path]?.length || 0,
          });
        } else {
          // It's a folder
          let folder = folderMap.get(currentPath);
          if (!folder) {
            folder = {
              name: part,
              path: currentPath,
              type: "folder",
              children: [],
            };
            folderMap.set(currentPath, folder);
            currentLevel.push(folder);
          }
          currentLevel = folder.children!;
        }
      });
    });

    return root;
  };

  const fileTree = currentProject
    ? buildFileTree(currentProject.codeFiles || {})
    : [];

  // Filter files by search query
  const filterTree = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;

    return nodes
      .map((node) => {
        if (node.type === "file") {
          return node.path.toLowerCase().includes(query.toLowerCase())
            ? node
            : null;
        } else {
          const filteredChildren = filterTree(node.children || [], query);
          if (filteredChildren.length > 0) {
            return { ...node, children: filteredChildren };
          }
          return node.name.toLowerCase().includes(query.toLowerCase())
            ? node
            : null;
        }
      })
      .filter(Boolean) as FileNode[];
  };

  const filteredTree = filterTree(fileTree, searchQuery);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleDownloadFile = (path: string) => {
    if (!currentProject) return;

    const content = currentProject.codeFiles[path];
    if (!content) return;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = path.split("/").pop() || "file.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "File downloaded",
      description: `${path} has been downloaded`,
    });
  };

  const handleDownloadAll = () => {
    if (!currentProject) return;

    // Create a simple text file with all files
    let content = `# ${currentProject.name}\n\n`;
    Object.entries(currentProject.codeFiles || {}).forEach(([path, code]) => {
      content += `\n\n=== ${path} ===\n\n${code}`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentProject.name}-files.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "All files downloaded",
      description: `${Object.keys(currentProject.codeFiles || {}).length} files downloaded`,
    });
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "tsx":
      case "ts":
      case "jsx":
      case "js":
        return <FileCode className="h-4 w-4 text-blue-400" />;
      case "json":
        return <FileJson className="h-4 w-4 text-yellow-400" />;
      case "md":
      case "txt":
        return <FileText className="h-4 w-4 text-slate-400" />;
      case "png":
      case "jpg":
      case "jpeg":
      case "svg":
      case "gif":
        return <ImageIcon className="h-4 w-4 text-purple-400" />;
      default:
        return <File className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => {
      if (node.type === "folder") {
        const isExpanded = expandedFolders.has(node.path);
        return (
          <div key={node.path}>
            <button
              onClick={() => toggleFolder(node.path)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded text-sm"
              style={{ paddingLeft: `${depth * 20 + 12}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500" />
              )}
              <Folder className="h-4 w-4 text-violet-400" />
              <span className="text-white">{node.name}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {node.children?.length || 0}
              </Badge>
            </button>
            {isExpanded && node.children && (
              <div>{renderFileTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <div
          key={node.path}
          className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded text-sm group"
          style={{ paddingLeft: `${depth * 20 + 36}px` }}
        >
          {getFileIcon(node.name)}
          <span className="flex-1 text-slate-300">{node.name}</span>
          <span className="text-xs text-slate-500">
            {formatFileSize(node.size || 0)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100"
            onClick={() => handleDownloadFile(node.path)}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    });
  };

  const totalFiles = currentProject
    ? Object.keys(currentProject.codeFiles || {}).length
    : 0;
  const totalSize = currentProject
    ? Object.values(currentProject.codeFiles || {}).reduce(
        (sum, content) => sum + content.length,
        0,
      )
    : 0;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="inline-flex p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
            <File className="h-8 w-8 text-violet-400 animate-pulse" />
          </div>
          <p className="text-slate-400">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0a0a0f] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Files</h1>
            <p className="text-sm text-slate-400">
              Browse and manage your project files
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6">
          {/* Project Selector & Stats */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-slate-400 mb-2 block">
                  Select Project
                </label>
                <Select
                  value={selectedProject}
                  onValueChange={setSelectedProject}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentProject && (
                <>
                  <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-xs text-slate-400 mb-1">
                      Total Files
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {totalFiles}
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-xs text-slate-400 mb-1">
                      Total Size
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatFileSize(totalSize)}
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-xs text-slate-400 mb-1">Platform</div>
                    <Badge>{currentProject.platform}</Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* File Browser */}
          {currentProject ? (
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-xl overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAll}
                  disabled={totalFiles === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>

              {/* File Tree */}
              <ScrollArea className="h-[600px]">
                <div className="p-2">
                  {filteredTree.length > 0 ? (
                    renderFileTree(filteredTree)
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <File className="h-12 w-12 mb-3 opacity-50" />
                      <p>
                        {searchQuery
                          ? "No files match your search"
                          : "No files in this project"}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-xl p-12">
              <div className="text-center text-slate-400">
                <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a project to view its files</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
