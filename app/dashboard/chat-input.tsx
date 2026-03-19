"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Suggestions
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  "A recipe book with favorites",
  "Fitness tracker with charts",
  "Task manager with tags",
  "E-commerce storefront",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  disabled = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) onSubmit();
    }
  };

  return (
    <motion.div layout>
      <div className="relative">
        {/* Subtle glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600/20 via-indigo-600/15 to-purple-600/20 rounded-2xl blur-lg opacity-60" />

        <div className="relative rounded-2xl border border-black/[0.08] dark:border-white/[0.12] bg-white/80 dark:bg-background/75 backdrop-blur-3xl shadow-xl overflow-hidden ring-1 ring-black/[0.03] dark:ring-white/[0.05] ring-inset">
          <div className="p-4">
            <div className="flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the app you want to build..."
                rows={1}
                autoFocus
                disabled={disabled}
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 text-base resize-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 border-none min-h-[44px] max-h-[120px] py-2 leading-relaxed"
              />
              <Button
                onClick={onSubmit}
                disabled={!input.trim() || disabled}
                size="icon"
                variant="gradient"
                className="h-10 w-10 rounded-xl shrink-0 transition-all hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105 disabled:opacity-20 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Suggestion chips */}
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                onClick={() => onInputChange(s)}
                className="text-xs px-3 py-1.5 rounded-full border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
