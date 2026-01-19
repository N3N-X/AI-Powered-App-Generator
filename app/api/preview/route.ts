import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { CodeFiles } from "@/types";

/**
 * @swagger
 * /api/preview:
 *   get:
 *     summary: Generate preview HTML for project
 *     description: Generates an HTML preview of the project using Expo Snack, displaying it in a phone mockup iframe. If no code exists, shows an empty state.
 *     tags:
 *       - Projects
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project to preview
 *     responses:
 *       200:
 *         description: HTML preview generated
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Project ID required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or project not found
 *       500:
 *         description: Preview generation failed
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return new NextResponse("Project ID required", { status: 400 });
    }

    // Get user and project
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
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

    const codeFiles = project.codeFiles as CodeFiles;

    // Check if project has any meaningful code
    const appCode = codeFiles["App.tsx"] || codeFiles["App.js"] || "";
    const hasCode =
      Object.keys(codeFiles).length > 0 && appCode.trim().length > 0;

    if (!hasCode) {
      return new NextResponse(generateEmptyStateHtml(project.name), {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store",
        },
      });
    }

    // Generate preview HTML with embedded code (not URL params)
    const previewHtml = generatePreviewHtml(codeFiles, project.name);

    return new NextResponse(previewHtml, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Preview error:", error);
    return new NextResponse("Preview generation failed", { status: 500 });
  }
}

function generatePreviewHtml(
  codeFiles: CodeFiles,
  projectName?: string | null,
): string {
  const escapedName = escapeHtml(projectName || "RUX App");

  // Prepare files for Snack - encode as base64 JSON to avoid escaping issues
  const filesForSnack: Record<string, { type: string; contents: string }> = {};

  for (const [path, content] of Object.entries(codeFiles)) {
    filesForSnack[path] = {
      type: "CODE",
      contents: content,
    };
  }

  // Ensure we have required files
  if (!filesForSnack["package.json"]) {
    filesForSnack["package.json"] = {
      type: "CODE",
      contents: JSON.stringify(
        {
          dependencies: {
            expo: "~52.0.0",
            "expo-status-bar": "~2.0.0",
            react: "18.3.1",
            "react-native": "0.76.5",
          },
        },
        null,
        2,
      ),
    };
  }

  const snackData = {
    files: filesForSnack,
    name: escapedName,
    description: "Built with RUX",
    dependencies: {
      expo: "~52.0.0",
      "expo-status-bar": "~2.0.0",
      react: "18.3.1",
      "react-native": "0.76.5",
    },
  };

  // Base64 encode the data to pass it safely
  const encodedData = Buffer.from(JSON.stringify(snackData)).toString("base64");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      width: 100%;
      background: #0f0f23;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 12px 16px;
      background: #1a1a2e;
      border-bottom: 1px solid #2a2a4e;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .header-text {
      color: #94a3b8;
      font-size: 13px;
    }
    .preview-frame {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
    }
    .phone-mockup {
      width: 100%;
      max-width: 375px;
      height: 100%;
      max-height: 812px;
      background: #000;
      border-radius: 40px;
      padding: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      position: relative;
    }
    .phone-screen {
      width: 100%;
      height: 100%;
      background: #fff;
      border-radius: 32px;
      overflow: hidden;
      position: relative;
    }
    .notch {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 150px;
      height: 30px;
      background: #000;
      border-radius: 0 0 20px 20px;
      z-index: 10;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    .loading-overlay {
      position: absolute;
      inset: 0;
      background: #1a1a2e;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      z-index: 20;
      border-radius: 32px;
      transition: opacity 0.3s ease;
    }
    .loading-overlay.hidden {
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
      margin-bottom: 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading-text {
      font-size: 14px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="status-dot"></div>
      <span class="header-text">Live Preview - ${escapedName}</span>
    </div>
    <div class="preview-frame">
      <div class="phone-mockup">
        <div class="phone-screen">
          <div class="notch"></div>
          <div class="loading-overlay" id="loading">
            <div class="spinner"></div>
            <div class="loading-text">Loading preview...</div>
          </div>
          <iframe
            id="snack-frame"
            allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-downloads"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
  <script>
    (function() {
      const iframe = document.getElementById('snack-frame');
      const loading = document.getElementById('loading');
      const encodedData = "${encodedData}";

      // Decode the snack data
      const snackData = JSON.parse(atob(encodedData));

      // Build the Snack URL with files as URL parameters
      // We'll use a minimal approach to avoid URL length issues
      const params = new URLSearchParams();
      params.set('name', snackData.name);
      params.set('description', snackData.description);
      params.set('platform', 'web');
      params.set('preview', 'true');
      params.set('theme', 'dark');
      params.set('supportedPlatforms', 'web');

      // Add dependencies
      Object.entries(snackData.dependencies).forEach(([pkg, version]) => {
        params.set('dependencies[' + encodeURIComponent(pkg) + ']', version);
      });

      // Add files - using Snack's code parameter format
      Object.entries(snackData.files).forEach(([path, file]) => {
        params.set('files[' + encodeURIComponent(path) + ']', file.contents);
      });

      const snackUrl = 'https://snack.expo.dev/embedded?' + params.toString();

      // Check URL length - if too long, use alternative method
      if (snackUrl.length > 8000) {
        // For very large projects, we need to use postMessage API
        // First load Snack without files, then inject via postMessage
        const baseParams = new URLSearchParams();
        baseParams.set('name', snackData.name);
        baseParams.set('platform', 'web');
        baseParams.set('preview', 'true');
        baseParams.set('theme', 'dark');

        iframe.src = 'https://snack.expo.dev/embedded?' + baseParams.toString();

        // Wait for iframe to load, then send files via postMessage
        iframe.onload = function() {
          setTimeout(function() {
            try {
              iframe.contentWindow.postMessage({
                type: 'SNACK_UPDATE',
                files: snackData.files,
                dependencies: snackData.dependencies,
              }, 'https://snack.expo.dev');
            } catch (e) {
              console.log('PostMessage not supported, falling back to URL params');
            }
            loading.classList.add('hidden');
          }, 2000);
        };
      } else {
        iframe.src = snackUrl;

        iframe.onload = function() {
          setTimeout(function() {
            loading.classList.add('hidden');
          }, 2000);
        };
      }

      // Fallback timeout
      setTimeout(function() {
        loading.classList.add('hidden');
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
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
      padding: 40px;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3);
    }
    .icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    p {
      font-size: 16px;
      color: #94a3b8;
      max-width: 300px;
      line-height: 1.6;
    }
    .hint {
      margin-top: 32px;
      padding: 16px 24px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 12px;
      font-size: 14px;
      color: #c4b5fd;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    </div>
    <h1>Ready to Build</h1>
    <p>Describe your app idea in the chat and watch it come to life in real-time.</p>
    <div class="hint">
      Try: "Build a todo app with categories"
    </div>
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
