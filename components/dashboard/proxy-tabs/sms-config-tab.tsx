"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, MessageSquare } from "lucide-react";
import type { SMSProxyConfig } from "@/types/proxy-config";
import { DEFAULT_SMS_CONFIG } from "@/types/proxy-config";

const COUNTRY_CODES = [
  { value: "+1", label: "+1 (US/CA)" },
  { value: "+44", label: "+44 (UK)" },
  { value: "+61", label: "+61 (AU)" },
  { value: "+49", label: "+49 (DE)" },
  { value: "+33", label: "+33 (FR)" },
  { value: "+81", label: "+81 (JP)" },
  { value: "+91", label: "+91 (IN)" },
  { value: "+55", label: "+55 (BR)" },
  { value: "+86", label: "+86 (CN)" },
  { value: "+82", label: "+82 (KR)" },
];

interface SMSConfigTabProps {
  projectId: string;
  config: SMSProxyConfig | null;
  onSave: (config: Partial<SMSProxyConfig>) => Promise<void>;
}

export function SMSConfigTab({ projectId, config, onSave }: SMSConfigTabProps) {
  const [form, setForm] = useState<SMSProxyConfig>(
    config || DEFAULT_SMS_CONFIG,
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      toast({ title: "SMS settings saved" });
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
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              SMS Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Configure SMS messaging for your app
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
            Default Country Code
          </label>
          <Select
            value={form.countryCode}
            onValueChange={(value) =>
              setForm({ ...form, countryCode: value })
            }
          >
            <SelectTrigger className="bg-white/80 dark:bg-white/5">
              <SelectValue placeholder="Select country code" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_CODES.map((code) => (
                <SelectItem key={code.value} value={code.value}>
                  {code.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Default country code used when phone numbers don&apos;t include one
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/10 dark:bg-white/5 border border-gray-200/50 dark:border-white/10">
          <p className="text-sm text-gray-600 dark:text-slate-400">
            SMS sender numbers are managed by the platform (Twilio). Messages
            are sent from a shared pool of numbers optimized for delivery.
          </p>
        </div>
      </div>
    </div>
  );
}
