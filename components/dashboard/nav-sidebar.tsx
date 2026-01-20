"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserStore, useIsAdmin } from "@/stores/user-store";
import { useUIStore } from "@/stores/ui-store";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  BarChart3,
  Key,
  Hammer,
  CreditCard,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    icon: FolderOpen,
  },
  {
    title: "Files",
    href: "/dashboard/files",
    icon: FileCode,
  },
  {
    title: "Builds",
    href: "/dashboard/builds",
    icon: Hammer,
    badge: "Pro",
  },
  {
    title: "API Keys",
    href: "/dashboard/api-keys",
    icon: Key,
  },
  {
    title: "Usage",
    href: "/dashboard/usage",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

const bottomNavItems = [
  {
    title: "Billing",
    href: "/dashboard/settings?tab=billing",
    icon: CreditCard,
  },
];

export function NavSidebar() {
  const pathname = usePathname();
  const { user } = useUserStore();
  const isAdmin = useIsAdmin();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "h-full glass border-r border-white/5 flex flex-col transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16",
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-white text-lg">RUX</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              const NavItem = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                    active
                      ? "bg-violet-500/20 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5",
                    !sidebarOpen && "justify-center px-2",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      active && "text-violet-400",
                    )}
                  />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-sm font-medium">
                        {item.title}
                      </span>
                      {item.badge && (
                        <Badge
                          variant="premium"
                          className="text-xs px-1.5 py-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              );

              if (!sidebarOpen) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                    <TooltipContent side="right">
                      {item.title}
                      {item.badge && ` (${item.badge})`}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return NavItem;
            })}
          </nav>
        </ScrollArea>

        {/* Bottom section */}
        <div className="p-2 border-t border-white/5 space-y-1">
          {/* Admin section - only visible to admins */}
          {isAdmin && (
            <div className={cn("mb-2", sidebarOpen && "px-1")}>
              {sidebarOpen && (
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-2">
                  Admin
                </p>
              )}
              {(() => {
                const active = pathname.startsWith("/dashboard/admin");
                const AdminLink = (
                  <Link
                    href="/dashboard/admin"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                      active
                        ? "bg-red-500/20 text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/5",
                      !sidebarOpen && "justify-center px-2",
                    )}
                  >
                    <Shield
                      className={cn(
                        "h-5 w-5 shrink-0",
                        active && "text-red-400",
                      )}
                    />
                    {sidebarOpen && (
                      <span className="flex-1 text-sm font-medium">Admin</span>
                    )}
                  </Link>
                );

                if (!sidebarOpen) {
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>{AdminLink}</TooltipTrigger>
                      <TooltipContent side="right">
                        Admin Dashboard
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return AdminLink;
              })()}
            </div>
          )}

          {/* Bottom nav items */}
          {bottomNavItems.map((item) => {
            const NavItem = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all",
                  !sidebarOpen && "justify-center px-2",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.title}</span>}
              </Link>
            );

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              );
            }

            return NavItem;
          })}

          {/* Plan upgrade card */}
          {sidebarOpen && user?.plan === "FREE" && (
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-medium text-white">
                  Upgrade to Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Unlock GitHub integration, builds, and more
              </p>
              <Button variant="gradient" size="sm" className="w-full" asChild>
                <Link href="/dashboard/settings?tab=billing">Upgrade</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
