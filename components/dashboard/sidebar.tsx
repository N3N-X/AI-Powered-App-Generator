"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import { FileTreeNode } from "@/types";
import {
  Plus,
  Search,
  FolderOpen,
  File,
  FileCode,
  FileJson,
  FileCog,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Sidebar() {
  const { sidebarTab, setSidebarTab } = useUIStore();
  const {
    projects,
    currentProject,
    setCurrentProject,
    fileTree,
    currentFile,
    setCurrentFile,
  } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <TooltipProvider>
      <div className="h-full glass border-r border-white/5 flex flex-col">
        <Tabs
          value={sidebarTab}
          onValueChange={(v) => setSidebarTab(v as "projects" | "files")}
          className="flex-1 flex flex-col"
        >
          <div className="p-3 border-b border-white/5">
            <TabsList className="w-full">
              <TabsTrigger value="projects" className="flex-1">
                Projects
              </TabsTrigger>
              <TabsTrigger value="files" className="flex-1">
                Files
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="projects" className="flex-1 flex flex-col mt-0">
            <ProjectsList
              projects={projects}
              currentProject={currentProject}
              onSelect={(id) => {}}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </TabsContent>

          <TabsContent value="files" className="flex-1 flex flex-col mt-0">
            <FileTree
              tree={fileTree}
              currentFile={currentFile}
              onSelect={setCurrentFile}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

interface ProjectsListProps {
  projects: Array<{
    id: string;
    name: string;
    updatedAt: Date;
  }>;
  currentProject: { id: string } | null;
  onSelect: (projectId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

function ProjectsList({
  projects,
  currentProject,
  onSelect,
  searchQuery,
  setSearchQuery,
}: ProjectsListProps) {
  const router = useRouter();
  const { openModal } = useUIStore();
  const { setCurrentProject } = useProjectStore();

  const handleSelectProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentProject(data.project);
        router.push("/dashboard/generate");
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <div className="p-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-white/5"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => openModal("new-project")}
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              {searchQuery ? "No projects found" : "No projects yet"}
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer",
                  currentProject?.id === project.id
                    ? "bg-violet-500/20 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                )}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {project.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-400">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </>
  );
}

interface FileTreeProps {
  tree: FileTreeNode[];
  currentFile: string | null;
  onSelect: (path: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

function FileTree({
  tree,
  currentFile,
  onSelect,
  searchQuery,
  setSearchQuery,
}: FileTreeProps) {
  return (
    <>
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-white/5"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {tree.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              No files in project
            </div>
          ) : (
            tree.map((node) => (
              <FileTreeItem
                key={node.path}
                node={node}
                currentFile={currentFile}
                onSelect={onSelect}
                depth={0}
                searchQuery={searchQuery}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </>
  );
}

interface FileTreeItemProps {
  node: FileTreeNode;
  currentFile: string | null;
  onSelect: (path: string) => void;
  depth: number;
  searchQuery: string;
}

function FileTreeItem({
  node,
  currentFile,
  onSelect,
  depth,
  searchQuery,
}: FileTreeItemProps) {
  const [expanded, setExpanded] = useState(true);

  const getFileIcon = (name: string) => {
    if (name.endsWith(".tsx") || name.endsWith(".ts")) {
      return <FileCode className="h-4 w-4 text-blue-400" />;
    }
    if (name.endsWith(".json")) {
      return <FileJson className="h-4 w-4 text-amber-400" />;
    }
    if (name.endsWith(".config.js") || name.endsWith(".config.ts")) {
      return <FileCog className="h-4 w-4 text-slate-400" />;
    }
    return <File className="h-4 w-4 text-slate-400" />;
  };

  // Filter logic for search
  const matchesSearch = node.name
    .toLowerCase()
    .includes(searchQuery.toLowerCase());
  const childrenMatch =
    node.children?.some(
      (child) =>
        child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.children?.some((grandchild) =>
          grandchild.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    ) ?? false;

  if (searchQuery && !matchesSearch && !childrenMatch) {
    return null;
  }

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <FolderOpen className="h-4 w-4 text-amber-400" />
          <span className="ml-1">{node.name}</span>
        </button>
        {expanded && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeItem
                key={child.path}
                node={child}
                currentFile={currentFile}
                onSelect={onSelect}
                depth={depth + 1}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors",
        currentFile === node.path
          ? "bg-violet-500/20 text-white"
          : "text-slate-400 hover:text-white hover:bg-white/5",
      )}
      style={{ paddingLeft: `${depth * 12 + 28}px` }}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  );
}
