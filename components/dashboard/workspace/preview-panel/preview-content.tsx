"use client";

import { RefObject } from "react";
import { Smartphone, Loader2, ExternalLink, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PreviewMode, PreviewPhase } from "../mobile-utils";
import { PreviewStatus } from "../preview-status";
import { VerificationIframe } from "../verification-iframe";

interface PreviewContentProps {
  previewMode: PreviewMode;
  webPreviewUrl: string | undefined;
  previewReady: boolean;
  previewPhase: PreviewPhase;
  isGenerating: boolean;
  progressMessage: string | null;
  qrCodeUrl: string | null;
  platform: string;
  snackUrl: string | undefined;
  isPreviewFullscreen: boolean;
  setIsPreviewFullscreen: (val: boolean) => void;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  webPreviewRef: RefObject<{ current: Window | null }>;
  setIsPreviewLoading: (val: boolean) => void;
  codeFiles: Record<string, string> | undefined;
}

export function PreviewContent({
  previewMode,
  webPreviewUrl,
  previewReady,
  previewPhase,
  isGenerating,
  progressMessage,
  qrCodeUrl,
  platform,
  snackUrl,
  isPreviewFullscreen,
  setIsPreviewFullscreen,
  iframeRef,
  webPreviewRef,
  setIsPreviewLoading,
  codeFiles,
}: PreviewContentProps) {
  const hasCodeFiles = codeFiles && Object.keys(codeFiles).length > 0;

  return (
    <div className="flex-1 flex overflow-hidden m-2">
      <div
        className={cn(
          "flex-1 relative flex items-center justify-center rounded-xl",
          isPreviewFullscreen && "fixed inset-0 z-50 bg-background p-8",
        )}
      >
        {isPreviewFullscreen && (
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 z-10 liquid-glass-pill liquid-shadow text-white hover:bg-white/[0.08]"
            onClick={() => setIsPreviewFullscreen(false)}
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Exit Fullscreen
          </Button>
        )}
        <div
          className={cn(
            "relative mx-auto",
            isPreviewFullscreen ? "w-[480px] h-[980px]" : "w-[420px] h-[860px]",
          )}
        >
          <div className="absolute inset-0 rounded-[55px] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 p-[3px] shadow-2xl">
            <div className="absolute inset-[3px] rounded-[52px] bg-black overflow-hidden">
              <div className="w-full h-full rounded-[52px] overflow-hidden">
                {!hasCodeFiles ? (
                  <EmptyPreview />
                ) : previewMode === "web" ? (
                  <WebPreview
                    webPreviewUrl={webPreviewUrl}
                    previewReady={previewReady}
                    previewPhase={previewPhase}
                    isGenerating={isGenerating}
                    progressMessage={progressMessage}
                    iframeRef={iframeRef}
                    webPreviewRef={webPreviewRef}
                    setIsPreviewLoading={setIsPreviewLoading}
                  />
                ) : (
                  <DevicePreview
                    qrCodeUrl={qrCodeUrl}
                    platform={platform}
                    snackUrl={snackUrl}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="h-full flex items-center justify-center bg-slate-900">
      <div className="text-center text-slate-400">
        <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-white font-medium mb-2">
          Start building to see your app
        </p>
        <p className="text-sm">Describe what you want to build in the chat</p>
      </div>
    </div>
  );
}

interface WebPreviewProps {
  webPreviewUrl: string | undefined;
  previewReady: boolean;
  previewPhase: PreviewPhase;
  isGenerating: boolean;
  progressMessage: string | null;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  webPreviewRef: RefObject<{ current: Window | null }>;
  setIsPreviewLoading: (val: boolean) => void;
}

function WebPreview({
  webPreviewUrl,
  previewReady,
  previewPhase,
  isGenerating,
  progressMessage,
  iframeRef,
  webPreviewRef,
  setIsPreviewLoading,
}: WebPreviewProps) {
  if (webPreviewUrl && previewReady) {
    return (
      <iframe
        ref={iframeRef}
        src={webPreviewUrl}
        className="w-full h-full border-0"
        title="Web Preview"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
        onLoad={() => {
          if (iframeRef.current?.contentWindow) {
            webPreviewRef.current.current = iframeRef.current.contentWindow;
            setIsPreviewLoading(false);
          }
        }}
      />
    );
  }

  return (
    <div className="h-full flex items-center justify-center bg-slate-900 relative">
      {webPreviewUrl && previewPhase === "verifying" && (
        <VerificationIframe src={webPreviewUrl} />
      )}
      <PreviewStatus
        previewPhase={previewPhase}
        isGenerating={isGenerating}
        progressMessage={progressMessage}
      />
    </div>
  );
}

interface DevicePreviewProps {
  qrCodeUrl: string | null;
  platform: string;
  snackUrl: string | undefined;
}

function DevicePreview({ qrCodeUrl, platform, snackUrl }: DevicePreviewProps) {
  if (qrCodeUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="bg-white p-4 rounded-xl inline-block mb-4">
            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Scan with Rulxy
          </h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Open the Rulxy app on your{" "}
            {platform === "IOS" ? "iPhone" : "Android"} and scan this QR code to
            preview your app
          </p>
          {snackUrl && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => window.open(snackUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Expo Snack
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center bg-slate-900">
      <div className="text-center text-slate-400">
        <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
        <p>Generating QR code...</p>
        <p className="text-xs mt-2">Connecting to Expo...</p>
      </div>
    </div>
  );
}
