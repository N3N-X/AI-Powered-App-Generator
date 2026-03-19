"use client";

import { Button } from "@/components/ui/button";

interface QrCodeModalProps {
  qrCodeUrl: string;
  onClose: () => void;
  size?: "sm" | "lg";
}

export function QrCodeModal({
  qrCodeUrl,
  onClose,
  size = "lg",
}: QrCodeModalProps) {
  const imgSize = size === "sm" ? "w-48 h-48" : "w-64 h-64";
  const padding = size === "sm" ? "p-4" : "p-6";
  const containerPadding = size === "sm" ? "p-6 mx-4" : "p-8";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className={`bg-slate-900 rounded-2xl ${containerPadding} text-center`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`bg-white ${padding} rounded-xl inline-block mb-3`}>
          <img src={qrCodeUrl} alt="QR Code" className={imgSize} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Scan with Rulxy
        </h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
          Download Rulxy from the App Store or Play Store, then scan this code
          to preview on your device
        </p>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
