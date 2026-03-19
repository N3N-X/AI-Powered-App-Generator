import { escapeHtml } from "./html-utils";

export function generateErrorHtml(message: string): string {
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

export function generateEmptyStateHtml(projectName?: string | null): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(projectName || "Rulxy Preview")}</title>
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
