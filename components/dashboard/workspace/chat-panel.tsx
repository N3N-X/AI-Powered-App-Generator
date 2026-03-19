"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Bot, Loader2, ChevronRight } from "lucide-react";
import { ChatMessage } from "@/types";
import { ChatBubble } from "./chat-bubble";
import { ActivityFeed } from "./streaming-code-display";
import type { ActivityItem } from "@/stores/project-store-types";
import type { Plan } from "@/types";
import { CreditsGate } from "./credits-gate";
import { GenerationNotice } from "./generation-notice";

interface ChatHeaderProps {
  remainingCredits: number;
  /** Extra className for the outer wrapper (e.g. mobile glass styling). */
  wrapperClassName?: string;
  /** Border color of the status dot's outer ring. */
  borderColor?: string;
}

export function ChatHeader({
  remainingCredits,
  wrapperClassName,
  borderColor = "border-background",
}: ChatHeaderProps) {
  return (
    <div className={wrapperClassName}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 relative">
          <Sparkles className="h-4 w-4 text-white" />
          <div
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 ${borderColor}`}
          />
        </div>
        <div>
          <span className="text-sm font-semibold text-white">Rulxy Agent</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">
              Online &middot; {remainingCredits.toLocaleString()} credits
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  progressMessage: string | null;
  generationNotice?: string | null;
  streamText: string;
  generationPhase: string | null;
  activityItems: ActivityItem[];
  quickPrompts: string[];
  promptsLabel: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onSetInput: (value: string) => void;
  onViewCode?: (files: Record<string, string>) => void;
  onCancel?: () => void;
  isCanceling?: boolean;
  /** Smaller variant for mobile. */
  compact?: boolean;
}

export function ChatMessages({
  messages,
  isGenerating,
  progressMessage,
  generationNotice,
  streamText,
  generationPhase,
  activityItems,
  quickPrompts,
  promptsLabel,
  scrollRef,
  onSetInput,
  onViewCode,
  onCancel,
  isCanceling = false,
  compact = false,
}: ChatMessagesProps) {
  const pad = compact ? "p-3 space-y-3" : "p-4 space-y-4";
  const iconSize = compact ? "h-7 w-7" : "h-8 w-8";
  const innerIconSize = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  const promptSlice = compact ? quickPrompts.slice(0, 3) : quickPrompts;

  return (
    <ScrollArea className="flex-1 relative" ref={scrollRef}>
      <div className={pad}>
        {isGenerating && generationNotice && (
          <GenerationNotice message={generationNotice} />
        )}
        {messages.length === 0 ? (
          <div className={compact ? "py-6 text-center" : "py-8"}>
            <div className={compact ? "text-center" : "text-center mb-8"}>
              <div
                className={`relative inline-flex ${compact ? "p-4" : "p-5"} rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 ${compact ? "mb-4" : "mb-5"} shadow-lg shadow-violet-500/10`}
              >
                <Sparkles
                  className={
                    compact
                      ? "h-6 w-6 text-violet-400"
                      : "h-8 w-8 text-violet-400"
                  }
                />
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
              </div>
              <h3
                className={`${compact ? "text-base" : "text-lg"} font-semibold text-white ${compact ? "mb-1" : "mb-2"}`}
              >
                What do you want to build?
              </h3>
              <p
                className={`${compact ? "text-xs" : "text-sm"} text-slate-400 ${compact ? "mb-4" : ""}`}
              >
                Describe your app and Rulxy Agent will build it
              </p>
            </div>

            <div className={compact ? "space-y-2 px-2" : "space-y-2"}>
              {!compact && (
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">
                  {promptsLabel}
                </p>
              )}
              {promptSlice.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onSetInput(prompt)}
                  className={
                    compact
                      ? "w-full text-left p-3 rounded-2xl liquid-glass liquid-glass-hover liquid-shadow text-xs text-slate-300 hover:text-white flex items-center gap-2 transition-all duration-300"
                      : "w-full text-left p-3 rounded-2xl liquid-glass liquid-glass-hover liquid-shadow text-sm text-slate-300 hover:text-white flex items-center gap-2 group transition-all duration-300"
                  }
                >
                  <ChevronRight
                    className={
                      compact
                        ? "h-3 w-3 text-violet-400"
                        : "h-4 w-4 text-slate-400 group-hover:text-violet-400 transition-colors"
                    }
                  />
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
              onViewCode={
                message.codeChanges
                  ? () => onViewCode?.(message.codeChanges!)
                  : undefined
              }
            />
          ))
        )}

        {isGenerating && (
          <div className={`flex items-start ${compact ? "gap-2" : "gap-3"}`}>
            <div
              className={`flex ${iconSize} items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shrink-0 relative`}
            >
              <Bot className={`${innerIconSize} text-white`} />
              {!compact && (
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900 animate-pulse" />
              )}
            </div>
            <div
              className={`flex-1 rounded-2xl ${compact ? "liquid-glass px-3 py-2" : "rounded-tl-sm liquid-glass liquid-shadow px-4 py-3"}`}
            >
              {!compact && (
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-violet-400 tracking-wide uppercase">
                    Rulxy Agent
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Working
                  </span>
                </div>
              )}
              <div
                className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"} text-slate-400`}
              >
                <Loader2
                  className={`${compact ? "h-3 w-3" : "h-4 w-4"} animate-spin text-violet-400`}
                />
                <span>{progressMessage || "Generating..."}</span>
              </div>
              <ActivityFeed
                items={activityItems}
                streamText={streamText}
                compact={compact}
              />
              <div className="mt-2 flex items-center justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={!onCancel || isCanceling}
                  className={
                    compact
                      ? "h-7 px-2 text-[10px] text-slate-300 hover:text-white"
                      : "h-8 px-3 text-xs text-slate-300 hover:text-white"
                  }
                >
                  {isCanceling ? "Canceling..." : "Cancel"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  canGenerate?: boolean;
  plan?: Plan | null;
  /** Compact variant for mobile. */
  compact?: boolean;
}

export function ChatInput({
  input,
  setInput,
  onKeyDown,
  onSubmit,
  isGenerating,
  textareaRef,
  canGenerate = true,
  plan,
  compact = false,
}: ChatInputProps) {
  return (
    <div
      className={
        compact ? "p-2 relative" : "p-4 border-t border-white/[0.06] relative"
      }
    >
      <div
        className={
          compact
            ? "liquid-glass rounded-2xl liquid-shadow-lg relative"
            : "relative liquid-glass rounded-2xl liquid-shadow-lg"
        }
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe what you want to build..."
          className={
            compact
              ? "min-h-[44px] max-h-[100px] pr-10 resize-none bg-transparent border-0 text-white text-sm placeholder:text-slate-500 rounded-2xl focus-visible:ring-0 focus-visible:ring-offset-0"
              : "min-h-[52px] max-h-[120px] pr-12 resize-none bg-transparent border-0 text-white placeholder:text-slate-500 rounded-2xl focus-visible:ring-0 focus-visible:ring-offset-0"
          }
          disabled={isGenerating || !canGenerate}
        />
        <Button
          size="icon"
          className={
            compact
              ? "absolute right-2 bottom-2 h-8 w-8 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl liquid-glow-hover transition-all duration-500"
              : "absolute right-2 bottom-2 h-8 w-8 bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 rounded-xl liquid-glow-hover transition-all duration-300"
          }
          onClick={onSubmit}
          disabled={!input.trim() || isGenerating || !canGenerate}
        >
          <Send className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </Button>
      </div>
      {!canGenerate && (
        <CreditsGate plan={plan} compact={compact} className="mt-2" />
      )}
      {!compact && canGenerate && (
        <p className="mt-2 text-[11px] text-slate-500">Press Enter to send</p>
      )}
    </div>
  );
}
