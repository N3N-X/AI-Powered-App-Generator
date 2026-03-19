import type { ArticleContent } from "../types";

export const gettingStartedContent: ArticleContent = {
  "quick-start": {
    title: "Quick Start Guide",
    content: `
# Quick Start Guide

Welcome to Rulxy! Build production-ready web and mobile apps using AI in minutes.

## Step 1: Create Your Account

1. Click "Get Started" on the homepage
2. Enter your invite code (required during early access)
3. Create your account with email and password
4. You'll start with 3,000 free credits

## Step 2: Create Your First Project

1. Click "New Project" in your dashboard
2. Choose your platform:
   - **Web**: React-based web applications
   - **iOS**: Native iOS apps with React Native
   - **Android**: Native Android apps with React Native
3. Give your project a name

## Step 3: Describe Your App

Chat with AI to describe what you want to build:

\`\`\`
"Create a task management app with the ability to add, edit,
complete, and delete tasks. Include categories and due dates."
\`\`\`

The AI will generate complete, production-ready code.

## Step 4: Preview Your App

- **Web apps**: Instantly live at yourproject.rulxy.com
- **Mobile apps**: Scan QR code with Expo Go app

## Step 5: Iterate and Refine

Continue the conversation to add features:

\`\`\`
"Add dark mode support"
"Include push notifications for due dates"
"Add a calendar view"
\`\`\`

## Next Steps

- Learn about [Writing Effective Prompts](/docs/prompts)
- Set up [GitHub Integration](/docs/connect-github)
- Build for [iOS](/docs/ios) or [Android](/docs/android)
    `,
  },

  "first-project": {
    title: "Creating Your First Project",
    content: `
# Creating Your First Project

This guide walks you through creating and configuring your first Rulxy project.

## Choosing a Platform

Rulxy supports three platforms, each optimized for different use cases:

### Web Applications
- Pure React with modern ES modules
- Instant deployment to yourapp.rulxy.com
- Custom domain support (Pro/Elite)
- No app store approval needed

### iOS Applications
- React Native + Expo
- Preview with Expo Go
- Build IPA files for App Store
- Requires Apple Developer account for distribution

### Android Applications
- React Native + Expo
- Preview with Expo Go
- Build APK files for Play Store
- Requires Google Play Developer account for distribution

## Project Settings

After creating a project, configure these settings:

### Basic Info
- **Name**: Displayed in your dashboard and app
- **Description**: Helps AI understand context
- **Icon**: Auto-generated or upload custom

### Platform-Specific
- **Bundle ID** (iOS): com.yourcompany.appname
- **Package Name** (Android): com.yourcompany.appname

## Project Structure

Rulxy generates a clean, organized codebase:

\`\`\`
App.tsx              # Main entry point
components/          # Reusable UI components
screens/             # Screen components (mobile)
utils/               # Helper functions
types/               # TypeScript definitions
assets/              # Images, fonts, etc.
\`\`\`

## Tips for Success

1. **Start simple**: Begin with core features, add complexity later
2. **Be specific**: Detailed descriptions = better code
3. **Iterate often**: Small changes are easier to refine
4. **Use the file explorer**: Review and edit generated code
    `,
  },

  platforms: {
    title: "Understanding Platforms",
    content: `
# Understanding Platforms (Web/iOS/Android)

Rulxy generates platform-optimized code. Here's what you need to know.

## Web Applications

### Technology Stack
- React 18+ with hooks
- Modern CSS (Tailwind-compatible)
- ES modules via CDN
- No build step required

### Deployment
- Instant subdomain: yourapp.rulxy.com
- Custom domains (Pro/Elite plans)
- SSL included automatically
- Global CDN for fast loading

### Best For
- Landing pages and marketing sites
- Dashboards and admin panels
- Web apps and tools
- Prototypes and MVPs

## iOS Applications

### Technology Stack
- React Native + Expo SDK
- Native iOS components
- Platform-specific APIs
- TypeScript support

### Development Flow
1. Generate code with AI
2. Preview in Expo Go app
3. Build IPA with cloud builds
4. Submit to App Store

### Requirements
- Apple Developer account ($99/year) for distribution
- Mac not required (cloud builds)
- Xcode not required

## Android Applications

### Technology Stack
- React Native + Expo SDK
- Native Android components
- Material Design patterns
- TypeScript support

### Development Flow
1. Generate code with AI
2. Preview in Expo Go app
3. Build APK with cloud builds
4. Submit to Play Store

### Requirements
- Google Play Developer account ($25 one-time)
- No special hardware needed
- Android Studio not required

## Cross-Platform Considerations

When building for multiple platforms:

1. **Shared Logic**: Business logic works across platforms
2. **Platform Components**: UI adapts to each platform
3. **Native Features**: Use platform-specific APIs when needed
4. **Testing**: Preview on actual devices via Expo Go
    `,
  },

  dashboard: {
    title: "Dashboard Overview",
    content: `
# Dashboard Overview

Your Rulxy dashboard is the central hub for managing all your projects and settings.

## Main Sections

### Projects
- View all your projects
- Create new projects
- Access project settings
- See recent activity

### Generate
- AI-powered code generation
- Chat interface for prompts
- Live preview panel
- File explorer

### Builds
- Cloud build status
- Download APK/IPA files
- Build history

### Settings
- Account profile
- Billing and subscription
- Invite friends
- Security settings

## Project Dashboard

Each project has its own dashboard with:

### Code Editor
- Syntax highlighting
- File tree navigation
- Search and replace
- Auto-save

### Preview Panel
- Live web preview
- Mobile QR code
- Refresh controls

### Chat History
- All AI conversations
- Regenerate from any point

## Credits Display

Your credit balance is always visible:
- Current credits remaining
- Credits used this session
- Upgrade prompts when low
    `,
  },
};
