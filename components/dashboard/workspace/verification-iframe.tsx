"use client";

interface VerificationIframeProps {
  src: string;
  className?: string;
}

export function VerificationIframe({
  src,
  className = "absolute inset-0 w-full h-full border-0 opacity-0 pointer-events-none",
}: VerificationIframeProps) {
  return (
    <iframe
      src={src}
      className={className}
      title="Verification Preview"
      allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
      sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
    />
  );
}
