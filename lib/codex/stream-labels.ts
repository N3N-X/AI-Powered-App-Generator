/**
 * User-friendly label generation for streaming progress events.
 */

/**
 * Generate a user-friendly label for file changes based on the file path.
 */
export function generateFileChangeLabel(paths: string[]): string {
  if (paths.length === 0) return "Updating files";

  const labels: string[] = [];

  for (const path of paths) {
    const fileName = path.split("/").pop() || path;
    const cleanName = fileName.replace(/\.(tsx?|jsx?|css|json)$/, "");
    const pathLower = path.toLowerCase();

    let label = "";

    // Screen/Page detection
    if (pathLower.includes("/screens/") || pathLower.includes("/pages/")) {
      const formattedName = cleanName
        .replace(/Screen$|Page$|Component$|View$/i, "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .trim();
      label = `Building ${formattedName} screen`;
    }
    // Component detection
    else if (pathLower.includes("/components/")) {
      const formattedName = cleanName
        .replace(/Component$/i, "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .trim();
      label = `Creating ${formattedName}`;
    }
    // Service/API detection
    else if (
      pathLower.includes("/services/") ||
      pathLower.includes("/utils/")
    ) {
      label = `Setting up ${cleanName}`;
    }
    // App entry
    else if (fileName === "App.tsx" || fileName === "App.jsx") {
      label = "Configuring app entry";
    }
    // Default
    else {
      label = `Writing ${cleanName}`;
    }

    labels.push(label);
  }

  const unique = [...new Set(labels)];
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return unique.join(" and ");
  return `${unique[0]} (+${unique.length - 1} more)`;
}

/**
 * Format command for UI display - just show the raw command.
 */
export function formatCommandForUI(cmd: string): string | null {
  if (!cmd || !cmd.trim()) return null;

  // Just return the raw command, truncated if too long
  const trimmed = cmd.trim();
  if (trimmed.length > 80) {
    return trimmed.slice(0, 77) + "...";
  }
  return trimmed;
}
