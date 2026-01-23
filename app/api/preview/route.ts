import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { CodeFiles } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return new NextResponse("Project ID required", { status: 400 });
    }

    // Validate projectId format (basic UUID/CUID validation)
    if (!/^[a-zA-Z0-9_-]{10,40}$/.test(projectId)) {
      return new NextResponse("Invalid project ID format", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
      include: {
        projects: {
          where: { id: projectId },
        },
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const project = user.projects[0];
    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    let codeFiles: CodeFiles = {};
    try {
      codeFiles = (project.codeFiles as CodeFiles) || {};
    } catch {
      codeFiles = {};
    }

    // Check if codeFiles is valid
    if (!codeFiles || typeof codeFiles !== "object") {
      console.error("Invalid codeFiles:", codeFiles);
      return new NextResponse(generateEmptyStateHtml(project.name), {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store",
        },
      });
    }

    // Check if project has any meaningful code
    const appCode = codeFiles["App.tsx"] || codeFiles["App.js"] || "";
    const hasCode =
      Object.keys(codeFiles).length > 0 && appCode && appCode.trim().length > 0;

    if (!hasCode) {
      return new NextResponse(generateEmptyStateHtml(project.name), {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store",
        },
      });
    }

    const previewHtml = generatePreviewHtml(
      codeFiles,
      project.name,
      project.platform,
    );

    return new NextResponse(previewHtml, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Preview error:", error);
    return new NextResponse(
      generateErrorHtml("Preview generation failed. Please try again."),
      {
        status: 500,
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

function generateErrorHtml(message: string): string {
  const safeMessage = escapeHtml(message);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview Error</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      width: 100%;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .container {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
      padding: 32px;
    }
    .icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #ef4444;
    }
    p {
      font-size: 14px;
      color: #94a3b8;
      max-width: 300px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">&#x26A0;</div>
    <h1>Preview Error</h1>
    <p>${safeMessage}</p>
  </div>
</body>
</html>`;
}

function generatePreviewHtml(
  codeFiles: CodeFiles,
  projectName?: string | null,
  projectPlatform?: string,
): string {
  const escapedName = escapeHtml(projectName || "RUX App");

  // Extract dependencies
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

  // Auto-detect common dependencies
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

  // Get main App code
  const appCode = codeFiles["App.tsx"] || codeFiles["App.js"] || "";

  // Build dependencies string (comma-separated pkg@version format)
  const depsString = Object.entries(dependencies)
    .map(([pkg, version]) => `${pkg}@${version}`)
    .join(",");

  // Build the Snack URL with code parameter
  // Using encodeURIComponent for proper URL encoding
  // Determine which platforms to show based on project platform
  // Web is always included, plus the selected mobile platform (if any)
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
  snackParams.set("sdkVersion", "52.0.0");
  snackParams.set("name", projectName || "RUX App");
  snackParams.set("dependencies", depsString);
  snackParams.set("sourceUrl", "https://rux.dev");

  // For the code, we need to URL encode it properly
  // URLSearchParams handles encoding automatically
  snackParams.set("code", appCode);

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
      background: #0a0a0f;
    }
    #snack-frame {
      width: 100%;
      height: 100%;
      border: none;
    }
    .loader {
      position: fixed;
      inset: 0;
      background: #0a0a0f;
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
  </style>
</head>
<body>
  <div class="loader" id="loader">
    <div class="spinner"></div>
    <div class="loader-text">Loading preview...</div>
  </div>
  <iframe
    id="snack-frame"
    src="${snackUrl}"
    sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
    allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone"
  ></iframe>
  <script>
    (function() {
      var iframe = document.getElementById('snack-frame');
      var loader = document.getElementById('loader');

      iframe.onload = function() {
        // Hide loader after Snack has time to initialize
        setTimeout(function() {
          loader.classList.add('hide');
        }, 3000);
      };

      // Fallback hide after timeout
      setTimeout(function() {
        loader.classList.add('hide');
      }, 10000);
    })();
  </script>
</body>
</html>`;
}

function generateEmptyStateHtml(projectName?: string | null): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(projectName || "RUX Preview")}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      width: 100%;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .container {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
      padding: 32px;
    }
    .icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      box-shadow: 0 16px 32px rgba(139, 92, 246, 0.25);
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    p {
      font-size: 14px;
      color: #94a3b8;
      max-width: 260px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📱</div>
    <h1>Ready to Build</h1>
    <p>Describe your app idea in the chat and watch it come to life.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
