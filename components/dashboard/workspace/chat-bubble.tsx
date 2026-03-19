"use client";

import { ChatMessage } from "@/types";
import { User, Bot, FileCode2, Code2, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ChatBubble({
  message,
  onViewCode,
  onOpenFile,
}: {
  message: ChatMessage;
  onViewCode?: () => void;
  onOpenFile?: (path: string) => void;
}) {
  const isUser = message.role === "user";
  const changedFiles = message.codeChanges
    ? Object.keys(message.codeChanges)
    : [];

  if (isUser) {
    return (
      <div className="flex items-start gap-3 flex-row-reverse">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg shadow-slate-900/30 ring-1 ring-white/[0.08]">
          <User className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 max-w-[85%] ml-auto">
          <div className="rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white bg-gradient-to-br from-violet-600/30 to-indigo-600/20 border border-violet-500/20 shadow-lg shadow-violet-500/5 backdrop-blur-xl">
            <p className="whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 ring-1 ring-violet-400/20 relative">
        <Bot className="h-4 w-4 text-white" />
        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-violet-400 tracking-wide">
            Rulxy Agent
          </span>
          <Sparkles className="h-3 w-3 text-violet-400/50" />
        </div>
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200 liquid-glass liquid-shadow">
          <p className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>

          {changedFiles.length > 0 && (
            <FileChangesList
              files={changedFiles}
              onOpenFile={onOpenFile}
              onViewCode={onViewCode}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function FileChangesList({
  files,
  onOpenFile,
  onViewCode,
}: {
  files: string[];
  onOpenFile?: (path: string) => void;
  onViewCode?: () => void;
}) {
  const maxShow = 8;
  const shown = files.slice(0, maxShow);
  const remaining = files.length - maxShow;

  return (
    <div className="mt-3 pt-3 border-t border-white/[0.06]">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-md bg-emerald-500/20 flex items-center justify-center">
            <Plus className="h-2.5 w-2.5 text-emerald-400" />
          </div>
          <span className="text-xs text-emerald-400 font-medium">
            {files.length} file{files.length !== 1 ? "s" : ""} changed
          </span>
        </div>
        {onViewCode && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-slate-400 hover:text-white ml-auto liquid-glass-pill liquid-glass-hover rounded-lg px-2"
            onClick={onViewCode}
          >
            <Code2 className="h-3 w-3 mr-1" />
            View Code
          </Button>
        )}
      </div>
      <div className="space-y-0.5 rounded-xl liquid-glass p-1">
        {shown.map((file) => (
          <button
            key={file}
            onClick={() => onOpenFile?.(file)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all duration-200 text-left group"
          >
            <FileCode2 className="h-3 w-3 text-violet-400/50 group-hover:text-violet-400 shrink-0 transition-colors" />
            <span className="truncate font-mono">{file}</span>
          </button>
        ))}
        {remaining > 0 && (
          <span className="block px-2.5 py-1 text-xs text-slate-600">
            +{remaining} more file{remaining !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
