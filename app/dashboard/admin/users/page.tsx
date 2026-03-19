"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUserStore, useIsAdmin } from "@/stores/user-store";
import { toast } from "@/hooks/use-toast";
import { Users } from "lucide-react";
import { UserData, Pagination, EditFormData } from "./types";
import { UserFilters } from "./user-filters";
import { UserTable } from "./user-table";
import { EditUserDialog } from "./edit-user-dialog";

export default function AdminUsersPage() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { isLoaded } = useUserStore();

  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");

  // Edit dialog state
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({
    plan: "",
    role: "",
    credits: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isLoaded, isAdmin, router]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(planFilter !== "all" && { plan: planFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, planFilter]);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, planFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const openEditDialog = (userData: UserData) => {
    setEditingUser(userData);
    setEditForm({
      plan: userData.plan,
      role: userData.role,
      credits: userData.credits,
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          plan: editForm.plan,
          role: editForm.role,
          credits: editForm.credits,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      toast({
        title: "User updated",
        description: `${editingUser.email} has been updated`,
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-violet-500" />
              User Management
            </h1>
            <p className="text-gray-500 dark:text-slate-400">
              {pagination.total} total users
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin")}
          >
            Back to Dashboard
          </Button>
        </div>

        <UserFilters
          search={search}
          onSearchChange={setSearch}
          planFilter={planFilter}
          onPlanFilterChange={setPlanFilter}
          onSubmit={handleSearch}
        />

        <UserTable
          users={users}
          pagination={pagination}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onEditUser={openEditDialog}
        />
      </div>

      <EditUserDialog
        user={editingUser}
        editForm={editForm}
        onEditFormChange={setEditForm}
        isSaving={isSaving}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveUser}
      />
    </div>
  );
}
