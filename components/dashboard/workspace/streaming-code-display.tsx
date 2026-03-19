"use client";

import { useRef, useEffect, useState } from "react";
import {
  Loader2,
  Check,
  Brain,
  FileEdit,
  Terminal,
  MessageSquare,
  ListChecks,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/stores/project-store-types";

interface ActivityFeedProps {
  items: ActivityItem[];
  streamText?: string;
  compact?: boolean;
}

/** Structured activity feed shown during generation. */
export function ActivityFeed({
  items,
  streamText,
  compact,
}: ActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items, streamText]);

  if (items.length === 0 && !streamText) return null;

  return (
    <div
      ref={scrollRef}
      className={cn(
        "mt-2 space-y-1 overflow-y-auto",
        compact ? "max-h-[180px]" : "max-h-[260px]",
      )}
    >
      {items.map((item) => (
        <ActivityRow key={item.id} item={item} compact={compact} />
      ))}
      {streamText && (
        <div
          className={cn(
            "rounded-xl liquid-glass px-3 py-2",
            compact ? "text-xs" : "text-[13px]",
          )}
        >
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-6 font-mono">
            {streamText.slice(-1500)}
          </p>
        </div>
      )}
    </div>
  );
}

function ActivityRow({
  item,
  compact,
}: {
  item: ActivityItem;
  compact?: boolean;
}) {
  const isActive = item.status === "active";
  const isTodo = item.type === "todo_list";
  const iconSize = compact ? "h-3 w-3" : "h-3.5 w-3.5";
  const textSize = compact ? "text-xs" : "text-[13px]";
  const [expanded, setExpanded] = useState(isActive);

  useEffect(() => {
    if (item.status === "active") {
      setExpanded(true);
    }
  }, [item.status]);

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl px-2.5 py-1.5 transition-all duration-200",
        isActive
          ? "liquid-glass border border-violet-500/15 shadow-sm shadow-violet-500/5"
          : "hover:bg-white/[0.03]",
      )}
    >
      <div className="flex items-center gap-2">
        <StatusIcon type={item.type} isActive={isActive} className={iconSize} />
        <span
          className={cn(
            textSize,
            "truncate flex-1",
            isActive ? "text-slate-200" : "text-slate-500",
          )}
        >
          {item.label}
        </span>
        {isTodo && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className={cn(
              "shrink-0 rounded p-0.5 transition-colors",
              isActive
                ? "text-violet-300/80 hover:text-violet-200"
                : "text-slate-500 hover:text-slate-300",
            )}
            aria-label={expanded ? "Collapse plan" : "Expand plan"}
          >
            {expanded ? (
              <ChevronDown className={iconSize} />
            ) : (
              <ChevronRight className={iconSize} />
            )}
          </button>
        )}
        {!isActive && (
          <Check className={cn(iconSize, "text-emerald-500/60 shrink-0")} />
        )}
        {isActive && (
          <Loader2
            className={cn(iconSize, "text-violet-400 animate-spin shrink-0")}
          />
        )}
      </div>
      {item.detail && (!isTodo || expanded) && (
        <pre
          className={cn(
            "whitespace-pre-wrap font-normal text-slate-400",
            compact ? "text-[10px] line-clamp-3" : "text-[12px] line-clamp-5",
          )}
        >
          {item.detail}
        </pre>
      )}
    </div>
  );
}

function StatusIcon({
  type,
  isActive,
  className,
}: {
  type: ActivityItem["type"];
  isActive: boolean;
  className?: string;
}) {
  const color = isActive ? "text-violet-400" : "text-slate-600";

  switch (type) {
    case "thinking":
      return <Brain className={cn(className, color)} />;
    case "file_edit":
    case "file_read":
      return <FileEdit className={cn(className, color)} />;
    case "command":
      return <Terminal className={cn(className, color)} />;
    case "message":
      return <MessageSquare className={cn(className, color)} />;
    case "todo_list":
      return <ListChecks className={cn(className, color)} />;
    default:
      return <Loader2 className={cn(className, color)} />;
  }
}
