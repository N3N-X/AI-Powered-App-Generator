"use client";

import { useCallback, useEffect, useState } from "react";
import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import { useProjectStore } from "@/stores/project-store";
import { getLanguageForFile } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  FileCode,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export function CodeEditor() {
  const {
    currentProject,
    currentFile,
    setCurrentFile,
    updateCodeFile,
    unsavedChanges,
    setUnsavedChanges,
  } = useProjectStore();

  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const monaco = useMonaco();

  // Reset open tabs when project changes
  useEffect(() => {
    setOpenTabs([]);
  }, [currentProject?.id]);

  // Add current file to open tabs
  useEffect(() => {
    if (currentFile && !openTabs.includes(currentFile)) {
      setOpenTabs((prev) => [...prev, currentFile]);
    }
  }, [currentFile, openTabs]);

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
          "editor.background": "#0f172a",
          "editor.foreground": "#e2e8f0",
          "editor.lineHighlightBackground": "#1e293b",
          "editor.selectionBackground": "#8b5cf640",
          "editorCursor.foreground": "#8b5cf6",
          "editorWhitespace.foreground": "#334155",
          "editorIndentGuide.background": "#1e293b",
          "editorLineNumber.foreground": "#475569",
          "editorLineNumber.activeForeground": "#8b5cf6",
        },
      });
    }
  }, [monaco]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    // Set theme after mount
    monaco.editor.setTheme("rux-dark");

    // Configure editor options
    editor.updateOptions({
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontLigatures: true,
      lineHeight: 1.6,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 16, bottom: 16 },
      smoothScrolling: true,
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      renderLineHighlight: "gutter",
      bracketPairColorization: { enabled: true },
    });
  };

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (currentFile && value !== undefined) {
        updateCodeFile(currentFile, value);
      }
    },
    [currentFile, updateCodeFile],
  );

  const handleCopy = async () => {
    if (!currentFile || !currentProject) return;

    const content = currentProject.codeFiles[currentFile];
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard" });
    }
  };

  const handleCloseTab = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter((t) => t !== filePath);
    setOpenTabs(newTabs);

    if (currentFile === filePath) {
      setCurrentFile(newTabs[newTabs.length - 1] || null);
    }
  };

  const currentContent = currentProject?.codeFiles[currentFile || ""] || "";
  const language = currentFile ? getLanguageForFile(currentFile) : "typescript";

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <p>Select a project to view code</p>
      </div>
    );
  }

  if (!currentFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
        <FileCode className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-center">
          Select a file from the sidebar or generate code to get started
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "h-full flex flex-col bg-slate-900/50",
          isFullscreen && "fixed inset-0 z-50",
        )}
      >
        {/* Tab bar */}
        <div className="flex items-center justify-between border-b border-white/5 bg-black/20">
          <div className="flex-1 flex items-center overflow-x-auto hide-scrollbar">
            {openTabs.map((filePath) => {
              const fileName = filePath.split("/").pop() || filePath;
              const isActive = filePath === currentFile;

              return (
                <div
                  key={filePath}
                  onClick={() => setCurrentFile(filePath)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm border-r border-white/5 transition-colors group cursor-pointer",
                    isActive
                      ? "bg-slate-800/50 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5",
                  )}
                >
                  <span className="truncate max-w-[120px]">{fileName}</span>
                  <button
                    onClick={(e) => handleCloseTab(filePath, e)}
                    className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 transition-opacity"
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
                    <Check className="h-4 w-4 text-emerald-400" />
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
          <Editor
            height="100%"
            language={language}
            value={currentContent}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            theme="rux-dark"
            options={{
              readOnly: false,
              automaticLayout: true,
            }}
            loading={
              <div className="h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/5 bg-black/20 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>{language.toUpperCase()}</span>
            <span>{currentContent.split("\n").length} lines</span>
          </div>
          <div className="flex items-center gap-4">
            {unsavedChanges && (
              <span className="text-amber-400">Unsaved changes</span>
            )}
            <span>UTF-8</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
