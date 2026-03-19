import { ChatMessage, CodeFiles } from "@/types";
import { codeFilesToTree, generateId } from "@/lib/utils";
import { Project, ProjectState } from "./project-store-types";

type StoreGet = () => ProjectState;
type StoreSet = {
  (partial: Partial<ProjectState>): void;
  (fn: (state: ProjectState) => Partial<ProjectState>): void;
};

export function createProjectActions(set: StoreSet, get: StoreGet) {
  return {
    setCurrentProject: (project: Project | null) => {
      const {
        currentProject: prev,
        messages: currentMessages,
        isGenerating,
      } = get();

      const isSameProject = prev && project && prev.id === project.id;
      const hasInMemoryMessages = currentMessages.length > 0;

      let projectMessages: ChatMessage[] = [];
      if (!isSameProject || (!hasInMemoryMessages && !isGenerating)) {
        if (project?.chatHistory) {
          try {
            const history = Array.isArray(project.chatHistory)
              ? project.chatHistory
              : [];
            const seenIds = new Set<string>();
            projectMessages = history.map((msg: any) => {
              let id = msg.id || generateId();
              while (seenIds.has(id)) id = generateId();
              seenIds.add(id);
              return {
                ...msg,
                id,
                timestamp: new Date(msg.timestamp),
              };
            });
          } catch (error) {
            console.error("Failed to load chat history:", error);
          }
        }
      } else {
        projectMessages = currentMessages;
      }

      set({
        currentProject: project,
        currentFile: project ? Object.keys(project.codeFiles)[0] || null : null,
        fileTree: project ? codeFilesToTree(project.codeFiles) : [],
        messages: projectMessages,
        unsavedChanges: false,
      });
    },

    setProjects: (projects: Project[]) => set({ projects }),

    addProject: (project: Project) => {
      set((state) => ({
        projects: [project, ...state.projects],
      }));
    },

    updateProject: (id: string, updates: Partial<Project>) => {
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

    deleteProject: (id: string) => {
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject:
          state.currentProject?.id === id ? null : state.currentProject,
      }));
    },
  };
}

export function createFileActions(set: StoreSet, get: StoreGet) {
  return {
    setCurrentFile: (file: string | null) => set({ currentFile: file }),

    updateCodeFile: (path: string, content: string) => {
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

    deleteCodeFile: (path: string) => {
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

    renameCodeFile: (oldPath: string, newPath: string) => {
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

    setCodeFiles: (files: CodeFiles) => {
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
  };
}

export function createMessageActions(set: StoreSet, get: StoreGet) {
  return {
    addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => {
      const newMessage: ChatMessage = {
        ...message,
        id: generateId(),
        timestamp: new Date(),
      };
      const { currentProject, messages } = get();
      const newMessages = [...messages, newMessage];

      set({ messages: newMessages });

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

      if (currentProject) {
        fetch(`/api/projects/${currentProject.id}/chat`, {
          method: "DELETE",
        }).catch((error) => {
          console.error("Failed to clear chat history:", error);
        });
      }
    },
  };
}
