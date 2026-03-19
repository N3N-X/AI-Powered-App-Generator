/**
 * Sandbox security and console capture scripts for the preview iframe.
 *
 * Returns JavaScript strings to be embedded in <script> tags that:
 * 1. Lock down dangerous APIs (parent, top, opener, storage, cookies, network).
 * 2. Capture console.error/warn and forward to parent via postMessage.
 * 3. Capture unhandled errors and rejections.
 */

export function getSandboxScript(): string {
  return `
    // Save parent reference before sandbox locks it down (used by console capture)
    var __ruxParent = window.parent;

    // SANDBOX SECURITY
    (function() {
      try { delete window.parent; } catch(e) {}
      try { delete window.top; } catch(e) {}
      try { delete window.opener; } catch(e) {}

      var sandboxStorage = {};
      var sandboxProxy = {
        getItem: function(k) { return sandboxStorage[k] || null; },
        setItem: function(k, v) { sandboxStorage[k] = String(v); },
        removeItem: function(k) { delete sandboxStorage[k]; },
        clear: function() { sandboxStorage = {}; },
        get length() { return Object.keys(sandboxStorage).length; },
        key: function(i) { return Object.keys(sandboxStorage)[i] || null; }
      };
      Object.defineProperty(window, 'localStorage', {
        get: function() { return sandboxProxy; },
        configurable: false
      });
      Object.defineProperty(window, 'sessionStorage', {
        get: function() { return sandboxProxy; },
        configurable: false
      });
      Object.defineProperty(document, 'cookie', {
        get: function() { return ''; },
        set: function() { return ''; },
        configurable: false
      });

      var allowedDomains = ['esm.sh', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'rulxy.com', 'rulxy.space', 'nonxy.com', 'localhost', '127.0.0.1', 'dev.rulxy.com'];
      var currentHost = window.location.hostname;
      var originalFetch = window.fetch;
      window.fetch = function(url, options) {
        var urlStr = typeof url === 'string' ? url : (url.url || '');
        var hostname = '';
        try { hostname = new URL(urlStr, window.location.origin).hostname; } catch(e) {}
        var isAllowed = hostname === currentHost || allowedDomains.some(function(d) {
          return hostname === d || hostname.endsWith('.' + d);
        });
        if (!isAllowed && !urlStr.startsWith('data:') && !urlStr.startsWith('blob:')) {
          return Promise.reject(new Error('Network requests are restricted in preview mode'));
        }
        return originalFetch.call(window, url, options);
      };

      var OriginalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function() {
        var xhr = new OriginalXHR();
        var originalOpen = xhr.open;
        xhr.open = function(method, url) {
          var hostname = '';
          try { hostname = new URL(url, window.location.origin).hostname; } catch(e) {}
          var isAllowed = hostname === currentHost || allowedDomains.some(function(d) {
            return hostname === d || hostname.endsWith('.' + d);
          });
          if (!isAllowed) throw new Error('Network requests are restricted in preview mode');
          return originalOpen.apply(xhr, arguments);
        };
        return xhr;
      };
      window.WebSocket = function() { throw new Error('WebSocket restricted'); };
      window.EventSource = function() { throw new Error('EventSource restricted'); };
    })();`;
}

export function getConsoleCaptureScript(): string {
  return `
    // ---- Console Capture: send errors to parent via postMessage ----
    (function() {
      var _origError = console.error;
      var _origWarn = console.warn;
      var _seenMessages = {};

      function postConsole(level, args) {
        try {
          var message = Array.prototype.slice.call(args).map(function(a) {
            if (a instanceof Error) return a.message + '\\n' + (a.stack || '');
            if (typeof a === 'object') try { return JSON.stringify(a); } catch(e) { return String(a); }
            return String(a);
          }).join(' ');

          // Deduplicate — don't spam parent with the same error
          var key = level + ':' + message.slice(0, 200);
          if (_seenMessages[key]) return;
          _seenMessages[key] = true;

          __ruxParent.postMessage({
            type: 'rux-console',
            level: level,
            message: message,
            timestamp: Date.now()
          }, '*');
        } catch(e) {}
      }

      console.error = function() {
        postConsole('error', arguments);
        _origError.apply(console, arguments);
      };
      console.warn = function() {
        postConsole('warn', arguments);
        _origWarn.apply(console, arguments);
      };

      window.addEventListener('error', function(event) {
        postConsole('error', [event.message + ' at ' + (event.filename || '') + ':' + (event.lineno || '')]);
      });

      window.addEventListener('unhandledrejection', function(event) {
        var reason = event.reason;
        var msg = reason instanceof Error ? reason.message : String(reason);
        postConsole('error', ['Unhandled Promise Rejection: ' + msg]);
      });
    })();`;
}
