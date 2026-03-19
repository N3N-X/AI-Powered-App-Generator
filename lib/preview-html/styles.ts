/**
 * CSS styles for the preview HTML document.
 */

export function getPreviewStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { height: 100%; width: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .rux-loading {
      display: flex; align-items: center; justify-content: center;
      height: 100vh; background: #f5f5f5; flex-direction: column; gap: 16px;
    }
    .rux-spinner {
      width: 40px; height: 40px; border: 3px solid #e0e0e0;
      border-top-color: #8b5cf6; border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .rux-error {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100vh; background: #fef2f2; color: #991b1b; padding: 20px; text-align: center;
    }
    .rux-error pre {
      margin-top: 10px; padding: 10px; background: #fee2e2; border-radius: 4px;
      font-size: 12px; max-width: 90%; overflow: auto; text-align: left;
      white-space: pre-wrap; word-break: break-word;
    }`;
}

export function getSizeLimitStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #fef2f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #991b1b; text-align: center; padding: 20px;
    }
    h2 { margin-bottom: 8px; }
    p { color: #b91c1c; font-size: 14px; }`;
}
