"use client";

import { AlertTriangle } from "lucide-react";

interface GenerationNoticeProps {
  message?: string | null;
}

export function GenerationNotice({ message }: GenerationNoticeProps) {
  return (
    <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-amber-100">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300 mt-0.5" />
      <div>
        <p className="text-xs font-semibold">Queueing under heavy load...</p>
        {message && (
          <p className="text-[11px] text-amber-100/80">{message}</p>
        )}
      </div>
    </div>
  );
}
