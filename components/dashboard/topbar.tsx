"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
import { useUserStore, useRemainingCredits } from "@/stores/user-store";
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
  Sun,
  Moon,
  Monitor,
  Globe,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { DomainSettings } from "./domain-settings";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const {
    currentProject,
    isGenerating,
    setIsGenerating,
    setCodeFiles,
    addMessage,
  } = useProjectStore();
  const { user, hasGitHub } = useUserStore();
  const remainingCredits = useRemainingCredits();
  const {
    sidebarOpen,
    toggleSidebar,
    openModal,
    showPreview,
    setShowPreview,
    theme,
    setTheme,
  } = useUIStore();

  // Only show project actions on project editor pages
  const isProjectPage =
    pathname?.startsWith("/dashboard/generate/") && currentProject;

  // Domain settings modal state (only for WEB projects)
  const [domainSettingsOpen, setDomainSettingsOpen] = useState(false);
  const isWebProject = currentProject?.platform === "WEB";

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

  const handlePushToGithub = async () => {
    if (!currentProject) return;

    if (!hasGitHub) {
      toast({
        title: "GitHub not connected",
        description: "Connect your GitHub account in Settings to push code",
        variant: "destructive",
      });
      router.push("/dashboard/settings?tab=integrations");
      return;
    }

    try {
      // Check if repo exists or needs to be created
      if (!currentProject.githubRepo) {
        // Create new repo
        const response = await fetch("/api/github/create-repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: currentProject.id,
            repoName: currentProject.slug,
            isPrivate: true,
            description: currentProject.description || `Created with RUX`,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create GitHub repository");
        }

        toast({
          title: "Repository created",
          description: "Your code has been pushed to a new GitHub repository",
        });
      } else {
        // Push to existing repo
        const response = await fetch("/api/github/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: currentProject.id,
            commitMessage: `Update from RUX - ${new Date().toLocaleString()}`,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to push to GitHub");
        }

        toast({
          title: "Code pushed",
          description: "Your changes have been pushed to GitHub",
        });
      }
    } catch (error) {
      console.error("GitHub push error:", error);
      toast({
        title: "Push failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleBuildAndroid = async () => {
    if (!currentProject) return;

    try {
      const response = await fetch("/api/build/android", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: currentProject.id,
          platform: "ANDROID",
          profile: "production",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start build");
      }

      toast({
        title: "Build started",
        description:
          "Your Android build has been queued. Check the Builds page for status.",
      });

      router.push("/dashboard/builds");
    } catch (error) {
      console.error("Android build error:", error);
      toast({
        title: "Build failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleBuildIOS = async () => {
    if (!currentProject) return;

    try {
      const response = await fetch("/api/build/ios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: currentProject.id,
          platform: "IOS",
          profile: "production",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start build");
      }

      toast({
        title: "Build started",
        description:
          "Your iOS build has been queued. Check the Builds page for status.",
      });

      router.push("/dashboard/builds");
    } catch (error) {
      console.error("iOS build error:", error);
      toast({
        title: "Build failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleLogoClick = () => {
    // Reset to dashboard view (deselect current project)
    useProjectStore.getState().setCurrentProject(null);
    router.push("/dashboard");
  };

  const handleThemeToggle = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  const getThemeIcon = () => {
    if (theme === "light") return <Sun className="h-4 w-4" />;
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <TooltipProvider>
      <header className="h-14 border-b border-gray-300/50 dark:border-white/20 bg-blue-50/90 dark:bg-black/20 backdrop-blur-3xl shadow-xl dark:shadow-2xl flex items-center justify-between px-4">
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
            className="flex items-center gap-2 hover:opacity-80 transition-opacity bg-blue-50/90 dark:bg-black/20 backdrop-blur-3xl shadow-xl dark:shadow-2xl rounded-lg px-3 py-2 border border-gray-300/50 dark:border-white/20"
          >
            <div className="flex h-8 w-8 items-center justify-center">
              <Sparkles className="h-4 w-4 text-black dark:text-white" />
            </div>
            <span className="font-semibold text-black dark:text-white hidden sm:inline">
              RUX
            </span>
          </button>
        </div>

        {/* Center section - Project Actions (only on project editor pages) */}
        {isProjectPage && (
          <div className="flex items-center gap-2">
            {/* Export */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden md:inline">Export</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download project as ZIP</TooltipContent>
            </Tooltip>

            {/* Domain Settings (WEB only) */}
            {isWebProject && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
                    onClick={() => setDomainSettingsOpen(true)}
                  >
                    <Globe className="h-4 w-4" />
                    <span className="hidden md:inline">Domain</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Configure domain settings</TooltipContent>
              </Tooltip>
            )}

            {/* Push to GitHub */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
                  onClick={handlePushToGithub}
                  disabled={!hasGitHub}
                >
                  <Github className="h-4 w-4" />
                  <span className="hidden md:inline">Push</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {hasGitHub ? "Push to GitHub" : "Connect GitHub in Settings"}
              </TooltipContent>
            </Tooltip>

            {/* Build */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                    >
                      <Smartphone className="h-4 w-4" />
                      <span className="hidden md:inline">Build</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Build your app</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Build Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleBuildAndroid}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Android APK
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBuildIOS}>
                  <Apple className="h-4 w-4 mr-2" />
                  iOS Build
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-6 w-px bg-gray-300 dark:bg-white/10 mx-1" />
          </div>
        )}

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Credits remaining - only on project pages */}
          {isProjectPage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                  <Zap className="h-3 w-3" />
                  <span>{remainingCredits.toLocaleString()} credits</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Credits remaining</TooltipContent>
            </Tooltip>
          )}

          {/* Plan badge with upgrade */}
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                {user.plan === "FREE" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-7"
                    asChild
                  >
                    <Link href="/dashboard/settings?tab=billing">
                      <span>Upgrade</span>
                      <Zap className="h-3 w-3" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-1.5 h-7",
                      user.plan === "ELITE" &&
                        "text-amber-400 border-amber-400/30",
                      user.plan === "PRO" &&
                        "text-violet-400 border-violet-400/30",
                    )}
                    asChild
                  >
                    <Link href="/dashboard/settings?tab=billing">
                      <span>{user.plan}</span>
                    </Link>
                  </Button>
                )}
              </TooltipTrigger>
              <TooltipContent>
                {user.plan === "FREE"
                  ? "Upgrade your plan"
                  : `Current plan: ${user.plan}`}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleThemeToggle}
              >
                {getThemeIcon()}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Theme:{" "}
              {theme === "system"
                ? "System"
                : theme === "light"
                  ? "Light"
                  : "Dark"}
            </TooltipContent>
          </Tooltip>

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

          {/* User Menu */}
          {!authLoading && authUser && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {authUser.user_metadata?.avatar_url ? (
                          <img
                            src={authUser.user_metadata.avatar_url}
                            alt="Profile"
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          authUser.user_metadata?.display_name?.[0] ||
                          authUser.user_metadata?.full_name?.[0] ||
                          authUser.email?.[0]?.toUpperCase()
                        )}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Account</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {authUser.user_metadata?.display_name ||
                        authUser.user_metadata?.full_name ||
                        "User"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      {authUser.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/user-profile")}>
                  <UserIcon className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/settings")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    router.push("/");
                  }}
                  className="text-red-600 dark:text-red-400"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Domain Settings Modal (WEB projects only) */}
      {currentProject && isWebProject && (
        <DomainSettings
          projectId={currentProject.id}
          open={domainSettingsOpen}
          onOpenChange={setDomainSettingsOpen}
        />
      )}
    </TooltipProvider>
  );
}
