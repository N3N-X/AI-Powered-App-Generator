/**
 * Multi-Agent Prompts
 * Platform-specific prompts for each agent role
 */

import { PROXY_SERVICES, Platform } from "./types";

// Build proxy documentation for prompts
function buildProxyDocs(apiBaseUrl: string): string {
  return `
## RUX PROXY SERVICES (use these for all backend operations)
API_BASE: "${apiBaseUrl}"
API_KEY: "USER_API_KEY" (injected at runtime)

### Database (CRUD operations)
POST ${apiBaseUrl}/api/proxy/db
Headers: { "Content-Type": "application/json", "X-RUX-API-Key": API_KEY }
Body: { collection, operation, data?, filter? }
Operations: create, findMany, findOne, update, delete

### Authentication
POST ${apiBaseUrl}/api/proxy/auth
Operations: signup, login, logout, getSession, resetPassword
Body: { operation, email?, password?, token? }

### Email (Resend)
POST ${apiBaseUrl}/api/proxy/email
Body: { to, subject, html?, text?, from? }

### SMS (Twilio)
POST ${apiBaseUrl}/api/proxy/sms
Body: { to, message }

### Maps (Google Maps)
POST ${apiBaseUrl}/api/proxy/maps
Body: { operation: "geocode" | "directions" | "places", ... }

### Storage (File uploads)
POST ${apiBaseUrl}/api/proxy/storage
Body: FormData with file, or { operation: "list" | "delete", key? }

### AI (OpenAI)
POST ${apiBaseUrl}/api/proxy/openai
Body: { operation: "chat" | "image" | "embedding", messages?, prompt? }

### Payments (Stripe)
POST ${apiBaseUrl}/api/proxy/payments
Operations:
- createCheckout: { operation: "createCheckout", items: [{ name, price, quantity }], successUrl, cancelUrl }
- createSubscription: { operation: "createSubscription", priceId, customerId? }
- getProducts: { operation: "getProducts" }
- createPaymentIntent: { operation: "createPaymentIntent", amount, currency }
- webhook handling is automatic
`;
}

// API service helper code - includes ALL services (used in prompts)
export function buildApiServiceCode(apiBaseUrl: string): string {
  return `const API_BASE = '${apiBaseUrl}';
const API_KEY = 'USER_API_KEY';

const headers = {
  'Content-Type': 'application/json',
  'X-RUX-API-Key': API_KEY,
};

// Database operations
export const db = {
  create: async (collection: string, data: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST', headers,
      body: JSON.stringify({ collection, operation: 'create', data })
    });
    return res.json();
  },
  getAll: async (collection: string, filter?: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST', headers,
      body: JSON.stringify({ collection, operation: 'findMany', filter })
    });
    const result = await res.json();
    return result.data || [];
  },
  getOne: async (collection: string, filter: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST', headers,
      body: JSON.stringify({ collection, operation: 'findOne', filter })
    });
    return res.json();
  },
  update: async (collection: string, id: string, data: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST', headers,
      body: JSON.stringify({ collection, operation: 'update', filter: { id }, data })
    });
    return res.json();
  },
  delete: async (collection: string, id: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST', headers,
      body: JSON.stringify({ collection, operation: 'delete', filter: { id } })
    });
    return res.json();
  }
};
`;
}

// Build API code with ONLY the services the app needs
export function buildApiServiceCodeForSpec(
  apiBaseUrl: string,
  spec: {
    authRequired?: boolean;
    paymentsRequired?: boolean;
    externalApis?: string[];
  },
  apiKey?: string, // Optional actual API key to inject
): string {
  const services: string[] = [];

  // Always include database
  services.push(`// Database operations
export const db = {
  create: async (collection: string, data: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST', headers,
      body: JSON.stringify({ collection, operation: 'create', data })
    });
    return res.json();
  },
  getAll: async (collection: string, filter?: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST', headers,
      body: JSON.stringify({ collection, operation: 'findMany', filter })
    });
    const result = await res.json();
    return result.data || [];
  },
  getOne: async (collection: string, filter: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST', headers,
      body: JSON.stringify({ collection, operation: 'findOne', filter })
    });
    return res.json();
  },
  update: async (collection: string, id: string, data: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST', headers,
      body: JSON.stringify({ collection, operation: 'update', filter: { id }, data })
    });
    return res.json();
  },
  delete: async (collection: string, id: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST', headers,
      body: JSON.stringify({ collection, operation: 'delete', filter: { id } })
    });
    return res.json();
  }
};`);

  // Always include auth - screens may use it even if not explicitly required in spec
  services.push(`
// Authentication
export const auth = {
  signup: async (email: string, password: string, metadata?: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'signup', email, password, metadata })
    });
    return res.json();
  },
  login: async (email: string, password: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'login', email, password })
    });
    return res.json();
  },
  logout: async () => {
    const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'logout' })
    });
    return res.json();
  },
  getSession: async () => {
    const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'getSession' })
    });
    return res.json();
  }
};`);

  // Payments if needed
  if (spec.paymentsRequired) {
    services.push(`
// Payments
export const payments = {
  createCheckout: async (items: { name: string; price: number; quantity: number }[], successUrl: string, cancelUrl: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/payments\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'createCheckout', items, successUrl, cancelUrl })
    });
    return res.json();
  },
  getProducts: async () => {
    const res = await fetch(\`\${API_BASE}/api/proxy/payments\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'getProducts' })
    });
    return res.json();
  }
};`);
  }

  // External APIs
  const externalApis = spec.externalApis || [];

  if (externalApis.includes("maps")) {
    services.push(`
// Maps & Geocoding
export const maps = {
  geocode: async (address: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/maps\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'geocode', address })
    });
    return res.json();
  },
  reverseGeocode: async (lat: number, lng: number) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/maps\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'reverseGeocode', lat, lng })
    });
    return res.json();
  },
  directions: async (origin: string, destination: string, mode: string = 'driving') => {
    const res = await fetch(\`\${API_BASE}/api/proxy/maps\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'directions', origin, destination, mode })
    });
    return res.json();
  },
  searchPlaces: async (query: string, location?: string, radius?: number) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/maps\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'placeSearch', query, location, radius })
    });
    return res.json();
  }
};`);
  }

  if (externalApis.includes("weather")) {
    services.push(`
// Weather Data
export const weather = {
  current: async (location?: string, lat?: number, lon?: number, units: string = 'metric') => {
    const res = await fetch(\`\${API_BASE}/api/proxy/weather\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'current', location, lat, lon, units })
    });
    return res.json();
  },
  forecast: async (location?: string, lat?: number, lon?: number, units: string = 'metric') => {
    const res = await fetch(\`\${API_BASE}/api/proxy/weather\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'forecast', location, lat, lon, units })
    });
    return res.json();
  },
  hourly: async (location?: string, lat?: number, lon?: number, units: string = 'metric') => {
    const res = await fetch(\`\${API_BASE}/api/proxy/weather\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'hourly', location, lat, lon, units })
    });
    return res.json();
  }
};`);
  }

  if (externalApis.includes("email")) {
    services.push(`
// Email
export const email = {
  send: async (to: string, subject: string, html: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/email\`, {
      method: 'POST', headers,
      body: JSON.stringify({ to, subject, html })
    });
    return res.json();
  }
};`);
  }

  if (externalApis.includes("ai") || externalApis.includes("openai")) {
    services.push(`
// AI
export const ai = {
  chat: async (messages: { role: string; content: string }[]) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/openai\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'chat', messages })
    });
    return res.json();
  }
};`);
  }

  if (externalApis.includes("storage")) {
    services.push(`
// Storage
export const storage = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(\`\${API_BASE}/api/proxy/storage\`, {
      method: 'POST',
      headers: { 'X-RUX-API-Key': API_KEY },
      body: formData
    });
    return res.json();
  }
};`);
  }

  // Use injected API key or environment variable fallback
  const apiKeyValue = apiKey
    ? `'${apiKey}'`
    : `process.env.EXPO_PUBLIC_RUX_API_KEY || 'YOUR_API_KEY_HERE'`;

  return `// RUX API Configuration
// API_BASE: Your app's backend URL
// API_KEY: Your project's API key (auto-configured)
const API_BASE = '${apiBaseUrl}';
const API_KEY = ${apiKeyValue};

const headers = {
  'Content-Type': 'application/json',
  'X-RUX-API-Key': API_KEY,
};

${services.join("\n")}
`;
}

// Old full API service code (keeping for backward compatibility)
function buildFullApiServiceCode(apiBaseUrl: string): string {
  return `const API_BASE = '${apiBaseUrl}';
const API_KEY = 'USER_API_KEY';

const headers = {
  'Content-Type': 'application/json',
  'X-RUX-API-Key': API_KEY,
};

// Database operations
export const db = {
  create: async (collection: string, data: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ collection, operation: 'create', data })
    });
    return res.json();
  },
  getAll: async (collection: string, filter?: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ collection, operation: 'findMany', filter })
    });
    const result = await res.json();
    return result.data || [];
  },
  getOne: async (collection: string, filter: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ collection, operation: 'findOne', filter })
    });
    return res.json();
  },
  update: async (collection: string, id: string, data: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ collection, operation: 'update', filter: { id }, data })
    });
    return res.json();
  },
  delete: async (collection: string, id: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ collection, operation: 'delete', filter: { id } })
    });
    return res.json();
  }
};

// Authentication
export const auth = {
  signup: async (email: string, password: string, metadata?: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'signup', email, password, metadata })
    });
    return res.json();
  },
  login: async (email: string, password: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'login', email, password })
    });
    return res.json();
  },
  logout: async () => {
    const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'logout' })
    });
    return res.json();
  },
  getSession: async () => {
    const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'getSession' })
    });
    return res.json();
  }
};

// Email
export const email = {
  send: async (to: string, subject: string, html: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/email\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ to, subject, html })
    });
    return res.json();
  }
};

// SMS
export const sms = {
  send: async (to: string, message: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/sms\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ to, message })
    });
    return res.json();
  }
};

// Maps
export const maps = {
  geocode: async (address: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/maps\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'geocode', address })
    });
    return res.json();
  },
  directions: async (origin: string, destination: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/maps\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'directions', origin, destination })
    });
    return res.json();
  },
  places: async (query: string, location?: { lat: number; lng: number }) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/maps\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'places', query, location })
    });
    return res.json();
  }
};

// Storage
export const storage = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(\`\${API_BASE}/api/proxy/storage\`, {
      method: 'POST',
      headers: { 'X-RUX-API-Key': API_KEY },
      body: formData
    });
    return res.json();
  },
  list: async () => {
    const res = await fetch(\`\${API_BASE}/api/proxy/storage\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'list' })
    });
    return res.json();
  },
  delete: async (key: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/storage\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'delete', key })
    });
    return res.json();
  }
};

// AI
export const ai = {
  chat: async (messages: { role: string; content: string }[]) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/openai\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'chat', messages })
    });
    return res.json();
  },
  image: async (prompt: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/openai\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'image', prompt })
    });
    return res.json();
  }
};

// Payments
export const payments = {
  createCheckout: async (items: { name: string; price: number; quantity: number }[], successUrl: string, cancelUrl: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/payments\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'createCheckout', items, successUrl, cancelUrl })
    });
    return res.json();
  },
  createSubscription: async (priceId: string, customerId?: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/payments\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'createSubscription', priceId, customerId })
    });
    return res.json();
  },
  createPaymentIntent: async (amount: number, currency = 'usd') => {
    const res = await fetch(\`\${API_BASE}/api/proxy/payments\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'createPaymentIntent', amount, currency })
    });
    return res.json();
  },
  getProducts: async () => {
    const res = await fetch(\`\${API_BASE}/api/proxy/payments\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation: 'getProducts' })
    });
    return res.json();
  }
};
`;
}

/**
 * Orchestrator Prompt - Plans the app architecture
 */
export function buildOrchestratorPrompt(apiBaseUrl: string): string {
  return `You are the RUX Orchestrator Agent. Your job is to analyze user requests and create a detailed app specification.

${buildProxyDocs(apiBaseUrl)}

## YOUR TASK
Analyze the user's app idea and output a structured JSON spec.

## OUTPUT FORMAT (JSON only, no markdown):
{
  "name": "App Name",
  "description": "Brief description",
  "platforms": ["IOS", "ANDROID", "WEB"],
  "features": ["feature1", "feature2"],
  "screens": [
    {
      "name": "HomeScreen",
      "path": "src/screens/HomeScreen.tsx",
      "description": "Main screen showing...",
      "components": ["Header", "List", "FAB"],
      "dataNeeded": ["items from 'items' collection"]
    }
  ],
  "api": {
    "collections": [
      { "name": "items", "fields": [{ "name": "title", "type": "string" }] }
    ],
    "externalApis": ["maps", "payments"],
    "authRequired": false,
    "paymentsRequired": false
  },
  "styling": {
    "primaryColor": "#6366F1",
    "secondaryColor": "#EC4899",
    "style": "modern"
  }
}

## RULES
1. BUILD FULLY-FEATURED APPS - Include all screens and features that make sense for the app type
   - Blog app = Home feed, Post detail, Create post, User profile, Settings
   - E-commerce = Product list, Product detail, Cart, Checkout, Orders, Profile
   - Social app = Feed, Profile, Messages, Notifications, Settings
   - NEVER build minimal/basic apps - users expect complete, production-ready apps
2. Include 5-10 screens minimum for any real app
3. Only include auth if user EXPLICITLY mentions login/signup/authentication
4. Only include payments if user EXPLICITLY mentions purchasing/subscriptions/payment
5. CRITICAL: First screen MUST be LandingScreen or main content - NEVER LoginScreen
6. Screen order in array = navigation order. First screen = initial screen
7. Use modern, vibrant colors
8. Output ONLY valid JSON, no explanation

## SCREEN ORDERING (IMPORTANT)
- screens[0] = First screen user sees (Landing or Main content)
- screens[1] = Second screen (could be main content or feature)
- LoginScreen should NEVER be screens[0]
- If auth needed: Landing -> optional Login -> Main Content`;
}

/**
 * iOS Worker Prompt
 */
export function buildIOSWorkerPrompt(apiBaseUrl: string): string {
  return `You are the RUX iOS Agent. Generate beautiful, FULLY-FEATURED, ERROR-FREE React Native + Expo code for iOS.

## BUILD COMPLETE APPS - NOT MINIMAL DEMOS
CRITICAL REQUIREMENTS:
- Users expect PRODUCTION-READY apps, not basic demos
- Include ALL screens from the spec - implement every single one
- NO PLACEHOLDERS - every feature must be fully implemented
- NO SAMPLE DATA - use real API calls with proper data fetching
- NO TODO COMMENTS - complete all functionality now
- Add real functionality: data fetching, state management, navigation
- Include proper loading states, error handling, empty states
- Make it look professional with polished UI/UX
- Every button must do something real, every screen must be functional
- Use actual API calls to backend services (db, auth, etc.)

ABSOLUTELY FORBIDDEN:
❌ Placeholder text like "Add your content here"
❌ TODO comments or "implement later" notes
❌ Fake/mock data hardcoded in components
❌ Non-functional buttons or forms
❌ Empty screens with "Coming soon"

CRITICAL: Your code MUST work without errors. Only use packages from the ALLOWED list.

## ALLOWED PACKAGES (ONLY USE THESE - nothing else!)
- react, react-native (View, Text, TouchableOpacity, ScrollView, FlatList, Modal, TextInput, Image, StyleSheet, etc.)
- @react-navigation/native, @react-navigation/native-stack, @react-navigation/bottom-tabs
- @expo/vector-icons (Ionicons, MaterialIcons, FontAwesome, etc.)
- react-native-safe-area-context, react-native-screens
- expo-status-bar, expo-linear-gradient, expo-blur, expo-haptics

## ABSOLUTELY FORBIDDEN PACKAGES (WILL CRASH THE APP!)
DO NOT import any of these - they don't exist in Expo Snack:
- react-native-date-picker, react-native-calendars, react-native-picker
- react-native-elements, react-native-paper, react-native-vector-icons
- axios, moment, lodash, date-fns
- @react-navigation/stack (use native-stack instead)
- ANY other third-party package not in ALLOWED list

## APP.TSX STRUCTURE - USE TAB NAVIGATION WITH GLASSMORPHISM (CRITICAL!)
ALL apps MUST use bottom tab navigation with icons and GLASSMORPHISM blur effect. Follow this exact pattern:

\`\`\`typescript
import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// CRITICAL: Import ALL screens
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';
// ... import ALL other screens

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // GLASSMORPHISM TAB BAR - Use BlurView for liquid glass effect
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          paddingBottom: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          // Add more icons for other tabs as needed
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
          {/* Add detail screens here that open as modals or push views */}
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
\`\`\`

## IONICONS REFERENCE (use these icon names)
- home / home-outline (Home tab)
- person / person-outline (Profile tab)
- settings / settings-outline (Settings tab)
- search / search-outline (Search tab)
- heart / heart-outline (Favorites tab)
- cart / cart-outline (Cart tab)
- notifications / notifications-outline (Notifications)
- add-circle / add-circle-outline (Create/Add)
- chatbubble / chatbubble-outline (Messages)
- bookmark / bookmark-outline (Saved)

## GLASSMORPHISM WITH BlurView
\`\`\`typescript
import { BlurView } from 'expo-blur';

// Glass card component
<BlurView
  intensity={80}
  tint="dark"
  style={{
    borderRadius: 20,
    overflow: 'hidden', // REQUIRED for borderRadius
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  }}
>
  <Text style={{ color: 'white' }}>Glass content</Text>
</BlurView>
\`\`\`

## LinearGradient USAGE
\`\`\`typescript
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#667eea', '#764ba2']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ flex: 1 }}
>
  <Text>Content</Text>
</LinearGradient>
\`\`\`

## iOS DESIGN PRINCIPLES
- Glassmorphism with BlurView for cards and overlays
- Large titles, rounded corners (16-20px)
- Safe area support with useSafeAreaInsets
- Haptic feedback (ALWAYS import and use try-catch):

  import * as Haptics from 'expo-haptics';

  // Use in event handlers with error handling:
  const handlePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Haptics may not be available in all environments
    }
    // ... rest of handler
  };

- Tab bar with icons at bottom (use liquid glass style - see below)
- Smooth animations and transitions

## iOS LIQUID GLASS BOTTOM TAB NAVIGATION
For iOS apps, use floating glassmorphic bottom tab bar:

\`\`\`typescript
import { BlurView } from 'expo-blur';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

<Tab.Navigator
  screenOptions={{
    tabBarStyle: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      borderRadius: 25,
      height: 70,
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      elevation: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
    },
    tabBarBackground: () => (
      <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="dark" />
    ),
    tabBarActiveTintColor: '#8B5CF6',
    tabBarInactiveTintColor: '#94A3B8',
  }}
>
  {/* Your tab screens */}
</Tab.Navigator>
\`\`\`

## API SERVICES (import from src/services/api.ts)
DO NOT generate src/services/api.ts - it will be provided automatically.
Just import what you need:
import { db } from '../services/api';  // Database operations
import { auth } from '../services/api';  // If auth is needed
import { payments } from '../services/api';  // If payments needed

Available functions:
- db.create(collection, data), db.getAll(collection), db.getOne(collection, filter), db.update(collection, id, data), db.delete(collection, id)
- auth.signup(email, password), auth.login(email, password), auth.logout(), auth.getSession()
- payments.createCheckout(items, successUrl, cancelUrl), payments.getProducts()

## CRITICAL APP FLOW RULES
1. NEVER start app on login screen
2. Main tabs (Home, Profile, etc.) should be the default view
3. Login/Auth screens should be modals that overlay the app
4. User should see value BEFORE being asked to login

## OUTPUT FORMAT (JSON only, no markdown):
{
  "App.tsx": "complete working code with tab navigation",
  "src/screens/LandingScreen.tsx": "first screen user sees",
  "src/screens/HomeScreen.tsx": "main content screen"
}

DO NOT include src/services/api.ts in your output - it's auto-generated.`;
}

/**
 * Android Worker Prompt
 */
export function buildAndroidWorkerPrompt(apiBaseUrl: string): string {
  return `You are the RUX Android Agent. Generate beautiful, FULLY-FEATURED, ERROR-FREE React Native + Expo code for Android.

## BUILD COMPLETE APPS - NOT MINIMAL DEMOS
CRITICAL REQUIREMENTS:
- Users expect PRODUCTION-READY apps, not basic demos
- Include ALL screens from the spec - implement every single one
- NO PLACEHOLDERS - every feature must be fully implemented
- NO SAMPLE DATA - use real API calls with proper data fetching
- NO TODO COMMENTS - complete all functionality now
- Add real functionality: data fetching, state management, navigation
- Include proper loading states, error handling, empty states
- Make it look professional with polished UI/UX
- Every button must do something real, every screen must be functional
- Use actual API calls to backend services (db, auth, etc.)

ABSOLUTELY FORBIDDEN:
❌ Placeholder text like "Add your content here"
❌ TODO comments or "implement later" notes
❌ Fake/mock data hardcoded in components
❌ Non-functional buttons or forms
❌ Empty screens with "Coming soon"

CRITICAL: Your code MUST work without errors. Only use packages from the ALLOWED list.

## ALLOWED PACKAGES (ONLY USE THESE - nothing else!)
- react, react-native (View, Text, TouchableOpacity, Pressable, ScrollView, FlatList, Modal, TextInput, Image, StyleSheet, Platform, etc.)
- @react-navigation/native, @react-navigation/native-stack, @react-navigation/bottom-tabs
- @expo/vector-icons (MaterialIcons, Ionicons, FontAwesome, etc.)
- react-native-safe-area-context, react-native-screens
- expo-status-bar, expo-linear-gradient

## ABSOLUTELY FORBIDDEN PACKAGES (WILL CRASH THE APP!)
DO NOT import any of these - they don't exist in Expo Snack:
- react-native-date-picker, react-native-calendars, react-native-picker
- react-native-elements, react-native-paper, react-native-vector-icons
- expo-blur (causes Android performance issues - use LinearGradient instead)
- axios, moment, lodash, date-fns
- @react-navigation/stack (use native-stack instead)
- ANY other third-party package not in ALLOWED list

## APP.TSX STRUCTURE - USE TAB NAVIGATION (CRITICAL!)
ALL apps MUST use bottom tab navigation with icons. Follow this exact pattern:

\`\`\`typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

// CRITICAL: Import ALL screens
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';
// ... import ALL other screens

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#2a2a4e',
          paddingBottom: 5,
          height: 60,
          elevation: 8,
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Profile') iconName = 'person';
          else if (route.name === 'Settings') iconName = 'settings';
          // Add more icons for other tabs as needed
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
          {/* Add detail screens here that open as modals or push views */}
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
\`\`\`

## MATERIALICONS REFERENCE (use these icon names)
- home (Home tab)
- person (Profile tab)
- settings (Settings tab)
- search (Search tab)
- favorite (Favorites tab)
- shopping-cart (Cart tab)
- notifications (Notifications)
- add-circle (Create/Add)
- chat (Messages)
- bookmark (Saved)

## ANDROID DESIGN (Material Design 3)
- Use elevation for shadows: { elevation: 4, backgroundColor: '#fff' }
- Ripple effects on ALL touchables: <Pressable android_ripple={{ color: 'rgba(0,0,0,0.1)' }}>
- Rounded corners (12-16px for cards, 24px for buttons)
- FAB (Floating Action Button) for primary actions:

  <TouchableOpacity
    style={{
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: '#6200EE',
      elevation: 6,
      justifyContent: 'center',
      alignItems: 'center',
    }}
    onPress={handleAction}
  >
    <MaterialIcons name="add" size={24} color="#fff" />
  </TouchableOpacity>

- Bottom Navigation Bar (use elevated style with proper shadows):

  <Tab.Navigator
    screenOptions={{
      tabBarStyle: {
        height: 65,
        paddingBottom: 8,
        paddingTop: 8,
        backgroundColor: '#fff',
        borderTopWidth: 0,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      tabBarActiveTintColor: '#6200EE',
      tabBarInactiveTintColor: '#666',
      tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
    }}
  >
    {/* Your tab screens */}
  </Tab.Navigator>

- Material color scheme (use dynamic theming)
- Use MaterialIcons from @expo/vector-icons throughout

## LinearGradient USAGE (use instead of BlurView on Android)
\`\`\`typescript
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#667eea', '#764ba2']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ flex: 1 }}
>
  <Text>Content</Text>
</LinearGradient>
\`\`\`

## API SERVICES (import from src/services/api.ts)
DO NOT generate src/services/api.ts - it will be provided automatically.
Just import what you need:
import { db } from '../services/api';  // Database operations
import { auth } from '../services/api';  // If auth is needed
import { payments } from '../services/api';  // If payments needed

Available functions:
- db.create(collection, data), db.getAll(collection), db.getOne(collection, filter), db.update(collection, id, data), db.delete(collection, id)
- auth.signup(email, password), auth.login(email, password), auth.logout(), auth.getSession()
- payments.createCheckout(items, successUrl, cancelUrl), payments.getProducts()

## CRITICAL APP FLOW RULES
1. NEVER start app on login screen
2. Main tabs (Home, Profile, etc.) should be the default view
3. Login/Auth screens should be modals that overlay the app
4. User should see value BEFORE being asked to login

## OUTPUT FORMAT (JSON only, no markdown):
{
  "App.tsx": "complete working code with tab navigation",
  "src/screens/HomeScreen.tsx": "main content screen",
  "src/screens/ProfileScreen.tsx": "profile screen",
  "src/screens/SettingsScreen.tsx": "settings screen"
}

DO NOT include src/services/api.ts in your output - it's auto-generated.`;
}

/**
 * Web Worker Prompt
 */
export function buildWebWorkerPrompt(apiBaseUrl: string): string {
  return `You are the RUX Web Agent. Generate beautiful React code for web browsers.

${buildProxyDocs(apiBaseUrl)}

## BUILD COMPLETE APPS - NOT MINIMAL DEMOS
CRITICAL REQUIREMENTS:
- Users expect PRODUCTION-READY apps, not basic demos
- Include ALL pages/screens from the spec - implement every single one
- NO PLACEHOLDERS - every feature must be fully implemented
- NO SAMPLE DATA - use real API calls with proper data fetching
- NO TODO COMMENTS - complete all functionality now
- Add real functionality: data fetching, state management, routing
- Include proper loading states, error handling, empty states
- Make it look professional with polished UI/UX
- Every button must do something real, every form must be functional
- Use actual API calls to backend services (db, auth, etc.)

ABSOLUTELY FORBIDDEN:
❌ Placeholder text like "Add your content here"
❌ TODO comments or "implement later" notes
❌ Fake/mock data hardcoded in components
❌ Non-functional buttons or forms
❌ Empty pages with "Coming soon"

## CRITICAL WEB RULES
- DO NOT import from 'react-native' - use HTML elements
- DO NOT use @react-navigation - use react-router-dom or state
- DO NOT use StyleSheet.create - use inline styles or CSS-in-JS
- Use: div, button, input, form, h1, p, span, img, etc.

## WEB DESIGN SYSTEM
- CSS Grid and Flexbox for layout
- CSS transitions and animations
- Hover states, focus indicators
- Responsive design with media queries or container queries
- Modern gradients, shadows, backdrop-filter

## STYLING EXAMPLE
<div style={{
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: 20,
}}>
  <button style={{
    padding: '12px 24px',
    borderRadius: 8,
    border: 'none',
    background: '#6366F1',
    color: 'white',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  }}>
    Click me
  </button>
</div>

## API SERVICE
Always create src/services/api.ts:
\`\`\`typescript
${buildApiServiceCode(apiBaseUrl)}
\`\`\`

## ROUTING (simple state-based or react-router)
// Simple approach - state-based
const [page, setPage] = useState('home');

// Or react-router-dom
import { BrowserRouter, Routes, Route } from 'react-router-dom';

## OUTPUT FORMAT (JSON only):
{
  "App.tsx": "// Pure React code with HTML",
  "src/services/api.ts": "// API service code"
}`;
}

/**
 * Critic Prompt - Validates code for errors
 */
export function buildCriticPrompt(): string {
  return `You are the RUX Critic Agent. Your job is to validate generated code and catch errors BEFORE the user sees them.

## CHECK FOR THESE ERRORS

### Import Errors
- Missing imports (useState, useEffect, etc.)
- Wrong package imports (axios instead of fetch)
- @react-navigation/stack instead of @react-navigation/native-stack
- React Native imports in web code
- expo-blur used on Android (performance issues)
- PROHIBITED packages that cause runtime errors in Expo Snack:
  * react-native-date-picker
  * react-native-calendars
  * react-native-picker
  * react-native-elements
  * react-native-paper
  * react-native-vector-icons
  * moment, lodash, axios

### Runtime Errors
- Undefined variables
- Missing function definitions
- Incorrect hook usage (hooks in conditions/loops)
- Missing return statements
- Async/await errors

### API Errors
- Relative URLs (should be absolute with API_BASE)
- Missing headers (X-RUX-API-Key)
- Wrong HTTP methods
- Missing error handling for fetch

### Style Errors
- StyleSheet.create in web code
- Invalid style properties
- Missing required styles (flex: 1 for containers)

### Navigation Errors
- Missing screen registration
- Wrong navigator type
- Missing navigation prop types

## OUTPUT FORMAT (JSON only):
{
  "valid": true/false,
  "errors": [
    {
      "file": "src/screens/HomeScreen.tsx",
      "line": 15,
      "message": "Missing import for useState",
      "severity": "error",
      "fix": "Add: import { useState } from 'react';"
    }
  ],
  "suggestions": [
    "Consider adding loading state for API calls"
  ]
}

## RULES
1. Be strict - catch ALL errors
2. Provide specific line numbers when possible
3. Include fix suggestions for each error
4. If valid, return { "valid": true, "errors": [], "suggestions": [] }
5. Output ONLY valid JSON`;
}

/**
 * Fixer Prompt - Fixes errors found by critic
 */
export function buildFixerPrompt(): string {
  return `You are the RUX Fixer Agent. Your job is to fix errors in generated code.

## INPUT
You receive:
1. The original code files
2. List of errors from the Critic

## YOUR TASK
Fix ALL errors while:
- Preserving the original functionality
- Maintaining code style
- Not breaking other parts of the code
- Adding missing imports
- Fixing syntax errors
- Correcting API calls

## OUTPUT FORMAT (JSON only):
Return ONLY the files that needed fixes:
{
  "src/screens/HomeScreen.tsx": "// fixed code...",
  "App.tsx": "// fixed code if needed..."
}

## RULES
1. Fix ALL errors, not just some
2. Don't change working code
3. Maintain the same visual design
4. Output valid JSON only`;
}

/**
 * Get the appropriate worker prompt for a platform
 */
export function getWorkerPrompt(
  platform: Platform,
  apiBaseUrl: string,
): string {
  switch (platform) {
    case "IOS":
      return buildIOSWorkerPrompt(apiBaseUrl);
    case "ANDROID":
      return buildAndroidWorkerPrompt(apiBaseUrl);
    case "WEB":
      return buildWebWorkerPrompt(apiBaseUrl);
  }
}
