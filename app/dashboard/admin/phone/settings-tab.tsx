"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, MessageSquare, Loader2, Save } from "lucide-react";
import { ToggleRow } from "./shared-components";
import type { VoiceSettings } from "./types";

interface SettingsTabProps {
  settings: VoiceSettings;
  onSettingsChange: (settings: VoiceSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function SettingsTab({
  settings,
  onSettingsChange,
  onSave,
  isSaving,
}: SettingsTabProps) {
  const update = (partial: Partial<VoiceSettings>) =>
    onSettingsChange({ ...settings, ...partial });

  return (
    <div className="space-y-6">
      {/* Voice Settings */}
      <Card className="liquid-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Voice Settings
          </CardTitle>
          <CardDescription>
            Configure the AI voice agent and call handling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ToggleRow
            label="Voice Webhook"
            description={
              settings.enabled
                ? "Accepting incoming calls"
                : "Calls will hear unavailable message"
            }
            checked={settings.enabled}
            onChange={(enabled) => update({ enabled })}
            colorOn="green"
          />

          <div className="space-y-2">
            <Label className="text-slate-300">Default Greeting</Label>
            <Textarea
              value={settings.greeting_message}
              onChange={(e) => update({ greeting_message: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">
              Pro/Elite Greeting{" "}
              <span className="text-slate-500">
                (use {"{name}"} for caller name)
              </span>
            </Label>
            <Textarea
              value={settings.pro_greeting_message}
              onChange={(e) =>
                update({ pro_greeting_message: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">
              AI Agent System Prompt (Grok)
            </Label>
            <Textarea
              className="min-h-[120px]"
              value={settings.system_prompt}
              onChange={(e) => update({ system_prompt: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Forwarding Number (Pro/Elite)
              </Label>
              <Input
                className="bg-white/5 border-white/10 text-white"
                value={settings.forwarding_number}
                onChange={(e) =>
                  update({ forwarding_number: e.target.value })
                }
                placeholder="+13103007171"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                Max Conversation Turns
              </Label>
              <Input
                type="number"
                className="bg-white/5 border-white/10 text-white"
                value={settings.max_conversation_turns}
                onChange={(e) =>
                  update({
                    max_conversation_turns:
                      parseInt(e.target.value, 10) || 5,
                  })
                }
                min={1}
                max={20}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Settings */}
      <Card className="liquid-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Settings
          </CardTitle>
          <CardDescription>
            Configure SMS messaging and AI auto-replies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ToggleRow
            label="SMS Webhook"
            description={
              settings.sms_enabled
                ? "Processing incoming messages"
                : "Incoming messages ignored"
            }
            checked={settings.sms_enabled}
            onChange={(sms_enabled) => update({ sms_enabled })}
            colorOn="green"
          />

          <ToggleRow
            label="AI Auto-Reply"
            description={
              settings.sms_auto_reply
                ? "Grok responds to incoming SMS automatically"
                : "No automatic replies"
            }
            checked={settings.sms_auto_reply}
            onChange={(sms_auto_reply) => update({ sms_auto_reply })}
            colorOn="violet"
          />

          <div className="space-y-2">
            <Label className="text-slate-300">
              SMS AI System Prompt (Grok)
            </Label>
            <Textarea
              className="min-h-[120px]"
              value={settings.sms_system_prompt}
              onChange={(e) =>
                update({ sms_system_prompt: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
