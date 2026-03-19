"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CREDIT_COSTS } from "@/types";
import { Smartphone, Apple, Upload } from "lucide-react";
import Link from "next/link";

export function BuildInfo() {
  return (
    <Card className="liquid-glass-card">
      <CardHeader>
        <CardTitle className="text-white">Build Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-400">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-5 w-5 text-green-400" />
              <span className="font-medium text-white">Android Builds</span>
            </div>
            <ul className="space-y-1 text-sm">
              <li>APK for sideloading and testing</li>
              <li>Build time: ~5-15 minutes</li>
              <li>Costs {CREDIT_COSTS.buildAndroid} credits per build</li>
              <li>No credentials needed to build</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Apple className="h-5 w-5 text-slate-300" />
              <span className="font-medium text-white">iOS Builds</span>
            </div>
            <ul className="space-y-1 text-sm">
              <li>IPA for App Store or TestFlight</li>
              <li>Build time: ~10-25 minutes</li>
              <li>Costs {CREDIT_COSTS.buildIOS} credits per build</li>
              <li>No credentials needed to build</li>
            </ul>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="h-5 w-5 text-violet-400" />
            <span className="font-medium text-white">Store Publishing</span>
          </div>
          <p className="text-sm">
            Building apps requires only credits — no developer accounts
            needed. To publish builds to the App Store or Play Store,
            connect your App Store Connect API Key (iOS) or Google Play
            Service Account (Android) in{" "}
            <Link
              href="/dashboard/settings?tab=integrations"
              className="text-violet-400 hover:underline"
            >
              Settings &rarr; Integrations
            </Link>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
