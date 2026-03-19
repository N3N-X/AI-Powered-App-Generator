"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUIStore } from "@/stores/ui-store";
import { useUserStore } from "@/stores/user-store";
import { SettingsAccountTab } from "./settings-account-tab";
import { SettingsIntegrationsTab } from "./settings-integrations-tab";
import { SettingsCredentialsTab } from "./settings-credentials-tab";
import { SettingsBillingTab } from "./settings-billing-tab";

export function SettingsModal() {
  const { activeModal, closeModal } = useUIStore();
  const { user, hasGitHub, hasAppleDev, hasGoogleDev, setConnectedServices } =
    useUserStore();

  const isOpen = activeModal === "settings";

  return (
    <Dialog open={isOpen} onOpenChange={() => closeModal()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account, integrations, and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4 mt-4">
            <SettingsAccountTab user={user} />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4 mt-4">
            <SettingsIntegrationsTab
              user={user}
              hasGitHub={hasGitHub}
              setConnectedServices={setConnectedServices}
            />
          </TabsContent>

          <TabsContent value="credentials" className="space-y-4 mt-4">
            <SettingsCredentialsTab
              hasAppleDev={hasAppleDev}
              hasGoogleDev={hasGoogleDev}
              closeModal={closeModal}
            />
          </TabsContent>

          <TabsContent value="billing" className="space-y-4 mt-4">
            <SettingsBillingTab user={user} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
