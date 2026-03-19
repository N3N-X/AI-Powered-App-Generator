/**
 * Virtual CommonJS module system and app loader for the preview sandbox.
 *
 * Returns JavaScript strings (to be embedded in <script> tags) that:
 * 1. Decode the base64-encoded code files.
 * 2. Set up external module registry (React, ReactDOM, lucide-react proxy).
 * 3. Provide resolvePath() and requireModule() for CJS-style imports.
 * 4. Load and render the App entry point.
 */

/**
 * Get the module system initialization and require() implementation.
 * @param encodedFiles - base64-encoded JSON of the code files
 */
export function getModuleSystemScript(encodedFiles: string): string {
  return `
    // ---- Virtual Module System (CommonJS) ----
    var encodedFiles = "${encodedFiles}";
    var codeFiles = JSON.parse(decodeURIComponent(escape(atob(encodedFiles))));

    // Map package names to UMD globals loaded via script tags
    var React = window.React;
    var ReactDOM = window.ReactDOM;

    // Build external modules registry from globals
    var externalModules = {
      'react': Object.assign({ default: React, __esModule: true }, React),
      'react-dom': Object.assign({ default: ReactDOM, __esModule: true }, ReactDOM),
      'react-dom/client': { default: ReactDOM, __esModule: true, createRoot: ReactDOM.createRoot, hydrateRoot: ReactDOM.hydrateRoot },
      'react/jsx-runtime': { default: React, __esModule: true, jsx: React.createElement, jsxs: React.createElement, Fragment: React.Fragment },
      'lucide-react': lucideReactProxy,
    };

    function resolvePath(importPath, fromFile) {
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) return null;
      var base = (fromFile && fromFile.indexOf('/') !== -1)
        ? fromFile.replace(/\\/[^/]*$/, '')
        : '';
      var raw;
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        raw = base ? base + '/' + importPath : importPath;
      } else {
        raw = importPath;
      }
      var parts = raw.split('/');
      var resolved = [];
      for (var i = 0; i < parts.length; i++) {
        if (parts[i] === '.' || parts[i] === '') continue;
        if (parts[i] === '..') { resolved.pop(); continue; }
        resolved.push(parts[i]);
      }
      var normalized = resolved.join('/');
      var exts = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
      for (var e = 0; e < exts.length; e++) {
        if (codeFiles[normalized + exts[e]] !== undefined) return normalized + exts[e];
      }
      // Fallback: if relative resolution overshot (e.g. ../App from src/pages/ yields
      // nothing because App.tsx is at root), try the basename at root level
      if (importPath.startsWith('../') || importPath.startsWith('./')) {
        var basename = importPath.split('/').pop();
        if (basename) {
          for (var e2 = 0; e2 < exts.length; e2++) {
            if (codeFiles[basename + exts[e2]] !== undefined) return basename + exts[e2];
          }
        }
      }
      return null;
    }

    var moduleCache = {};
    var moduleInProgress = {};

    function requireModule(id, fromFile) {
      // External package?
      if (externalModules[id]) return externalModules[id];

      // Try to resolve as local file
      var resolved = resolvePath(id, fromFile);
      if (!resolved) {
        console.warn('[RUX] Module not found: ' + id + ' (from ' + (fromFile || 'root') + ')');
        return {};
      }

      if (moduleCache[resolved]) return moduleCache[resolved];
      if (moduleInProgress[resolved]) return moduleInProgress[resolved];

      var code = codeFiles[resolved];
      if (!code) return {};

      var mod = { exports: {} };
      moduleInProgress[resolved] = mod.exports;

      try {
        function transformWithFilename(name) {
          return Babel.transform(code, {
            presets: ['react', 'typescript'],
            plugins: ['transform-modules-commonjs'],
            filename: name,
          }).code;
        }

        function looksLikeJsx(source) {
          return /return\\s*\\(\\s*</.test(source) || /<\\s*[A-Z][A-Za-z0-9]*/.test(source);
        }

        var transformed;
        try {
          transformed = transformWithFilename(resolved);
        } catch (transformError) {
          var canRetryAsJsxExt =
            (resolved.endsWith('.ts') || resolved.endsWith('.js')) &&
            looksLikeJsx(code);
          if (!canRetryAsJsxExt) throw transformError;
          var fallbackName = resolved.replace(/\\.ts$/, '.tsx').replace(/\\.js$/, '.jsx');
          transformed = transformWithFilename(fallbackName);
        }

        var fn = new Function('require', 'module', 'exports', transformed);
        fn(
          function(dep) { return requireModule(dep, resolved); },
          mod,
          mod.exports
        );
      } catch (e) {
        console.error('[RUX] Error in ' + resolved + ':', e.message);
      }

      moduleCache[resolved] = mod.exports;
      delete moduleInProgress[resolved];
      return mod.exports;
    }

    function escapeHtml(text) {
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }`;
}

export function getAppLoaderScript(): string {
  return `
    // Validate that a module exports a valid React component
    function validateComponentExport(mod, filePath) {
      var component = mod.default || mod;
      if (!component) {
        console.error('[RUX] ' + filePath + ' has no default export. Every page/screen file must: export default function ComponentName() { return <div>...</div>; }');
        return false;
      }
      if (typeof component !== 'function') {
        var exportType = typeof component;
        var exportKeys = Object.keys(component || {}).join(', ');
        console.error('[RUX] ' + filePath + ' exports a ' + exportType + ' instead of a React component function. Got keys: [' + exportKeys + ']. Fix: use "export default function ComponentName()" not "export default { ... }" or "module.exports = { ... }"');
        return false;
      }
      return true;
    }

    function loadApp() {
      try {
        var entryFile = codeFiles['App.tsx'] !== undefined ? 'App.tsx' :
                        codeFiles['App.jsx'] !== undefined ? 'App.jsx' :
                        codeFiles['App.js'] !== undefined ? 'App.js' : null;

        if (!entryFile) throw new Error('No App.tsx/App.jsx/App.js found');

        // Pre-validate all page/screen files before rendering
        var fileKeys = Object.keys(codeFiles);
        for (var i = 0; i < fileKeys.length; i++) {
          var fk = fileKeys[i];
          if (fk === entryFile) continue;
          if (fk.match(/\\.(tsx|jsx)$/) && (fk.indexOf('src/pages/') === 0 || fk.indexOf('src/screens/') === 0 || fk.indexOf('src/components/') === 0)) {
            try {
              var mod = requireModule('./' + fk, '');
              validateComponentExport(mod, fk);
            } catch(e) {
              console.error('[RUX] Failed to load ' + fk + ': ' + e.message);
            }
          }
        }

        var AppModule = requireModule('./' + entryFile, '');
        var App = AppModule.default || AppModule.App || AppModule;

        if (!App || typeof App !== 'function') {
          throw new Error(entryFile + ' does not export a valid React component function. Got type: ' + typeof App + '. Fix: use "export default function App() { return <div>...</div>; }"');
        }

        var rootElement = document.getElementById('root');
        var root = ReactDOM.createRoot(rootElement);
        root.render(React.createElement(App));
      } catch (error) {
        console.error('[RUX] Preview Error: ' + error.message);
        document.getElementById('root').innerHTML =
          '<div class="rux-error">' +
          '<h2>Preview Error</h2>' +
          '<p>' + escapeHtml(error.message) + '</p>' +
          '<pre>' + escapeHtml(error.stack || '') + '</pre>' +
          '</div>';
      }
    }

    window.addEventListener('load', function() {
      setTimeout(loadApp, 100);
    });

    window.onerror = function(msg) {
      console.error('[RUX Preview] Runtime error:', msg);
      return false;
    };`;
}
