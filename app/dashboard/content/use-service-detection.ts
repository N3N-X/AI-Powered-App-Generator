"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  ProxyConfigsResponse,
  ProxyConfigService,
} from "@/types/proxy-config";
import type { ContentProject } from "@/components/dashboard/content/types";

interface UseServiceDetectionProps {
  selectedProjectId: string;
  projects: ContentProject[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface UseServiceDetectionReturn {
  availableTabs: string[];
  detectingServices: boolean;
  proxyConfigs: ProxyConfigsResponse | null;
  projectPaymentPlatform: "revenuecat" | "stripe" | null;
  handleSaveProxyConfig: (
    service: ProxyConfigService,
    config: Record<string, unknown>,
  ) => Promise<void>;
}

export function useServiceDetection({
  selectedProjectId,
  projects,
  activeTab,
  setActiveTab,
}: UseServiceDetectionProps): UseServiceDetectionReturn {
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [detectingServices, setDetectingServices] = useState(false);
  const [proxyConfigs, setProxyConfigs] = useState<ProxyConfigsResponse | null>(
    null,
  );
  const [projectPaymentPlatform, setProjectPaymentPlatform] = useState<
    "revenuecat" | "stripe" | null
  >(null);

  const detectServices = useCallback(async () => {
    if (!selectedProjectId) return;
    setDetectingServices(true);
    const tabs: string[] = [];

    // Fetch collections, users, and proxy config in parallel
    const [collectionsResult, usersResult, proxyResult] =
      await Promise.allSettled([
        fetch(`/api/projects/${selectedProjectId}/collections`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch(`/api/projects/${selectedProjectId}/users?limit=1`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch(`/api/projects/${selectedProjectId}/proxy-config`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

    // Check collections (database)
    const collectionsData =
      collectionsResult.status === "fulfilled" ? collectionsResult.value : null;
    if (collectionsData?.collections?.length > 0) tabs.push("database");

    // Check users
    const usersData =
      usersResult.status === "fulfilled" ? usersResult.value : null;
    if (usersData?.pagination?.total > 0) {
      tabs.push("users");
    } else {
      const proj = projects.find((p) => p.id === selectedProjectId);
      const apiCode = proj?.codeFiles?.["src/services/api.ts"] || "";
      if (
        apiCode.includes("operation: 'login'") ||
        apiCode.includes("operation: 'signup'")
      ) {
        tabs.push("users");
      }
    }

    // Check if project has code files
    const project = projects.find((p) => p.id === selectedProjectId);
    if (
      project &&
      project.codeFiles &&
      Object.keys(project.codeFiles).length > 0
    ) {
      tabs.push("files");
    }

    // Payments tab
    const projForPayments = projects.find((p) => p.id === selectedProjectId);
    if (projForPayments) {
      const plat = (projForPayments.platform || "").toUpperCase();
      const appSpec = projForPayments.appConfig as Record<
        string,
        unknown
      > | null;
      const usesPayments =
        (appSpec as { api?: { paymentsRequired?: boolean } })?.api
          ?.paymentsRequired === true ||
        (projForPayments.codeFiles &&
          Object.values(projForPayments.codeFiles)
            .join("\n")
            .match(/proxy\/payments|revenuecat|stripe|purchase|subscription/i));

      if (usesPayments) {
        if (plat === "IOS" || plat === "ANDROID") {
          tabs.push("payments");
          setProjectPaymentPlatform("revenuecat");
        } else if (plat === "WEB") {
          tabs.push("payments");
          setProjectPaymentPlatform("stripe");
        }
      }
    }

    // Always show these core tabs
    tabs.push("settings", "github", "usage", "logs", "images", "apikeys");

    // Detect proxy services
    const proxyData =
      proxyResult.status === "fulfilled" ? proxyResult.value : null;
    if (proxyData) {
      setProxyConfigs(proxyData as ProxyConfigsResponse);
      const detected = (proxyData as ProxyConfigsResponse).detectedServices;
      if (detected.includes("email")) tabs.push("proxy-email");
      if (detected.includes("sms")) tabs.push("proxy-sms");
      if (detected.includes("push")) tabs.push("proxy-push");
      if (detected.includes("storage")) tabs.push("proxy-storage");
      if (detected.includes("maps")) tabs.push("proxy-maps");
    }

    // Web projects: simplified tabs
    const projectForTabs = projects.find((p) => p.id === selectedProjectId);
    const isWebProject = projectForTabs?.platform === "WEB";
    const finalTabs = isWebProject
      ? tabs.filter((t) => !["apikeys", "files"].includes(t))
      : tabs;

    setAvailableTabs(finalTabs);
    if (finalTabs.length > 0 && !finalTabs.includes(activeTab)) {
      setActiveTab(finalTabs[0]);
    }
    setDetectingServices(false);
  }, [selectedProjectId, projects, activeTab, setActiveTab]);

  useEffect(() => {
    if (!selectedProjectId) return;
    detectServices();
  }, [selectedProjectId, detectServices]);

  const handleSaveProxyConfig = async (
    service: ProxyConfigService,
    config: Record<string, unknown>,
  ) => {
    if (!selectedProjectId) return;
    const res = await fetch(`/api/projects/${selectedProjectId}/proxy-config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service, config }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to save config");
    }
    const refreshRes = await fetch(
      `/api/projects/${selectedProjectId}/proxy-config`,
    );
    if (refreshRes.ok) {
      setProxyConfigs(await refreshRes.json());
    }
  };

  return {
    availableTabs,
    detectingServices,
    proxyConfigs,
    projectPaymentPlatform,
    handleSaveProxyConfig,
  };
}
