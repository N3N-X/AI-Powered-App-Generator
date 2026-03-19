"use client";

export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-violet-500/10 via-violet-400/5 to-transparent rounded-full blur-[140px] animate-pulse" />
      <div
        className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-gradient-radial from-indigo-500/10 via-indigo-400/5 to-transparent rounded-full blur-[160px] animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-radial from-cyan-400/5 via-transparent to-transparent rounded-full blur-[100px]" />
    </div>
  );
}
