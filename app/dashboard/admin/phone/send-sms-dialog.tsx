"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { MessageSquarePlus, Loader2, Send } from "lucide-react";

interface SendSmsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  smsTo: string;
  onSmsToChange: (value: string) => void;
  smsBody: string;
  onSmsBodyChange: (value: string) => void;
  isSending: boolean;
  onSend: () => void;
}

export function SendSmsDialog({
  open,
  onOpenChange,
  smsTo,
  onSmsToChange,
  smsBody,
  onSmsBodyChange,
  isSending,
  onSend,
}: SendSmsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#12121a] border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-violet-500" />
            Send SMS
          </DialogTitle>
          <DialogDescription className="sr-only">
            Send an SMS message to a phone number
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">To</Label>
            <Input
              className="bg-white/5 border-white/10 text-white"
              placeholder="+1234567890"
              value={smsTo}
              onChange={(e) => onSmsToChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Message</Label>
            <Textarea
              className="min-h-[100px]"
              placeholder="Type your message..."
              value={smsBody}
              onChange={(e) => onSmsBodyChange(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              {smsBody.length}/1600 characters
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSend}
            disabled={isSending || !smsTo.trim() || !smsBody.trim()}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
