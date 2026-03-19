/** iOS platform rules — template for generated iOS apps (iOS 26+ Liquid Glass). */

export const IOS_RULES = `## iOS NAVIGATION PATTERN
- Screens go in src/screens/ directory (e.g. src/screens/HomeScreen.tsx)
- Use Ionicons from @expo/vector-icons for tab icons
- Tab icons: home/home-outline, person/person-outline, settings/settings-outline, search/search-outline, heart/heart-outline, cart/cart-outline, notifications/notifications-outline
- MUST use React Navigation bottom tabs via createBottomTabNavigator (do NOT build a custom bottom nav component)
- Even simple apps (like calculator/todo) must still use the native tab navigator shell

## ALLOWED PACKAGES
react, react-native, @react-navigation/native, @react-navigation/native-stack, @react-navigation/bottom-tabs, @expo/vector-icons, react-native-safe-area-context, react-native-screens, expo-status-bar, expo-linear-gradient, expo-haptics, expo-blur, expo-glass-effect, react-native-reanimated, react-native-gesture-handler

## iOS 26 LIQUID GLASS DESIGN PHILOSOPHY
Follow Apple's iOS 26 design language. Apps should feel translucent, layered, and alive:
- **Glass surfaces** for floating UI elements (cards, headers, action sheets, floating buttons)
- **Depth through translucency** — surfaces reveal content behind them, creating visual hierarchy
- **Generous whitespace** and breathing room between elements
- **Large, bold typography** — SF Pro style hierarchy (hero 34pt, h1 28pt, body 16pt)
- **Subtle animations** on interactions — scale on press, smooth transitions
- **Minimal borders** — use shadow and translucency for separation instead of hard borders
- **Rounded corners everywhere** — radius 16-24 for cards, 12 for buttons, full for badges/avatars

## LIQUID GLASS COMPONENTS
Use expo-glass-effect for key UI surfaces on iOS 26+. Always provide fallback styling for older iOS:

\`\`\`typescript
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, View } from 'react-native';

// Glass card component pattern
function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  const { theme } = useTheme();
  const useGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

  if (useGlass) {
    return (
      <GlassView style={[{ borderRadius: theme.radius.xl, padding: theme.spacing.lg }, style]}>
        {children}
      </GlassView>
    );
  }
  return (
    <View style={[{
      backgroundColor: theme.surface, borderRadius: theme.radius.xl,
      padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15, shadowRadius: 12,
    }, style]}>
      {children}
    </View>
  );
}
\`\`\`

Use GlassView/GlassCard for: floating action buttons, card containers, bottom sheets, headers, search bars.
Do NOT use glass on: full-screen backgrounds, every single element (reserve for 3-5 key surfaces per screen).

## THEME SYSTEM (MANDATORY)
Every iOS app MUST implement a dark/light theme using React Context:

\`\`\`typescript
// src/theme.tsx
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
  shadow: { color: '#000', opacity: 0.25, radius: 12, offset: { width: 0, height: 4 } },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  fontSize: { hero: 34, h1: 28, h2: 22, h3: 18, body: 16, small: 14, caption: 12 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
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
  shadow: { color: '#000', opacity: 0.08, radius: 12, offset: { width: 0, height: 4 } },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  fontSize: { hero: 34, h1: 28, h2: 22, h3: 18, body: 16, small: 14, caption: 12 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
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
Every screen component MUST wrap its content in SafeAreaView:
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
Use edges={['top']} so the bottom tab bar handles its own safe area. NEVER render content behind the notch or home indicator.

## THEME USAGE IN SCREENS
- Spacing: padding: theme.spacing.lg, marginBottom: theme.spacing.md, gap: theme.spacing.sm
- Font sizes: fontSize: theme.fontSize.h1 for headings, theme.fontSize.body for text, theme.fontSize.caption for labels
- Border radius: borderRadius: theme.radius.xl for cards, theme.radius.md for buttons, theme.radius.full for badges/avatars
- Status colors: color: theme.success for success text, backgroundColor: theme.errorBg for error badges
- Shadows: shadowColor: theme.shadow.color, shadowOpacity: theme.shadow.opacity, shadowRadius: theme.shadow.radius, shadowOffset: theme.shadow.offset
- Cards: { backgroundColor: theme.surface, borderRadius: theme.radius.xl, padding: theme.spacing.lg, shadowColor: theme.shadow.color, shadowOpacity: theme.shadow.opacity, shadowRadius: theme.shadow.radius, shadowOffset: theme.shadow.offset }
- NEVER hardcode spacing values, font sizes, colors, or border-radius — always use theme tokens

## SCREEN DESIGN PATTERNS (iOS 26 style)
- **Hero headers**: Large bold title (fontSize.hero, fontWeight '800'), subtitle in textSecondary, xxl bottom margin
- **Card lists**: Cards with surface bg, radius xl, padding lg, shadow — generous spacing.md gap between cards
- **Floating action button**: Positioned absolute bottom-right, primary bg, radius full, shadow, size 56x56
- **Search bars**: Surface bg, radius full, padding horizontal lg, height 44, icon + placeholder text
- **Section headers**: fontSize.h2, fontWeight '700', marginBottom md, paddingHorizontal lg
- **List items**: Pressable with paddingVertical md, paddingHorizontal lg, borderBottomWidth 0.5, borderColor border
- **Badges/pills**: primaryLight bg, primary text, radius full, paddingHorizontal sm, paddingVertical 2, fontSize caption
- **Empty states**: Centered, large icon (56px) in textMuted, h3 heading, body description, primary action button

## APP.TSX MUST FOLLOW THIS EXACT TEMPLATE (adapt screens/icons only):
\`\`\`typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'HomeScreen') iconName = focused ? 'home' : 'home-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Home' }} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isDark } = useTheme();
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
\`\`\`

CRITICAL RULES FOR TAB BAR:
- tabBarStyle background and border MUST come from theme object — they change with dark/light mode
- DO NOT hardcode colors in tabBarStyle — always use theme.tabBar, theme.tabBarBorder
- DO NOT add position, bottom, borderRadius, elevation, or other layout properties to tabBarStyle
- DO NOT add tabBarBackground
- On iOS 26+ the system automatically upgrades the native tab bar to Liquid Glass — keep tabBarStyle simple (just backgroundColor + borderTopColor) so the Liquid Glass effect applies correctly
- StatusBar style MUST match theme: isDark ? 'light' : 'dark'`;
