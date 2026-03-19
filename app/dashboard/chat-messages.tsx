"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Loader2 } from "lucide-react";
import { Platform } from "@/types";

// ---------------------------------------------------------------------------
// Platform options
// ---------------------------------------------------------------------------

import { Globe, Apple, Smartphone } from "lucide-react";

export const PLATFORM_OPTIONS: {
  value: Platform;
  label: string;
  icon: typeof Globe;
  desc: string;
  color: string;
}[] = [
  {
    value: "WEB",
    label: "Web",
    icon: Globe,
    desc: "React web app",
    color: "from-blue-500 to-cyan-500",
  },
  {
    value: "IOS",
    label: "iOS",
    icon: Apple,
    desc: "iPhone & iPad",
    color: "from-pink-500 to-rose-500",
  },
  {
    value: "ANDROID",
    label: "Android",
    icon: Smartphone,
    desc: "Android devices",
    color: "from-green-500 to-emerald-500",
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatMessagesProps {
  userPrompt: string;
  chatState: "idle" | "awaiting_platform" | "creating";
  onSelectPlatform: (platform: Platform) => void;
  disabled?: boolean;
  onDisabledClick?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatMessages({
  userPrompt,
  chatState,
  onSelectPlatform,
  disabled = false,
  onDisabledClick,
}: ChatMessagesProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatState]);

  if (chatState === "idle") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 mb-6"
    >
      {/* User message */}
      {userPrompt && (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-violet-500/15 border border-violet-500/20 px-4 py-3">
            <p className="text-sm text-gray-700 dark:text-white leading-relaxed">
              {userPrompt}
            </p>
          </div>
        </div>
      )}

      {/* Bot response — platform selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-start gap-3"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shrink-0 shadow-lg shadow-violet-500/25">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 space-y-4">
          <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed pt-1.5">
            Great idea! Which platform would you like to build for?
          </p>

          {chatState === "awaiting_platform" ? (
            <div className="grid grid-cols-3 gap-3">
              {PLATFORM_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (disabled) {
                      onDisabledClick?.();
                      return;
                    }
                    onSelectPlatform(opt.value);
                  }}
                  disabled={disabled}
                  className={`group relative flex flex-col items-center gap-2.5 p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] transition-all overflow-hidden ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-violet-500/40"}`}
                >
                  {/* Hover gradient */}
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${opt.color}`}
                  />
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${opt.color} shadow-lg`}
                  >
                    <opt.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {opt.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-500">
                    {opt.desc}
                  </span>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
              <span className="text-sm text-gray-500 dark:text-slate-400">
                Creating your project...
              </span>
            </div>
          )}
        </div>
      </motion.div>

      <div ref={chatEndRef} />
    </motion.div>
  );
}
