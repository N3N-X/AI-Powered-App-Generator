"use client";

import { CreditsBalanceCard } from "./credits-balance-card";
import { ProfileCard } from "./profile-card";
import { SecurityCard } from "./security-card";
import { DangerZoneCard } from "./danger-zone-card";
import { InviteCard } from "./invite-card";

export function AccountTab() {
  return (
    <div className="space-y-6">
      <CreditsBalanceCard />
      <InviteCard />
      <ProfileCard />
      <SecurityCard />
      <DangerZoneCard />
    </div>
  );
}
