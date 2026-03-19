/** Web platform rules — template for generated web apps. */

export const WEB_RULES = `## WEB NAVIGATION PATTERN
- Use state-based routing (NO react-router-dom)
- Pages go in src/pages/ directory (e.g. src/pages/HomePage.tsx)
- Use lucide-react for icons: import { Home, User, Settings } from 'lucide-react'
- Use HTML elements with inline styles referencing THEME constant
- MUST include responsive CSS via <style> tag

## ALLOWED PACKAGES
react, lucide-react ONLY. NO react-router-dom, NO react-native, NO axios/lodash/moment.

## APP.TSX MUST FOLLOW THIS EXACT TEMPLATE (adapt pages/icons only):
\`\`\`typescript
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Home, BookOpen, Heart } from 'lucide-react'; // Import icons matching your app's screens
// Import all pages from ./src/pages/...

const DARK_THEME = {
  colors: {
    background: '#0a0a1a',
    surface: 'rgba(255,255,255,0.03)',
    surfaceHover: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.08)',
    text: '#e2e8f0',
    textSecondary: 'rgba(255,255,255,0.6)',
    textMuted: 'rgba(255,255,255,0.4)',
    primary: '#7c3aed',
    primaryHover: '#8b5cf6',
    primaryGlow: 'rgba(124,58,237,0.25)',
    accent: '#6366f1',
    success: '#10b981',
    successBg: 'rgba(16,185,129,0.12)',
    error: '#ef4444',
    errorBg: 'rgba(239,68,68,0.12)',
    warning: '#f59e0b',
    warningBg: 'rgba(245,158,11,0.12)',
    info: '#3b82f6',
    infoBg: 'rgba(59,130,246,0.12)',
  },
  glass: {
    background: 'rgba(255,255,255,0.03)',
    blur: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    shadow: '0 8px 32px rgba(0,0,0,0.12)',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64 },
  typography: {
    hero: { fontSize: 48, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' },
    h1: { fontSize: 32, fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: 24, fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: 18, fontWeight: 600, lineHeight: 1.4 },
    body: { fontSize: 16, fontWeight: 400, lineHeight: 1.6 },
    small: { fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
    caption: { fontSize: 12, fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.02em' },
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.2)',
    md: '0 4px 12px rgba(0,0,0,0.2)',
    lg: '0 8px 32px rgba(0,0,0,0.24)',
    xl: '0 16px 48px rgba(0,0,0,0.3)',
    glow: '0 0 20px rgba(124,58,237,0.3)',
  },
};

const LIGHT_THEME = {
  colors: {
    background: '#f8fafc',
    surface: 'rgba(0,0,0,0.02)',
    surfaceHover: 'rgba(0,0,0,0.04)',
    border: 'rgba(0,0,0,0.08)',
    text: '#1e293b',
    textSecondary: 'rgba(0,0,0,0.6)',
    textMuted: 'rgba(0,0,0,0.4)',
    primary: '#7c3aed',
    primaryHover: '#8b5cf6',
    primaryGlow: 'rgba(124,58,237,0.15)',
    accent: '#6366f1',
    success: '#059669',
    successBg: 'rgba(5,150,105,0.08)',
    error: '#dc2626',
    errorBg: 'rgba(220,38,38,0.08)',
    warning: '#d97706',
    warningBg: 'rgba(217,119,6,0.08)',
    info: '#2563eb',
    infoBg: 'rgba(37,99,235,0.08)',
  },
  glass: {
    background: 'rgba(255,255,255,0.7)',
    blur: 'blur(20px)',
    border: '1px solid rgba(0,0,0,0.08)',
    shadow: '0 8px 32px rgba(0,0,0,0.06)',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64 },
  typography: {
    hero: { fontSize: 48, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' },
    h1: { fontSize: 32, fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: 24, fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: 18, fontWeight: 600, lineHeight: 1.4 },
    body: { fontSize: 16, fontWeight: 400, lineHeight: 1.6 },
    small: { fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
    caption: { fontSize: 12, fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.02em' },
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 4px 12px rgba(0,0,0,0.06)',
    lg: '0 8px 32px rgba(0,0,0,0.08)',
    xl: '0 16px 48px rgba(0,0,0,0.12)',
    glow: '0 0 20px rgba(124,58,237,0.15)',
  },
};

type AppTheme = typeof DARK_THEME;
const ThemeContext = createContext<{ theme: AppTheme; isDark: boolean; toggleTheme: () => void }>({
  theme: DARK_THEME, isDark: true, toggleTheme: () => {}
});
export const useTheme = () => useContext(ThemeContext);

const NavigationContext = createContext<{ currentPage: string; navigate: (page: string) => void }>({
  currentPage: 'home', navigate: () => {}
});
export const useNavigation = () => useContext(NavigationContext);

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'recipes', label: 'Recipes', icon: BookOpen },
  { id: 'favorites', label: 'Favorites', icon: Heart },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const THEME = isDark ? DARK_THEME : LIGHT_THEME;
  const toggleTheme = () => setIsDark(prev => !prev);

  useEffect(() => {
    document.title = "App Name";
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    document.documentElement.style.backgroundColor = THEME.colors.background;
    document.body.style.backgroundColor = THEME.colors.background;
  }, [isDark, THEME]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage />;
      case 'recipes': return <RecipesPage />;
      case 'favorites': return <FavoritesPage />;
      default: return <HomePage />;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: THEME, isDark, toggleTheme }}>
    <NavigationContext.Provider value={{ currentPage, navigate: setCurrentPage }}>
      <div style={{ minHeight: '100vh', background: THEME.colors.background, color: THEME.colors.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", transition: 'background 0.3s, color 0.3s' }}>
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: isDark ? 'rgba(10,10,26,0.8)' : 'rgba(255,255,255,0.8)',
          backdropFilter: THEME.glass.blur,
          borderBottom: THEME.glass.border,
          padding: '0 24px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, background: 'linear-gradient(135deg, #7c3aed, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            App Name
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="nav-links">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => setCurrentPage(item.id)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: THEME.radius.md, border: 'none', cursor: 'pointer',
                background: currentPage === item.id ? THEME.colors.primaryGlow : 'transparent',
                color: currentPage === item.id ? '#a78bfa' : THEME.colors.textSecondary,
                fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
              }}>
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}
            <button onClick={toggleTheme} style={{
              marginLeft: 8, padding: '8px 12px', borderRadius: THEME.radius.md, border: THEME.glass.border,
              background: THEME.colors.surface, color: THEME.colors.text, cursor: 'pointer',
              fontSize: 14, transition: 'all 0.2s',
            }}>
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', color: THEME.colors.text, cursor: 'pointer', padding: 8 }}>
            <div style={{ width: 20, height: 2, background: THEME.colors.text, margin: '4px 0', borderRadius: 2 }} />
            <div style={{ width: 20, height: 2, background: THEME.colors.text, margin: '4px 0', borderRadius: 2 }} />
            <div style={{ width: 20, height: 2, background: THEME.colors.text, margin: '4px 0', borderRadius: 2 }} />
          </button>
        </nav>
        {menuOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setMenuOpen(false)}>
            <div style={{ position: 'absolute', top: 64, right: 0, width: 280, background: THEME.colors.surface, borderLeft: THEME.glass.border, padding: THEME.spacing.md, height: 'calc(100vh - 64px)' }} onClick={e => e.stopPropagation()}>
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => { setCurrentPage(item.id); setMenuOpen(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '14px 16px', borderRadius: THEME.radius.md, border: 'none', cursor: 'pointer',
                  background: currentPage === item.id ? THEME.colors.primaryGlow : 'transparent',
                  color: currentPage === item.id ? '#a78bfa' : THEME.colors.textSecondary,
                  fontSize: 15, fontWeight: 500, marginBottom: 4,
                }}>
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
              <button onClick={toggleTheme} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '14px 16px', borderRadius: THEME.radius.md, border: 'none', cursor: 'pointer',
                background: 'transparent', color: THEME.colors.textSecondary,
                fontSize: 15, fontWeight: 500, marginTop: 8,
              }}>
                {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
            </div>
          </div>
        )}
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: \`\${THEME.spacing.xl}px \${THEME.spacing.md}px\` }}>
          {renderPage()}
        </main>
        <footer style={{
          borderTop: THEME.glass.border, padding: \`\${THEME.spacing.xl}px \${THEME.spacing.md}px\`,
          textAlign: 'center', color: THEME.colors.textMuted, ...THEME.typography.small,
        }}>
          <p>Built with Rulxy</p>
        </footer>
        <style>{\`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: \${THEME.colors.background}; }
          .nav-links { display: flex; }
          .mobile-menu-btn { display: none !important; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
          .animate-in { animation: fadeIn 0.4s ease-out both; }
          .slide-up { animation: slideUp 0.5s ease-out both; }
          .scale-in { animation: scaleIn 0.3s ease-out both; }
          @media (max-width: 768px) {
            .nav-links { display: none !important; }
            .mobile-menu-btn { display: block !important; }
          }
          @media (max-width: 640px) {
            .grid-responsive { grid-template-columns: 1fr !important; }
          }
          @media (min-width: 641px) and (max-width: 1024px) {
            .grid-responsive { grid-template-columns: repeat(2, 1fr) !important; }
          }
        \`}</style>
      </div>
    </NavigationContext.Provider>
    </ThemeContext.Provider>
  );
}
\`\`\`

CRITICAL: Follow this template structure EXACTLY. Adapt NAV_ITEMS and pages to match the app spec screens. ONLY include screens the user requested.

## THEME USAGE IN PAGE COMPONENTS
Every page component MUST start with:
\`\`\`typescript
import React from 'react';
import { useTheme, useNavigation } from '../../App';

export default function PageName() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { navigate } = useNavigation();
  // ... use theme.colors.*, theme.spacing.*, etc.
}
\`\`\`
NOTE: Pages live in src/pages/, so the import path to root App.tsx is '../../App' (up two levels: pages → src → root).

Style patterns (use \`theme\` from useTheme(), NEVER a local THEME constant):
- Typography: style={{ ...theme.typography.h1, color: theme.colors.text }}
- Spacing: style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
- Cards: style={{ background: theme.colors.surface, border: theme.glass.border, borderRadius: theme.radius.lg, padding: theme.spacing.lg, boxShadow: theme.shadow.md, transition: 'all 0.2s' }}
- Primary button: style={{ background: theme.colors.primary, color: '#fff', padding: \\\`\\\${theme.spacing.sm}px \\\${theme.spacing.xl}px\\\`, borderRadius: theme.radius.md, border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
- Status badge: style={{ background: theme.colors.successBg, color: theme.colors.success, padding: \\\`2px \\\${theme.spacing.sm}px\\\`, borderRadius: theme.radius.full, ...theme.typography.caption }}
- Card grid: style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.lg }} className="grid-responsive"
- Section: style={{ padding: \\\`\\\${theme.spacing.xxl}px 0\\\` }}

## THEME SYSTEM RULES
- App.tsx defines DARK_THEME + LIGHT_THEME and exports useTheme() and useNavigation() via Context
- App.tsx MUST set document.documentElement.style.colorScheme and backgroundColor on theme change
- App.tsx MUST include a theme toggle button in both desktop nav and mobile menu
- Pages MUST import { useTheme } from '../../App' (two levels up from src/pages/ to root) and destructure: const { theme, isDark, toggleTheme } = useTheme()
- NEVER define a standalone THEME constant or re-create ThemeContext in page files
- NEVER hardcode colors, spacing, font sizes, or border-radius — always use theme tokens from useTheme()
- ALL generated apps MUST support both dark and light themes`;
