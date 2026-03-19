import { CodeFiles, ChatMessage, FileTreeNode, AppConfig } from "@/types";

// Activity feed items shown during generation
export interface ActivityItem {
  id: string;
  type:
    | "thinking"
    | "file_edit"
    | "file_read"
    | "command"
    | "message"
    | "todo_list";
  label: string;
  status: "active" | "done";
  detail?: string;
  paths?: string[];
  timestamp: number;
}

// Generation phase tracking
export type GenerationPhase =
  | "idle"
  | "planning"
  | "generating"
  | "validating"
  | "complete"
  | "error";

export interface Project {
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

export interface ProjectState {
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

  // Generation state
  generationPhase: GenerationPhase;
  generationMessage: string;
  generationNotice: string | null;
  streamText: string;
  activityItems: ActivityItem[];

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

  // Actions - Generation
  setGenerationPhase: (phase: GenerationPhase, message?: string) => void;
  setGenerationNotice: (notice: string | null) => void;
  appendStreamText: (delta: string) => void;
  addActivityItem: (item: ActivityItem) => void;
  updateActivityItem: (id: string, updates: Partial<ActivityItem>) => void;
  clearGenerationState: () => void;

  // Utilities
  refreshFileTree: () => void;
}
