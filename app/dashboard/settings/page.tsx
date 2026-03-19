"use client";

import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountTab } from "@/components/dashboard/settings/account-tab";
import { IntegrationsTab } from "@/components/dashboard/settings/integrations-tab";
import { NotificationsTab } from "@/components/dashboard/settings/notifications-tab";
import { BillingTab } from "@/components/dashboard/settings/billing-tab";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "account";

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="bg-white/5 p-1">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <AccountTab />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <IntegrationsTab />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <BillingTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
