"use client";

import { Apple, Smartphone, Shield, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SettingsCredentialsTabProps {
  hasAppleDev: boolean;
  hasGoogleDev: boolean;
  closeModal: () => void;
}

export function SettingsCredentialsTab({
  hasAppleDev,
  hasGoogleDev,
  closeModal,
}: SettingsCredentialsTabProps) {
  return (
    <>
      <p className="text-sm text-slate-400">
        Connect your developer accounts to build and deploy apps.
      </p>

      {/* Apple Developer */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              <Apple className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium text-white">Apple Developer</h4>
              <p className="text-sm text-slate-400">
                Required for iOS builds
              </p>
            </div>
          </div>
          {hasAppleDev ? (
            <Badge variant="success">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                closeModal();
                // Open Apple connect modal
              }}
            >
              Connect
            </Button>
          )}
        </div>
      </div>

      {/* Google Play */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium text-white">Google Play</h4>
              <p className="text-sm text-slate-400">
                Required for Android distribution
              </p>
            </div>
          </div>
          {hasGoogleDev ? (
            <Badge variant="success">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                closeModal();
                // Open Google connect modal
              }}
            >
              Connect
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mt-4">
        <Shield className="h-4 w-4" />
        All credentials are encrypted with AES-256-GCM
      </div>
    </>
  );
}
