"use client";

import { lazy, Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

const SettingsModal = lazy(() =>
  import("@/components/dashboard/settings-modal").then((mod) => ({
    default: mod.SettingsModal,
  })),
);

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use unified layout for all dashboard pages with nav sidebar and topbar
  return (
    <DashboardLayout>
      {children}
      <Suspense fallback={null}>
        <SettingsModal />
      </Suspense>
    </DashboardLayout>
  );
}
