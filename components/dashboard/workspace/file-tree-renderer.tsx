import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";
import { FileTreeNode } from "@/types";

export function FileTreeRenderer({
  nodes,
  currentFile,
  openTabs,
  collapsedFolders,
  onToggleFolder,
  onFileClick,
  depth,
}: {
  nodes: FileTreeNode[];
  currentFile: string | null;
  openTabs: string[];
  collapsedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onFileClick: (path: string) => void;
  depth: number;
}) {
  return (
    <>
      {nodes.map((node) => {
        if (node.type === "folder") {
          const isCollapsed = collapsedFolders.has(node.path);
          return (
            <div key={node.path}>
              <button
                onClick={() => onToggleFolder(node.path)}
                className="w-full text-left py-1.5 rounded text-xs flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3 w-3 shrink-0 text-slate-500" />
                ) : (
                  <ChevronDown className="h-3 w-3 shrink-0 text-slate-500" />
                )}
                <Folder className="h-3.5 w-3.5 shrink-0 text-amber-400/70" />
                <span className="truncate">{node.name}</span>
              </button>
              {!isCollapsed && node.children && (
                <FileTreeRenderer
                  nodes={node.children}
                  currentFile={currentFile}
                  openTabs={openTabs}
                  collapsedFolders={collapsedFolders}
                  onToggleFolder={onToggleFolder}
                  onFileClick={onFileClick}
                  depth={depth + 1}
                />
              )}
            </div>
          );
        }

        const isActive = node.path === currentFile;
        const isOpen = openTabs.includes(node.path);
        return (
          <button
            key={node.path}
            onClick={() => onFileClick(node.path)}
            className={cn(
              "w-full text-left py-1.5 rounded text-xs flex items-center gap-2 transition-colors",
              isActive
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5",
            )}
            style={{ paddingLeft: `${depth * 12 + 22}px` }}
          >
            <File className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{node.name}</span>
            {isOpen && (
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 ml-auto mr-2" />
            )}
          </button>
        );
      })}
    </>
  );
}

export { FileTreeRenderer as MobileFileTreeRenderer };
