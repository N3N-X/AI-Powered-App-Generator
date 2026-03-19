"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import type { ContentProject } from "./types";
import type { AppConfigForm } from "./native-settings-sections";
import { buildAppConfigPayload } from "./app-config-utils";

export function useAppSettings(
  project: ContentProject,
  onProjectUpdate: (updated: Partial<ContentProject>) => void,
) {
  const [appConfigForm, setAppConfigForm] = useState<AppConfigForm>({
    name: "",
    slug: "",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splashImage: "./assets/splash.png",
    splashBackgroundColor: "#ffffff",
    iosBundleIdentifier: "",
    iosSupportsTablet: true,
    androidPackage: "",
    androidAdaptiveIconBg: "#ffffff",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [appDescription, setAppDescription] = useState("");

  // Domain settings
  const [customDomain, setCustomDomain] = useState("");
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [domainVerified, setDomainVerified] = useState(false);
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainVerifying, setDomainVerifying] = useState(false);
  const [domainDnsRecords, setDomainDnsRecords] = useState<
    { type: string; name: string; value: string }[]
  >([]);

  // Populate form from project
  useEffect(() => {
    let cfg: Record<string, unknown> | null = null;
    if (project.codeFiles?.["app.json"]) {
      try {
        const parsed = JSON.parse(project.codeFiles["app.json"]);
        cfg = (parsed?.expo as Record<string, unknown>) || parsed;
      } catch {
        cfg = project.appConfig;
      }
    } else {
      cfg = project.appConfig;
    }
    setAppDescription(project.description || "");
    setAppConfigForm({
      name: (cfg?.name as string) || project.name || "",
      slug: (cfg?.slug as string) || "",
      version: (cfg?.version as string) || "1.0.0",
      orientation: (cfg?.orientation as string) || "portrait",
      icon: (cfg?.icon as string) || "./assets/icon.png",
      splashImage:
        ((cfg?.splash as Record<string, unknown>)?.image as string) ||
        "./assets/splash.png",
      splashBackgroundColor:
        ((cfg?.splash as Record<string, unknown>)?.backgroundColor as string) ||
        "#ffffff",
      iosBundleIdentifier:
        ((cfg?.ios as Record<string, unknown>)?.bundleIdentifier as string) ||
        "",
      iosSupportsTablet:
        ((cfg?.ios as Record<string, unknown>)?.supportsTablet as boolean) ??
        true,
      androidPackage:
        ((cfg?.android as Record<string, unknown>)?.package as string) || "",
      androidAdaptiveIconBg:
        ((
          (cfg?.android as Record<string, unknown>)?.adaptiveIcon as Record<
            string,
            unknown
          >
        )?.backgroundColor as string) || "#ffffff",
    });
  }, [project]);

  // Fetch domain settings
  const fetchDomainSettings = useCallback(async () => {
    if (project.platform !== "WEB") return;
    try {
      const res = await fetch(`/api/projects/${project.id}/domain`);
      if (res.ok) {
        const data = await res.json();
        setCustomDomain(data.customDomain || "");
        setCustomDomainInput(data.customDomain || "");
        setDomainVerified(data.domainVerified || false);
      }
    } catch {
      /* ignore */
    }
  }, [project.id, project.platform]);

  useEffect(() => {
    fetchDomainSettings();
  }, [fetchDomainSettings]);

  const handleSaveAppConfig = async () => {
    setSettingsSaving(true);
    try {
      const platform = project.platform || "WEB";
      const { appConfig, appJsonContent } = buildAppConfigPayload(
        appConfigForm,
        platform,
      );
      const updatedCodeFiles: Record<string, string> = {
        ...(project.codeFiles || {}),
        "app.json": JSON.stringify(appJsonContent, null, 2),
      };
      if (updatedCodeFiles["package.json"]) {
        try {
          const pkg = JSON.parse(updatedCodeFiles["package.json"]);
          pkg.name = appConfigForm.slug;
          updatedCodeFiles["package.json"] = JSON.stringify(pkg, null, 2);
        } catch {}
      }
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appConfig,
          codeFiles: updatedCodeFiles,
          description: appDescription || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onProjectUpdate({
          name: appConfigForm.name,
          description: appDescription || null,
          codeFiles: updatedCodeFiles,
          ...(data.project || {}),
        });
        toast({ title: "App settings saved" });
      } else {
        toast({ title: "Failed to save settings", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSaveCustomDomain = async () => {
    setDomainSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/domain`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customDomain: customDomainInput.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomDomain(data.customDomain || "");
        setDomainVerified(data.domainVerified || false);
        if (data.dnsRecords) setDomainDnsRecords(data.dnsRecords);
        else setDomainDnsRecords([]);
        toast({
          title: data.customDomain
            ? "Custom domain saved"
            : "Custom domain removed",
        });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({
          title: err.error || "Failed to save domain",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Failed to save domain", variant: "destructive" });
    } finally {
      setDomainSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    setDomainVerifying(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/domain/verify`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.verified) {
          setDomainVerified(true);
          setDomainDnsRecords([]);
          toast({ title: "Domain verified successfully" });
        } else {
          setDomainDnsRecords(data.requiredRecords || []);
          toast({
            title: "Verification failed \u2014 check DNS records",
            variant: "destructive",
          });
        }
      } else {
        toast({ title: "Verification failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Verification failed", variant: "destructive" });
    } finally {
      setDomainVerifying(false);
    }
  };

  const handleRemoveCustomDomain = async () => {
    if (!confirm("Remove custom domain?")) return;
    setDomainSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${project.id}/domain?type=customDomain`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setCustomDomain("");
        setCustomDomainInput("");
        setDomainVerified(false);
        setDomainDnsRecords([]);
        toast({ title: "Custom domain removed" });
      }
    } catch {
      toast({ title: "Failed to remove domain", variant: "destructive" });
    } finally {
      setDomainSaving(false);
    }
  };

  return {
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
  };
}
