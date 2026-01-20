"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import { useProjectStore } from "@/stores/project-store";
import { getLanguageForFile } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Copy,
  Check,
  Maximize2,
  Minimize2,
  FileCode,
  X,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export function CodeEditor() {
  const {
    currentProject,
    currentFile,
    setCurrentFile,
    updateCodeFile,
    setUnsavedChanges,
  } = useProjectStore();

  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["src"]),
  );
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const monaco = useMonaco();

  // Detect system theme
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };

    updateTheme();

    // Watch for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Track previous project ID to detect project changes
  const [prevProjectId, setPrevProjectId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Reset open tabs and open default file when project changes
  useEffect(() => {
    // Only run when project ID changes (not on every codeFiles update)
    if (currentProject?.id !== prevProjectId) {
      setPrevProjectId(currentProject?.id || null);
      setOpenTabs([]);
      setHasInitialized(false);
    }
  }, [currentProject?.id, prevProjectId]);

  // Open default file once when project loads with code
  useEffect(() => {
    if (hasInitialized) return;
    if (!currentProject?.codeFiles) return;
    if (Object.keys(currentProject.codeFiles).length === 0) return;

    const appFile =
      currentProject.codeFiles["App.tsx"] || currentProject.codeFiles["App.js"];
    if (appFile) {
      const fileName =
        "App.tsx" in currentProject.codeFiles ? "App.tsx" : "App.js";
      setCurrentFile(fileName);
      setOpenTabs([fileName]);
    } else {
      const firstFile = Object.keys(currentProject.codeFiles)[0];
      if (firstFile) {
        setCurrentFile(firstFile);
        setOpenTabs([firstFile]);
      }
    }
    setHasInitialized(true);
  }, [
    currentProject?.id,
    currentProject?.codeFiles,
    hasInitialized,
    setCurrentFile,
  ]);

  // Add current file to open tabs (only when file changes, not on every render)
  useEffect(() => {
    if (currentFile && !openTabs.includes(currentFile)) {
      setOpenTabs((prev) => [...prev, currentFile]);
    }
  }, [currentFile]); // Removed openTabs from deps to prevent loop

  // Configure Monaco editor theme
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme("rux-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "6b7280" },
          { token: "keyword", foreground: "c084fc" },
          { token: "string", foreground: "4ade80" },
          { token: "number", foreground: "38bdf8" },
          { token: "type", foreground: "f472b6" },
        ],
        colors: {
          "editor.background": "#1e1e1e",
          "editor.foreground": "#e2e8f0",
          "editor.lineHighlightBackground": "#2d2d30",
          "editor.selectionBackground": "#8b5cf640",
          "editorCursor.foreground": "#8b5cf6",
          "editorWhitespace.foreground": "#334155",
          "editorIndentGuide.background": "#2d2d30",
          "editorLineNumber.foreground": "#475569",
          "editorLineNumber.activeForeground": "#8b5cf6",
        },
      });

      monaco.editor.defineTheme("rux-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "comment", foreground: "6b7280" },
          { token: "keyword", foreground: "7c3aed" },
          { token: "string", foreground: "16a34a" },
          { token: "number", foreground: "0284c7" },
          { token: "type", foreground: "db2777" },
        ],
        colors: {
          "editor.background": "#ffffff",
          "editor.foreground": "#1f2937",
          "editor.lineHighlightBackground": "#f9fafb",
          "editor.selectionBackground": "#8b5cf620",
          "editorCursor.foreground": "#8b5cf6",
        },
      });
    }
  }, [monaco]);

  const handleEditorMount: OnMount = useCallback(() => {
    // Editor is ready
  }, []);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined && currentFile && currentProject) {
        const currentContent = currentProject.codeFiles?.[currentFile] || "";
        if (value !== currentContent) {
          updateCodeFile(currentFile, value);
          setUnsavedChanges(true);
        }
      }
    },
    [currentFile, currentProject, updateCodeFile, setUnsavedChanges],
  );

  const handleCopy = () => {
    if (currentContent) {
      navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
    }
  };

  const handleCloseTab = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenTabs((prev) => prev.filter((tab) => tab !== filePath));
    if (currentFile === filePath) {
      const remainingTabs = openTabs.filter((tab) => tab !== filePath);
      setCurrentFile(remainingTabs[remainingTabs.length - 1] || null);
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  // File tree node type - using interface to allow index signature with specific property
  interface FileTreeNode {
    [key: string]: FileTreeNode | string[] | undefined;
  }

  // Build file tree structure - memoized to prevent recalculation on every render
  const fileTree = useMemo(() => {
    if (!currentProject?.codeFiles) return {} as FileTreeNode;

    const tree: FileTreeNode = {};
    const files = Object.keys(currentProject.codeFiles);

    files.forEach((filePath) => {
      const parts = filePath.split("/");
      let current: FileTreeNode = tree;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // It's a file
          if (!current._files) current._files = [];
          (current._files as string[]).push(filePath);
        } else {
          // It's a folder
          if (!current[part]) current[part] = {};
          current = current[part] as FileTreeNode;
        }
      });
    });

    return tree;
  }, [currentProject?.codeFiles]);

  // Memoized file tree renderer to prevent unnecessary re-renders
  const renderFileTree = useCallback(
    (tree: FileTreeNode, basePath = ""): React.ReactNode[] => {
      const items: React.ReactNode[] = [];

      // Render folders
      Object.keys(tree).forEach((key) => {
        if (key === "_files") return;

        const folderPath = basePath ? `${basePath}/${key}` : key;
        const isExpanded = expandedFolders.has(folderPath);

        items.push(
          <div key={folderPath}>
            <button
              onClick={() => toggleFolder(folderPath)}
              className="w-full flex items-center gap-1.5 px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500" />
              )}
              <span>{key}</span>
            </button>
            {isExpanded && (
              <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
                {renderFileTree(tree[key] as FileTreeNode, folderPath)}
              </div>
            )}
          </div>,
        );
      });

      // Render files
      const files = tree._files as string[] | undefined;
      if (files) {
        files.forEach((filePath: string) => {
          const fileName = filePath.split("/").pop() || filePath;
          const isActive = currentFile === filePath;

          items.push(
            <button
              key={filePath}
              onClick={() => setCurrentFile(filePath)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1 text-sm rounded transition-colors",
                isActive
                  ? "bg-violet-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              <File className="h-3.5 w-3.5" />
              <span className="truncate">{fileName}</span>
            </button>,
          );
        });
      }

      return items;
    },
    [expandedFolders, currentFile, setCurrentFile],
  );

  const currentContent =
    (currentFile && currentProject?.codeFiles?.[currentFile]) || "";
  const language = currentFile ? getLanguageForFile(currentFile) : "typescript";

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-[#1e1e1e] text-gray-500 dark:text-slate-400">
        <div className="text-center">
          <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No project selected</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "h-full flex bg-white dark:bg-[#1e1e1e]",
          isFullscreen && "fixed inset-0 z-50",
        )}
      >
        {/* File Explorer */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#252526] flex flex-col">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Explorer
            </h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">{renderFileTree(fileTree)}</div>
          </ScrollArea>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab bar */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#252526]">
            <div className="flex-1 flex items-center overflow-x-auto hide-scrollbar">
              {openTabs.map((filePath) => {
                const fileName = filePath.split("/").pop() || filePath;
                const isActive = filePath === currentFile;

                return (
                  <div
                    key={filePath}
                    onClick={() => setCurrentFile(filePath)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm border-r border-gray-200 dark:border-gray-800 transition-colors group cursor-pointer",
                      isActive
                        ? "bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700",
                    )}
                  >
                    <span className="truncate max-w-[120px]">{fileName}</span>
                    <button
                      onClick={(e) => handleCloseTab(filePath, e)}
                      className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-0.5 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 px-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy code</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 min-h-0">
            {currentFile ? (
              <Editor
                height="100%"
                language={language}
                value={currentContent}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                theme={theme === "dark" ? "rux-dark" : "rux-light"}
                options={{
                  readOnly: false,
                  automaticLayout: true,
                  fontSize: 14,
                  lineNumbers: "on",
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  tabSize: 2,
                  formatOnPaste: true,
                  formatOnType: true,
                }}
                loading={
                  <div className="flex items-center justify-center h-full bg-white dark:bg-[#1e1e1e]">
                    <div className="text-gray-500 dark:text-slate-400">
                      Loading editor...
                    </div>
                  </div>
                }
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-slate-400">
                <div className="text-center">
                  <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a file to edit</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
