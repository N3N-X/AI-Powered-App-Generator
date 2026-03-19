"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Key, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { ApiKey } from "./types";
import { formatDate, getServiceColor } from "./types";

interface ApiKeysTabProps {
  projectId: string;
}

export function ApiKeysTab({ projectId }: ApiKeysTabProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);

  const fetchApiKeys = useCallback(async () => {
    if (!projectId) return;
    setApiKeysLoading(true);
    try {
      const res = await fetch(`/api/proxy/keys?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setApiKeys(
          (data.keys || []).map((k: Record<string, unknown>) => ({
            id: k.id,
            name: k.name,
            keyPrefix: k.key_prefix || k.keyPrefix || "",
            services: k.services || [],
            lastUsed: k.last_used || k.lastUsed || null,
            createdAt: k.created_at || k.createdAt,
            isActive: k.is_active !== false && k.isActive !== false,
          })),
        );
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setApiKeysLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleRevokeApiKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/proxy/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      if (res.ok) {
        toast({ title: "API key revoked" });
        fetchApiKeys();
      } else {
        toast({ title: "Failed to revoke key", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to revoke key", variant: "destructive" });
    }
  };

  return (
    <div className="liquid-glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h3 className="text-sm font-medium text-slate-300">API Keys</h3>
          <p className="text-xs text-slate-500 mt-0.5">Keys are automatically generated when your app is created</p>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => fetchApiKeys()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-320px)] md:h-[500px]">
        {apiKeysLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Key className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">No API keys yet</p>
            <p className="text-xs mt-1">Keys are created automatically when you generate your app</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-500 uppercase">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Key</th>
                  <th className="text-left p-3 font-medium">Services</th>
                  <th className="text-left p-3 font-medium">Created</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 text-sm text-slate-200 font-medium">{key.name}</td>
                    <td className="p-3">
                      <code className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">{key.keyPrefix}...</code>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {key.services.slice(0, 3).map((svc) => (
                          <span key={svc} className={cn("text-xs px-1.5 py-0.5 rounded", getServiceColor(svc))}>{svc}</span>
                        ))}
                        {key.services.length > 3 && <span className="text-xs text-slate-500">+{key.services.length - 3}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-slate-500">{formatDate(key.createdAt)}</td>
                    <td className="p-3">
                      <Badge variant={key.isActive ? "default" : "outline"} className="text-xs">{key.isActive ? "Active" : "Revoked"}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      {key.isActive && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleRevokeApiKey(key.id)}>
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
