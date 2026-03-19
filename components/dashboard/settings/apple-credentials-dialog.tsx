"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Apple, Key, ExternalLink, Loader2 } from "lucide-react";

interface AppleCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

export function AppleCredentialsDialog({
  open,
  onOpenChange,
  onConnected,
}: AppleCredentialsDialogProps) {
  const [appleKeyId, setAppleKeyId] = useState("");
  const [appleIssuerId, setAppleIssuerId] = useState("");
  const [appleP8Key, setAppleP8Key] = useState("");
  const [appleCredName, setAppleCredName] = useState("Default");
  const [isSavingApple, setIsSavingApple] = useState(false);

  const resetForm = () => {
    setAppleKeyId("");
    setAppleIssuerId("");
    setAppleP8Key("");
    setAppleCredName("Default");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleConnectApple = async () => {
    if (!appleKeyId.trim() || !appleIssuerId.trim() || !appleP8Key.trim()) {
      toast({ title: "All fields required", description: "Please fill in Key ID, Issuer ID, and P8 Key", variant: "destructive" });
      return;
    }
    setIsSavingApple(true);
    try {
      const response = await fetch("/api/creds/connect-apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: appleCredName.trim() || "Default",
          keyId: appleKeyId.trim(),
          issuerId: appleIssuerId.trim(),
          p8Key: appleP8Key.trim(),
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save credentials");
      }
      onConnected();
      onOpenChange(false);
      resetForm();
      toast({ title: "App Store Connect linked", description: "Your API Key has been saved securely" });
    } catch (error) {
      toast({ title: "Failed to save credentials", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" });
    } finally {
      setIsSavingApple(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5" />
            App Store Connect API Key
          </DialogTitle>
          <DialogDescription>
            Enter your App Store Connect API Key credentials. These are used only for publishing builds to the App Store.{" "}
            <a href="https://appstoreconnect.apple.com/access/integrations/api" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline inline-flex items-center gap-1">
              Generate API Key <ExternalLink className="h-3 w-3" />
            </a>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="appleCredName">Credential Name</Label>
            <Input id="appleCredName" value={appleCredName} onChange={(e) => setAppleCredName(e.target.value)} placeholder="e.g. My App Key" className="bg-white/5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="appleKeyId">Key ID</Label>
            <Input id="appleKeyId" value={appleKeyId} onChange={(e) => setAppleKeyId(e.target.value)} placeholder="e.g. ABC123DEFG" className="bg-white/5" />
            <p className="text-xs text-slate-500">Found in App Store Connect under Users and Access &gt; Integrations &gt; Keys</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="appleIssuerId">Issuer ID</Label>
            <Input id="appleIssuerId" value={appleIssuerId} onChange={(e) => setAppleIssuerId(e.target.value)} placeholder="e.g. 12345678-1234-1234-1234-123456789012" className="bg-white/5" />
            <p className="text-xs text-slate-500">Shown at the top of the API Keys page in App Store Connect</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="appleP8Key">API Key (.p8)</Label>
            <Textarea id="appleP8Key" value={appleP8Key} onChange={(e) => setAppleP8Key(e.target.value)} placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----" className="bg-white/5 font-mono text-xs min-h-[120px]" />
            <p className="text-xs text-slate-500">Paste the contents of the .p8 file downloaded from App Store Connect</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSavingApple}>Cancel</Button>
          <Button onClick={handleConnectApple} disabled={isSavingApple || !appleKeyId.trim() || !appleIssuerId.trim() || !appleP8Key.trim()}>
            {isSavingApple ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
            Save Credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
