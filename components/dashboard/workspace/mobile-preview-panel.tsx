"use client";

import { RefObject } from "react";
import { Monitor, Smartphone, QrCode, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PreviewStatus } from "./preview-status";
import { VerificationIframe } from "./verification-iframe";
import type { PreviewMode, PreviewPhase } from "./mobile-utils";

interface MobilePreviewPanelProps {
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
  webPreviewUrl: string | undefined;
  previewReady: boolean;
  previewPhase: PreviewPhase;
  isPreviewLoading: boolean;
  isOnline: boolean;
  isGenerating: boolean;
  qrCodeUrl: string | null;
  platform: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  webPreviewRef: RefObject<{ current: Window | null }>;
  setIsPreviewLoading: (val: boolean) => void;
  setShowQrModal: (val: boolean) => void;
}

export function MobilePreviewPanel({
  previewMode,
  setPreviewMode,
  webPreviewUrl,
  previewReady,
  previewPhase,
  isPreviewLoading,
  isOnline,
  isGenerating,
  qrCodeUrl,
  platform,
  iframeRef,
  webPreviewRef,
  setIsPreviewLoading,
  setShowQrModal,
}: MobilePreviewPanelProps) {
  return (
    <div className="h-full flex flex-col p-2 gap-2">
      <div className="liquid-glass rounded-2xl h-12 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isPreviewLoading
                ? "bg-yellow-500 animate-pulse"
                : isOnline
                  ? "bg-emerald-500"
                  : "bg-slate-500",
            )}
          />
          <span className="text-xs font-medium text-white">Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center bg-white/5 rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 px-2 gap-1",
                previewMode === "web"
                  ? "bg-violet-500/20 text-violet-300"
                  : "text-slate-400",
              )}
              onClick={() => setPreviewMode("web")}
            >
              <Monitor className="h-3 w-3" />
              <span className="text-[10px]">Web</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 px-2 gap-1",
                previewMode === "device"
                  ? "bg-violet-500/20 text-violet-300"
                  : "text-slate-400",
              )}
              onClick={() => setPreviewMode("device")}
            >
              <Smartphone className="h-3 w-3" />
              <span className="text-[10px]">Device</span>
            </Button>
          </div>
          {qrCodeUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={() => setShowQrModal(true)}
            >
              <QrCode className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden liquid-shadow-lg border border-white/[0.08]">
        {previewMode === "web" ? (
          webPreviewUrl && previewReady ? (
            <iframe
              ref={iframeRef}
              src={webPreviewUrl}
              className="w-full h-full border-0"
              title="Web Preview"
              allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
              sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
              onLoad={() => {
                if (iframeRef.current?.contentWindow) {
                  webPreviewRef.current.current =
                    iframeRef.current.contentWindow;
                  setIsPreviewLoading(false);
                }
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-900 relative">
              {webPreviewUrl && previewPhase === "verifying" && (
                <VerificationIframe src={webPreviewUrl} />
              )}
              <PreviewStatus
                previewPhase={previewPhase}
                isGenerating={isGenerating}
                iconSize="sm"
              />
            </div>
          )
        ) : (
          <div className="h-full flex items-center justify-center bg-slate-900">
            <div className="text-center">
              {qrCodeUrl ? (
                <>
                  <div className="bg-white p-3 rounded-xl inline-block mb-3">
                    <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">
                    Scan with Rulxy
                  </h3>
                  <p className="text-xs text-slate-400 max-w-[200px] mx-auto">
                    Open Rulxy on your{" "}
                    {platform === "IOS" ? "iPhone" : "Android"} and scan this
                    code
                  </p>
                </>
              ) : (
                <div className="text-slate-400">
                  <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin" />
                  <p className="text-xs">Generating QR code...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
