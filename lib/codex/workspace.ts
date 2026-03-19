/**
 * Workspace hydration — bridge between DB CodeFiles and disk.
 *
 * Writes CodeFiles to /tmp/rux-{projectId}/ so the Codex agent
 * can operate on real files, then reads them back after generation.
 */

import { mkdir, writeFile, rm, readFile } from "fs/promises";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { glob } from "fast-glob";

type CodeFiles = Record<string, string>;

const WORKSPACE_PREFIX = "rux-";

// Files we manage ourselves (not part of user code)
const INTERNAL_FILES = new Set(["AGENTS.md"]);

// ── Public API ───────────────────────────────────────────────────────

/**
 * Get the workspace path for a project.
 */
export function workspacePath(projectId: string): string {
  return join(tmpdir(), `${WORKSPACE_PREFIX}${projectId}`);
}

/**
 * Write CodeFiles from DB to disk. Creates directories as needed.
 * Returns the workspace root path.
 */
export async function hydrateWorkspace(
  projectId: string,
  codeFiles: CodeFiles,
): Promise<string> {
  const root = workspacePath(projectId);

  // Clean slate — remove old workspace if it exists
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });

  // Write all code files
  const writes = Object.entries(codeFiles).map(async ([filePath, content]) => {
    const fullPath = join(root, filePath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, "utf-8");
  });

  await Promise.all(writes);
  return root;
}

/**
 * Write the AGENTS.md file to the workspace root.
 */
export async function writeAgentsMd(
  workspaceRoot: string,
  content: string,
): Promise<void> {
  await writeFile(join(workspaceRoot, "AGENTS.md"), content, "utf-8");
}

/**
 * Read all files from the workspace back into a CodeFiles map.
 * Excludes internal files (AGENTS.md) and common noise (node_modules, .git).
 */
export async function collectWorkspace(
  workspaceRoot: string,
): Promise<CodeFiles> {
  const files = await glob("**/*", {
    cwd: workspaceRoot,
    dot: false,
    onlyFiles: true,
    ignore: ["node_modules/**", ".git/**", "AGENTS.md"],
  });

  const codeFiles: CodeFiles = {};

  const reads = files.map(async (relativePath) => {
    const content = await readFile(
      join(workspaceRoot, relativePath),
      "utf-8",
    );
    codeFiles[relativePath] = content;
  });

  await Promise.all(reads);
  return codeFiles;
}

/**
 * Diff two CodeFiles maps. Returns only files that changed or are new.
 */
export function diffFiles(
  before: CodeFiles,
  after: CodeFiles,
): CodeFiles {
  const changed: CodeFiles = {};
  for (const [path, content] of Object.entries(after)) {
    if (before[path] !== content) {
      changed[path] = content;
    }
  }
  return changed;
}

/**
 * Remove the workspace directory.
 */
export async function cleanupWorkspace(workspaceRoot: string): Promise<void> {
  await rm(workspaceRoot, { recursive: true, force: true });
}
