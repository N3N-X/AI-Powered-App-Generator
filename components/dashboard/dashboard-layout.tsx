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
  Settings,
  Hammer,
  Zap,
  Database,
  Menu,
  X,
  Shield,
  Sun,
  Moon,
  Monitor,
  BarChart3,
} from "lucide-react";
import { RuxLogo } from "@/components/shared/rux-logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreditsRefillModal } from "@/components/billing/credits-refill-modal";

const navItems: {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
}[] = [
  {
    title: "Generate",
    href: "/dashboard",
    icon: Zap,
    exact: true,
  },
  { title: "App Manager", href: "/dashboard/content", icon: Database },
  { title: "Builds", href: "/dashboard/builds", icon: Hammer },
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
  const { theme, setTheme, activeModal, closeModal } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";
  const showRefillModal = activeModal === "refill-credits";

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

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Atmospheric background glow — fixed, always visible */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-[-300px] h-[800px] w-[1200px] -translate-x-1/2 rounded-full bg-violet-500/20 blur-[180px]" />
          <div className="absolute right-[-150px] top-[15%] h-[500px] w-[500px] rounded-full bg-cyan-400/15 blur-[140px]" />
          <div className="absolute left-[-100px] top-[40%] h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[120px] liquid-float" />
          <div className="absolute bottom-[-200px] left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[160px]" />
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/5 blur-[100px]" />
        </div>

        {/* Topbar with Navigation */}
        <header className="px-4 sm:px-6 lg:px-8 pt-4 pb-2 shrink-0">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
            {/* Logo Pill */}
            <Link
              href="/dashboard"
              className="liquid-glass-pill liquid-glass-hover liquid-shadow-lg px-2 h-14 flex items-center"
            >
              <RuxLogo className="h-12 w-48 hidden sm:block" showText />
              <RuxLogo className="h-10 w-10 sm:hidden" />
            </Link>

            {/* Navigation Links - Single pill container */}
            <nav className="hidden md:flex items-center flex-1 justify-center">
              <div className="liquid-glass-pill liquid-shadow flex items-center gap-1 px-1.5 h-14">
                {navItems.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all duration-200 text-sm font-medium",
                        active
                          ? "bg-white/15 dark:bg-white/10 text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10",
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
                        <Badge
                          variant="premium"
                          className="text-xs px-1.5 py-0"
                        >
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
                      "flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all duration-200 text-sm font-medium",
                      pathname.startsWith("/dashboard/admin")
                        ? "bg-red-500/15 text-red-400"
                        : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10",
                    )}
                  >
                    <Shield
                      className={cn(
                        "h-4 w-4 shrink-0",
                        pathname.startsWith("/dashboard/admin") &&
                          "text-red-400",
                      )}
                    />
                    <span>Admin</span>
                  </Link>
                )}
              </div>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 liquid-glass-pill liquid-glass-hover liquid-shadow transition-all duration-300"
                onClick={handleThemeToggle}
              >
                {getThemeIcon()}
              </Button>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-900 dark:text-white" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-900 dark:text-white" />
                )}
              </button>

              {/* User Profile - No Dropdown */}
              {!authLoading && authUser && (
                <Link
                  href="/dashboard/settings"
                  className="liquid-glass-pill liquid-glass-hover liquid-shadow-lg px-3 h-14 flex items-center gap-3"
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white liquid-glow-hover transition-all duration-500">
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
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user?.name ||
                        authUser.user_metadata?.display_name ||
                        authUser.user_metadata?.full_name ||
                        authUser.email?.split("@")[0]}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span className="text-xs font-medium text-amber-500">
                        {(user?.credits ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="mt-3 mx-auto max-w-7xl">
              <div className="liquid-glass-card liquid-shadow p-3 space-y-1 animate-scale-in">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const active = isActive(item.href, item.exact);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 text-sm font-medium",
                          active
                            ? "bg-violet-500/20 dark:bg-violet-500/20 text-violet-700 dark:text-white border border-violet-500/30"
                            : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10",
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
            </div>
          )}
        </header>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          <main className="h-full overflow-auto">{children}</main>
        </div>

        <CreditsRefillModal
          open={showRefillModal}
          onOpenChange={(open) => {
            if (!open) closeModal();
          }}
          plan={user?.plan}
        />
      </div>
    </TooltipProvider>
  );
}
