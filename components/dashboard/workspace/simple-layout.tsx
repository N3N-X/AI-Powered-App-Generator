"use client";

import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  ExternalLink,
  Database,
  LayoutGrid,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ChatHeader, ChatMessages, ChatInput } from "./chat-panel";
import { PreviewContent } from "./preview-panel";
import { BackgroundBlobs } from "./background-blobs";
import type { WorkspaceState } from "./use-workspace-state";

interface SimpleLayoutProps {
  ws: WorkspaceState;
  quickPrompts: string[];
  promptsLabel: string;
  className?: string;
}

export function SimpleLayout({
  ws,
  quickPrompts,
  promptsLabel,
  className,
}: SimpleLayoutProps) {
  return (
    <TooltipProvider>
      <div className={cn("h-full flex p-2 relative", className)}>
        <BackgroundBlobs />

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel
            defaultSize="40%"
            minSize="10%"
            maxSize="55%"
            collapsible
          >
            {/* Chat Panel */}
            <Card className="h-full flex flex-col overflow-hidden">
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

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="60%" minSize="30%">
            {/* Preview Panel */}
            <Card className="h-full flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-white">
                      Live Preview
                    </span>
                  </div>
                  {ws.subdomainDisplayLabel && (
                    <span className="text-xs text-slate-500">
                      {ws.subdomainDisplayLabel}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2 text-slate-400 hover:text-white"
                        onClick={() =>
                          ws.router.push(
                            `/dashboard/content?project=${ws.currentProject?.id}`,
                          )
                        }
                      >
                        <Database className="h-4 w-4" />
                        <span className="hidden sm:inline">Manage</span>
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
                        className="h-8 gap-2 text-slate-400 hover:text-white"
                        onClick={() => ws.setWorkspaceMode("advanced")}
                      >
                        <LayoutGrid className="h-4 w-4" />
                        <span className="hidden sm:inline">Advanced</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Switch to Advanced IDE Mode</TooltipContent>
                  </Tooltip>

                  <div className="w-px h-5 bg-white/10" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-white"
                        onClick={ws.refreshPreview}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh Preview</TooltipContent>
                  </Tooltip>

                  <div className="w-px h-5 bg-white/10" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-white"
                        onClick={() =>
                          ws.setIsPreviewFullscreen(!ws.isPreviewFullscreen)
                        }
                      >
                        {ws.isPreviewFullscreen ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {ws.isPreviewFullscreen
                        ? "Exit Fullscreen"
                        : "Fullscreen"}
                    </TooltipContent>
                  </Tooltip>

                  {ws.subdomainDisplayUrl && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-white"
                          onClick={() => {
                            const url = ws.isDev
                              ? `/api/serve?subdomain=${ws.currentProject!.subdomain}`
                              : `https://${ws.currentProject!.subdomain}.rulxy.com`;
                            window.open(url, "_blank");
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open in New Tab</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 flex overflow-hidden m-2">
                <div
                  className={cn(
                    "flex-1 relative",
                    ws.isPreviewFullscreen &&
                      "fixed inset-0 z-50 bg-background p-0",
                  )}
                >
                  {ws.isPreviewFullscreen && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-4 right-4 z-10 bg-black/80 border-white/20 text-white hover:bg-black/90"
                      onClick={() => ws.setIsPreviewFullscreen(false)}
                    >
                      <Minimize2 className="h-4 w-4 mr-2" />
                      Exit Fullscreen
                    </Button>
                  )}

                  <div
                    className={cn(
                      "h-full rounded-xl overflow-hidden border border-white/[0.08] bg-white",
                      ws.isPreviewFullscreen && "rounded-none border-0",
                    )}
                  >
                    <PreviewContent
                      previewHtml={ws.previewHtml}
                      previewReady={ws.previewReady}
                      previewPhase={ws.previewPhase}
                      isGenerating={ws.isGenerating}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}
