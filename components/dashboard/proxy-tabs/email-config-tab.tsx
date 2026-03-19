"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Mail } from "lucide-react";
import type { EmailProxyConfig } from "@/types/proxy-config";
import { DEFAULT_EMAIL_CONFIG } from "@/types/proxy-config";

interface EmailConfigTabProps {
  projectId: string;
  config: EmailProxyConfig | null;
  onSave: (config: Partial<EmailProxyConfig>) => Promise<void>;
}

export function EmailConfigTab({
  projectId,
  config,
  onSave,
}: EmailConfigTabProps) {
  const [form, setForm] = useState<EmailProxyConfig>(
    config || DEFAULT_EMAIL_CONFIG,
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.fromAddress) {
      toast({
        title: "From address is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await onSave(form);
      toast({ title: "Email settings saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-xl">
      <div className="p-6 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Mail className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Email Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Configure how emails are sent from your app
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
          size="sm"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </Button>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            From Address <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            placeholder="noreply@myapp.com"
            value={form.fromAddress}
            onChange={(e) =>
              setForm({ ...form, fromAddress: e.target.value })
            }
            className="bg-white/80 dark:bg-white/5"
          />
          <p className="text-xs text-gray-500 dark:text-slate-500">
            The sender email address for all outgoing emails
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            From Name
          </label>
          <Input
            placeholder="My App"
            value={form.fromName}
            onChange={(e) =>
              setForm({ ...form, fromName: e.target.value })
            }
            className="bg-white/80 dark:bg-white/5"
          />
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Display name shown to recipients
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Reply-To Address
          </label>
          <Input
            type="email"
            placeholder="support@myapp.com"
            value={form.replyTo || ""}
            onChange={(e) =>
              setForm({
                ...form,
                replyTo: e.target.value || null,
              })
            }
            className="bg-white/80 dark:bg-white/5"
          />
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Where replies should be directed (optional)
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Subject Prefix
          </label>
          <Input
            placeholder="[MyApp]"
            value={form.subjectPrefix || ""}
            onChange={(e) =>
              setForm({
                ...form,
                subjectPrefix: e.target.value || null,
              })
            }
            className="bg-white/80 dark:bg-white/5"
          />
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Prepended to all email subjects (optional)
          </p>
        </div>
      </div>
    </div>
  );
}
