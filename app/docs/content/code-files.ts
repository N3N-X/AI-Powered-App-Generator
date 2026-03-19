import type { ArticleContent } from "../types";

export const codeFilesContent: ArticleContent = {
  "file-explorer": {
    title: "File Explorer",
    content: `
# File Explorer

Navigate and manage your project files.

## Overview

The file explorer shows your complete project structure:
- Folders and files
- File types with icons
- Last modified times
- File sizes

## Navigation

### Expanding Folders
Click folder icons to expand/collapse.

### Opening Files
Click any file to open in the editor.

## File Operations

### Create New File
1. Right-click in file explorer
2. Select "New File"
3. Enter filename with extension

### Create Folder
1. Right-click in file explorer
2. Select "New Folder"
3. Enter folder name

### Rename
1. Right-click file or folder
2. Select "Rename"
3. Enter new name

### Delete
1. Right-click file or folder
2. Select "Delete"
3. Confirm deletion

## File Types

Rulxy recognizes and highlights:
- **.tsx/.jsx**: React components
- **.ts/.js**: TypeScript/JavaScript
- **.css**: Stylesheets
- **.json**: Configuration
- **.md**: Documentation

## Tips

1. **Keep organized**: Use folders for components, screens, utils
2. **Naming**: Use consistent naming conventions
3. **Clean up**: Remove unused files regularly
4. **Version control**: Commit before major changes
    `,
  },

  "code-editor": {
    title: "Code Editor",
    content: `
# Code Editor

Edit your generated code with the built-in editor.

## Features

### Syntax Highlighting
Full highlighting for:
- TypeScript/JavaScript
- JSX/TSX
- CSS
- JSON
- Markdown

### Auto-Complete
Intelligent suggestions for:
- Component props
- Import statements
- Function parameters
- Variable names

### Error Detection
Real-time detection of:
- Syntax errors
- Type errors
- Import issues
- Linting warnings

## Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Save | Ctrl + S | Cmd + S |
| Find | Ctrl + F | Cmd + F |
| Replace | Ctrl + H | Cmd + H |
| Go to line | Ctrl + G | Cmd + G |
| Comment | Ctrl + / | Cmd + / |

## Editing Tips

### Multi-cursor
- Alt + Click: Add cursor
- Ctrl + D: Select next occurrence

### Selection
- Double-click: Select word
- Triple-click: Select line

### Moving Code
- Alt + Up/Down: Move line up/down

## Best Practices

1. **Save often**: Auto-save is enabled, but manual save confirms
2. **Format code**: Keep code readable with formatting
3. **Review AI changes**: Always check generated code
    `,
  },

  downloads: {
    title: "Downloading Projects",
    content: `
# Downloading Projects

Export your complete project as a ZIP file.

## What's Included

Your download contains:
- All source code files
- Assets (images, fonts)
- Configuration files
- package.json with dependencies
- README with setup instructions

## How to Download

### From Dashboard
1. Open project settings
2. Click "Export Project"
3. Choose format (ZIP)
4. Download starts automatically

### From Project View
1. Click the download icon
2. Confirm export
3. Save the ZIP file

## Using Downloaded Projects

### Web Projects
\`\`\`bash
# Unzip the project
unzip my-project.zip
cd my-project

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

### Mobile Projects
\`\`\`bash
# Unzip the project
unzip my-project.zip
cd my-project

# Install dependencies
npm install

# Start Expo
npx expo start
\`\`\`

## Tips

1. **Export regularly**: Keep local backups
2. **Use Git**: Better than ZIP for version control
3. **Check dependencies**: Ensure package.json is complete
4. **Test locally**: Verify export works before sharing
    `,
  },

  "version-control": {
    title: "Version Control",
    content: `
# Version Control

Track changes and manage versions of your code.

## Built-in Versioning

Rulxy automatically tracks:
- Every code generation
- Manual file edits
- Configuration changes

### Viewing History
1. Open file in editor
2. Click "History" tab
3. See all versions with timestamps
4. Compare versions side-by-side

### Restoring Versions
1. Find the version to restore
2. Click "Restore"
3. Confirm the action
4. Previous code is restored

## Git Integration

For professional version control, connect to GitHub:

### Benefits
- Full git history
- Branch management
- Collaboration
- CI/CD integration
- Backup and recovery

### Setup
See [Connecting GitHub](/docs/connect-github)

## Best Practices

### Commit Often
- After completing features
- Before major changes
- When something works

### Write Good Messages
\`\`\`
Good: "Add user authentication with email/password"
Bad: "updates"
\`\`\`

### Use Branches
- main: Production code
- develop: Integration branch
- feature/*: New features
- fix/*: Bug fixes

## Recovery

If something breaks:

1. **Recent change**: Use undo (Ctrl+Z)
2. **Last session**: Check version history
3. **With Git**: Revert to previous commit
4. **Major issue**: Contact support
    `,
  },
};
