import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CodeFiles, FileTreeNode } from "@/types";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a URL-safe slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a random ID
 */
export function generateId(length: number = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return formatDate(d);
  } else if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
}

/**
 * Convert CodeFiles object to FileTreeNode structure
 */
export function codeFilesToTree(files: CodeFiles): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const paths = Object.keys(files).sort();

  for (const filePath of paths) {
    const parts = filePath.split("/");
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      const existing = currentLevel.find((node) => node.name === part);

      if (existing) {
        if (existing.children) {
          currentLevel = existing.children;
        }
      } else {
        const newNode: FileTreeNode = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };
        currentLevel.push(newNode);

        if (!isFile && newNode.children) {
          currentLevel = newNode.children;
        }
      }
    }
  }

  return sortFileTree(root);
}

/**
 * Sort file tree (folders first, then alphabetically)
 */
function sortFileTree(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes
    .map((node) => ({
      ...node,
      children: node.children ? sortFileTree(node.children) : undefined,
    }))
    .sort((a, b) => {
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;
      return a.name.localeCompare(b.name);
    });
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/**
 * Generate default app.json for Expo project
 */
export function getDefaultAppJson(projectName: string, slug: string): string {
  return JSON.stringify(
    {
      expo: {
        name: projectName,
        slug: slug,
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
          image: "./assets/splash.png",
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
        assetBundlePatterns: ["**/*"],
        ios: {
          supportsTablet: true,
        },
        android: {
          adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#ffffff",
          },
        },
        web: {
          favicon: "./assets/favicon.png",
        },
      },
    },
    null,
    2,
  );
}

/**
 * Generate default package.json for Expo project
 */
export function getDefaultPackageJson(
  projectName: string,
  slug: string,
): string {
  const sanitizedName = slug.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();

  return JSON.stringify(
    {
      name: sanitizedName,
      version: "1.0.0",
      main: "expo/AppEntry.js",
      scripts: {
        start: "expo start",
        android: "expo start --android",
        ios: "expo start --ios",
        web: "expo start --web",
      },
      dependencies: {
        expo: "~51.0.28",
        "expo-status-bar": "~1.12.1",
        react: "18.2.0",
        "react-native": "0.74.5",
      },
      devDependencies: {
        "@babel/core": "^7.20.0",
      },
      private: true,
    },
    null,
    2,
  );
}

/**
 * Generate default tsconfig.json for Expo project
 */
export function getDefaultTsconfig(): string {
  return JSON.stringify(
    {
      extends: "expo/tsconfig.base",
      compilerOptions: {
        strict: true,
      },
    },
    null,
    2,
  );
}

/**
 * Generate default assets structure
 */
export function getDefaultAssets(): Record<string, string> {
  return {
    "assets/icon.png": "// Default icon placeholder - replace with actual icon",
    "assets/splash.png":
      "// Default splash screen placeholder - replace with actual splash",
    "assets/adaptive-icon.png":
      "// Default adaptive icon placeholder - replace with actual icon",
    "assets/favicon.png":
      "// Default favicon placeholder - replace with actual favicon",
  };
}

/**
 * Get language for Monaco editor based on file extension
 */
export function getLanguageForFile(filename: string): string {
  const ext = getFileExtension(filename);
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "scss",
    html: "html",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
  };
  return languageMap[ext] || "plaintext";
}

/**
 * Get file icon based on extension
 */
export function getFileIcon(filename: string): string {
  const ext = getFileExtension(filename);
  const iconMap: Record<string, string> = {
    ts: "typescript",
    tsx: "react",
    js: "javascript",
    jsx: "react",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "sass",
    png: "image",
    jpg: "image",
    jpeg: "image",
    svg: "svg",
    gif: "image",
  };
  return iconMap[ext] || "file";
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length - 3) + "...";
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Calculate total size of code files
 */
export function calculateCodeSize(files: CodeFiles): number {
  return Object.values(files).reduce((total, content) => {
    return total + new TextEncoder().encode(content).length;
  }, 0);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if code contains potentially dangerous patterns
 */
export function sanitizeGeneratedCode(code: string): string {
  // Remove any potentially dangerous patterns
  const dangerous = [
    /eval\s*\(/g,
    /Function\s*\(/g,
    /document\.write/g,
    /innerHTML\s*=/g,
    /__dirname/g,
    /__filename/g,
    /require\s*\(\s*['"`]child_process/g,
    /require\s*\(\s*['"`]fs/g,
    /process\.env/g,
  ];

  let sanitized = code;
  for (const pattern of dangerous) {
    sanitized = sanitized.replace(pattern, "/* [REMOVED FOR SAFETY] */");
  }

  return sanitized;
}

/**
 * Validate that a string is valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}
