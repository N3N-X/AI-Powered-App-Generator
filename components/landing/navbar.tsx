"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  User,
  LogOut,
  BookOpen,
  CreditCard,
  Info,
  Mail,
  FileText,
  Home,
} from "lucide-react";
import { RuxLogo } from "@/components/shared/rux-logo";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/auth/auth-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const mobileNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/docs", label: "Documentation", icon: BookOpen },
  { href: "/blog", label: "Blog", icon: FileText },
  { href: "/about", label: "About Us", icon: Info },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const { theme, setTheme } = useUIStore();
  const { user, logout, loading } = useAuth();
  const router = useRouter();

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

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const getUserInitials = () => {
    const displayName =
      user?.user_metadata?.display_name || user?.user_metadata?.full_name;
    if (displayName) {
      return displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || "U";
  };

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8">
      <nav className="mx-auto max-w-7xl flex items-center justify-between gap-3">
        {/* Logo Pill */}
        <Link
          href="/"
          className="liquid-glass-pill liquid-glass-hover liquid-shadow-lg px-2 h-14 flex items-center"
        >
          <RuxLogo className="h-12 w-48 hidden sm:block" showText />
          <RuxLogo className="h-10 w-10 sm:hidden" showBackground={false} />
        </Link>

        {/* Desktop Navigation Links - Single pill container */}
        <div className="hidden md:flex items-center flex-1 justify-center">
          <div className="liquid-glass-pill liquid-shadow flex items-center gap-1 px-1.5 h-14">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-1.5 rounded-full text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Auth/User Pill */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-white/10 dark:hover:bg-white/10 transition-all duration-300 liquid-glass-pill liquid-shadow"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-900 dark:text-white" />
            ) : (
              <Menu className="h-5 w-5 text-gray-900 dark:text-white" />
            )}
          </button>

          <div className="hidden md:flex items-center gap-2">
            {/* Theme Toggle Pill */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 liquid-glass-pill liquid-glass-hover liquid-shadow transition-all duration-300"
              onClick={handleThemeToggle}
            >
              {getThemeIcon()}
            </Button>

            {!loading && !user && (
              <>
                <Button
                  variant="ghost"
                  className="liquid-glass-pill liquid-glass-hover liquid-shadow h-10"
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthModalOpen(true);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="gradient"
                  className="rounded-full liquid-glow-hover liquid-shadow h-10 px-5"
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthModalOpen(true);
                  }}
                >
                  Get Started Free
                </Button>
              </>
            )}

            {!loading && user && (
              <>
                <Button
                  variant="gradient"
                  className="rounded-full liquid-glow-hover liquid-shadow h-10"
                  asChild
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 liquid-glass-pill liquid-glass-hover liquid-shadow px-3 h-10"
                >
                  <Avatar className="h-8 w-8 liquid-glow-hover transition-all duration-500">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url || undefined}
                      alt={
                        user.user_metadata?.display_name ||
                        user.user_metadata?.full_name ||
                        "User"
                      }
                    />
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-sm text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white hidden lg:inline">
                    {user.user_metadata?.display_name ||
                      user.user_metadata?.full_name ||
                      user.email?.split("@")[0]}
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="mx-auto max-w-7xl mt-3 px-4 sm:px-6 lg:px-8">
          <div className="liquid-glass-card liquid-shadow p-3 space-y-1 animate-scale-in md:hidden">
            {mobileNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-2xl transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">
                  Theme
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl"
                  onClick={handleThemeToggle}
                >
                  {getThemeIcon()}
                </Button>
              </div>
              {!loading && !user && (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-center rounded-2xl"
                    onClick={() => {
                      setAuthMode("signin");
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="gradient"
                    className="w-full justify-center rounded-2xl liquid-glow-hover"
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    Get Started Free
                  </Button>
                </>
              )}
              {!loading && user && (
                <>
                  <Button
                    variant="gradient"
                    className="w-full justify-center rounded-2xl liquid-glow-hover"
                    asChild
                  >
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-center rounded-2xl text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode={authMode}
      />
    </header>
  );
}
