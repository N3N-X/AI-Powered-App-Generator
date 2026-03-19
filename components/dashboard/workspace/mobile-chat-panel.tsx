"use client";

import { RefObject } from "react";
import { Sparkles, Bot, Loader2, ChevronRight, Send } from "lucide-react";
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

interface MobileChatPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  progressMessage: string | null;
  streamText: string;
  generationPhase: string | null;
  activityItems: ActivityItem[];
  remainingCredits: number;
  platform: string;
  quickPrompts: string[];
  input: string;
  setInput: (val: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  openFileInEditor: (filePath: string) => void;
  setMobileSimpleTab: (tab: "chat" | "preview" | "code") => void;
  onCancel?: () => void;
  isCanceling?: boolean;
  canGenerate?: boolean;
  userPlan?: Plan | null;
  scrollRef: RefObject<HTMLDivElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export function MobileChatPanel({
  messages,
  isGenerating,
  progressMessage,
  streamText,
  generationPhase,
  activityItems,
  remainingCredits,
  platform,
  quickPrompts,
  input,
  setInput,
  handleSubmit,
  handleKeyDown,
  openFileInEditor,
  setMobileSimpleTab,
  onCancel,
  isCanceling = false,
  canGenerate = true,
  userPlan,
  scrollRef,
  textareaRef,
}: MobileChatPanelProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-violet-600/[0.04] to-transparent pointer-events-none" />
      {/* Chat Header */}
      <div className="liquid-glass mx-2 mt-2 rounded-2xl h-14 px-4 flex items-center justify-between shrink-0 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center liquid-glow-hover transition-all duration-500 relative">
            <Sparkles className="h-4 w-4 text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">
              Rulxy Agent
            </span>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-500">
                {remainingCredits.toLocaleString()} credits
              </span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {platform}
        </Badge>
      </div>

      <ScrollArea className="flex-1 relative" ref={scrollRef}>
        <div className="p-3 space-y-3">
          {messages.length === 0 ? (
            <div className="py-6 text-center">
              <div className="relative inline-flex p-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 mb-4 liquid-shadow">
                <Sparkles className="h-6 w-6 text-violet-400" />
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                What do you want to build?
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Describe your {platform} app
              </p>
              <div className="space-y-2 px-2">
                {quickPrompts.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="w-full text-left p-3 rounded-2xl liquid-glass liquid-glass-hover liquid-shadow text-xs text-slate-300 hover:text-white flex items-center gap-2 transition-all duration-300"
                  >
                    <ChevronRight className="h-3 w-3 text-violet-400" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                onOpenFile={(path) => {
                  openFileInEditor(path);
                  setMobileSimpleTab("code");
                }}
                onViewCode={
                  message.codeChanges
                    ? () => {
                        const files = Object.keys(message.codeChanges || {});
                        if (files[0]) {
                          openFileInEditor(files[0]);
                          setMobileSimpleTab("code");
                        }
                      }
                    : undefined
                }
              />
            ))
          )}
          {isGenerating && (
            <div className="flex items-start gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shrink-0">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1 rounded-2xl liquid-glass px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
                  <span>{progressMessage || "Generating..."}</span>
                </div>
                <ActivityFeed
                  items={activityItems}
                  streamText={streamText}
                  compact
                />
                <div className="mt-2 flex items-center justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={!onCancel || isCanceling}
                    className="h-7 px-2 text-[10px] text-slate-300 hover:text-white"
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
      <div className="p-2 relative">
        <div className="liquid-glass rounded-2xl liquid-shadow-lg relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            className="min-h-[44px] max-h-[100px] pr-10 resize-none bg-transparent border-0 text-white text-sm placeholder:text-slate-500 rounded-2xl focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isGenerating || !canGenerate}
          />
          <Button
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl liquid-glow-hover transition-all duration-500"
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isGenerating || !canGenerate}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        {!canGenerate && (
          <CreditsGate plan={userPlan} compact className="mt-2" />
        )}
      </div>
    </div>
  );
}
