"use client";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { DesktopChatPanel } from "./desktop-chat-panel";
import { DesktopPreviewPanel } from "./desktop-preview-panel";
import type { MobileWorkspaceHook } from "./use-mobile-workspace";

interface DesktopSimpleLayoutProps {
  h: MobileWorkspaceHook;
}

export function DesktopSimpleLayout({ h }: DesktopSimpleLayoutProps) {
  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      {/* Chat */}
      <ResizablePanel defaultSize="55%" minSize="10%" maxSize="70%" collapsible>
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
          showPlatformBadge
        />
      </ResizablePanel>
      <ResizableHandle withHandle />

      {/* Preview */}
      <ResizablePanel defaultSize="45%" minSize="20%">
        <DesktopPreviewPanel
          previewMode={h.previewMode}
          setPreviewMode={h.setPreviewMode}
          webPreviewUrl={h.webPreviewUrl}
          previewReady={h.previewReady}
          previewPhase={h.previewPhase}
          isPreviewLoading={h.isPreviewLoading}
          isOnline={h.isOnline}
          isGenerating={h.isGenerating}
          progressMessage={h.progressMessage}
          qrCodeUrl={h.qrCodeUrl}
          platform={h.currentProject?.platform || ""}
          snackUrl={h.snackState?.url}
          isPreviewFullscreen={h.isPreviewFullscreen}
          setIsPreviewFullscreen={h.setIsPreviewFullscreen}
          setShowQrModal={h.setShowQrModal}
          setWorkspaceMode={h.setWorkspaceMode}
          onRefreshPreview={h.refreshPreview}
          iframeRef={h.iframeRef}
          webPreviewRef={h.webPreviewRef}
          setIsPreviewLoading={h.setIsPreviewLoading}
          onManageClick={() =>
            h.router.push(`/dashboard/content?project=${h.currentProject?.id}`)
          }
          codeFiles={h.currentProject?.codeFiles}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
