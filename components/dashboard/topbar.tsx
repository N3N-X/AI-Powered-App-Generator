"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useProjectStore } from "@/stores/project-store";
import { useUserStore, useRemainingPrompts } from "@/stores/user-store";
import { useUIStore } from "@/stores/ui-store";
import {
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  Play,
  RefreshCw,
  Download,
  Github,
  Upload,
  Smartphone,
  Apple,
  Settings,
  ChevronDown,
  Zap,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import JSZip from "jszip";

export function Topbar() {
  const router = useRouter();
  const {
    currentProject,
    isGenerating,
    setIsGenerating,
    setCodeFiles,
    addMessage,
  } = useProjectStore();
  const { user, incrementUsage } = useUserStore();
  const remainingPrompts = useRemainingPrompts();
  const { sidebarOpen, toggleSidebar, openModal, showPreview, setShowPreview } =
    useUIStore();

  const handleGenerate = async () => {
    if (!currentProject || isGenerating) return;

    // Focus the chat input instead - generation happens through chat
    const chatInput = document.querySelector(
      'textarea[placeholder*="Describe"]',
    ) as HTMLTextAreaElement;
    if (chatInput) {
      chatInput.focus();
      toast({
        title: "Ready to generate",
        description: "Type your prompt in the chat to generate code",
      });
    }
  };

  const handleRefine = async () => {
    if (!currentProject || isGenerating) return;

    setIsGenerating(true);

    try {
      const response = await fetch("/api/vibe/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt:
            "Please review and refine the current code. Fix any bugs, improve performance, and enhance the user experience while keeping the same functionality.",
          projectId: currentProject.id,
          isRefine: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refine code");
      }

      const data = await response.json();

      // Add assistant message
      addMessage({
        role: "assistant",
        content: data.message || "I've refined your code with improvements.",
        model: data.model,
        codeChanges: data.codeFiles,
      });

      // Update code files
      if (data.codeFiles) {
        setCodeFiles({
          ...currentProject.codeFiles,
          ...data.codeFiles,
        });
      }

      incrementUsage();

      toast({
        title: "Code refined",
        description: `${Object.keys(data.codeFiles || {}).length} files updated`,
      });
    } catch (error) {
      console.error("Refine error:", error);
      toast({
        title: "Refine failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!currentProject) return;

    try {
      const zip = new JSZip();

      // Add all code files to the zip
      for (const [filePath, content] of Object.entries(
        currentProject.codeFiles,
      )) {
        zip.file(filePath, content);
      }

      // Generate the zip file
      const blob = await zip.generateAsync({ type: "blob" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentProject.name || "project"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Project exported",
        description: "Your project has been downloaded as a ZIP file",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export project",
        variant: "destructive",
      });
    }
  };

  const handleBuildAndroid = () => {
    openModal("settings"); // For now, open settings to connect accounts
  };

  const handleBuildIOS = () => {
    openModal("settings");
  };

  const handleLogoClick = () => {
    // Reset to dashboard view (deselect current project)
    useProjectStore.getState().setCurrentProject(null);
    router.push("/dashboard");
  };

  return (
    <TooltipProvider>
      <header className="h-14 border-b border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {/* Sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white hidden sm:inline">
              RUX
            </span>
          </button>

          {/* Project name */}
          {currentProject && (
            <>
              <span className="text-slate-600">/</span>
              <span className="text-sm text-slate-300 truncate max-w-[200px]">
                {currentProject.name}
              </span>
            </>
          )}
        </div>

        {/* Center section - Action buttons */}
        <div className="flex items-center gap-2">
          {/* Preview toggle button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showPreview ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!currentProject}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showPreview ? "Hide preview" : "Show preview"}
            </TooltipContent>
          </Tooltip>

          {/* Generate button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="gradient"
                size="sm"
                onClick={handleGenerate}
                disabled={!currentProject || isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Generate</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Generate code from your prompt</TooltipContent>
          </Tooltip>

          {/* Refine button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefine}
                disabled={!currentProject || isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Refine</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refine and improve existing code</TooltipContent>
          </Tooltip>

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!currentProject}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Download ZIP
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Github className="h-4 w-4 mr-2" />
                Create GitHub Repo
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Push to GitHub
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Build dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!currentProject}
                className="gap-2"
              >
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline">Build</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Build Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleBuildAndroid}>
                <Smartphone className="h-4 w-4 mr-2" />
                Build Android APK
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBuildIOS}>
                <Apple className="h-4 w-4 mr-2" />
                Build iOS IPA
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Prompts remaining */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                <Zap className="h-3 w-3" />
                <span>{remainingPrompts} prompts left</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Daily prompts remaining</TooltipContent>
          </Tooltip>

          {/* Plan badge with upgrade */}
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={user.plan === "FREE" ? "outline" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-1.5 h-7",
                    user.plan === "ELITE" &&
                      "text-amber-400 border-amber-400/30",
                    user.plan === "PRO" &&
                      "text-violet-400 border-violet-400/30",
                  )}
                  onClick={() => openModal("settings")}
                >
                  {user.plan === "FREE" ? (
                    <>
                      <span>Upgrade</span>
                      <Zap className="h-3 w-3" />
                    </>
                  ) : (
                    <span>{user.plan}</span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {user.plan === "FREE"
                  ? "Upgrade your plan"
                  : `Current plan: ${user.plan}`}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openModal("settings")}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          {/* User button */}
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      </header>
    </TooltipProvider>
  );
}
