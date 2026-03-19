"use client";

import { Button } from "@/components/ui/button";
import { Github, Settings } from "lucide-react";

export function NotConnectedView() {
  return (
    <div className="liquid-glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Github className="h-4 w-4" />
          GitHub Integration
        </h3>
      </div>
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Github className="h-6 w-6 text-slate-400" />
        </div>
        <h4 className="text-sm font-medium text-slate-300 mb-2">
          GitHub Not Connected
        </h4>
        <p className="text-xs text-slate-500 mb-6 max-w-sm">
          Connect your GitHub account to push your code to a repository. You can
          create new repos or push to existing ones.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            window.location.href = "/dashboard/settings?tab=integrations";
          }}
        >
          <Settings className="h-4 w-4" />
          Connect in Settings
        </Button>
      </div>
    </div>
  );
}
