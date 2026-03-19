"use client";

import { Loader2, Ticket, Check, X } from "lucide-react";
import type { InviteCode } from "./page";

interface InviteCodesTableProps {
  codes: InviteCode[];
  isLoading: boolean;
}

export function InviteCodesTable({ codes, isLoading }: InviteCodesTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (codes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-slate-400">
        <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No invite codes found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-white/5">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">
              Code
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">
              Owner
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">
              Type
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">
              Uses
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
          {codes.map((code) => (
            <tr
              key={code.id}
              className="hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                {code.code}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                {code.owner_email || "System"}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-400">
                  {code.code_type}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                {code.times_used}
                {code.max_uses ? ` / ${code.max_uses}` : ""}
              </td>
              <td className="px-4 py-3">
                {code.is_active ? (
                  <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Check className="h-4 w-4" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                    <X className="h-4 w-4" />
                    Inactive
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                {new Date(code.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
