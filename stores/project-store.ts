import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CodeFiles, ChatMessage, FileTreeNode, AppConfig } from "@/types";
import { codeFilesToTree, generateId } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  platform: "WEB" | "IOS" | "ANDROID";
  codeFiles: CodeFiles;
  chatHistory: ChatMessage[];
  appConfig: AppConfig | null;
  githubRepo: string | null;
  githubUrl: string | null;
  subdomain: string | null;
  customDomain: string | null;
  domainVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectState {
  // Current project
  currentProject: Project | null;
  currentFile: string | null;
  fileTree: FileTreeNode[];

  // All projects
  projects: Project[];

  // Chat history for current project
  messages: ChatMessage[];

  // UI state
  isGenerating: boolean;
  isSaving: boolean;
  unsavedChanges: boolean;

  // Actions - Projects
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Actions - Files
  setCurrentFile: (file: string | null) => void;
  updateCodeFile: (path: string, content: string) => void;
  deleteCodeFile: (path: string) => void;
  renameCodeFile: (oldPath: string, newPath: string) => void;
  setCodeFiles: (files: CodeFiles) => void;

  // Actions - Messages
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearMessages: () => void;

  // Actions - UI
  setIsGenerating: (isGenerating: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  setUnsavedChanges: (unsaved: boolean) => void;

  // Utilities
  refreshFileTree: () => void;
}

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

      // Project actions
      setCurrentProject: (project) => {
        // Load chat history from project's chatHistory field (stored in DB)
        let projectMessages: ChatMessage[] = [];
        if (project?.chatHistory) {
          try {
            const history = Array.isArray(project.chatHistory)
              ? project.chatHistory
              : [];
            projectMessages = history.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }));
          } catch (error) {
            console.error("Failed to load chat history:", error);
          }
        }

        set({
          currentProject: project,
          currentFile: project
            ? Object.keys(project.codeFiles)[0] || null
            : null,
          fileTree: project ? codeFilesToTree(project.codeFiles) : [],
          messages: projectMessages,
          unsavedChanges: false,
        });
      },

      setProjects: (projects) => set({ projects }),

      addProject: (project) => {
        set((state) => ({
          projects: [project, ...state.projects],
        }));
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p,
          ),
          currentProject:
            state.currentProject?.id === id
              ? { ...state.currentProject, ...updates, updatedAt: new Date() }
              : state.currentProject,
        }));
        get().refreshFileTree();
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject:
            state.currentProject?.id === id ? null : state.currentProject,
        }));
      },

      // File actions
      setCurrentFile: (file) => set({ currentFile: file }),

      updateCodeFile: (path, content) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedFiles = {
          ...currentProject.codeFiles,
          [path]: content,
        };

        set({
          currentProject: {
            ...currentProject,
            codeFiles: updatedFiles,
            updatedAt: new Date(),
          },
          unsavedChanges: true,
        });
        get().refreshFileTree();
      },

      deleteCodeFile: (path) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const { [path]: removed, ...rest } = currentProject.codeFiles;

        set({
          currentProject: {
            ...currentProject,
            codeFiles: rest,
            updatedAt: new Date(),
          },
          currentFile: get().currentFile === path ? null : get().currentFile,
          unsavedChanges: true,
        });
        get().refreshFileTree();
      },

      renameCodeFile: (oldPath, newPath) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const content = currentProject.codeFiles[oldPath];
        if (!content) return;

        const { [oldPath]: removed, ...rest } = currentProject.codeFiles;
        const updatedFiles = {
          ...rest,
          [newPath]: content,
        };

        set({
          currentProject: {
            ...currentProject,
            codeFiles: updatedFiles,
            updatedAt: new Date(),
          },
          currentFile:
            get().currentFile === oldPath ? newPath : get().currentFile,
          unsavedChanges: true,
        });
        get().refreshFileTree();
      },

      setCodeFiles: (files) => {
        const { currentProject } = get();
        if (!currentProject) return;

        set({
          currentProject: {
            ...currentProject,
            codeFiles: files,
            updatedAt: new Date(),
          },
          unsavedChanges: true,
        });
        get().refreshFileTree();
      },

      // Message actions
      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date(),
        };
        const { currentProject, messages } = get();
        const newMessages = [...messages, newMessage];

        set({ messages: newMessages });

        // Save to database
        if (currentProject) {
          fetch(`/api/projects/${currentProject.id}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: newMessages }),
          }).catch((error) => {
            console.error("Failed to save chat history:", error);
          });
        }
      },

      clearMessages: () => {
        const { currentProject } = get();
        set({ messages: [] });

        // Clear from database
        if (currentProject) {
          fetch(`/api/projects/${currentProject.id}/chat`, {
            method: "DELETE",
          }).catch((error) => {
            console.error("Failed to clear chat history:", error);
          });
        }
      },

      // UI actions
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setIsSaving: (isSaving) => set({ isSaving }),
      setUnsavedChanges: (unsaved) => set({ unsavedChanges: unsaved }),

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
        // Only persist essential data
        currentFile: state.currentFile,
        messages: state.messages,
      }),
    },
  ),
);
