"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserStore } from "@/stores/user-store";
import { useUIStore } from "@/stores/ui-store";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  BarChart3,
  Key,
  Hammer,
  Zap,
  FileCode,
  Sparkles,
  Menu,
  X,
  Shield,
  User as UserIcon,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { title: "Generate", href: "/dashboard/generate", icon: Zap },
  { title: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { title: "Files", href: "/dashboard/files", icon: FileCode },
  { title: "Builds", href: "/dashboard/builds", icon: Hammer, badge: "Pro" },
  { title: "API Keys", href: "/dashboard/api-keys", icon: Key },
  { title: "Usage", href: "/dashboard/usage", icon: BarChart3 },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const { user } = useUserStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-white dark:bg-[#0a0a0f] overflow-hidden">
        {/* Liquid Glass Background - Animated like landing page */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-blue-400/15 via-blue-300/8 to-transparent rounded-full blur-[140px] animate-pulse" />
          <div
            className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-gradient-radial from-purple-400/12 via-purple-300/6 to-transparent rounded-full blur-[160px] animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-radial from-cyan-300/5 via-transparent to-transparent rounded-full blur-[100px]" />
          <div
            className="absolute top-10 right-20 w-[300px] h-[300px] bg-gradient-radial from-green-400/8 via-green-300/4 to-transparent rounded-full blur-[80px] animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-gradient-radial from-rose-400/6 via-rose-300/3 to-transparent rounded-full blur-[120px] animate-pulse"
            style={{ animationDelay: "0.5s" }}
          />
        </div>

        {/* Topbar with Navigation */}
        <header className="bg-white/80 dark:bg-black/30 backdrop-blur-3xl border-b border-gray-200/50 dark:border-white/10 shrink-0">
          <div className="flex items-center justify-between px-6 h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-lg">
                RUX
              </span>
            </Link>

            {/* Horizontal Navigation - visible on md and up */}
            <nav className="hidden md:flex items-center gap-1 flex-1 justify-center mx-4">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium",
                      active
                        ? "bg-violet-500/20 dark:bg-violet-500/20 text-violet-700 dark:text-white border border-violet-500/30"
                        : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active && "text-violet-400",
                      )}
                    />
                    <span>{item.title}</span>
                    {item.badge && (
                      <Badge variant="premium" className="text-xs px-1.5 py-0">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}

              {/* Admin Link - only visible to admins */}
              {isAdmin && (
                <Link
                  href="/dashboard/admin"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium",
                    pathname.startsWith("/dashboard/admin")
                      ? "bg-red-500/20 dark:bg-red-500/20 text-red-700 dark:text-white border border-red-500/30"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10",
                  )}
                >
                  <Shield
                    className={cn(
                      "h-4 w-4 shrink-0",
                      pathname.startsWith("/dashboard/admin") && "text-red-400",
                    )}
                  />
                  <span>Admin</span>
                </Link>
              )}
            </nav>

            {/* Right side - User + Mobile Menu Button */}
            <div className="flex items-center gap-2">
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/5 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-900 dark:text-white" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-900 dark:text-white" />
                )}
              </button>

              {/* User Menu */}
              {!authLoading && authUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 h-auto py-1.5 px-2"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                        {authUser.photoURL ? (
                          <img
                            src={authUser.photoURL}
                            alt="Profile"
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          authUser.displayName?.[0] ||
                          authUser.email?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.name ||
                            authUser.displayName ||
                            authUser.email?.split("@")[0]}
                        </p>
                        <Badge
                          variant={
                            user?.plan === "ELITE" ? "premium" : "secondary"
                          }
                          className="text-xs"
                        >
                          {user?.plan || "FREE"}
                        </Badge>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500 dark:text-slate-400 hidden sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {authUser.displayName || "User"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {authUser.email}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push("/user-profile")}
                    >
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
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl">
              <nav className="p-2 space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
                        active
                          ? "bg-violet-500/20 dark:bg-violet-500/20 text-violet-700 dark:text-white border border-violet-500/30"
                          : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          active && "text-violet-400",
                        )}
                      />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant="premium"
                          className="text-xs px-1.5 py-0 ml-auto"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </header>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          <main className="h-full overflow-auto bg-white/30 dark:bg-black/20 backdrop-blur-2xl">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
