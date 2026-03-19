"use client";

import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Mail, Clock, UserCheck } from "lucide-react";
import type { AccessRequest } from "./page";

interface AccessRequestsTableProps {
  requests: AccessRequest[];
  isLoading: boolean;
  processingId: string | null;
  onApprove: (request: AccessRequest) => void;
  onReject: (request: AccessRequest) => void;
}

export function AccessRequestsTable({
  requests,
  isLoading,
  processingId,
  onApprove,
  onReject,
}: AccessRequestsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-slate-400">
        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No access requests found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-white/5">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">
              Email
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">
              Requested
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">
              Invite Code
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">
              Signed Up
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
          {requests.map((request) => (
            <tr
              key={request.id}
              className="hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                {request.email}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                {new Date(request.requested_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={request.status} />
              </td>
              <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-slate-400">
                {request.invite_code_sent || "—"}
              </td>
              <td className="px-4 py-3">
                {request.signed_up_at ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400">
                    <UserCheck className="h-3 w-3" />
                    {new Date(request.signed_up_at).toLocaleDateString()}
                  </span>
                ) : request.status === "approved" ? (
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    Not yet
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    —
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {request.status === "pending" && (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApprove(request)}
                      disabled={processingId === request.id}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-500/10"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReject(request)}
                      disabled={processingId === request.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: AccessRequest["status"] }) {
  const styles = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400",
    approved:
      "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status === "pending" && <Clock className="h-3 w-3" />}
      {status === "approved" && <Check className="h-3 w-3" />}
      {status === "rejected" && <X className="h-3 w-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
