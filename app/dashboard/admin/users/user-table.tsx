"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shield,
  Edit,
  Zap,
} from "lucide-react";
import { UserData, Pagination } from "./types";

interface UserTableProps {
  users: UserData[];
  pagination: Pagination;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onEditUser: (user: UserData) => void;
}

export function UserTable({
  users,
  pagination,
  isLoading,
  onPageChange,
  onEditUser,
}: UserTableProps) {
  return (
    <Card className="liquid-glass-card">
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Showing {users.length} of {pagination.total} users
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((userData) => (
              <div
                key={userData.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center">
                    <span className="text-violet-400 font-medium">
                      {userData.name?.[0] ||
                        userData.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {userData.name || "No name"}
                      </p>
                      {userData.role === "ADMIN" && (
                        <Badge variant="destructive" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {userData.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Credits</p>
                    <p className="text-gray-900 dark:text-white font-medium flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-500" />
                      {userData.credits.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Projects</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {userData._count.projects}
                    </p>
                  </div>
                  <Badge
                    variant={
                      userData.plan === "ELITE"
                        ? "premium"
                        : userData.plan === "PRO"
                          ? "success"
                          : "secondary"
                    }
                  >
                    {userData.plan}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditUser(userData)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                No users found
              </div>
            )}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
