"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { AppUser, Pagination } from "./types";
import { formatDate } from "./types";

interface UsersTabProps {
  projectId: string;
}

export function UsersTab({ projectId }: UsersTabProps) {
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [usersPagination, setUsersPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [usersSearch, setUsersSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);

  const fetchUsers = useCallback(
    async (page = 1) => {
      if (!projectId) return;
      setUsersLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (usersSearch) params.set("search", usersSearch);
        const res = await fetch(`/api/projects/${projectId}/users?${params}`);
        if (res.ok) {
          const data = await res.json();
          setAppUsers(data.users || []);
          setUsersPagination(data.pagination);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setUsersLoading(false);
      }
    },
    [projectId, usersSearch],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="liquid-glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by email or name..."
            value={usersSearch}
            onChange={(e) => setUsersSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            className="pl-9 h-8 text-sm bg-white/5 border-white/10"
          />
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => fetchUsers(usersPagination.page)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-320px)] md:h-[500px]">
        {usersLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : appUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Users className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">No users have signed up yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-500 uppercase">
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Verified</th>
                  <th className="text-left p-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {appUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                          {u.name?.[0]?.toUpperCase() || u.email[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-200">{u.name || "\u2014"}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-slate-400">{u.email}</td>
                    <td className="p-3">
                      <Badge variant={u.emailVerified ? "default" : "outline"} className="text-xs">
                        {u.emailVerified ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ScrollArea>

      {usersPagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-white/10">
          <span className="text-xs text-slate-500">{usersPagination.total} user(s)</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7" disabled={usersPagination.page <= 1} onClick={() => fetchUsers(usersPagination.page - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-slate-400">{usersPagination.page} / {usersPagination.totalPages}</span>
            <Button variant="outline" size="sm" className="h-7" disabled={usersPagination.page >= usersPagination.totalPages} onClick={() => fetchUsers(usersPagination.page + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
