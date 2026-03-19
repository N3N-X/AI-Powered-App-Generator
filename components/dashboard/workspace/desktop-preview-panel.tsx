"use client";

import { RefObject } from "react";
import type { PreviewMode, PreviewPhase } from "./mobile-utils";
import { PreviewToolbar } from "./preview-panel/preview-toolbar";
import { PreviewContent } from "./preview-panel/preview-content";
import { Card } from "@/components/ui/card";

interface DesktopPreviewPanelProps {
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
  webPreviewUrl: string | undefined;
  previewReady: boolean;
  previewPhase: PreviewPhase;
  isPreviewLoading: boolean;
  isOnline: boolean;
  isGenerating: boolean;
  progressMessage: string | null;
  qrCodeUrl: string | null;
  platform: string;
  snackUrl: string | undefined;
  isPreviewFullscreen: boolean;
  setIsPreviewFullscreen: (val: boolean) => void;
  setShowQrModal: (val: boolean) => void;
  setWorkspaceMode: (mode: "simple" | "advanced") => void;
  onRefreshPreview?: () => void;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  webPreviewRef: RefObject<{ current: Window | null }>;
  setIsPreviewLoading: (val: boolean) => void;
  onManageClick: () => void;
  codeFiles: Record<string, string> | undefined;
}

export function DesktopPreviewPanel({
  previewMode,
  setPreviewMode,
  webPreviewUrl,
  previewReady,
  previewPhase,
  isPreviewLoading,
  isOnline,
  isGenerating,
  progressMessage,
  qrCodeUrl,
  platform,
  snackUrl,
  isPreviewFullscreen,
  setIsPreviewFullscreen,
  setShowQrModal,
  setWorkspaceMode,
  onRefreshPreview,
  iframeRef,
  webPreviewRef,
  setIsPreviewLoading,
  onManageClick,
  codeFiles,
}: DesktopPreviewPanelProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <PreviewToolbar
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        isPreviewLoading={isPreviewLoading}
        isOnline={isOnline}
        qrCodeUrl={qrCodeUrl}
        platform={platform}
        snackUrl={snackUrl}
        isPreviewFullscreen={isPreviewFullscreen}
        setIsPreviewFullscreen={setIsPreviewFullscreen}
        setShowQrModal={setShowQrModal}
        setWorkspaceMode={setWorkspaceMode}
        onManageClick={onManageClick}
        onRefreshPreview={onRefreshPreview}
      />
      <PreviewContent
        previewMode={previewMode}
        webPreviewUrl={webPreviewUrl}
        previewReady={previewReady}
        previewPhase={previewPhase}
        isGenerating={isGenerating}
        progressMessage={progressMessage}
        qrCodeUrl={qrCodeUrl}
        platform={platform}
        snackUrl={snackUrl}
        isPreviewFullscreen={isPreviewFullscreen}
        setIsPreviewFullscreen={setIsPreviewFullscreen}
        iframeRef={iframeRef}
        webPreviewRef={webPreviewRef}
        setIsPreviewLoading={setIsPreviewLoading}
        codeFiles={codeFiles}
      />
    </Card>
  );
}
