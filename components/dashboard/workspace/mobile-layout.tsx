"use client";

import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Code2,
  Eye,
  ExternalLink,
  FolderTree,
  Save,
  Database,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getLanguageForFile } from "@/lib/utils";
import { FileTreeRenderer } from "./file-tree-renderer";
import { ChatHeader, ChatMessages, ChatInput } from "./chat-panel";
import { PreviewContent } from "./preview-panel";
import type { WorkspaceState } from "./use-workspace-state";

interface MobileLayoutProps {
  ws: WorkspaceState;
  quickPrompts: string[];
  promptsLabel: string;
  className?: string;
}

export function MobileLayout({
  ws,
  quickPrompts,
  promptsLabel,
  className,
}: MobileLayoutProps) {
  return (
    <TooltipProvider>
      <div
        className={cn(
          "h-full flex flex-col relative",
          className,
        )}
      >
        <div className="flex-1 overflow-hidden">
          {/* Chat Tab */}
          {ws.mobileSimpleTab === "chat" && (
            <div className="h-full flex flex-col overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-violet-600/[0.04] to-transparent pointer-events-none" />
              <ChatHeader
                remainingCredits={ws.remainingCredits}
                wrapperClassName="liquid-glass mx-2 mt-2 rounded-2xl h-14 px-4 flex items-center justify-between shrink-0 relative"
                borderColor="border-background"
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
                  if (keys[0]) {
                    ws.openFileInEditor(keys[0]);
                    ws.setMobileSimpleTab("code");
                  }
                }}
                compact
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
                compact
              />
            </div>
          )}

          {/* Preview Tab */}
          {ws.mobileSimpleTab === "preview" && (
            <div className="h-full flex flex-col p-2 gap-2">
              <div className="liquid-glass rounded-2xl h-12 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-white">
                    Live Preview
                  </span>
                </div>
                {ws.subdomainDisplayUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 liquid-glass-pill liquid-glass-hover liquid-shadow text-slate-400 hover:text-white"
                    onClick={() => {
                      const url = ws.isDev
                        ? `/api/serve?subdomain=${ws.currentProject!.subdomain}`
                        : `https://${ws.currentProject!.subdomain}.rulxy.com`;
                      window.open(url, "_blank");
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className="flex-1 rounded-2xl overflow-hidden liquid-shadow-lg border border-white/[0.08]">
                <PreviewContent
                  previewHtml={ws.previewHtml}
                  previewReady={ws.previewReady}
                  previewPhase={ws.previewPhase}
                  isGenerating={ws.isGenerating}
                />
              </div>
            </div>
          )}

          {/* Code Tab */}
          {ws.mobileSimpleTab === "code" && (
            <div className="h-full flex flex-col p-2 gap-2">
              <div className="liquid-glass rounded-2xl h-12 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      ws.setMobileExplorerOpen(!ws.mobileExplorerOpen)
                    }
                    className={cn(
                      "h-8 w-8 flex items-center justify-center rounded-xl transition-all duration-300",
                      ws.mobileExplorerOpen
                        ? "liquid-glass liquid-shadow text-violet-400"
                        : "text-slate-500 hover:text-slate-300",
                    )}
                  >
                    <FolderTree className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-slate-400 truncate">
                    {ws.currentFile || "No file selected"}
                  </span>
                </div>
                {ws.unsavedChanges && (
                  <Button
                    size="sm"
                    className="h-7 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-xs liquid-glow-hover"
                    onClick={ws.handleSave}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                )}
              </div>
              <div className="flex-1 flex gap-2 overflow-hidden">
                {ws.mobileExplorerOpen && (
                  <div className="w-[35%] min-w-[110px] max-w-[180px] flex flex-col liquid-glass rounded-2xl overflow-hidden">
                    <div className="h-10 px-3 flex items-center justify-between border-b border-white/[0.06] shrink-0">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        Explorer
                      </span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                        {Object.keys(ws.currentProject?.codeFiles || {}).length}
                      </Badge>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-1.5 space-y-0.5">
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
                  </div>
                )}
                <div className="flex-1 flex flex-col liquid-glass rounded-2xl overflow-hidden">
                  <div className="flex-1">
                    {ws.currentFile ? (
                      <Editor
                        height="100%"
                        language={getLanguageForFile(ws.currentFile)}
                        value={
                          ws.currentProject?.codeFiles?.[ws.currentFile] || ""
                        }
                        onChange={(value) => {
                          if (value !== undefined) {
                            ws.handleEditorChange(value);
                          }
                        }}
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
          )}
        </div>

        {/* Mobile Tab Bar */}
        <div className="shrink-0 px-3 pb-3 pt-1.5 flex items-center justify-center gap-2">
          {(
            [
              { id: "chat", icon: MessageSquare, label: "Chat" },
              { id: "preview", icon: Eye, label: "Preview" },
              { id: "code", icon: Code2, label: "Code" },
              { id: "manage", icon: Database, label: "Manage" },
            ] as const
          ).map((tab) => {
            const isActive = tab.id === ws.mobileSimpleTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "manage") {
                    ws.router.push(
                      `/dashboard/content?project=${ws.currentProject?.id}`,
                    );
                  } else {
                    ws.setMobileSimpleTab(
                      tab.id as "chat" | "preview" | "code",
                    );
                  }
                }}
                className={cn(
                  "liquid-glass-pill liquid-shadow flex items-center gap-1.5 px-4 py-2 h-10 transition-all duration-300 text-sm font-medium",
                  isActive
                    ? "liquid-glass-hover text-violet-400 border-violet-500/20"
                    : "text-slate-400 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
