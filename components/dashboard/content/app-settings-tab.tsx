"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Loader2 } from "lucide-react";
import { usePlanLimits } from "@/stores/user-store";
import type { ContentProject } from "./types";
import { useAppSettings } from "./use-app-settings";
import {
  WebGeneralSection,
  WebDomainSection,
  WebBrandingSection,
  NotificationsSection,
  DangerZoneSection,
} from "./web-settings-sections";
import { useNotificationEmail } from "./use-notification-email";
import {
  NativeGeneralSection,
  NativeSplashSection,
  NativeIosSection,
  NativeAndroidSection,
} from "./native-settings-sections";

interface AppSettingsTabProps {
  project: ContentProject;
  onProjectUpdate: (updated: Partial<ContentProject>) => void;
  onDeleteProject: () => void;
}

export function AppSettingsTab({
  project,
  onProjectUpdate,
  onDeleteProject,
}: AppSettingsTabProps) {
  const planLimits = usePlanLimits();
  const notif = useNotificationEmail(project.id);
  const {
    appConfigForm,
    setAppConfigForm,
    settingsSaving,
    appDescription,
    setAppDescription,
    customDomain,
    customDomainInput,
    setCustomDomainInput,
    domainVerified,
    domainSaving,
    domainVerifying,
    domainDnsRecords,
    handleSaveAppConfig,
    handleSaveCustomDomain,
    handleVerifyDomain,
    handleRemoveCustomDomain,
  } = useAppSettings(project, onProjectUpdate);

  return (
    <div className="liquid-glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h3 className="text-sm font-medium text-slate-300">
            {project.platform === "WEB"
              ? "Web App Settings"
              : "App Configuration"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {project.platform === "WEB"
              ? "Configure your web app"
              : "Configure your app\u0027s app.json settings"}
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5"
          onClick={handleSaveAppConfig}
          disabled={settingsSaving}
        >
          {settingsSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save Changes
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-320px)] md:h-[600px]">
        <div className="p-6 space-y-8">
          {project.platform === "WEB" ? (
            <>
              <WebGeneralSection
                name={appConfigForm.name}
                version={appConfigForm.version}
                description={appDescription}
                onNameChange={(v) =>
                  setAppConfigForm((p) => ({ ...p, name: v }))
                }
                onVersionChange={(v) =>
                  setAppConfigForm((p) => ({ ...p, version: v }))
                }
                onDescriptionChange={setAppDescription}
              />
              <WebDomainSection
                slug={appConfigForm.slug}
                projectId={project.id}
                customDomain={customDomain}
                customDomainInput={customDomainInput}
                domainVerified={domainVerified}
                domainSaving={domainSaving}
                domainVerifying={domainVerifying}
                domainDnsRecords={domainDnsRecords}
                canRemoveBranding={planLimits.removeBranding}
                onDomainInputChange={setCustomDomainInput}
                onSaveDomain={handleSaveCustomDomain}
                onVerifyDomain={handleVerifyDomain}
                onRemoveDomain={handleRemoveCustomDomain}
              />
              <WebBrandingSection
                canRemoveBranding={planLimits.removeBranding}
              />
              <NotificationsSection
                email={notif.notificationEmail}
                onEmailChange={notif.setNotificationEmail}
                saving={notif.saving}
                onSave={notif.handleSave}
              />
              <DangerZoneSection onDeleteProject={onDeleteProject} />
            </>
          ) : (
            <>
              <NativeGeneralSection
                form={appConfigForm}
                onFormChange={setAppConfigForm}
              />
              <NativeSplashSection
                form={appConfigForm}
                onFormChange={setAppConfigForm}
              />
              {project.platform !== "ANDROID" && (
                <NativeIosSection
                  form={appConfigForm}
                  onFormChange={setAppConfigForm}
                />
              )}
              {project.platform !== "IOS" && (
                <NativeAndroidSection
                  form={appConfigForm}
                  onFormChange={setAppConfigForm}
                />
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
