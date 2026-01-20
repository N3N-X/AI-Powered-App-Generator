"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Book,
  Search,
  Code2,
  Sparkles,
  Zap,
  Globe,
  Smartphone,
  Github,
  Cloud,
  Key,
  Database,
  FileCode,
  Terminal,
  Play,
  ChevronRight,
  ArrowLeft,
  LayoutDashboard,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const docSections = [
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
      { title: "AI Model Selection (Grok vs Claude)", slug: "models" },
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
      { title: "React Best Practices", slug: "react-practices" },
      { title: "Styling & Theming", slug: "styling" },
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
    title: "Managed API Proxies",
    icon: Database,
    articles: [
      { title: "What are API Proxies?", slug: "proxy-intro" },
      { title: "Available Services", slug: "available-services" },
      { title: "API Keys Management", slug: "api-keys" },
      { title: "Using Proxies in Your App", slug: "using-proxies" },
      { title: "Rate Limits & Credits", slug: "rate-limits" },
    ],
  },
  {
    id: "api-reference",
    title: "API Reference",
    icon: Terminal,
    articles: [
      { title: "Authentication", slug: "auth" },
      { title: "Projects API", slug: "projects-api" },
      { title: "Generation API", slug: "generation-api" },
      { title: "Proxy APIs", slug: "proxy-apis" },
      { title: "Webhooks", slug: "webhooks" },
    ],
  },
];

const articleContent: Record<string, { title: string; content: string }> = {
  "quick-start": {
    title: "Quick Start Guide",
    content: `
# Quick Start Guide

Welcome to RUX! This guide will help you build your first app in minutes.

## Step 1: Create Your Account

1. Sign up at [rux.sh/signup](/signup)
2. Verify your email
3. You'll start with 3,000 free credits

## Step 2: Choose Your Platform

RUX supports three platforms:
- **Web**: React-based web applications with live subdomains
- **iOS**: Native iOS apps using React Native
- **Android**: Native Android apps using React Native

## Step 3: Describe Your App

Simply chat with AI and describe what you want to build:

\`\`\`
"Create a landing page with a hero section, features grid, and contact form"
\`\`\`

or

\`\`\`
"Build a todo app with add, edit, delete, and mark complete features"
\`\`\`

## Step 4: See It Live

- **Web apps**: Get an instant subdomain (myapp.rux.sh)
- **Mobile apps**: Preview in Expo Go on your phone

## Step 5: Iterate & Refine

Continue the conversation to add features:

\`\`\`
"Add dark mode toggle"
"Make it responsive for mobile"
"Add user authentication"
\`\`\`

## Next Steps

- Explore the [Dashboard Overview](/dashboard/docs/dashboard)
- Learn about [Writing Effective Prompts](/dashboard/docs/prompts)
- Set up [GitHub Integration](/dashboard/docs/connect-github)
    `,
  },
  "how-it-works": {
    title: "How AI Generation Works",
    content: `
# How AI Generation Works

RUX uses advanced AI models to transform your natural language descriptions into production-ready code.

## AI Models

### xAI Grok (Default)
- **Cost**: 8 credits per 1K tokens
- **Speed**: Very fast
- **Best for**: Quick iterations, prototyping
- **Availability**: All plans

### Claude AI (Elite Plan)
- **Cost**: 10 credits per 1K tokens
- **Speed**: Fast
- **Best for**: Complex applications, detailed logic
- **Availability**: Elite plan or bring your own key

## Generation Process

### 1. Prompt Analysis
The AI analyzes your request to understand:
- Platform requirements (Web/iOS/Android)
- Features and functionality
- UI/UX preferences
- Technical requirements

### 2. Code Generation
Based on your platform:

**Web Apps**:
- Pure React components
- HTML/CSS styling
- ES modules via CDN
- No React Native code

**Mobile Apps**:
- React Native components
- Platform-specific features
- Expo-compatible code
- Native navigation

### 3. File Structure
The AI creates a complete file structure:
\`\`\`
App.tsx              # Main component
components/          # Reusable components
screens/            # Screen components (mobile)
utils/              # Helper functions
types/              # TypeScript types
\`\`\`

### 4. Live Preview
Your code is instantly deployed:
- **Web**: Live subdomain with instant preview
- **Mobile**: Expo Go compatible QR code

## Best Practices

1. **Be Specific**: "Create a blue navigation bar with logo on left and menu on right"
2. **Iterate**: Start simple, add features progressively
3. **Reference**: "Like the previous screen but with a form"
4. **Platform-Aware**: Mention iOS/Android specific features when needed

## Credit Usage

Each generation costs approximately:
- Simple changes: 50-100 credits
- New features: 100-500 credits
- Complete screens: 500-1000 credits
- Full apps: 1000-3000 credits
    `,
  },
  prompts: {
    title: "Writing Effective Prompts",
    content: `
# Writing Effective Prompts

Learn how to communicate with AI to get the best results.

## Basic Prompt Structure

### Good Prompts
✅ "Create a landing page with a hero section featuring a gradient background, headline 'Build Apps with AI', subtitle explaining the product, and a 'Get Started' button"

✅ "Add a navigation bar at the top with logo on left, menu items (Features, Pricing, Docs), and Login button on right"

✅ "Build a todo list component with input field, add button, list of todos with checkboxes, and delete icons"

### Poor Prompts
❌ "Make it better"
❌ "Add stuff"
❌ "Like that other app"

## Platform-Specific Prompts

### Web Apps
\`\`\`
"Create a responsive pricing table with 3 tiers:
- Free: $0, 3 projects, basic features
- Pro: $29/mo, 20 projects, GitHub integration
- Elite: $99/mo, unlimited projects, priority support"
\`\`\`

### Mobile Apps
\`\`\`
"Create a tab navigation with 3 screens:
1. Home: Show welcome message and recent items
2. Search: Search bar and filterable results
3. Profile: User avatar, name, and settings list"
\`\`\`

## Iteration Patterns

### Adding Features
\`\`\`
"Add a dark mode toggle button in the top right corner"
"Add form validation with error messages below each field"
"Add loading states with spinners when fetching data"
\`\`\`

### Modifying Design
\`\`\`
"Change the primary color from blue to purple"
"Make the cards have rounded corners and shadows"
"Increase spacing between sections"
\`\`\`

### Fixing Issues
\`\`\`
"The button is not centered, please center it horizontally"
"Make the text larger and more readable"
"Fix the layout on mobile screens"
\`\`\`

## Advanced Techniques

### Referencing Previous Work
\`\`\`
"Create a new screen similar to the home screen but for user settings"
"Use the same card style as the pricing page"
\`\`\`

### Technical Specifications
\`\`\`
"Use flexbox for layout"
"Implement with useState hooks"
"Add TypeScript types for props"
"Use async/await for API calls"
\`\`\`

### User Experience
\`\`\`
"Add smooth transitions when toggling dark mode"
"Show toast notification on successful save"
"Add haptic feedback when button is pressed (iOS/Android)"
\`\`\`

## Tips for Success

1. **Start Simple**: Build basic structure first
2. **One Thing at a Time**: Don't request too many changes at once
3. **Be Visual**: Describe what you want to see
4. **Provide Context**: Explain the use case
5. **Test & Iterate**: Review, then refine

## Example Workflow

\`\`\`
Step 1: "Create a blog post listing page"
Step 2: "Add a featured post section at the top"
Step 3: "Add category filters"
Step 4: "Make it responsive for mobile"
Step 5: "Add loading skeleton screens"
Step 6: "Add smooth scroll animations"
\`\`\`
    `,
  },
};

export default function DocsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [selectedArticle, setSelectedArticle] = useState("quick-start");
  const [searchQuery, setSearchQuery] = useState("");

  const currentArticle =
    articleContent[selectedArticle] || articleContent["quick-start"];

  const filteredSections = docSections
    .map((section) => ({
      ...section,
      articles: section.articles.filter((article) =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((section) => section.articles.length > 0);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] flex flex-col">
      {/* Top Bar with Back Button */}
      <div className="border-b border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-black/30 backdrop-blur-xl p-4 shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <SignedOut>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Button>
            </SignedIn>
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-violet-500" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Documentation
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SignedIn>
              {user && (
                <Badge variant="secondary" className="hidden md:flex">
                  Welcome,{" "}
                  {user.firstName ||
                    user.emailAddresses[0]?.emailAddress.split("@")[0]}
                </Badge>
              )}
            </SignedIn>
            <SignedOut>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/login")}
                  className="hidden sm:flex"
                >
                  Sign In
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => router.push("/signup")}
                >
                  Get Started
                </Button>
              </div>
            </SignedOut>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-gray-200/50 dark:border-white/10 bg-white/60 dark:bg-black/30 backdrop-blur-xl hidden lg:block">
          <div className="p-6 border-b border-gray-200/50 dark:border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Book className="h-6 w-6 text-violet-500" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Documentation
              </h1>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/60 dark:bg-white/5"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-4 space-y-6">
              {filteredSections.map((section) => (
                <div key={section.id}>
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <section.icon className="h-4 w-4 text-violet-500" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {section.title}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {section.articles.map((article) => (
                      <button
                        key={article.slug}
                        onClick={() => setSelectedArticle(article.slug)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                          selectedArticle === article.slug
                            ? "bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/30"
                            : "text-gray-600 dark:text-slate-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span>{article.title}</span>
                          <ChevronRight
                            className={cn(
                              "h-3.5 w-3.5 transition-transform",
                              selectedArticle === article.slug &&
                                "text-violet-500",
                            )}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Article Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {currentArticle.title}
              </h1>
              <Badge variant="info">Documentation</Badge>
            </div>

            {/* Article Content */}
            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
              <CardContent className="p-8">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <div
                    className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: currentArticle.content
                        .replace(/\n/g, "<br/>")
                        .replace(/#{1,6}\s/g, ""),
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Help Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Play className="h-5 w-5 text-violet-500" />
                    Video Tutorial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Watch a step-by-step video guide for this topic.
                  </p>
                  <Badge className="mt-3" variant="outline">
                    Coming Soon
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-emerald-500" />
                    Code Examples
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Explore working examples and templates.
                  </p>
                  <Badge className="mt-3" variant="outline">
                    Available in Pro
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
