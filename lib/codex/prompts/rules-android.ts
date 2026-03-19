/** Android platform rules — template for generated Android apps (Material Design 3). */

export const ANDROID_RULES = `## ANDROID NAVIGATION PATTERN
- Use @react-navigation/bottom-tabs + @react-navigation/native-stack
- Screens go in src/screens/ directory (e.g. src/screens/HomeScreen.tsx)
- Use MaterialIcons from @expo/vector-icons for tab icons
- Tab icons: home, person, settings, search, favorite, shopping-cart, notifications
- Wrap in SafeAreaProvider + NavigationContainer

## ALLOWED PACKAGES
react, react-native, @react-navigation/native, @react-navigation/native-stack, @react-navigation/bottom-tabs, @expo/vector-icons, react-native-safe-area-context, react-native-screens, expo-status-bar, expo-linear-gradient, expo-haptics, react-native-reanimated, react-native-gesture-handler

## MATERIAL DESIGN 3 PHILOSOPHY
Follow Google's Material Design 3 (Material You) design language. Apps should feel cohesive, elevated, and expressive:
- **Tonal elevation** — use surface tints (surfaceElevated) instead of drop shadows for elevation
- **Rounded shapes** — 12dp for small (buttons, chips), 16dp for medium (cards), 28dp for large (FABs, sheets)
- **Dynamic spacing** — generous padding (16-24dp), consistent gaps between elements
- **Bold typography** — clear hierarchy with large headings, medium body, and caption text
- **Color containers** — primary actions use primaryLight bg + primary text for M3 "tonal" look
- **Floating action button (FAB)** — 56dp, rounded 16dp (NOT full circle), primary bg, elevation 6
- **Bottom sheets & dialogs** — rounded top corners (28dp), surface bg, elevated

## THEME SYSTEM (MANDATORY)
Use the same ThemeProvider pattern as iOS. Create src/theme.tsx with DARK/LIGHT themes:

\`\`\`typescript
// src/theme.tsx — Material Design 3 themed
import React, { createContext, useContext, useState } from 'react';

const DARK = {
  background: '#0a0a1a', surface: '#1a1a2e', card: '#12121f',
  surfaceElevated: 'rgba(255,255,255,0.06)',
  text: '#e2e8f0', textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.35)',
  border: 'rgba(255,255,255,0.08)', primary: '#6366F1',
  primaryLight: 'rgba(99,102,241,0.15)',
  tabBar: '#0a0a1a', tabBarBorder: 'rgba(255,255,255,0.06)',
  statusBar: 'light' as const,
  success: '#10b981', successBg: 'rgba(16,185,129,0.12)',
  error: '#ef4444', errorBg: 'rgba(239,68,68,0.12)',
  warning: '#f59e0b', warningBg: 'rgba(245,158,11,0.12)',
  elevation: {
    level0: { shadowOpacity: 0, elevation: 0 },
    level1: { shadowOpacity: 0.05, elevation: 1 },
    level2: { shadowOpacity: 0.08, elevation: 3 },
    level3: { shadowOpacity: 0.11, elevation: 6 },
    level4: { shadowOpacity: 0.14, elevation: 8 },
    level5: { shadowOpacity: 0.17, elevation: 12 },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  fontSize: { hero: 34, h1: 28, h2: 22, h3: 18, body: 16, small: 14, caption: 12 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, xxl: 28, full: 9999 },
};
const LIGHT = {
  background: '#f8fafc', surface: '#ffffff', card: '#ffffff',
  surfaceElevated: 'rgba(0,0,0,0.03)',
  text: '#1e293b', textSecondary: 'rgba(0,0,0,0.6)',
  textMuted: 'rgba(0,0,0,0.35)',
  border: 'rgba(0,0,0,0.06)', primary: '#6366F1',
  primaryLight: 'rgba(99,102,241,0.10)',
  tabBar: '#ffffff', tabBarBorder: 'rgba(0,0,0,0.06)',
  statusBar: 'dark' as const,
  success: '#059669', successBg: 'rgba(5,150,105,0.08)',
  error: '#dc2626', errorBg: 'rgba(220,38,38,0.08)',
  warning: '#d97706', warningBg: 'rgba(217,119,6,0.08)',
  elevation: {
    level0: { shadowOpacity: 0, elevation: 0 },
    level1: { shadowOpacity: 0.03, elevation: 1 },
    level2: { shadowOpacity: 0.05, elevation: 3 },
    level3: { shadowOpacity: 0.08, elevation: 6 },
    level4: { shadowOpacity: 0.10, elevation: 8 },
    level5: { shadowOpacity: 0.12, elevation: 12 },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  fontSize: { hero: 34, h1: 28, h2: 22, h3: 18, body: 16, small: 14, caption: 12 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, xxl: 28, full: 9999 },
};
export type AppTheme = typeof DARK;
const ThemeCtx = createContext<{ theme: AppTheme; isDark: boolean; toggleTheme: () => void }>({
  theme: DARK, isDark: true, toggleTheme: () => {}
});
export const useTheme = () => useContext(ThemeCtx);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? DARK : LIGHT;
  return <ThemeCtx.Provider value={{ theme, isDark, toggleTheme: () => setIsDark(p => !p) }}>{children}</ThemeCtx.Provider>;
}
\`\`\`

## SAFE AREA — CRITICAL
Every screen component MUST wrap its content in SafeAreaView from react-native-safe-area-context:
\`\`\`typescript
import { SafeAreaView } from 'react-native-safe-area-context';
export default function HomeScreen() {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      {/* screen content */}
    </SafeAreaView>
  );
}
\`\`\`

## THEME USAGE IN SCREENS
- Spacing: padding: theme.spacing.lg, marginBottom: theme.spacing.md, gap: theme.spacing.sm
- Font sizes: fontSize: theme.fontSize.h1 for headings, theme.fontSize.body for text, theme.fontSize.caption for labels
- Border radius: borderRadius: theme.radius.lg for cards, theme.radius.md for buttons, theme.radius.full for badges
- Elevation (M3): Apply theme.elevation.level2 spread for cards, level3 for FABs, level5 for modals
- Cards: { backgroundColor: theme.surface, borderRadius: theme.radius.lg, padding: theme.spacing.lg, ...theme.elevation.level2 }
- NEVER hardcode spacing values, font sizes, colors, or border-radius — always use theme tokens

## MATERIAL DESIGN 3 SCREEN PATTERNS
- **Hero headers**: Large bold title (fontSize.hero, fontWeight '800'), subtitle in textSecondary, xxl bottom margin
- **M3 Cards**: surface bg, radius lg (16), padding lg, elevation.level2 — NO hard borders (use elevation instead)
- **FAB (Floating Action Button)**: position absolute, bottom 24, right 24, width 56, height 56, radius lg (16 NOT full), primary bg, elevation.level3, centered icon
- **Tonal buttons (M3)**: primaryLight bg, primary text, radius full, paddingVertical sm, paddingHorizontal xl, fontWeight '600'
- **Outlined buttons**: transparent bg, borderWidth 1, borderColor border, radius full, text color
- **Search bars**: surfaceElevated bg, radius xxl (28), padding horizontal lg, height 48, elevation.level1
- **Section headers**: fontSize.h2, fontWeight '700', marginBottom md, paddingHorizontal lg
- **List items**: Pressable with paddingVertical md, paddingHorizontal lg, borderBottomWidth 0.5, borderColor border
- **Chips/badges**: primaryLight bg, primary text, radius full, paddingHorizontal sm, paddingVertical 2, fontSize caption
- **Bottom sheets**: surface bg, borderTopLeftRadius xxl, borderTopRightRadius xxl, elevation.level5
- **Empty states**: Centered, large icon (56px) in textMuted, h3 heading, body description, tonal action button

## TAB BAR STYLING
Material Design 3 floating pill tab bar:
\`\`\`typescript
tabBarStyle: {
  position: 'absolute',
  bottom: 16,
  left: 16,
  right: 16,
  borderRadius: 24,
  height: 64,
  paddingBottom: 8,
  backgroundColor: theme.surface,
  borderTopWidth: 0,
  ...theme.elevation.level3,
}
\`\`\`
- Tab bar colors MUST come from theme object — they change with dark/light mode
- DO NOT hardcode colors — always use theme.surface, theme.primary, etc.
- StatusBar style MUST match theme: isDark ? 'light' : 'dark'

## APP.TSX STRUCTURE
Same as iOS template but with ThemeProvider wrapping everything, MainTabs using theme for tabBarStyle (Material Design 3 floating pill), and AppContent component for StatusBar. See iOS template for exact pattern — adapt tab bar style to Material Design 3 floating pill above.`;
