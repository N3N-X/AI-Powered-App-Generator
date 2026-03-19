/**
 * Lucide icon SVG path data and icon factory script for the preview sandbox.
 *
 * Returns a JavaScript string (to be embedded in a <script> tag) that:
 * 1. Defines the LUCIDE_ICON_MAP with SVG paths for common icons.
 * 2. Provides createLucideIcon() which builds React SVG components.
 * 3. Creates a Proxy-based lucide-react module stub.
 * 4. Registers all known icons as window globals.
 */

export function getLucideIconScript(): string {
  return `
    var LUCIDE_ICON_MAP = {
      Home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
      Search: 'M21 21l-6-6m0 0A7 7 0 1 0 3 10a7 7 0 0 0 12 5z',
      Settings: 'M12 1a1 1 0 0 1 1 1v1.07A7.002 7.002 0 0 1 18.93 9H20a1 1 0 1 1 0 2h-1.07A7.002 7.002 0 0 1 13 16.93V18a1 1 0 1 1-2 0v-1.07A7.002 7.002 0 0 1 5.07 11H4a1 1 0 1 1 0-2h1.07A7.002 7.002 0 0 1 11 3.07V2a1 1 0 0 1 1-1z',
      User: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
      Heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z',
      Star: 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z',
      ShoppingCart: 'M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M20 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6',
      Menu: 'M3 12h18M3 6h18M3 18h18',
      X: 'M18 6L6 18M6 6l12 12',
      Plus: 'M12 5v14M5 12h14',
      Check: 'M20 6L9 17l-5-5',
      ChevronRight: 'M9 18l6-6-6-6',
      ChevronLeft: 'M15 18l-6-6 6-6',
      ChevronDown: 'M6 9l6 6 6-6',
      ArrowLeft: 'M19 12H5M12 19l-7-7 7-7',
      ArrowRight: 'M5 12h14M12 5l7 7-7 7',
      Bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
      Mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
      Phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72',
      MapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
      Calendar: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4M8 2v4M3 10h18',
      Clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2',
      Eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
      Edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
      Trash2: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6M14 11v6',
      Filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
      Download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5M12 15V3',
      Upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5M12 3v12',
      LogOut: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5M21 12H9',
      LogIn: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4 M10 17l5-5-5-5M15 12H3',
      Bookmark: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
      Share2: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0-6z M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98',
      ExternalLink: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6M10 14L21 3',
      Copy: 'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
      MoreVertical: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
      Sun: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
      Moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
      Globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z',
      Zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      TrendingUp: 'M23 6l-9.5 9.5-5-5L1 18',
      BarChart: 'M12 20V10M18 20V4M6 20v-4',
      Layers: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5M2 12l10 5 10-5',
      Grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
      List: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
      Image: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M21 15l-5-5L5 21',
      Camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
      Coffee: 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z M6 1v3M10 1v3M14 1v3',
      Gift: 'M20 12v10H4V12 M2 7h20v5H2z M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
      Tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01',
      Users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
      MessageCircle: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
      Sparkles: 'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z',
    };

    function createLucideIcon(name) {
      var pathD = LUCIDE_ICON_MAP[name];
      return function LucideIcon(props) {
        var size = (props && props.size) || 24;
        var color = (props && props.color) || (props && props.stroke) || 'currentColor';
        var strokeWidth = (props && props.strokeWidth) || 2;
        var className = (props && props.className) || '';
        return React.createElement('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          width: size, height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: color,
          strokeWidth: strokeWidth,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          className: className,
          style: props && props.style,
        }, pathD ? pathD.split(' M').map(function(d, i) {
          return React.createElement('path', { key: i, d: i === 0 ? d : 'M' + d });
        }) : React.createElement('circle', { cx: 12, cy: 12, r: 10 }));
      };
    }

    // Build lucide-react proxy: any named import returns an SVG icon component
    var lucideReactProxy = new Proxy({ __esModule: true, default: {} }, {
      get: function(target, prop) {
        if (prop === '__esModule') return true;
        if (prop === 'default') return target;
        if (typeof prop === 'string') return createLucideIcon(prop);
        return undefined;
      }
    });

    // Register all known Lucide icons as globals so generated code works even without imports
    Object.keys(LUCIDE_ICON_MAP).forEach(function(name) {
      window[name] = createLucideIcon(name);
    });`;
}
