"use client";

import { Shield, Crown, CheckCircle2 } from "lucide-react";

interface WebBrandingSectionProps {
  canRemoveBranding: boolean;
}

export function WebBrandingSection({
  canRemoveBranding,
}: WebBrandingSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-200 border-b border-white/10 pb-2 flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Branding
      </h4>
      <div>
        <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
          Remove &quot;Built with Rulxy&quot; badge
          {!canRemoveBranding && (
            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-medium">
              <Crown className="h-2.5 w-2.5" />
              PRO
            </span>
          )}
        </label>
        {canRemoveBranding ? (
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-500/20 bg-green-500/5 text-xs text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Rulxy branding is removed from your web app
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-slate-400">
              Remove the &quot;Built with Rulxy&quot; badge from your published
              web app. Available on Pro and Elite plans.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
