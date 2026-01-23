"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/stores/project-store";
import { subscribeToUserProjects, unsubscribe } from "@/lib/supabase/realtime";
import { RealtimeChannel } from "@supabase/supabase-js";

export function useRealtimeProjects(userId: string | null) {
  const {
    addProject,
    updateProject,
    deleteProject,
    currentProject,
    setCurrentProject,
  } = useProjectStore();

  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel;

    try {
      channel = subscribeToUserProjects(
        userId,
        // On INSERT
        (newProject) => {
          const project = {
            ...newProject,
            codeFiles: newProject.code_files || {},
            chatHistory: newProject.chat_history || [],
            appConfig: newProject.app_config || null,
            githubRepo: newProject.github_repo || null,
            githubUrl: newProject.github_url || null,
            customDomain: newProject.custom_domain || null,
            domainVerified: newProject.domain_verified || false,
            createdAt: new Date(newProject.created_at),
            updatedAt: new Date(newProject.updated_at),
          };
          addProject(project);
        },
        // On UPDATE
        (updatedProject) => {
          const currentVersion = currentProject?.updatedAt;
          const serverVersion = new Date(updatedProject.updated_at);

          // Only apply if server version is newer
          if (currentVersion && serverVersion <= currentVersion) {
            console.log("[Realtime] Ignoring stale update from server");
            return;
          }

          const updates = {
            name: updatedProject.name,
            description: updatedProject.description,
            codeFiles: updatedProject.code_files || {},
            chatHistory: updatedProject.chat_history || [],
            appConfig: updatedProject.app_config || null,
            githubRepo: updatedProject.github_repo || null,
            githubUrl: updatedProject.github_url || null,
            subdomain: updatedProject.subdomain || null,
            customDomain: updatedProject.custom_domain || null,
            domainVerified: updatedProject.domain_verified || false,
            updatedAt: serverVersion,
          };

          // Check if this is the current project being actively edited
          // Log warning if code structure changed (potential conflict)
          if (currentProject?.id === updatedProject.id) {
            const localCodeKeys = Object.keys(currentProject.codeFiles || {})
              .sort()
              .join(",");
            const serverCodeKeys = Object.keys(updatedProject.code_files || {})
              .sort()
              .join(",");

            if (localCodeKeys !== serverCodeKeys) {
              console.warn(
                "[Realtime] Code structure changed on server, potential conflict detected",
              );
              // Still apply update but user should be aware
            }
          }

          updateProject(updatedProject.id, updates);

          // If this is the current project, update it
          if (currentProject?.id === updatedProject.id) {
            setCurrentProject({
              ...currentProject,
              ...updates,
              id: currentProject!.id,
              slug: currentProject!.slug,
              platform: currentProject!.platform,
              createdAt: currentProject!.createdAt,
            });
          }
        },
        // On DELETE
        (deletedProject) => {
          deleteProject(deletedProject.id);

          // Clear current project if it was deleted
          if (currentProject?.id === deletedProject.id) {
            setCurrentProject(null);
          }
        },
      );
    } catch (error) {
      console.error("[useRealtimeProjects] Subscription error:", error);
    }

    return () => {
      if (channel) {
        unsubscribe(channel);
      }
    };
  }, [
    userId,
    addProject,
    updateProject,
    deleteProject,
    currentProject,
    setCurrentProject,
  ]);
}
