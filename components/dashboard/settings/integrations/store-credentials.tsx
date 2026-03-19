"use client";

import { useState, useEffect } from "react";
import { Apple, Smartphone } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { toast } from "@/hooks/use-toast";
import { AppleCredentialsDialog } from "../apple-credentials-dialog";
import { GoogleCredentialsDialog } from "../google-credentials-dialog";
import { IntegrationServiceCard } from "../integration-service-card";

export function StoreCredentials() {
  const { setConnectedServices } = useUserStore();

  const [showAppleDialog, setShowAppleDialog] = useState(false);
  const [appleConnected, setAppleConnected] = useState(false);
  const [showGoogleDialog, setShowGoogleDialog] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    const checkCredentialStatus = async () => {
      try {
        const [appleRes, googleRes] = await Promise.all([
          fetch("/api/creds/connect-apple"),
          fetch("/api/creds/connect-google"),
        ]);
        if (appleRes.ok) {
          const data = await appleRes.json();
          setAppleConnected(data.connected);
          setConnectedServices({ appleDev: data.connected });
        }
        if (googleRes.ok) {
          const data = await googleRes.json();
          setGoogleConnected(data.connected);
          setConnectedServices({ googleDev: data.connected });
        }
      } catch {
        // Silently fail
      }
    };
    checkCredentialStatus();
  }, [setConnectedServices]);

  const handleDisconnect = async (
    endpoint: string,
    serviceKey: "appleDev" | "googleDev",
    setConnected: (v: boolean) => void,
    label: string,
  ) => {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) return;
      const data = await res.json();
      if (data.credentials?.length > 0) {
        for (const cred of data.credentials) {
          await fetch(`${endpoint}?id=${cred.id}`, { method: "DELETE" });
        }
      }
      setConnected(false);
      setConnectedServices({ [serviceKey]: false });
      toast({
        title: "Disconnected",
        description: `${label} credentials removed`,
      });
    } catch {
      toast({
        title: "Failed to disconnect",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <IntegrationServiceCard
        icon={Apple}
        title="App Store Connect"
        description="Connect your API Key to publish builds to the App Store"
        connected={appleConnected}
        connectLabel="Connect App Store API Key"
        onConnect={() => setShowAppleDialog(true)}
        onUpdate={() => setShowAppleDialog(true)}
        onDisconnect={() =>
          handleDisconnect(
            "/api/creds/connect-apple",
            "appleDev",
            setAppleConnected,
            "App Store Connect",
          )
        }
      />

      <IntegrationServiceCard
        icon={Smartphone}
        title="Google Play"
        description="Connect your Service Account to publish builds to the Play Store"
        connected={googleConnected}
        connectLabel="Connect Google Service Account"
        onConnect={() => setShowGoogleDialog(true)}
        onUpdate={() => setShowGoogleDialog(true)}
        onDisconnect={() =>
          handleDisconnect(
            "/api/creds/connect-google",
            "googleDev",
            setGoogleConnected,
            "Google Play",
          )
        }
      />

      <AppleCredentialsDialog
        open={showAppleDialog}
        onOpenChange={setShowAppleDialog}
        onConnected={() => {
          setAppleConnected(true);
          setConnectedServices({ appleDev: true });
        }}
      />

      <GoogleCredentialsDialog
        open={showGoogleDialog}
        onOpenChange={setShowGoogleDialog}
        onConnected={() => {
          setGoogleConnected(true);
          setConnectedServices({ googleDev: true });
        }}
      />
    </>
  );
}
