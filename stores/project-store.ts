import { create } from "zustand";
import { persist } from "zustand/middleware";
import { codeFilesToTree } from "@/lib/utils";
import { GenerationPhase, ProjectState } from "./project-store-types";
import {
  createProjectActions,
  createFileActions,
  createMessageActions,
} from "./project-store-actions";

// Re-export types so existing imports from "@/stores/project-store" still work
export type { GenerationPhase } from "./project-store-types";

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentProject: null,
      currentFile: null,
      fileTree: [],
      projects: [],
      messages: [],
      isGenerating: false,
      isSaving: false,
      unsavedChanges: false,
      generationPhase: "idle" as GenerationPhase,
      generationMessage: "",
      generationNotice: null,
      streamText: "",
      activityItems: [],

      // Delegated actions
      ...createProjectActions(set, get),
      ...createFileActions(set, get),
      ...createMessageActions(set, get),

      // UI actions
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setIsSaving: (isSaving) => set({ isSaving }),
      setUnsavedChanges: (unsaved) => set({ unsavedChanges: unsaved }),

      // Generation actions
      setGenerationPhase: (phase, message) =>
        set({
          generationPhase: phase,
          ...(message !== undefined && { generationMessage: message }),
        }),

      setGenerationNotice: (notice) => set({ generationNotice: notice }),

      appendStreamText: (delta) =>
        set((state) => ({ streamText: state.streamText + delta })),

      addActivityItem: (item) =>
        set((state) => ({ activityItems: [...state.activityItems, item] })),

      updateActivityItem: (id, updates) =>
        set((state) => ({
          activityItems: state.activityItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item,
          ),
        })),

      clearGenerationState: () =>
        set({
          generationPhase: "idle",
          generationMessage: "",
          generationNotice: null,
          streamText: "",
          activityItems: [],
          isGenerating: false,
        }),

      // Utilities
      refreshFileTree: () => {
        const { currentProject } = get();
        if (currentProject) {
          set({ fileTree: codeFilesToTree(currentProject.codeFiles) });
        }
      },
    }),
    {
      name: "rux-project-store",
      partialize: (state) => ({
        currentProject: state.currentProject
          ? {
              id: state.currentProject.id,
              name: state.currentProject.name,
              description: state.currentProject.description,
              slug: state.currentProject.slug,
              platform: state.currentProject.platform,
              codeFiles: {},
              chatHistory: [],
              appConfig: state.currentProject.appConfig,
              githubRepo: state.currentProject.githubRepo,
              githubUrl: state.currentProject.githubUrl,
              subdomain: state.currentProject.subdomain,
              customDomain: state.currentProject.customDomain,
              domainVerified: state.currentProject.domainVerified,
              createdAt: state.currentProject.createdAt,
              updatedAt: state.currentProject.updatedAt,
            }
          : null,
        currentFile: state.currentFile,
      }),
    },
  ),
);
