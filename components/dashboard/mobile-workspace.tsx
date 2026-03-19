"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMobileWorkspace } from "./workspace/use-mobile-workspace";
import { BackgroundBlobs } from "./workspace/background-blobs";
import { QrCodeModal } from "./workspace/qr-code-modal";
import { MobileChatPanel } from "./workspace/mobile-chat-panel";
import { MobilePreviewPanel } from "./workspace/mobile-preview-panel";
import { MobileCodePanel } from "./workspace/mobile-code-panel";
import { MobileTabBar } from "./workspace/mobile-tab-bar";
import { DesktopSimpleLayout } from "./workspace/desktop-simple-layout";
import { DesktopAdvancedLayout } from "./workspace/desktop-advanced-layout";
import { VerificationIframe } from "./workspace/verification-iframe";

interface MobileWorkspaceProps {
  className?: string;
}

export function MobileWorkspace({ className }: MobileWorkspaceProps) {
  const h = useMobileWorkspace();

  if (!h.currentProject) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-slate-400">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No project selected</p>
        </div>
      </div>
    );
  }

  const currentContent = h.currentFile
    ? h.currentProject.codeFiles?.[h.currentFile] || ""
    : "";

  // Mobile Layout
  if (h.isMobile) {
    return (
      <TooltipProvider>
        <div
          className={cn(
            "h-full flex flex-col relative",
            className,
          )}
        >
          <div className="flex-1 overflow-hidden">
            {h.mobileSimpleTab === "chat" && (
              <MobileChatPanel
                messages={h.messages}
                isGenerating={h.isGenerating}
                progressMessage={h.progressMessage}
                streamText={h.streamText}
                generationPhase={h.generationPhase}
                activityItems={h.activityItems}
                remainingCredits={h.remainingCredits}
                platform={h.currentProject.platform || ""}
                quickPrompts={h.quickPrompts}
                input={h.input}
                setInput={h.setInput}
                handleSubmit={h.handleSubmit}
                handleKeyDown={h.handleKeyDown}
                onCancel={h.cancelGeneration}
                isCanceling={h.isCanceling}
                canGenerate={h.canGenerate}
                userPlan={h.userPlan}
                openFileInEditor={h.openFileInEditor}
                setMobileSimpleTab={h.setMobileSimpleTab}
                scrollRef={h.scrollRef}
                textareaRef={h.textareaRef}
              />
            )}
            {h.mobileSimpleTab === "preview" && (
              <MobilePreviewPanel
                previewMode={h.previewMode}
                setPreviewMode={h.setPreviewMode}
                webPreviewUrl={h.webPreviewUrl}
                previewReady={h.previewReady}
                previewPhase={h.previewPhase}
                isPreviewLoading={h.isPreviewLoading}
                isOnline={h.isOnline}
                isGenerating={h.isGenerating}
                qrCodeUrl={h.qrCodeUrl}
                platform={h.currentProject.platform || ""}
                iframeRef={h.iframeRef}
                webPreviewRef={h.webPreviewRef}
                setIsPreviewLoading={h.setIsPreviewLoading}
                setShowQrModal={h.setShowQrModal}
              />
            )}
            {h.mobileSimpleTab === "code" && (
              <MobileCodePanel
                currentFile={h.currentFile}
                currentContent={currentContent}
                codeFiles={h.currentProject.codeFiles}
                fileTree={h.fileTree}
                openTabs={h.openTabs}
                collapsedFolders={h.collapsedFolders}
                mobileExplorerOpen={h.mobileExplorerOpen}
                setMobileExplorerOpen={h.setMobileExplorerOpen}
                unsavedChanges={h.unsavedChanges}
                handleEditorChange={h.handleEditorChange}
                handleSave={h.handleSave}
                openFileInEditor={h.openFileInEditor}
                toggleFolder={h.toggleFolder}
              />
            )}
          </div>

          {/* Hidden verification iframe */}
          {h.webPreviewUrl &&
            h.mobileSimpleTab !== "preview" &&
            h.previewPhase === "verifying" && (
              <VerificationIframe
                src={h.webPreviewUrl}
                className="absolute w-0 h-0 border-0 opacity-0 pointer-events-none"
              />
            )}

          <MobileTabBar
            activeTab={h.mobileSimpleTab}
            setActiveTab={h.setMobileSimpleTab}
            onManageClick={() =>
              h.router.push(
                `/dashboard/content?project=${h.currentProject?.id}`,
              )
            }
          />
        </div>

        {h.showQrModal && h.qrCodeUrl && (
          <QrCodeModal
            qrCodeUrl={h.qrCodeUrl}
            onClose={() => h.setShowQrModal(false)}
            size="sm"
          />
        )}
      </TooltipProvider>
    );
  }

  // Desktop Advanced Mode
  if (h.workspaceMode === "advanced") {
    return (
      <TooltipProvider>
        <div
          className={cn(
            "h-full flex p-2 relative",
            className,
          )}
        >
          <BackgroundBlobs />
          <DesktopAdvancedLayout h={h} />
        </div>
      </TooltipProvider>
    );
  }

  // Desktop Simple Mode (default)
  return (
    <TooltipProvider>
      <div
        className={cn(
          "h-full flex p-2 relative",
          className,
        )}
      >
        <BackgroundBlobs />
        <DesktopSimpleLayout h={h} />

        {h.showQrModal && h.qrCodeUrl && (
          <QrCodeModal
            qrCodeUrl={h.qrCodeUrl}
            onClose={() => h.setShowQrModal(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
