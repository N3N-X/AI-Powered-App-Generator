"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { StatCard, Pagination } from "./shared-components";
import type { MessageLog, MessageStats } from "./types";

interface MessagesTabProps {
  messages: MessageLog[];
  msgStats: MessageStats | null;
  msgPage: number;
  msgTotalPages: number;
  onPageChange: (p: number) => void;
}

export function MessagesTab({
  messages,
  msgStats,
  msgPage,
  msgTotalPages,
  onPageChange,
}: MessagesTabProps) {
  return (
    <div className="space-y-8">
      {/* Message Stats */}
      {msgStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Messages"
            value={msgStats.totalMessages}
            icon={<MessageSquare className="h-4 w-4 text-slate-500" />}
          />
          <StatCard
            title="Incoming"
            value={msgStats.incoming}
            icon={<ArrowDownLeft className="h-4 w-4 text-blue-500" />}
          />
          <StatCard
            title="Outgoing"
            value={msgStats.outgoing}
            icon={<ArrowUpRight className="h-4 w-4 text-green-500" />}
          />
          <StatCard
            title="Today"
            value={msgStats.messagesToday}
            icon={<Activity className="h-4 w-4 text-violet-500" />}
          />
        </div>
      )}

      {/* Message Logs */}
      <Card className="liquid-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Logs
          </CardTitle>
          <CardDescription>
            Incoming and outgoing SMS messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">
              No messages yet
            </p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className="rounded-lg bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          msg.direction === "incoming"
                            ? "bg-blue-500/20"
                            : "bg-green-500/20"
                        }`}
                      >
                        {msg.direction === "incoming" ? (
                          <ArrowDownLeft className="h-4 w-4 text-blue-400" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-mono text-sm">
                            {msg.direction === "incoming"
                              ? msg.from_number
                              : msg.to_number}
                          </span>
                          <Badge
                            variant={
                              msg.direction === "incoming"
                                ? "secondary"
                                : "success"
                            }
                          >
                            {msg.direction}
                          </Badge>
                          {msg.user_plan && (
                            <Badge
                              variant={
                                msg.user_plan === "ELITE"
                                  ? "premium"
                                  : msg.user_plan === "PRO"
                                    ? "success"
                                    : "secondary"
                              }
                            >
                              {msg.user_plan}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 break-words">
                          {msg.body}
                        </p>
                        {msg.ai_response && (
                          <div className="mt-2 p-2 rounded bg-violet-500/10 border border-violet-500/20">
                            <span className="text-xs text-violet-400 font-medium">
                              AI Reply:
                            </span>
                            <p className="text-sm text-violet-200 mt-1">
                              {msg.ai_response}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}

              <Pagination
                page={msgPage}
                totalPages={msgTotalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
