"use client";

import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
import { FolderTree, Code2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLanguageForFile } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileTreeNode } from "@/types";
import { FileTreeRenderer as MobileFileTreeRenderer } from "./file-tree-renderer";

interface MobileCodePanelProps {
  currentFile: string | null;
  currentContent: string;
  codeFiles: Record<string, string> | undefined;
  fileTree: FileTreeNode[];
  openTabs: string[];
  collapsedFolders: Set<string>;
  mobileExplorerOpen: boolean;
  setMobileExplorerOpen: (val: boolean) => void;
  unsavedChanges: boolean;
  handleEditorChange: (value: string | undefined) => void;
  handleSave: () => void;
  openFileInEditor: (filePath: string) => void;
  toggleFolder: (path: string) => void;
}

export function MobileCodePanel({
  currentFile,
  currentContent,
  codeFiles,
  fileTree,
  openTabs,
  collapsedFolders,
  mobileExplorerOpen,
  setMobileExplorerOpen,
  unsavedChanges,
  handleEditorChange,
  handleSave,
  openFileInEditor,
  toggleFolder,
}: MobileCodePanelProps) {
  const language = currentFile ? getLanguageForFile(currentFile) : "typescript";

  return (
    <div className="h-full flex flex-col p-2 gap-2">
      {/* Code Header */}
      <div className="liquid-glass rounded-2xl h-12 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileExplorerOpen(!mobileExplorerOpen)}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-xl transition-all duration-300",
              mobileExplorerOpen
                ? "liquid-glass liquid-shadow text-violet-400"
                : "text-slate-500 hover:text-slate-300",
            )}
          >
            <FolderTree className="h-4 w-4" />
          </button>
          <span className="text-xs text-slate-400 truncate">
            {currentFile || "No file selected"}
          </span>
        </div>
        {unsavedChanges && (
          <Button
            size="sm"
            className="h-7 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-xs liquid-glow-hover"
            onClick={handleSave}
          >
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        )}
      </div>

      <div className="flex-1 flex gap-2 overflow-hidden">
        {/* File Explorer */}
        {mobileExplorerOpen && (
          <div className="w-[35%] min-w-[110px] max-w-[180px] flex flex-col liquid-glass rounded-2xl overflow-hidden">
            <div className="h-10 px-3 flex items-center justify-between border-b border-white/[0.06] shrink-0">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Explorer
              </span>
              <Badge variant="outline" className="text-[10px] h-4 px-1">
                {Object.keys(codeFiles || {}).length}
              </Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-1.5 space-y-0.5">
                <MobileFileTreeRenderer
                  nodes={fileTree}
                  currentFile={currentFile}
                  openTabs={openTabs}
                  collapsedFolders={collapsedFolders}
                  onToggleFolder={toggleFolder}
                  onFileClick={openFileInEditor}
                  depth={0}
                />
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Code Editor */}
        <div className="flex-1 flex flex-col liquid-glass rounded-2xl overflow-hidden">
          <div className="flex-1">
            {currentFile ? (
              <Editor
                height="100%"
                language={language}
                value={currentContent}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: "off",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  padding: { top: 8 },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Code2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Select a file</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
