import { Octokit } from "@octokit/rest";
import { CodeFiles } from "@/types";

interface GitHubUser {
  login: string;
  id: number;
  name: string | null;
  email: string | null;
  avatarUrl: string;
}

interface Repository {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  cloneUrl: string;
  defaultBranch: string;
}

/**
 * Create an authenticated Octokit instance
 */
function createOctokit(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
    userAgent: "RUX App Generator",
  });
}

/**
 * Verify GitHub token and get user info
 */
export async function verifyGitHubToken(accessToken: string): Promise<GitHubUser> {
  const octokit = createOctokit(accessToken);

  const { data } = await octokit.users.getAuthenticated();

  return {
    login: data.login,
    id: data.id,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
  };
}

/**
 * List user's repositories
 */
export async function listRepositories(
  accessToken: string,
  options?: { sort?: "created" | "updated" | "pushed"; perPage?: number }
): Promise<Repository[]> {
  const octokit = createOctokit(accessToken);

  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: options?.sort || "updated",
    per_page: options?.perPage || 30,
    affiliation: "owner",
  });

  return data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    htmlUrl: repo.html_url,
    cloneUrl: repo.clone_url,
    defaultBranch: repo.default_branch,
  }));
}

/**
 * Create a new repository
 */
export async function createRepository(
  accessToken: string,
  options: {
    name: string;
    description?: string;
    isPrivate?: boolean;
    autoInit?: boolean;
  }
): Promise<Repository> {
  const octokit = createOctokit(accessToken);

  const { data } = await octokit.repos.createForAuthenticatedUser({
    name: options.name,
    description: options.description,
    private: options.isPrivate ?? true,
    auto_init: options.autoInit ?? true,
    gitignore_template: "Node",
    license_template: "mit",
  });

  return {
    id: data.id,
    name: data.name,
    fullName: data.full_name,
    private: data.private,
    htmlUrl: data.html_url,
    cloneUrl: data.clone_url,
    defaultBranch: data.default_branch,
  };
}

/**
 * Push code files to a repository
 */
export async function pushCodeToRepo(
  accessToken: string,
  options: {
    owner: string;
    repo: string;
    branch?: string;
    files: CodeFiles;
    message: string;
  }
): Promise<{ commitSha: string; commitUrl: string }> {
  const octokit = createOctokit(accessToken);
  const { owner, repo, files, message } = options;
  const branch = options.branch || "main";

  // Get the current commit SHA for the branch
  let baseSha: string;
  try {
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    baseSha = refData.object.sha;
  } catch {
    // Branch doesn't exist, create it from default branch
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const { data: defaultRef } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${repoData.default_branch}`,
    });
    baseSha = defaultRef.object.sha;
  }

  // Get the tree SHA
  const { data: commitData } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: baseSha,
  });
  const baseTreeSha = commitData.tree.sha;

  // Create blobs for each file
  const blobs = await Promise.all(
    Object.entries(files).map(async ([path, content]) => {
      const { data } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(content).toString("base64"),
        encoding: "base64",
      });
      return { path, sha: data.sha };
    })
  );

  // Create a new tree
  const { data: treeData } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: blobs.map(({ path, sha }) => ({
      path,
      mode: "100644" as const,
      type: "blob" as const,
      sha,
    })),
  });

  // Create the commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: treeData.sha,
    parents: [baseSha],
  });

  // Update the branch reference
  try {
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });
  } catch {
    // Create the branch if it doesn't exist
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: newCommit.sha,
    });
  }

  return {
    commitSha: newCommit.sha,
    commitUrl: newCommit.html_url,
  };
}

/**
 * Get repository contents (for syncing)
 */
export async function getRepoContents(
  accessToken: string,
  options: {
    owner: string;
    repo: string;
    path?: string;
    ref?: string;
  }
): Promise<CodeFiles> {
  const octokit = createOctokit(accessToken);
  const { owner, repo, path = "", ref } = options;

  const files: CodeFiles = {};

  async function fetchDirectory(dirPath: string): Promise<void> {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: dirPath,
      ref,
    });

    if (Array.isArray(data)) {
      await Promise.all(
        data.map(async (item) => {
          if (item.type === "file" && item.download_url) {
            const response = await fetch(item.download_url);
            files[item.path] = await response.text();
          } else if (item.type === "dir") {
            await fetchDirectory(item.path);
          }
        })
      );
    }
  }

  await fetchDirectory(path);
  return files;
}

/**
 * Delete a repository (use with caution!)
 */
export async function deleteRepository(
  accessToken: string,
  owner: string,
  repo: string
): Promise<boolean> {
  const octokit = createOctokit(accessToken);

  try {
    await octokit.repos.delete({ owner, repo });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a repository exists
 */
export async function repositoryExists(
  accessToken: string,
  owner: string,
  repo: string
): Promise<boolean> {
  const octokit = createOctokit(accessToken);

  try {
    await octokit.repos.get({ owner, repo });
    return true;
  } catch {
    return false;
  }
}

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
export function generateReadme(projectName: string, description?: string): string {
  return `# ${projectName}

${description || "A React Native + Expo app generated with RUX."}

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

Built with [RUX](https://rux.sh) - AI-Powered Mobile App Generator
`;
}
