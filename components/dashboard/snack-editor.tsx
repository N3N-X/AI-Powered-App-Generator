"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { Snack, SnackFiles } from "snack-sdk";
import type { SnackState } from "snack-sdk";
import Editor from "@monaco-editor/react";
import { useProjectStore } from "@/stores/project-store";
import { getLanguageForFile } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Copy,
  Check,
  Maximize2,
  Minimize2,
  FileCode,
  X,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Smartphone,
  Monitor,
  RefreshCw,
  QrCode,
  ExternalLink,
  Globe,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import QRCode from "qrcode";

// Updated to SDK 54
const SNACK_SDK_VERSION = "54.0.0";

type PreviewPlatform = "web" | "ios" | "android";

// File tree node type for recursive structure
type FileTreeNode = {
  [key: string]: FileTreeNode | string[] | undefined;
};

interface SnackEditorProps {
  className?: string;
}

export function SnackEditor({ className }: SnackEditorProps) {
  const {
    currentProject,
    currentFile,
    setCurrentFile,
    updateCodeFile,
    setUnsavedChanges,
    unsavedChanges,
  } = useProjectStore();

  // Snack SDK instance (only used for iOS/Android)
  const [snack, setSnack] = useState<InstanceType<typeof Snack> | null>(null);
  const [snackState, setSnackState] = useState<SnackState | null>(null);
  const webPreviewRef = useRef<{ current: Window | null }>({ current: null });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const webPreviewIframeRef = useRef<HTMLIFrameElement>(null);

  // UI state
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["src"]),
  );
  const [previewPlatform, setPreviewPlatform] =
    useState<PreviewPlatform>("web");
  const [isOnline, setIsOnline] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [webPreviewKey, setWebPreviewKey] = useState(0); // For forcing iframe refresh

  // Track previous project ID and initialization
  const [prevProjectId, setPrevProjectId] = useState<string | null>(null);
  const [hasInitializedTabs, setHasInitializedTabs] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);

  // Determine if this is a WEB platform project
  const isWebProject = currentProject?.platform === "WEB";

  // Convert project code files to Snack files format
  const convertToSnackFiles = useCallback(
    (codeFiles: Record<string, string>): SnackFiles => {
      const snackFiles: SnackFiles = {};
      Object.entries(codeFiles).forEach(([path, content]) => {
        snackFiles[path] = {
          type: "CODE",
          contents: content,
        };
      });
      return snackFiles;
    },
    [],
  );

  // Reset tabs when project changes
  useEffect(() => {
    if (!currentProject) return;

    // Only reset when project ID actually changes
    if (currentProject.id !== prevProjectId) {
      setPrevProjectId(currentProject.id);
      setHasInitializedTabs(false);
      setOpenTabs([]);
      setIsLoading(true);
    }
  }, [currentProject?.id, prevProjectId]);

  // Initialize tabs once per project
  useEffect(() => {
    if (!currentProject || hasInitializedTabs) return;

    const files = Object.keys(currentProject.codeFiles || {});
    const firstFile =
      files.find((f) => f === "App.tsx" || f === "App.js") || files[0];

    if (firstFile) {
      setOpenTabs([firstFile]);
      setCurrentFile(firstFile);
    }

    setHasInitializedTabs(true);
    setIsLoading(false);
  }, [currentProject, hasInitializedTabs, setCurrentFile]);

  // Initialize Snack SDK only for iOS/Android projects
  useEffect(() => {
    // Don't use Snack for WEB projects
    if (!currentProject || isWebProject) {
      setSnack(null);
      setSnackState(null);
      return;
    }

    // Create new Snack instance with SDK 54
    const snackInstance = new Snack({
      name: currentProject.name || "RUX App",
      description: currentProject.description || "Generated with RUX",
      sdkVersion: SNACK_SDK_VERSION,
      files: convertToSnackFiles(currentProject.codeFiles || {}),
      dependencies: {
        "expo-status-bar": { version: "*" },
        "expo-blur": { version: "*" },
        "expo-haptics": { version: "*" },
        "expo-linear-gradient": { version: "*" },
        "react-native-safe-area-context": { version: "*" },
        "@expo/vector-icons": { version: "*" },
        "@react-navigation/native": { version: "*" },
        "@react-navigation/native-stack": { version: "*" },
        "@react-navigation/bottom-tabs": { version: "*" },
        "react-native-screens": { version: "*" },
      },
      online: true, // Enable online mode for device previews
      codeChangesDelay: 500,
      webPreviewRef: webPreviewRef.current,
    });

    // Listen for state changes
    const unsubscribeState = snackInstance.addStateListener(
      (state: SnackState) => {
        setSnackState(state);
        setIsLoading(false);

        // Generate QR code when online
        if (state.online && state.url) {
          QRCode.toDataURL(state.url, { width: 200, margin: 2 })
            .then(setQrCodeUrl)
            .catch(console.error);
          setIsOnline(true);
        }
      },
    );

    setSnack(snackInstance);
    setSnackState(snackInstance.getState());

    return () => {
      unsubscribeState();
    };
  }, [currentProject?.id, isWebProject, convertToSnackFiles]);

  // Update Snack files when project code changes (iOS/Android only)
  useEffect(() => {
    if (!snack || !currentProject?.codeFiles || isWebProject) return;

    const snackFiles = convertToSnackFiles(currentProject.codeFiles);
    snack.updateFiles(snackFiles);
  }, [currentProject?.codeFiles, snack, convertToSnackFiles, isWebProject]);

  // Refresh web preview when code changes (WEB projects only)
  useEffect(() => {
    if (!isWebProject || !currentProject?.codeFiles) return;

    // Debounce the refresh to avoid too many reloads
    const timeoutId = setTimeout(() => {
      setWebPreviewKey((prev) => prev + 1);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [currentProject?.codeFiles, isWebProject]);

  // Handle iframe load - connect to Snack SDK
  const handleIframeLoad = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      webPreviewRef.current.current = iframeRef.current.contentWindow;
      setIsLoading(false);
    }
  }, []);

  // Handle editor content change - updates local state and preview immediately
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined && currentFile && currentProject) {
        const currentContent = currentProject.codeFiles?.[currentFile] || "";
        if (value !== currentContent) {
          updateCodeFile(currentFile, value);
          setUnsavedChanges(true);

          // Update Snack for iOS/Android projects (live preview)
          if (snack && !isWebProject) {
            snack.updateFiles({
              [currentFile]: {
                type: "CODE",
                contents: value,
              },
            });
          }
        }
      }
    },
    [
      currentFile,
      currentProject,
      snack,
      isWebProject,
      updateCodeFile,
      setUnsavedChanges,
    ],
  );

  // Manual save to database
  const handleSave = useCallback(async () => {
    if (!currentProject?.id) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${currentProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codeFiles: currentProject.codeFiles,
        }),
      });

      if (response.ok) {
        setUnsavedChanges(false);
        toast({
          title: "Saved",
          description: "Changes saved successfully",
        });
      } else {
        throw new Error("Save failed");
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        title: "Save failed",
        description: "Could not save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentProject?.id, currentProject?.codeFiles, setUnsavedChanges]);

  const handleCopy = () => {
    if (currentContent) {
      navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
    }
  };

  const handleCloseTab = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenTabs((prev) => prev.filter((tab) => tab !== filePath));
    if (currentFile === filePath) {
      const remainingTabs = openTabs.filter((tab) => tab !== filePath);
      setCurrentFile(remainingTabs[remainingTabs.length - 1] || null);
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const handleRefreshPreview = useCallback(() => {
    setIsLoading(true);

    if (isWebProject) {
      // Force refresh the web preview iframe
      setWebPreviewKey((prev) => prev + 1);
      setTimeout(() => setIsLoading(false), 1000);
    } else if (snack) {
      snack.sendCodeChanges();
      setTimeout(() => setIsLoading(false), 2000);
    }
  }, [snack, isWebProject]);

  const openInSnack = useCallback(() => {
    if (snackState?.id) {
      window.open(`https://snack.expo.dev/${snackState.id}`, "_blank");
    } else if (snackState?.url) {
      window.open(snackState.url, "_blank");
    }
  }, [snackState]);

  // Add file to open tabs when selected (only after initialization)
  useEffect(() => {
    if (currentFile && hasInitializedTabs && !openTabs.includes(currentFile)) {
      setOpenTabs((prev) => [...prev, currentFile]);
    }
  }, [currentFile, hasInitializedTabs, openTabs]);

  // Build file tree structure
  const fileTree = useMemo((): FileTreeNode => {
    if (!currentProject?.codeFiles) return {};

    const tree: FileTreeNode = {};
    const files = Object.keys(currentProject.codeFiles);

    files.forEach((filePath) => {
      const parts = filePath.split("/");
      let current: FileTreeNode = tree;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          const files = current._files as string[] | undefined;
          if (!files) current._files = [];
          (current._files as string[]).push(filePath);
        } else {
          if (!current[part]) current[part] = {};
          current = current[part] as FileTreeNode;
        }
      });
    });

    return tree;
  }, [currentProject?.codeFiles]);

  // Render file tree
  const renderFileTree = useCallback(
    (tree: FileTreeNode, basePath = ""): React.ReactNode[] => {
      const items: React.ReactNode[] = [];

      Object.keys(tree).forEach((key) => {
        if (key === "_files") return;

        const folderPath = basePath ? `${basePath}/${key}` : key;
        const isExpanded = expandedFolders.has(folderPath);

        items.push(
          <div key={folderPath}>
            <button
              onClick={() => toggleFolder(folderPath)}
              className="w-full flex items-center gap-1.5 px-2 py-1 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-violet-400" />
              ) : (
                <Folder className="h-4 w-4 text-violet-400" />
              )}
              <span>{key}</span>
            </button>
            {isExpanded && (
              <div className="ml-4 border-l border-white/10 pl-2">
                {renderFileTree(tree[key] as FileTreeNode, folderPath)}
              </div>
            )}
          </div>,
        );
      });

      const filesInTree = tree._files as string[] | undefined;
      if (filesInTree) {
        filesInTree.forEach((filePath: string) => {
          const fileName = filePath.split("/").pop() || filePath;
          const isActive = currentFile === filePath;

          items.push(
            <button
              key={filePath}
              onClick={() => setCurrentFile(filePath)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1 text-sm rounded transition-colors",
                isActive
                  ? "bg-violet-500/20 text-violet-300 border-l-2 border-violet-500"
                  : "text-slate-400 hover:text-white hover:bg-white/5",
              )}
            >
              <File className="h-3.5 w-3.5" />
              <span className="truncate">{fileName}</span>
            </button>,
          );
        });
      }

      return items;
    },
    [expandedFolders, currentFile, setCurrentFile],
  );

  const currentContent =
    (currentFile && currentProject?.codeFiles?.[currentFile]) || "";
  const language = currentFile ? getLanguageForFile(currentFile) : "typescript";

  // Get web preview URL - use subdomain for WEB projects, Snack for others
  const webPreviewUrl = useMemo(() => {
    if (isWebProject && currentProject?.subdomain) {
      // Use our own serve endpoint for web projects
      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      return `${baseUrl}/api/serve?subdomain=${currentProject.subdomain}&_t=${webPreviewKey}`;
    }
    // Fall back to Snack web preview for iOS/Android
    if (previewPlatform === "web" && snackState?.webPreviewURL) {
      return snackState.webPreviewURL;
    }
    return null;
  }, [
    isWebProject,
    currentProject?.subdomain,
    webPreviewKey,
    previewPlatform,
    snackState?.webPreviewURL,
  ]);

  // Connected clients count
  const connectedClientsCount = snackState
    ? Object.keys(snackState.connectedClients || {}).length
    : 0;

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-black/20 backdrop-blur-xl text-slate-400">
        <div className="text-center">
          <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No project selected</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "h-full flex bg-black/10",
          isFullscreen && "fixed inset-0 z-50",
          className,
        )}
      >
        {/* File Explorer */}
        <div className="w-56 border-r border-white/5 bg-black/20 backdrop-blur-xl flex flex-col">
          <div className="px-3 py-3 border-b border-white/5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Explorer
            </h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">{renderFileTree(fileTree)}</div>
          </ScrollArea>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
          {/* Tab bar */}
          <div className="flex items-center justify-between border-b border-white/5 bg-black/20">
            <div className="flex-1 flex items-center overflow-x-auto hide-scrollbar">
              {openTabs.map((filePath) => {
                const fileName = filePath.split("/").pop() || filePath;
                const isActive = filePath === currentFile;

                return (
                  <div
                    key={filePath}
                    onClick={() => setCurrentFile(filePath)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 text-sm border-r border-white/5 transition-colors group cursor-pointer",
                      isActive
                        ? "bg-white/5 text-white border-b-2 border-b-violet-500"
                        : "text-slate-400 hover:text-white hover:bg-white/5",
                    )}
                  >
                    <span className="truncate max-w-[120px]">{fileName}</span>
                    <button
                      onClick={(e) => handleCloseTab(filePath, e)}
                      className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-1 px-3">
              {/* Save button - always visible */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7",
                      isSaving
                        ? "text-violet-400"
                        : unsavedChanges
                          ? "text-yellow-500 hover:text-yellow-400"
                          : "text-slate-400 hover:text-white",
                    )}
                    onClick={handleSave}
                    disabled={isSaving || !unsavedChanges}
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSaving
                    ? "Saving..."
                    : unsavedChanges
                      ? "Save changes"
                      : "All changes saved"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-white"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy code</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-white"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 min-h-0">
            {currentFile ? (
              <Editor
                height="100%"
                language={language}
                value={currentContent}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  readOnly: false,
                  automaticLayout: true,
                  fontSize: 13,
                  lineNumbers: "on",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  tabSize: 2,
                  formatOnPaste: true,
                  formatOnType: true,
                  padding: { top: 16 },
                }}
                loading={
                  <div className="flex items-center justify-center h-full bg-black/20">
                    <div className="text-slate-400">Loading editor...</div>
                  </div>
                }
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a file to edit</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-[500px] flex flex-col bg-black/20 backdrop-blur-xl">
          {/* Preview Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  isLoading
                    ? "bg-yellow-500 animate-pulse"
                    : isWebProject || isOnline
                      ? "bg-emerald-500"
                      : "bg-slate-500",
                )}
              />
              <span className="text-sm font-medium text-white">Preview</span>
              {isWebProject && currentProject?.subdomain && (
                <span className="text-xs text-slate-500">
                  {currentProject.subdomain}.rux.sh
                </span>
              )}
              {!isWebProject && connectedClientsCount > 0 && (
                <span className="text-xs text-slate-500">
                  ({connectedClientsCount} device
                  {connectedClientsCount > 1 ? "s" : ""})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Platform selector - only show for iOS/Android projects */}
              {!isWebProject && (
                <>
                  <div className="flex items-center bg-white/5 rounded-lg p-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setPreviewPlatform("web")}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            previewPlatform === "web"
                              ? "bg-violet-500 text-white shadow-lg"
                              : "text-slate-400 hover:text-white hover:bg-white/10",
                          )}
                        >
                          <Monitor className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Web</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setPreviewPlatform("ios")}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            previewPlatform === "ios"
                              ? "bg-violet-500 text-white shadow-lg"
                              : "text-slate-400 hover:text-white hover:bg-white/10",
                          )}
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>iOS</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setPreviewPlatform("android")}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            previewPlatform === "android"
                              ? "bg-violet-500 text-white shadow-lg"
                              : "text-slate-400 hover:text-white hover:bg-white/10",
                          )}
                        >
                          <Smartphone className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Android</TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="w-px h-5 bg-white/10" />
                </>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-white"
                    onClick={handleRefreshPreview}
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", isLoading && "animate-spin")}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>

              {!isWebProject && previewPlatform !== "web" && qrCodeUrl && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-white"
                      onClick={() => setShowQrCode(!showQrCode)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>QR Code</TooltipContent>
                </Tooltip>
              )}

              {isWebProject && currentProject?.subdomain && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-white"
                      onClick={() =>
                        window.open(
                          `/api/serve?subdomain=${currentProject.subdomain}`,
                          "_blank",
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open in New Tab</TooltipContent>
                </Tooltip>
              )}

              {!isWebProject && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-white"
                      onClick={openInSnack}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open in Snack</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 relative flex items-center justify-center p-2 overflow-hidden">
            {/* QR Code Modal for iOS/Android */}
            {!isWebProject &&
              showQrCode &&
              qrCodeUrl &&
              previewPlatform !== "web" && (
                <div className="absolute inset-0 z-10 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                    <h3 className="text-lg font-semibold mb-4 text-white">
                      Scan with Expo Go
                    </h3>
                    <div className="bg-white p-3 rounded-xl inline-block">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <p className="mt-4 text-sm text-slate-400">
                      Open Expo Go on your{" "}
                      {previewPlatform === "ios" ? "iPhone" : "Android"} and
                      scan
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setShowQrCode(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}

            {/* WEB Project Preview - use subdomain serve */}
            {isWebProject ? (
              <div className="w-full h-full rounded-lg overflow-hidden border border-white/10">
                {webPreviewUrl ? (
                  <iframe
                    ref={webPreviewIframeRef}
                    key={webPreviewKey}
                    src={webPreviewUrl}
                    className="w-full h-full border-0 bg-white"
                    title="Web Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                    allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/20">
                    <div className="text-center text-slate-400">
                      <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No subdomain assigned</p>
                      <p className="text-xs mt-2">
                        Create a new project to get a preview URL
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : previewPlatform !== "web" ? (
              // iOS/Android - Show QR Code instructions
              <div className="text-center text-slate-400">
                <Smartphone className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2 text-white">
                  Preview on {previewPlatform === "ios" ? "iOS" : "Android"}
                </h3>
                <p className="text-sm mb-4 max-w-xs mx-auto">
                  Install Expo Go app and scan the QR code to see live updates
                  on your{" "}
                  {previewPlatform === "ios" ? "iPhone" : "Android device"}.
                </p>
                {qrCodeUrl ? (
                  <Button
                    onClick={() => setShowQrCode(true)}
                    className="bg-violet-500 hover:bg-violet-600"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Show QR Code
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Connecting...</span>
                  </div>
                )}
                {connectedClientsCount > 0 && (
                  <p className="mt-4 text-xs text-emerald-400">
                    {connectedClientsCount} device
                    {connectedClientsCount > 1 ? "s" : ""} connected
                  </p>
                )}
              </div>
            ) : (
              // Snack Web Preview for iOS/Android projects
              <div className="w-full h-full rounded-lg overflow-hidden border border-white/10">
                {webPreviewUrl ? (
                  <iframe
                    ref={iframeRef}
                    src={webPreviewUrl}
                    className="w-full h-full border-0 bg-white"
                    title="Web Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                    allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone"
                    onLoad={handleIframeLoad}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/20">
                    <div className="text-center text-slate-400">
                      <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Initializing preview...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-slate-400">Loading preview...</p>
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="px-4 py-2 border-t border-white/5 text-xs text-slate-500 flex items-center justify-between">
            <span>
              {isWebProject ? "Web Preview" : `Expo SDK ${SNACK_SDK_VERSION}`}
            </span>
            <span className="flex items-center gap-2">
              {isSaving && (
                <span className="flex items-center gap-1 text-violet-400">
                  <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              )}
              {!isSaving &&
                (isWebProject
                  ? "Live"
                  : snackState?.unsaved
                    ? "Unsaved changes"
                    : "Synced")}
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
