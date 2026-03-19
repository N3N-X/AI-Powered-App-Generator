"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  PhoneForwarded,
  PhoneOutgoing,
  Clock,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { StatCard, Pagination, formatDuration } from "./shared-components";
import type { CallLog, CallStats } from "./types";

interface CallsTabProps {
  calls: CallLog[];
  callStats: CallStats | null;
  callPage: number;
  callTotalPages: number;
  onPageChange: (p: number) => void;
}

export function CallsTab({
  calls,
  callStats,
  callPage,
  callTotalPages,
  onPageChange,
}: CallsTabProps) {
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Call Stats */}
      {callStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Calls"
            value={callStats.totalCalls}
            icon={<Phone className="h-4 w-4 text-slate-500" />}
          />
          <StatCard
            title="Forwarded"
            value={callStats.forwardedCalls}
            icon={<PhoneForwarded className="h-4 w-4 text-green-500" />}
          />
          <StatCard
            title="Today"
            value={callStats.callsToday}
            icon={<Activity className="h-4 w-4 text-violet-500" />}
          />
          <StatCard
            title="Avg Duration"
            value={formatDuration(callStats.avgDuration)}
            icon={<Clock className="h-4 w-4 text-amber-500" />}
          />
        </div>
      )}

      {/* Call Logs */}
      <Card className="liquid-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Call Logs
          </CardTitle>
          <CardDescription>Incoming and outgoing calls</CardDescription>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">
              No calls recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {calls.map((call) => (
                <div key={call.id} className="rounded-lg bg-white/5">
                  <button
                    className="w-full flex items-center justify-between p-4 text-left"
                    onClick={() =>
                      setExpandedCall(expandedCall === call.id ? null : call.id)
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center">
                        {call.direction === "outgoing" ? (
                          <PhoneOutgoing className="h-4 w-4 text-violet-400" />
                        ) : (
                          <Phone className="h-4 w-4 text-violet-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium font-mono text-sm">
                          {call.caller_number || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(call.created_at).toLocaleString()}
                          {call.direction === "outgoing" && (
                            <span className="ml-2 text-violet-400">
                              Outgoing
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {call.user_plan && (
                        <Badge
                          variant={
                            call.user_plan === "ELITE"
                              ? "premium"
                              : call.user_plan === "PRO"
                                ? "success"
                                : "secondary"
                          }
                        >
                          {call.user_plan}
                        </Badge>
                      )}
                      <Badge
                        variant={
                          call.forwarded
                            ? "success"
                            : call.status === "completed"
                              ? "secondary"
                              : call.status === "failed"
                                ? "destructive"
                                : "secondary"
                        }
                      >
                        {call.forwarded
                          ? "Forwarded"
                          : call.outcome || call.status}
                      </Badge>
                      <span className="text-xs text-slate-500 w-12 text-right">
                        {formatDuration(call.duration_seconds)}
                      </span>
                      {expandedCall === call.id ? (
                        <ChevronUp className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {expandedCall === call.id && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3">
                      {/* Call Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
                        <div className="bg-white/5 rounded-lg p-2">
                          <span className="text-slate-500 block">Call SID</span>
                          <span className="text-slate-300 font-mono truncate block">
                            {call.call_sid}
                          </span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <span className="text-slate-500 block">Duration</span>
                          <span className="text-slate-300">
                            {formatDuration(call.duration_seconds) || "N/A"}
                          </span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <span className="text-slate-500 block">Status</span>
                          <span className="text-slate-300">{call.status}</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <span className="text-slate-500 block">Outcome</span>
                          <span className="text-slate-300">
                            {call.outcome || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Conversation */}
                      <div className="space-y-2">
                        <span className="text-xs text-slate-500 font-medium">
                          Conversation
                        </span>
                        {call.conversation?.length > 0 ? (
                          call.conversation.map((entry, i) => (
                            <div
                              key={i}
                              className={`flex ${entry.role === "agent" ? "justify-start" : "justify-end"}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                  entry.role === "agent"
                                    ? "bg-violet-500/20 text-violet-200"
                                    : "bg-white/10 text-slate-300"
                                }`}
                              >
                                <span className="text-xs font-medium block mb-1 opacity-60">
                                  {entry.role === "agent"
                                    ? "AI Agent"
                                    : "Caller"}
                                </span>
                                {entry.text}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-500 text-sm py-2">
                            No conversation recorded (caller may have hung up
                            before speaking)
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <Pagination
                page={callPage}
                totalPages={callTotalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
