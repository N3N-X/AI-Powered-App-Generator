import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light" | "system";
type SidebarTab = "projects" | "files";
type RightPanelTab = "editor" | "preview";
type WorkspaceMode = "simple" | "advanced";

interface UIState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Sidebar
  sidebarOpen: boolean;
  sidebarTab: SidebarTab;
  sidebarWidth: number;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setSidebarWidth: (width: number) => void;

  // Right panel (editor/preview)
  rightPanelTab: RightPanelTab;
  rightPanelWidth: number;
  showPreview: boolean;
  previewDeviceFrame: "none" | "iphone" | "android" | "tablet" | "desktop";
  setRightPanelTab: (tab: RightPanelTab) => void;
  setRightPanelWidth: (width: number) => void;
  setShowPreview: (show: boolean) => void;
  setPreviewDeviceFrame: (
    frame: "none" | "iphone" | "android" | "tablet" | "desktop",
  ) => void;

  // Modals
  activeModal:
    | null
    | "new-project"
    | "settings"
    | "export"
    | "github-connect"
    | "apple-connect"
    | "google-connect"
    | "upgrade"
    | "refill-credits";
  modalData: unknown;
  openModal: (modal: UIState["activeModal"], data?: unknown) => void;
  closeModal: () => void;

  // Toasts/Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Build status panel
  showBuildPanel: boolean;
  setShowBuildPanel: (show: boolean) => void;

  // Workspace mode (simple vs advanced IDE)
  workspaceMode: WorkspaceMode;
  setWorkspaceMode: (mode: WorkspaceMode) => void;

  // Preview readiness — gate preview visibility until generation completes
  previewReady: boolean;
  setPreviewReady: (ready: boolean) => void;

  // Console errors captured from preview iframe
  consoleErrors: { level: string; message: string; timestamp: number }[];
  addConsoleError: (error: {
    level: string;
    message: string;
    timestamp: number;
  }) => void;
  clearConsoleErrors: () => void;

  // Resizable panel sizes (percentages)
  panelSizes: {
    advancedExplorer: number;
    advancedEditor: number;
    advancedChat: number;
    simpleChat: number;
    simplePreview: number;
    editorPreviewSplit: number;
  };
  setPanelSizes: (sizes: Partial<UIState["panelSizes"]>) => void;
  resetPanelSizes: () => void;
}

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

let notificationId = 0;

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Theme
      theme: "system",
      setTheme: (theme) => set({ theme }),

      // Sidebar
      sidebarOpen: true,
      sidebarTab: "projects",
      sidebarWidth: 280,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarTab: (tab) => set({ sidebarTab: tab }),
      setSidebarWidth: (width) =>
        set({ sidebarWidth: Math.max(200, Math.min(400, width)) }),

      // Right panel
      rightPanelTab: "editor",
      rightPanelWidth: 500,
      showPreview: true,
      previewDeviceFrame: "iphone",
      setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
      setRightPanelWidth: (width) =>
        set({ rightPanelWidth: Math.max(300, Math.min(800, width)) }),
      setShowPreview: (show) => set({ showPreview: show }),
      setPreviewDeviceFrame: (frame) => set({ previewDeviceFrame: frame }),

      // Modals
      activeModal: null,
      modalData: null,
      openModal: (modal, data = null) =>
        set({ activeModal: modal, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),

      // Notifications
      notifications: [],
      addNotification: (notification) => {
        const id = `notification-${++notificationId}`;
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id }],
        }));

        // Auto-remove after duration
        if (notification.duration !== 0) {
          setTimeout(() => {
            set((state) => ({
              notifications: state.notifications.filter((n) => n.id !== id),
            }));
          }, notification.duration || 5000);
        }
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),

      // Build panel
      showBuildPanel: false,
      setShowBuildPanel: (show) => set({ showBuildPanel: show }),

      // Workspace mode
      workspaceMode: "simple",
      setWorkspaceMode: (mode) => set({ workspaceMode: mode }),

      // Preview readiness
      previewReady: true,
      setPreviewReady: (ready) => set({ previewReady: ready }),

      // Console errors from preview iframe
      consoleErrors: [],
      addConsoleError: (error) =>
        set((state) => ({
          consoleErrors: [...state.consoleErrors, error].slice(-50), // Keep last 50
        })),
      clearConsoleErrors: () => set({ consoleErrors: [] }),

      // Resizable panel sizes (percentages)
      panelSizes: {
        advancedExplorer: 15,
        advancedEditor: 50,
        advancedChat: 35,
        simpleChat: 40,
        simplePreview: 60,
        editorPreviewSplit: 50,
      },
      setPanelSizes: (sizes) =>
        set((state) => ({
          panelSizes: { ...state.panelSizes, ...sizes },
        })),
      resetPanelSizes: () =>
        set({
          panelSizes: {
            advancedExplorer: 15,
            advancedEditor: 50,
            advancedChat: 35,
            simpleChat: 40,
            simplePreview: 60,
            editorPreviewSplit: 50,
          },
        }),
    }),
    {
      name: "rux-ui-store",
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
        rightPanelWidth: state.rightPanelWidth,
        showPreview: state.showPreview,
        previewDeviceFrame: state.previewDeviceFrame,
        workspaceMode: state.workspaceMode,
        panelSizes: state.panelSizes,
      }),
    },
  ),
);
