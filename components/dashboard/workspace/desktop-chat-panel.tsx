"use client";

import { RefObject } from "react";
import { Sparkles, Bot, Loader2, ChevronRight, Send, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/types";
import type { Plan } from "@/types";
import { ChatBubble } from "./chat-bubble";
import { ActivityFeed } from "./streaming-code-display";
import type { ActivityItem } from "@/stores/project-store-types";
import { CreditsGate } from "./credits-gate";
import { Card } from "@/components/ui/card";

interface DesktopChatPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  progressMessage: string | null;
  streamText: string;
  generationPhase: string | null;
  activityItems: ActivityItem[];
  remainingCredits: number;
  platform: string;
  quickPrompts: string[];
  promptsLabel: string;
  input: string;
  setInput: (val: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  openFileInEditor: (filePath: string) => void;
  onCancel?: () => void;
  isCanceling?: boolean;
  canGenerate?: boolean;
  userPlan?: Plan | null;
  scrollRef: RefObject<HTMLDivElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  showPlatformBadge?: boolean;
}

export function DesktopChatPanel({
  messages,
  isGenerating,
  progressMessage,
  streamText,
  generationPhase,
  activityItems,
  remainingCredits,
  platform,
  quickPrompts,
  promptsLabel,
  input,
  setInput,
  handleSubmit,
  handleKeyDown,
  openFileInEditor,
  onCancel,
  isCanceling = false,
  canGenerate = true,
  userPlan,
  scrollRef,
  textareaRef,
  showPlatformBadge = false,
}: DesktopChatPanelProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 relative">
            <Sparkles className="h-4 w-4 text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">
              Rulxy Agent
            </span>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-amber-400" />
              <span className="text-xs text-slate-500">
                {remainingCredits.toLocaleString()} credits
              </span>
            </div>
          </div>
        </div>
        {showPlatformBadge && (
          <Badge
            variant="outline"
            className="text-xs liquid-glass-pill px-2.5 py-0.5"
          >
            {platform}
          </Badge>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="py-8">
              <div className="text-center mb-6">
                <div className="relative inline-flex p-5 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 mb-5 shadow-lg shadow-violet-500/10">
                  <Sparkles className="h-8 w-8 text-violet-400" />
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  What do you want to build?
                </h3>
                <p className="text-sm text-slate-400">
                  Describe your {platform} app
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">
                  {promptsLabel}
                </p>
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="w-full text-left p-3 rounded-2xl liquid-glass liquid-glass-hover liquid-shadow text-sm text-slate-300 hover:text-white flex items-center gap-2 group transition-all duration-300"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-violet-400 transition-colors" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, idx) => (
              <ChatBubble
                key={message.id || `msg-${idx}`}
                message={message}
                onOpenFile={openFileInEditor}
                onViewCode={
                  message.codeChanges
                    ? () => {
                        const files = Object.keys(message.codeChanges || {});
                        if (files[0]) openFileInEditor(files[0]);
                      }
                    : undefined
                }
              />
            ))
          )}
          {isGenerating && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shrink-0 shadow-lg shadow-violet-500/20 relative">
                <Bot className="h-4 w-4 text-white" />
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
              </div>
              <div className="flex-1 rounded-2xl rounded-tl-sm liquid-glass liquid-shadow px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-violet-400 tracking-wide uppercase">
                    Rulxy Agent
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Working
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                  <span>{progressMessage || "Generating..."}</span>
                </div>
                <ActivityFeed items={activityItems} streamText={streamText} />
                <div className="mt-2 flex items-center justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={!onCancel || isCanceling}
                    className="h-8 px-3 text-xs text-slate-300 hover:text-white liquid-glass-pill liquid-glass-hover rounded-xl"
                  >
                    {isCanceling ? "Canceling..." : "Cancel"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="relative liquid-glass rounded-2xl liquid-shadow-lg">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            className="min-h-[52px] max-h-[120px] pr-12 resize-none bg-transparent border-0 text-white placeholder:text-slate-500 rounded-2xl focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isGenerating || !canGenerate}
          />
          <Button
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8 bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 rounded-xl liquid-glow-hover transition-all duration-300"
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isGenerating || !canGenerate}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!canGenerate && <CreditsGate plan={userPlan} className="mt-2" />}
        {canGenerate && (
          <p className="mt-2 text-xs text-slate-500">Press Enter to send</p>
        )}
      </div>
    </Card>
  );
}
