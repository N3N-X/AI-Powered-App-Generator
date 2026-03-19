"use client";

import { lazy, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useUserStore } from "@/stores/user-store";
import { useProjectStore } from "@/stores/project-store";
import { api } from "@/lib/api-client";
import { useUserRealtime } from "@/hooks/use-user-realtime";

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
  const { user: authUser, mfaRequired, loading } = useAuth();
  const router = useRouter();
  const { user, setUser, setConnectedServices, isLoaded } = useUserStore();
  const { setProjects } = useProjectStore();

  useUserRealtime(authUser?.id);

  useEffect(() => {
    if (!loading && mfaRequired) {
      router.replace("/auth/mfa-verify");
    }
  }, [mfaRequired, loading, router]);

  // Fetch user and project data in parallel on mount
  useEffect(() => {
    if (loading || !authUser) return;
    if (isLoaded && user) return;

    async function fetchData() {
      try {
        const [userResponse, projectsResponse] = await Promise.all([
          api.get("/api/user"),
          api.get("/api/projects"),
        ]);

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
          setConnectedServices({
            github: userData.user.hasGitHub,
            appleDev: userData.user.hasAppleDev,
            googleDev: userData.user.hasGoogleDev,
            customApiKey: userData.user.hasCustomApiKey,
          });
        }

        if (projectsResponse.ok) {
          const data = await projectsResponse.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    }

    fetchData();
  }, [
    loading,
    authUser,
    isLoaded,
    user,
    setUser,
    setConnectedServices,
    setProjects,
  ]);

  // Prevent dashboard flash while redirecting to MFA
  if (!loading && mfaRequired) {
    return null;
  }

  return (
    <DashboardLayout>
      {children}
      <Suspense fallback={null}>
        <SettingsModal />
      </Suspense>
    </DashboardLayout>
  );
}
