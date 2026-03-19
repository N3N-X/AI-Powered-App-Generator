import {
  Sparkles,
  Zap,
  Globe,
  Smartphone,
  FileCode,
  Github,
  Cloud,
  Server,
  Code,
} from "lucide-react";

export const docSections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Sparkles,
    articles: [
      { title: "Quick Start Guide", slug: "quick-start" },
      { title: "Creating Your First Project", slug: "first-project" },
      { title: "Understanding Platforms (Web/iOS/Android)", slug: "platforms" },
      { title: "Dashboard Overview", slug: "dashboard" },
    ],
  },
  {
    id: "ai-generation",
    title: "AI-Powered Generation",
    icon: Zap,
    articles: [
      { title: "How AI Generation Works", slug: "how-it-works" },
      { title: "Writing Effective Prompts", slug: "prompts" },
      { title: "Iterative Development", slug: "iterative" },
      { title: "Credit System Explained", slug: "credits" },
    ],
  },
  {
    id: "web-apps",
    title: "Web Applications",
    icon: Globe,
    articles: [
      { title: "Building Web Apps", slug: "web-basics" },
      { title: "Live Subdomains", slug: "subdomains" },
      { title: "Custom Domains", slug: "custom-domains" },
    ],
  },
  {
    id: "mobile-apps",
    title: "Mobile Applications",
    icon: Smartphone,
    articles: [
      { title: "iOS App Development", slug: "ios" },
      { title: "Android App Development", slug: "android" },
      { title: "React Native Basics", slug: "react-native" },
      { title: "Expo Go Preview", slug: "expo-preview" },
      { title: "Native Features", slug: "native-features" },
    ],
  },
  {
    id: "code-management",
    title: "Code & Files",
    icon: FileCode,
    articles: [
      { title: "File Explorer", slug: "file-explorer" },
      { title: "Code Editor", slug: "code-editor" },
      { title: "Downloading Projects", slug: "downloads" },
      { title: "Version Control", slug: "version-control" },
    ],
  },
  {
    id: "github",
    title: "GitHub Integration",
    icon: Github,
    articles: [
      { title: "Connecting GitHub", slug: "connect-github" },
      { title: "Pushing to Repositories", slug: "push-repo" },
      { title: "Creating New Repos", slug: "create-repo" },
      { title: "Sync & Collaboration", slug: "collaboration" },
    ],
  },
  {
    id: "builds",
    title: "Building & Deployment",
    icon: Cloud,
    articles: [
      { title: "Cloud Builds with EAS", slug: "eas-builds" },
      { title: "Android APK Generation", slug: "android-apk" },
      { title: "iOS IPA Generation", slug: "ios-ipa" },
      { title: "Developer Credentials", slug: "dev-credentials" },
      { title: "App Store Deployment", slug: "app-store" },
    ],
  },
  {
    id: "api-proxies",
    title: "API Proxies",
    icon: Server,
    articles: [
      { title: "What are API Proxies?", slug: "proxy-intro" },
      { title: "Available Services", slug: "available-services" },
      { title: "Using Proxies in Your App", slug: "using-proxies" },
      { title: "Rate Limits & Credits", slug: "rate-limits" },
    ],
  },
  {
    id: "api-reference",
    title: "API Reference",
    icon: Code,
    articles: [
      { title: "Projects API", slug: "projects-api" },
      { title: "Generation API", slug: "generation-api" },
      { title: "Proxy APIs", slug: "proxy-apis" },
    ],
  },
];
