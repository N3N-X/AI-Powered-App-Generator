import Link from "next/link";
import { Instagram, Twitter } from "lucide-react";
import { RuxLogo } from "@/components/shared/rux-logo";

const footerLinks = {
  Product: [
    { label: "Pricing", href: "#pricing" },
    { label: "Blog", href: "/blog" },
    { label: "Documentation", href: "/docs" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-200/50 dark:border-white/5 bg-white/60 dark:bg-black/20 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <RuxLogo className="h-9 w-auto" showText />
            </Link>
            <p className="text-sm text-gray-600 dark:text-slate-400 max-w-xs">
              AI-powered platform to create web, iOS, and Android apps through
              natural language.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a
                href="https://x.com/RulxyApp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/rulxy.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-200/50 dark:border-white/5 flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-slate-500">
            &copy; {new Date().getFullYear()} Rulxy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
