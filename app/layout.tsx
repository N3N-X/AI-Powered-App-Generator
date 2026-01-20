import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateSoftwareApplicationSchema,
} from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rux.sh"),
  title: {
    default: "RUX - AI-Powered App Builder for Mobile & Web",
    template: "%s | RUX",
  },
  description:
    "Build mobile and web apps with AI. Describe your idea in natural language and RUX generates production-ready React Native, Expo, and web code instantly. Deploy in seconds.",
  keywords: [
    "AI app builder",
    "mobile app generator",
    "React Native",
    "Expo",
    "web app builder",
    "AI development",
    "no-code",
    "low-code",
    "iOS app builder",
    "Android app builder",
    "GPT app generator",
    "Claude AI",
    "AI coding assistant",
    "instant deployment",
  ],
  authors: [{ name: "RUX", url: "https://rux.sh" }],
  creator: "RUX",
  publisher: "RUX",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://rux.sh",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rux.sh",
    title: "RUX - AI-Powered App Builder for Mobile & Web",
    description:
      "Build mobile and web apps with AI. Describe your idea and generate production-ready code instantly.",
    siteName: "RUX",
    images: [
      {
        url: "https://rux.sh/og-image.png",
        width: 1200,
        height: 630,
        alt: "RUX - AI-Powered App Builder",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RUX - AI-Powered App Builder",
    description:
      "Build mobile and web apps with AI. Generate production-ready code instantly.",
    images: ["https://rux.sh/og-image.png"],
    creator: "@ruxsh",
    site: "@ruxsh",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#8b5cf6",
          colorBackground: "#0f172a",
          colorInputBackground: "#1e293b",
          colorInputText: "#e2e8f0",
          borderRadius: "0.75rem",
        },
        elements: {
          formButtonPrimary:
            "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
          card: "bg-slate-900/50 backdrop-blur-xl border border-white/10",
          headerTitle: "text-white",
          headerSubtitle: "text-slate-400",
          socialButtonsBlockButton:
            "bg-white/5 border-white/10 hover:bg-white/10",
          formFieldLabel: "text-slate-300",
          formFieldInput: "bg-slate-800/50 border-slate-700",
          footerActionLink: "text-violet-400 hover:text-violet-300",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Structured Data for SEO */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateOrganizationSchema()),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateWebsiteSchema()),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateSoftwareApplicationSchema()),
            }}
          />
        </head>
        <body className={`${inter.variable} font-sans antialiased`}>
          <Script
            id="sl-settings"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function() {
                window.SLSettings = window.SLSettings || {};
                window.SLSettings.showSLButton = false;
              })();`,
            }}
          />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
