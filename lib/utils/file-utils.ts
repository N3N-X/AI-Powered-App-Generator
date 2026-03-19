import { CodeFiles, FileTreeNode } from "@/types";

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
