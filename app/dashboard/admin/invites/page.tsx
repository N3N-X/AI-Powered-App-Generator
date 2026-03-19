"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore, useIsAdmin } from "@/stores/user-store";
import { toast } from "@/hooks/use-toast";
import { Ticket, Search, Check, X, Mail, Loader2 } from "lucide-react";
import { AccessRequestsTable } from "./access-requests-table";
import { InviteCodesTable } from "./invite-codes-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface AccessRequest {
  id: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  processed_at: string | null;
  notes: string | null;
  invite_code_sent: string | null;
  signed_up_at: string | null;
  signed_up_user_id: string | null;
}

export interface InviteCode {
  id: string;
  code: string;
  owner_id: string | null;
  owner_email?: string;
  created_at: string;
  times_used: number;
  max_uses: number | null;
  is_active: boolean;
  code_type: string;
}

export default function AdminInvitesPage() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { isLoaded } = useUserStore();

  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isLoaded, isAdmin, router]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [requestsRes, codesRes] = await Promise.all([
        fetch("/api/admin/invites/requests"),
        fetch("/api/admin/invites/codes"),
      ]);

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setRequests(data.requests || []);
      }
      if (codesRes.ok) {
        const data = await codesRes.json();
        setInviteCodes(data.codes || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (request: AccessRequest) => {
    setProcessingId(request.id);
    try {
      const res = await fetch("/api/admin/invites/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, action: "approve" }),
      });

      if (!res.ok) throw new Error("Failed to approve");

      toast({
        title: "Request approved",
        description: `Invite code sent to ${request.email}`,
      });
      fetchData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: AccessRequest) => {
    setProcessingId(request.id);
    try {
      const res = await fetch("/api/admin/invites/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, action: "reject" }),
      });

      if (!res.ok) throw new Error("Failed to reject");

      toast({ title: "Request rejected" });
      fetchData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Ticket className="h-6 w-6 text-violet-500" />
              Invite Management
            </h1>
            <p className="text-gray-500 dark:text-slate-400">
              Manage access requests and invite codes
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin")}
          >
            Back to Dashboard
          </Button>
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests" className="relative">
              Access Requests
              {pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-violet-500 text-white rounded-full">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="codes">Invite Codes</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <AccessRequestsTable
              requests={requests.filter(
                (r) =>
                  !search ||
                  r.email.toLowerCase().includes(search.toLowerCase()),
              )}
              isLoading={isLoading}
              processingId={processingId}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </TabsContent>

          <TabsContent value="codes" className="space-y-4">
            <InviteCodesTable codes={inviteCodes} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
