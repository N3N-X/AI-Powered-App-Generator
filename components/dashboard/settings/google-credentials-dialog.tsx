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
import { Smartphone, Key, ExternalLink, Loader2 } from "lucide-react";

interface GoogleCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

export function GoogleCredentialsDialog({
  open,
  onOpenChange,
  onConnected,
}: GoogleCredentialsDialogProps) {
  const [googleServiceAccountJson, setGoogleServiceAccountJson] = useState("");
  const [googlePackageName, setGooglePackageName] = useState("");
  const [googleCredName, setGoogleCredName] = useState("Default");
  const [isSavingGoogle, setIsSavingGoogle] = useState(false);

  const resetForm = () => {
    setGoogleServiceAccountJson("");
    setGooglePackageName("");
    setGoogleCredName("Default");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleConnectGoogle = async () => {
    if (!googleServiceAccountJson.trim()) {
      toast({ title: "Service account required", description: "Please paste your Google service account JSON", variant: "destructive" });
      return;
    }
    try {
      JSON.parse(googleServiceAccountJson.trim());
    } catch {
      toast({ title: "Invalid JSON", description: "The service account JSON is not valid", variant: "destructive" });
      return;
    }
    setIsSavingGoogle(true);
    try {
      const response = await fetch("/api/creds/connect-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: googleCredName.trim() || "Default",
          serviceAccountJson: googleServiceAccountJson.trim(),
          packageName: googlePackageName.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save credentials");
      }
      onConnected();
      onOpenChange(false);
      resetForm();
      toast({ title: "Google Play linked", description: "Your service account has been saved securely" });
    } catch (error) {
      toast({ title: "Failed to save credentials", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" });
    } finally {
      setIsSavingGoogle(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Google Play Service Account
          </DialogTitle>
          <DialogDescription>
            Enter your Google Play service account credentials. These are used only for publishing builds to the Play Store.{" "}
            <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline inline-flex items-center gap-1">
              Google Play Console <ExternalLink className="h-3 w-3" />
            </a>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="googleCredName">Credential Name</Label>
            <Input id="googleCredName" value={googleCredName} onChange={(e) => setGoogleCredName(e.target.value)} placeholder="e.g. My Play Account" className="bg-white/5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="googleServiceAccount">Service Account JSON</Label>
            <Textarea id="googleServiceAccount" value={googleServiceAccountJson} onChange={(e) => setGoogleServiceAccountJson(e.target.value)} placeholder='{"type": "service_account", "project_id": "...", ...}' className="bg-white/5 font-mono text-xs min-h-[160px]" />
            <p className="text-xs text-slate-500">Paste the full JSON contents of your Google Cloud service account key file. Create one in Google Cloud Console &gt; IAM &gt; Service Accounts.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="googlePackageName">Package Name (optional)</Label>
            <Input id="googlePackageName" value={googlePackageName} onChange={(e) => setGooglePackageName(e.target.value)} placeholder="e.g. com.yourcompany.yourapp" className="bg-white/5" />
            <p className="text-xs text-slate-500">Your Android app&apos;s package name (application ID)</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSavingGoogle}>Cancel</Button>
          <Button onClick={handleConnectGoogle} disabled={isSavingGoogle || !googleServiceAccountJson.trim()}>
            {isSavingGoogle ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
            Save Credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
