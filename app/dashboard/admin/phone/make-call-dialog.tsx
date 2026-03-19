"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Phone, PhoneOutgoing } from "lucide-react";

interface MakeCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callTo: string;
  onCallToChange: (value: string) => void;
  callState: "idle" | "connecting" | "ringing" | "connected";
  callDuration: number;
  isMuted: boolean;
  onMakeCall: () => void;
  onHangUp: () => void;
  onToggleMute: () => void;
}

function formatCallDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function MakeCallDialog({
  open,
  onOpenChange,
  callTo,
  onCallToChange,
  callState,
  callDuration,
  isMuted,
  onMakeCall,
  onHangUp,
  onToggleMute,
}: MakeCallDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && callState === "idle") onOpenChange(false);
      }}
    >
      <DialogContent className="bg-[#12121a] border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneOutgoing className="h-5 w-5 text-violet-500" />
            {callState === "idle" ? "Make Call" : "Call In Progress"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {callState === "idle"
              ? "Enter a phone number to call"
              : "Active call controls"}
          </DialogDescription>
        </DialogHeader>

        {callState === "idle" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Phone Number</Label>
              <Input
                className="bg-white/5 border-white/10 text-white"
                placeholder="+1234567890"
                value={callTo}
                onChange={(e) => onCallToChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onMakeCall()}
              />
              <p className="text-xs text-slate-500">
                E.164 format (e.g. +13101234567)
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={onMakeCall} disabled={!callTo.trim()}>
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-white font-mono text-lg">{callTo}</p>
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    callState === "connected"
                      ? "bg-green-500 animate-pulse"
                      : callState === "ringing"
                        ? "bg-amber-500 animate-pulse"
                        : "bg-violet-500 animate-pulse"
                  }`}
                />
                <span className="text-sm text-slate-400 capitalize">
                  {callState}
                </span>
                {callState === "connected" && (
                  <span className="text-sm text-slate-500 font-mono ml-2">
                    {formatCallDuration(callDuration)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              {callState === "connected" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleMute}
                  className={isMuted ? "border-red-500 text-red-400" : ""}
                >
                  {isMuted ? "Unmute" : "Mute"}
                </Button>
              )}
              <Button variant="destructive" onClick={onHangUp}>
                <Phone className="h-4 w-4 mr-2" />
                Hang Up
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
