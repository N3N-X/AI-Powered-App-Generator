"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Phone,
  PhoneOutgoing,
  MessageSquare,
  MessageSquarePlus,
  Loader2,
  Shield,
  Activity,
  ArrowLeft,
  X,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

import { CallsTab } from "./calls-tab";
import { MessagesTab } from "./messages-tab";
import { SettingsTab } from "./settings-tab";
import { MakeCallDialog } from "./make-call-dialog";
import { SendSmsDialog } from "./send-sms-dialog";
import { useTwilioDevice } from "./use-twilio-device";
import { useVoiceData } from "./use-voice-data";

export default function VoiceAgentPage() {
  const data = useVoiceData();
  const device = useTwilioDevice(() => data.fetchCalls(1));

  const [activeTab, setActiveTab] = useState<"calls" | "messages" | "settings">(
    "calls",
  );
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [callTo, setCallTo] = useState("");
  const [smsTo, setSmsTo] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (device.error) data.setError(device.error);
  }, [device.error, data]);

  const sendSms = async () => {
    if (!smsTo.trim() || !smsBody.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/voice/sms/outgoing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: smsTo.trim(), message: smsBody.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      setShowSmsDialog(false);
      setSmsTo("");
      setSmsBody("");
      data.fetchCalls(1);
    } catch (err) {
      data.setError(err instanceof Error ? err.message : "Failed to send SMS");
    } finally {
      setIsSending(false);
    }
  };

  const syncFromTwilio = async () => {
    setIsSyncing(true);
    await data.syncFromTwilio();
    setIsSyncing(false);
  };

  if (data.isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading voice agent...</p>
        </div>
      </div>
    );
  }

  if (data.error && !data.settings) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-slate-400">{data.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/admin">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Phone className="h-6 w-6 text-violet-500" />
                Voice & Messaging
              </h1>
            </div>
            <p className="text-slate-400 ml-12">
              Manage calls, SMS, and Grok AI agent
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={syncFromTwilio}
              disabled={isSyncing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
              />
              {isSyncing ? "Syncing..." : "Sync Twilio"}
            </Button>
            <Button variant="outline" onClick={() => setShowCallDialog(true)}>
              <PhoneOutgoing className="h-4 w-4 mr-2" />
              Make Call
            </Button>
            <Button onClick={() => setShowSmsDialog(true)}>
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Send SMS
            </Button>
          </div>
        </div>

        {data.error && data.settings && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{data.error}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => data.setError(null)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as "calls" | "messages" | "settings")
          }
        >
          <TabsList className="w-fit">
            <TabsTrigger
              value="calls"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <Phone className="h-4 w-4 mr-2" />
              Calls
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <Activity className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="calls">
            <CallsTab
              calls={data.calls}
              callStats={data.callStats}
              callPage={data.callPage}
              callTotalPages={data.callTotalPages}
              onPageChange={data.changeCallPage}
            />
          </TabsContent>
          <TabsContent value="messages">
            <MessagesTab
              messages={data.messages}
              msgStats={data.msgStats}
              msgPage={data.msgPage}
              msgTotalPages={data.msgTotalPages}
              onPageChange={data.changeMsgPage}
            />
          </TabsContent>
          <TabsContent value="settings">
            {data.settings && (
              <SettingsTab
                settings={data.settings}
                onSettingsChange={data.setSettings}
                onSave={data.saveSettings}
                isSaving={data.isSaving}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MakeCallDialog
        open={showCallDialog}
        onOpenChange={setShowCallDialog}
        callTo={callTo}
        onCallToChange={setCallTo}
        callState={device.callState}
        callDuration={device.callDuration}
        isMuted={device.isMuted}
        onMakeCall={() => device.makeCall(callTo)}
        onHangUp={device.hangUp}
        onToggleMute={device.toggleMute}
      />
      <SendSmsDialog
        open={showSmsDialog}
        onOpenChange={setShowSmsDialog}
        smsTo={smsTo}
        onSmsToChange={setSmsTo}
        smsBody={smsBody}
        onSmsBodyChange={setSmsBody}
        isSending={isSending}
        onSend={sendSms}
      />
    </div>
  );
}
