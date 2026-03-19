import Link from "next/link";
import { Sparkles, Hammer, Globe } from "lucide-react";

interface QuickLinksProps {
  visible: boolean;
}

export function QuickLinks({ visible }: QuickLinksProps) {
  if (!visible) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Link
        href="/dashboard"
        className="flex items-center gap-3 p-4 liquid-glass-card liquid-glass-hover hover:border-violet-500/30 transition-all group"
      >
        <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            Generate
          </p>
          <p className="text-xs text-slate-500">Create a new app</p>
        </div>
      </Link>
      <Link
        href="/dashboard/builds"
        className="flex items-center gap-3 p-4 liquid-glass-card liquid-glass-hover hover:border-violet-500/30 transition-all group"
      >
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Hammer className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            Builds
          </p>
          <p className="text-xs text-slate-500">View build history</p>
        </div>
      </Link>
      <Link
        href="/dashboard/content"
        className="flex items-center gap-3 p-4 liquid-glass-card liquid-glass-hover hover:border-violet-500/30 transition-all group"
      >
        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
          <Globe className="h-5 w-5 text-green-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            App Manager
          </p>
          <p className="text-xs text-slate-500">Manage data & services</p>
        </div>
      </Link>
    </div>
  );
}
