import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RUX - AI-Powered Mobile App Generator",
  description:
    "Describe your app idea in natural language and watch RUX generate production-ready React Native + Expo code. Build iOS and Android apps with the power of AI.",
  keywords: [
    "AI",
    "mobile app generator",
    "React Native",
    "Expo",
    "iOS",
    "Android",
    "no-code",
    "low-code",
    "app builder",
  ],
  authors: [{ name: "RUX" }],
  creator: "RUX",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rux.sh",
    title: "RUX - AI-Powered Mobile App Generator",
    description:
      "Describe your app idea and generate production-ready React Native code instantly.",
    siteName: "RUX",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RUX - AI-Powered Mobile App Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RUX - AI-Powered Mobile App Generator",
    description:
      "Describe your app idea and generate production-ready React Native code instantly.",
    images: ["/og-image.png"],
    creator: "@ruxsh",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
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
