"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Bell, Plus, X } from "lucide-react";
import type { PushProxyConfig } from "@/types/proxy-config";
import { DEFAULT_PUSH_CONFIG } from "@/types/proxy-config";

interface PushConfigTabProps {
  projectId: string;
  config: PushProxyConfig | null;
  onSave: (config: Partial<PushProxyConfig>) => Promise<void>;
}

export function PushConfigTab({
  projectId,
  config,
  onSave,
}: PushConfigTabProps) {
  const [form, setForm] = useState<PushProxyConfig>(
    config || DEFAULT_PUSH_CONFIG,
  );
  const [saving, setSaving] = useState(false);
  const [newTopic, setNewTopic] = useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      toast({ title: "Push notification settings saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addTopic = () => {
    const topic = newTopic.trim();
    if (!topic || form.topics.includes(topic)) return;
    setForm({ ...form, topics: [...form.topics, topic] });
    setNewTopic("");
  };

  const removeTopic = (topic: string) => {
    setForm({ ...form, topics: form.topics.filter((t) => t !== topic) });
  };

  return (
    <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-xl">
      <div className="p-6 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <Bell className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Push Notification Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Configure push notifications for your app
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
            Default Notification Title
          </label>
          <Input
            placeholder="Notification"
            value={form.defaultTitle}
            onChange={(e) => setForm({ ...form, defaultTitle: e.target.value })}
            className="bg-white/80 dark:bg-white/5"
          />
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Fallback title when none is specified
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Notification Icon URL
          </label>
          <Input
            placeholder="https://myapp.com/icon.png"
            value={form.iconUrl || ""}
            onChange={(e) =>
              setForm({ ...form, iconUrl: e.target.value || null })
            }
            className="bg-white/80 dark:bg-white/5"
          />
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Custom icon displayed in notifications (optional)
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Notification Topics
          </label>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add a topic..."
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTopic()}
              className="bg-white/80 dark:bg-white/5"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addTopic}
              disabled={!newTopic.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {form.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="gap-1">
                  {topic}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeTopic(topic)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Topic channels users can subscribe to
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/10 dark:bg-white/5 border border-gray-200/50 dark:border-white/10">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Badge Count
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-500">
                Show unread count on app icon
              </p>
            </div>
            <Button
              variant={form.badgeEnabled ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setForm({ ...form, badgeEnabled: !form.badgeEnabled })
              }
            >
              {form.badgeEnabled ? "On" : "Off"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-white/10 dark:bg-white/5 border border-gray-200/50 dark:border-white/10">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Sound
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-500">
                Play sound on notification
              </p>
            </div>
            <Button
              variant={form.soundEnabled ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setForm({ ...form, soundEnabled: !form.soundEnabled })
              }
            >
              {form.soundEnabled ? "On" : "Off"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
