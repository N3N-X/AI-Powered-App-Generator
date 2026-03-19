import { CodeFiles } from "@/types";
import { escapeHtml } from "./html-utils";
export { generateEmptyStateHtml, generateErrorHtml } from "./html-states";

export function generatePreviewHtml(
  codeFiles: CodeFiles,
  projectName?: string | null,
  projectPlatform?: string,
): string {
  const escapedName = escapeHtml(projectName || "Rulxy App");
  let dependencies: Record<string, string> = {
    expo: "~52.0.0",
    "expo-status-bar": "~2.0.0",
    react: "18.3.1",
    "react-native": "0.76.5",
  };

  if (codeFiles["package.json"]) {
    try {
      const pkgJson = JSON.parse(codeFiles["package.json"]);
      if (pkgJson.dependencies) {
        dependencies = { ...dependencies, ...pkgJson.dependencies };
      }
    } catch {
      // Keep defaults
    }
  }
  const allCode = Object.values(codeFiles).join("\n");
  const commonDeps: Record<string, string> = {
    "react-native-paper": "*",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "react-native-screens": "~4.0.0",
    "react-native-safe-area-context": "4.12.0",
    "@react-native-async-storage/async-storage": "2.1.0",
    "expo-linear-gradient": "~14.0.0",
    "expo-haptics": "~14.0.0",
    "expo-blur": "~14.0.0",
    "expo-glass-effect": "*",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    "@expo/vector-icons": "^14.0.0",
  };

  for (const [pkg, version] of Object.entries(commonDeps)) {
    if (
      allCode.includes(`from '${pkg}'`) ||
      allCode.includes(`from "${pkg}"`)
    ) {
      if (!dependencies[pkg]) {
        dependencies[pkg] = version;
      }
    }
  }
  const appCode = codeFiles["App.tsx"] || codeFiles["App.js"] || "";
  const depsString = Object.entries(dependencies)
    .map(([pkg, version]) => `${pkg}@${version}`)
    .join(",");

  const platformParam =
    projectPlatform === "IOS"
      ? "web,ios"
      : projectPlatform === "ANDROID"
        ? "web,android"
        : "web";

  const snackParams = new URLSearchParams();
  snackParams.set("platform", platformParam);
  snackParams.set("preview", "true");
  snackParams.set("theme", "dark");
  snackParams.set("sdkVersion", "54.0.0");
  snackParams.set("name", projectName || "Rulxy App");
  snackParams.set("dependencies", depsString);
  snackParams.set("sourceUrl", "https://rux.dev");

  // Send all files to Snack so multi-screen apps work
  const snackFiles: Record<string, { type: string; contents: string }> = {};
  for (const [filePath, content] of Object.entries(codeFiles)) {
    snackFiles[filePath] = { type: "CODE", contents: content };
  }
  const filesJson = JSON.stringify(snackFiles);
  const isTruncated = filesJson.length >= 100_000;
  if (!isTruncated) {
    snackParams.set("files", filesJson);
  } else {
    snackParams.set("code", appCode);
  }

  const snackUrl = `https://snack.expo.dev/embedded?${snackParams.toString()}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedName} - Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      width: 100%;
      overflow: hidden;
      background: hsl(240 17% 2%);
    }
    #snack-frame {
      width: 100%;
      height: 100%;
      border: none;
    }
    .loader {
      position: fixed;
      inset: 0;
      background: hsl(240 17% 2%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 999;
      transition: opacity 0.3s;
    }
    .loader.hide {
      opacity: 0;
      pointer-events: none;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #2a2a4e;
      border-top-color: #8b5cf6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loader-text {
      margin-top: 16px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      color: #64748b;
    }
    .limit-banner {
      position: fixed;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(148, 163, 184, 0.2);
      color: #cbd5f5;
      padding: 8px 12px;
      border-radius: 999px;
      font-family: system-ui, sans-serif;
      font-size: 12px;
      z-index: 1000;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    }
  </style>
</head>
<body>
  ${
    isTruncated
      ? `<div class="limit-banner">Preview limited to App.tsx due to project size. Export or run locally for full preview.</div>`
      : ""
  }
  <div class="loader" id="loader">
    <div class="spinner"></div>
    <div class="loader-text">Loading preview...</div>
  </div>
  <iframe
    id="snack-frame"
    src="${snackUrl}"
    sandbox="allow-same-origin allow-scripts"
    referrerpolicy="no-referrer"
    allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone"
  ></iframe>
  <script>
    (function() {
      var iframe = document.getElementById('snack-frame');
      var loader = document.getElementById('loader');

      iframe.onload = function() {
        setTimeout(function() {
          loader.classList.add('hide');
        }, 3000);
      };

      setTimeout(function() {
        loader.classList.add('hide');
      }, 10000);
    })();
  </script>
</body>
</html>`;
}
