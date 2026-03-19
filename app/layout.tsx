import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://rulxy.com"),
  title: {
    default: "Rulxy - AI-Powered App Builder for Mobile & Web",
    template: "%s | Rulxy",
  },
  description:
    "Build mobile and web apps with AI. Describe your idea in natural language and Rulxy generates production-ready iOS, Android, and web code instantly. Deploy in seconds.",
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
  authors: [{ name: "Rulxy", url: "https://rulxy.com" }],
  creator: "Rulxy",
  publisher: "Rulxy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://rulxy.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rulxy.com",
    title: "Rulxy - AI-Powered App Builder for Mobile & Web",
    description:
      "Build mobile and web apps with AI. Describe your idea and generate production-ready code instantly.",
    siteName: "Rulxy",
    images: [
      {
        url: "https://rulxy.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rulxy - AI-Powered App Builder",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rulxy - AI-Powered App Builder",
    description:
      "Build mobile and web apps with AI. Generate production-ready code instantly.",
    images: ["https://rulxy.com/og-image.png"],
    creator: "@RulxyApp",
    site: "@RulxyApp",
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
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
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
