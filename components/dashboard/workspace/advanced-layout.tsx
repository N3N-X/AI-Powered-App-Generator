"use client";

import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { TooltipProvider } from "@/components/ui/tooltip";
import { File, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLanguageForFile } from "@/lib/utils";
import { FileTreeRenderer } from "./file-tree-renderer";
import { ChatHeader, ChatMessages, ChatInput } from "./chat-panel";
import { DarkPreviewWrapper } from "./preview-panel";
import { BackgroundBlobs } from "./background-blobs";
import { EditorToolbar } from "./editor-toolbar";
import type { WorkspaceState } from "./use-workspace-state";

interface AdvancedLayoutProps {
  ws: WorkspaceState;
  quickPrompts: string[];
  promptsLabel: string;
  className?: string;
}

export function AdvancedLayout({
  ws,
  quickPrompts,
  promptsLabel,
  className,
}: AdvancedLayoutProps) {
  const currentContent = ws.currentFile
    ? ws.currentProject?.codeFiles?.[ws.currentFile] || ""
    : "";
  const language = ws.currentFile
    ? getLanguageForFile(ws.currentFile)
    : "typescript";

  return (
    <TooltipProvider>
      <div className={cn("h-full flex p-2 relative", className)}>
        <BackgroundBlobs />

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* File Explorer */}
          <ResizablePanel
            defaultSize="15%"
            minSize="10%"
            maxSize="25%"
            collapsible
          >
            <Card className="h-full flex flex-col overflow-hidden">
              <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Explorer
                </span>
                <Badge
                  variant="outline"
                  className="text-xs liquid-glass-pill px-2.5 py-0.5"
                >
                  {Object.keys(ws.currentProject?.codeFiles || {}).length}
                </Badge>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  <FileTreeRenderer
                    nodes={ws.fileTree}
                    currentFile={ws.currentFile}
                    openTabs={ws.openTabs}
                    collapsedFolders={ws.collapsedFolders}
                    onToggleFolder={ws.toggleFolder}
                    onFileClick={ws.openFileInEditor}
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
              <EditorToolbar
                unsavedChanges={ws.unsavedChanges}
                isSaving={ws.isSaving}
                showPreviewPanel={ws.showPreviewPanel}
                projectId={ws.currentProject?.id}
                router={ws.router}
                onSave={ws.handleSave}
                onTogglePreview={() =>
                  ws.setShowPreviewPanel(!ws.showPreviewPanel)
                }
                onSwitchToSimple={() => ws.setWorkspaceMode("simple")}
                onRefreshPreview={ws.refreshPreview}
              />

              {/* Tabs + Editor */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center border-b border-white/[0.06] overflow-x-auto px-1 gap-0.5 pt-1">
                  {ws.openTabs.map((filePath) => {
                    const fileName = filePath.split("/").pop() || filePath;
                    const isActive = filePath === ws.currentFile;
                    return (
                      <div
                        key={filePath}
                        onClick={() => ws.setCurrentFile(filePath)}
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
                        <span className="truncate max-w-[100px]">
                          {fileName}
                        </span>
                        <button
                          onClick={(e) => ws.handleCloseTab(filePath, e)}
                          className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg p-0.5 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex-1 overflow-hidden m-2">
                  {ws.showPreviewPanel ? (
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="gap-1 h-full"
                    >
                      <ResizablePanel defaultSize="50%" minSize="30%">
                        <EditorPane
                          currentFile={ws.currentFile}
                          content={currentContent}
                          language={language}
                          onChange={ws.handleEditorChange}
                        />
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                      <ResizablePanel defaultSize="50%" minSize="25%">
                        <DarkPreviewWrapper
                          previewHtml={ws.previewHtml}
                          previewReady={ws.previewReady}
                          previewPhase={ws.previewPhase}
                          isGenerating={ws.isGenerating}
                        />
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  ) : (
                    <EditorPane
                      currentFile={ws.currentFile}
                      content={currentContent}
                      language={language}
                      onChange={ws.handleEditorChange}
                    />
                  )}
                </div>
              </div>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Chat Panel */}
          <ResizablePanel
            defaultSize="35%"
            minSize="10%"
            maxSize="50%"
            collapsible
          >
            <Card className="h-full flex flex-col overflow-hidden relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-violet-600/[0.04] to-transparent pointer-events-none" />
              <ChatHeader
                remainingCredits={ws.remainingCredits}
                wrapperClassName="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0 relative"
              />
              <ChatMessages
                messages={ws.messages}
                isGenerating={ws.isGenerating}
                progressMessage={ws.progressMessage}
                generationNotice={ws.generationNotice}
                streamText={ws.streamText}
                generationPhase={ws.generationPhase}
                activityItems={ws.activityItems}
                quickPrompts={quickPrompts}
                promptsLabel={promptsLabel}
                scrollRef={ws.scrollRef}
                onSetInput={ws.setInput}
                onCancel={ws.handleCancel}
                isCanceling={ws.isCanceling}
                onViewCode={(files) => {
                  const keys = Object.keys(files);
                  if (keys[0]) ws.openFileInEditor(keys[0]);
                }}
              />
              <ChatInput
                input={ws.input}
                setInput={ws.setInput}
                onKeyDown={ws.handleKeyDown}
                onSubmit={() => ws.handleSubmit()}
                isGenerating={ws.isGenerating}
                canGenerate={ws.canGenerate}
                plan={ws.userPlan}
                textareaRef={ws.textareaRef}
              />
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}

function EditorPane({
  currentFile,
  content,
  language,
  onChange,
}: {
  currentFile: string | null;
  content: string;
  language: string;
  onChange: (value: string | undefined) => void;
}) {
  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 liquid-glass rounded-xl">
        <div className="text-center">
          <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Select a file from explorer</p>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full rounded-xl overflow-hidden">
      <Editor
        height="100%"
        language={language}
        value={content}
        onChange={onChange}
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
    </div>
  );
}
