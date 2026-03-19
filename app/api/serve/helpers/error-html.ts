/**
 * HTML escaping and error page generation utilities.
 */

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateErrorHtml(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Rulxy</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 { font-size: 24px; margin-bottom: 10px; }
    p { color: #94a3b8; font-size: 16px; }
    a { color: #8b5cf6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔍</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <p style="margin-top: 20px;"><a href="https://rulxy.com">Create your own app with Rulxy</a></p>
  </div>
</body>
</html>`;
}
