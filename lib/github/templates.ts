/**
 * Generate a .gitignore file for React Native/Expo projects
 */
export function generateGitignore(): string {
  return `# Dependencies
node_modules/

# Expo
.expo/
dist/
web-build/

# Native
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Metro
.metro-health-check*

# Debug
npm-debug.*
yarn-debug.*
yarn-error.*

# macOS
.DS_Store
*.pem

# Local env files
.env*.local

# TypeScript
*.tsbuildinfo

# Testing
coverage/

# IDE
.idea/
.vscode/
*.swp
*.swo
`;
}

/**
 * Generate a README.md for the project
 */
export function generateReadme(
  projectName: string,
  description?: string,
): string {
  return `# ${projectName}

${description || "A React Native + Expo app generated with Rulxy."}

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: \`npm install -g expo-cli\`

### Installation

\`\`\`bash
npm install
\`\`\`

### Running the app

\`\`\`bash
# Start the development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
\`\`\`

## Building for Production

This project uses EAS Build for creating production builds.

\`\`\`bash
# Install EAS CLI
npm install -g eas-cli

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
\`\`\`

## Project Structure

\`\`\`
├── App.tsx          # Main entry point
├── app/             # Screen components
├── components/      # Reusable components
├── hooks/           # Custom hooks
├── utils/           # Utility functions
├── constants/       # App constants
├── types/           # TypeScript types
└── assets/          # Images and fonts
\`\`\`

---

Built with [Rulxy](https://rulxy.com) - AI-Powered Mobile App Generator
`;
}
