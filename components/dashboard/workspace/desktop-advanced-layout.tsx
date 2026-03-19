"use client";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
import {
  Code2,
  Save,
  Loader2,
  Database,
  Eye,
  PanelLeftClose,
  File,
  X,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getLanguageForFile } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { FileTreeRenderer as MobileFileTreeRenderer } from "./file-tree-renderer";
import { DesktopChatPanel } from "./desktop-chat-panel";
import { VerificationIframe } from "./verification-iframe";
import type { MobileWorkspaceHook } from "./use-mobile-workspace";

interface DesktopAdvancedLayoutProps {
  h: MobileWorkspaceHook;
}
export function DesktopAdvancedLayout({ h }: DesktopAdvancedLayoutProps) {
  const currentContent = h.currentFile
    ? h.currentProject?.codeFiles?.[h.currentFile] || ""
    : "";
  const language = h.currentFile
    ? getLanguageForFile(h.currentFile)
    : "typescript";
  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      {/* File Explorer */}
      <ResizablePanel defaultSize="15%" minSize="10%" maxSize="25%" collapsible>
        <Card className="h-full flex flex-col overflow-hidden">
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Explorer
            </span>
            <Badge
              variant="outline"
              className="text-xs liquid-glass-pill px-2.5 py-0.5"
            >
              {Object.keys(h.currentProject?.codeFiles || {}).length}
            </Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              <MobileFileTreeRenderer
                nodes={h.fileTree}
                currentFile={h.currentFile}
                openTabs={h.openTabs}
                collapsedFolders={h.collapsedFolders}
                onToggleFolder={h.toggleFolder}
                onFileClick={h.openFileInEditor}
                depth={0}
              />
            </div>
          </ScrollArea>
        </Card>
      </ResizablePanel>
      <ResizableHandle withHandle />
      {/* Code Editor */}
      <ResizablePanel defaultSize="50%" minSize="30%">
        <Card className="h-full flex flex-col overflow-hidden">
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-semibold text-white">Editor</span>
              </div>
              <Badge
                variant="outline"
                className="text-xs liquid-glass-pill px-2.5 py-0.5"
              >
                {h.currentProject?.platform}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 gap-2",
                      h.unsavedChanges
                        ? "text-amber-400 hover:text-amber-300"
                        : "text-slate-400 hover:text-white",
                    )}
                    onClick={h.handleSave}
                    disabled={h.isSaving || !h.unsavedChanges}
                  >
                    {h.isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {h.isSaving
                    ? "Saving..."
                    : h.unsavedChanges
                      ? "Save (auto-saves in 2s)"
                      : "Saved"}
                </TooltipContent>
              </Tooltip>
              <div className="w-px h-5 bg-white/10" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-slate-400 hover:text-white"
                    onClick={() =>
                      h.router.push(
                        `/dashboard/content?project=${h.currentProject?.id}`,
                      )
                    }
                  >
                    <Database className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Manage app data & services</TooltipContent>
              </Tooltip>
              <div className="w-px h-5 bg-white/10" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 gap-2",
                      h.showPreviewPanel
                        ? "text-violet-400 bg-violet-500/10"
                        : "text-slate-400 hover:text-white",
                    )}
                    onClick={() => h.setShowPreviewPanel(!h.showPreviewPanel)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {h.showPreviewPanel ? "Hide Preview" : "Show Preview"}
                </TooltipContent>
              </Tooltip>
              <div className="w-px h-5 bg-white/10" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-slate-400 hover:text-white"
                    onClick={() => h.setWorkspaceMode("simple")}
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Switch to Simple Mode</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center border-b border-white/[0.06] overflow-x-auto px-1 gap-0.5 pt-1">
              {h.openTabs.map((filePath) => {
                const fileName = filePath.split("/").pop() || filePath;
                const isActive = filePath === h.currentFile;
                return (
                  <div
                    key={filePath}
                    onClick={() => h.setCurrentFile(filePath)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-1.5 text-sm cursor-pointer group transition-all duration-200 rounded-t-xl",
                      isActive
                        ? "bg-white/10 text-white border border-white/[0.08] border-b-0"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.05]",
                    )}
                  >
                    <File
                      className={cn(
                        "h-3.5 w-3.5",
                        isActive && "text-violet-400",
                      )}
                    />
                    <span className="truncate max-w-[100px]">{fileName}</span>
                    <button
                      onClick={(e) => h.handleCloseTab(filePath, e)}
                      className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg p-0.5 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Editor + Optional Preview */}
            <div className="flex-1 flex overflow-hidden m-2 gap-2">
              <div
                className={cn(
                  "flex-1 rounded-xl overflow-hidden",
                  h.showPreviewPanel && "w-1/2",
                )}
              >
                {h.currentFile ? (
                  <Editor
                    height="100%"
                    language={language}
                    value={currentContent}
                    onChange={h.handleEditorChange}
                    theme="vs-dark"
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      tabSize: 2,
                      padding: { top: 16 },
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 liquid-glass rounded-xl">
                    <div className="text-center">
                      <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Select a file from explorer</p>
                    </div>
                  </div>
                )}
              </div>
              {h.showPreviewPanel && (
                <div className="w-1/2 rounded-xl liquid-glass liquid-shadow overflow-hidden">
                  {h.webPreviewUrl && h.previewReady ? (
                    <iframe
                      src={h.webPreviewUrl}
                      className="w-full h-full border-0"
                      title="Preview"
                      allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                      sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-slate-900/50 relative">
                      {h.webPreviewUrl && h.previewPhase === "verifying" && (
                        <VerificationIframe src={h.webPreviewUrl} />
                      )}
                      <div className="text-center text-slate-500">
                        <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>
                          {h.previewPhase === "verifying"
                            ? "Verifying preview..."
                            : h.isGenerating
                              ? "Generating app..."
                              : "Initializing preview..."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      </ResizablePanel>
      <ResizableHandle withHandle />

      {/* Chat */}
      <ResizablePanel defaultSize="35%" minSize="10%" maxSize="50%" collapsible>
        <DesktopChatPanel
          messages={h.messages}
          isGenerating={h.isGenerating}
          progressMessage={h.progressMessage}
          streamText={h.streamText}
          generationPhase={h.generationPhase}
          activityItems={h.activityItems}
          remainingCredits={h.remainingCredits}
          platform={h.currentProject?.platform || ""}
          quickPrompts={h.quickPrompts}
          promptsLabel={h.promptsLabel}
          input={h.input}
          setInput={h.setInput}
          handleSubmit={h.handleSubmit}
          handleKeyDown={h.handleKeyDown}
          onCancel={h.cancelGeneration}
          isCanceling={h.isCanceling}
          canGenerate={h.canGenerate}
          userPlan={h.userPlan}
          openFileInEditor={h.openFileInEditor}
          scrollRef={h.scrollRef}
          textareaRef={h.textareaRef}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
