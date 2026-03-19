"use client";

import { TabsContent } from "@/components/ui/tabs";
import {
  EmailConfigTab,
  SMSConfigTab,
  PushConfigTab,
  StorageConfigTab,
  MapsConfigTab,
} from "@/components/dashboard/proxy-tabs";
import {
  DatabaseTab,
  UsersTab,
  AppSettingsTab,
  ApiKeysTab,
  UsageTab,
  PaymentsTab,
  ImagesTab,
  FilesTab,
  LogsTab,
  GitHubTab,
} from "@/components/dashboard/content";
import type {
  ProxyConfigsResponse,
  ProxyConfigService,
} from "@/types/proxy-config";
import type { ContentProject } from "@/components/dashboard/content/types";

interface TabPanelsProps {
  selectedProjectId: string;
  currentProject: ContentProject | undefined;
  proxyConfigs: ProxyConfigsResponse | null;
  projectPaymentPlatform: "revenuecat" | "stripe" | null;
  onSaveProxyConfig: (
    service: ProxyConfigService,
    config: Record<string, unknown>,
  ) => Promise<void>;
  onProjectUpdate: (updated: Partial<ContentProject>) => void;
  onDeleteProject: () => void;
  onGitHubRepoLinked: (repo: string, url: string) => void;
  onGitHubRepoUnlinked: () => void;
}

export function TabPanels({
  selectedProjectId,
  currentProject,
  proxyConfigs,
  projectPaymentPlatform,
  onSaveProxyConfig,
  onProjectUpdate,
  onDeleteProject,
  onGitHubRepoLinked,
  onGitHubRepoUnlinked,
}: TabPanelsProps) {
  return (
    <>
      <TabsContent value="database">
        <DatabaseTab projectId={selectedProjectId} />
      </TabsContent>

      <TabsContent value="users">
        <UsersTab projectId={selectedProjectId} />
      </TabsContent>

      <TabsContent value="settings">
        {currentProject && (
          <AppSettingsTab
            project={currentProject}
            onProjectUpdate={onProjectUpdate}
            onDeleteProject={onDeleteProject}
          />
        )}
      </TabsContent>

      <TabsContent value="github">
        {currentProject && (
          <GitHubTab
            projectId={selectedProjectId}
            projectName={currentProject.name}
            githubRepo={currentProject.githubRepo}
            githubUrl={currentProject.githubUrl}
            onRepoLinked={onGitHubRepoLinked}
            onRepoUnlinked={onGitHubRepoUnlinked}
          />
        )}
      </TabsContent>

      <TabsContent value="apikeys">
        <ApiKeysTab projectId={selectedProjectId} />
      </TabsContent>

      <TabsContent value="usage">
        <UsageTab projectId={selectedProjectId} />
      </TabsContent>

      <TabsContent value="payments">
        <PaymentsTab
          projectId={selectedProjectId}
          paymentPlatform={projectPaymentPlatform}
        />
      </TabsContent>

      <TabsContent value="images">
        <ImagesTab projectId={selectedProjectId} />
      </TabsContent>

      <TabsContent value="files">
        {currentProject && <FilesTab project={currentProject} />}
      </TabsContent>

      <TabsContent value="logs">
        <LogsTab projectId={selectedProjectId} />
      </TabsContent>

      <TabsContent value="proxy-email">
        <EmailConfigTab
          projectId={selectedProjectId}
          config={proxyConfigs?.configs?.email ?? null}
          onSave={(config) => onSaveProxyConfig("email", config)}
        />
      </TabsContent>
      <TabsContent value="proxy-sms">
        <SMSConfigTab
          projectId={selectedProjectId}
          config={proxyConfigs?.configs?.sms ?? null}
          onSave={(config) => onSaveProxyConfig("sms", config)}
        />
      </TabsContent>
      <TabsContent value="proxy-push">
        <PushConfigTab
          projectId={selectedProjectId}
          config={proxyConfigs?.configs?.push ?? null}
          onSave={(config) => onSaveProxyConfig("push", config)}
        />
      </TabsContent>
      <TabsContent value="proxy-storage">
        <StorageConfigTab
          projectId={selectedProjectId}
          config={proxyConfigs?.configs?.storage ?? null}
          onSave={(config) => onSaveProxyConfig("storage", config)}
        />
      </TabsContent>
      <TabsContent value="proxy-maps">
        <MapsConfigTab
          projectId={selectedProjectId}
          config={proxyConfigs?.configs?.maps ?? null}
          onSave={(config) => onSaveProxyConfig("maps", config)}
        />
      </TabsContent>
    </>
  );
}
