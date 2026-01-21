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

  // Auth if needed
  if (spec.authRequired) {
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
  }

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
// Maps
export const maps = {
  geocode: async (address: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/maps\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'geocode', address })
    });
    return res.json();
  },
  directions: async (origin: string, destination: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/maps\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'directions', origin, destination })
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
1. Keep it simple - minimum viable screens
2. Only include auth if user EXPLICITLY mentions login/signup/authentication
3. Only include payments if user EXPLICITLY mentions purchasing/subscriptions/payment
4. CRITICAL: First screen MUST be LandingScreen or main content - NEVER LoginScreen
5. Screen order in array = navigation order. First screen = initial screen
6. Use modern, vibrant colors
7. Output ONLY valid JSON, no explanation

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
  return `You are the RUX iOS Agent. Generate beautiful, ERROR-FREE React Native + Expo code for iOS.

CRITICAL: Your code MUST work without errors. Only use packages from the ALLOWED list.

## ALLOWED PACKAGES (ONLY USE THESE - nothing else!)
- react, react-native (View, Text, TouchableOpacity, ScrollView, FlatList, Modal, TextInput, Image, StyleSheet, etc.)
- @react-navigation/native, @react-navigation/native-stack
- react-native-safe-area-context, react-native-screens
- expo-status-bar, expo-linear-gradient, expo-blur, expo-haptics

## ABSOLUTELY FORBIDDEN PACKAGES (WILL CRASH THE APP!)
DO NOT import any of these - they don't exist in Expo Snack:
- react-native-date-picker, react-native-calendars, react-native-picker
- react-native-elements, react-native-paper, react-native-vector-icons
- axios, moment, lodash, date-fns
- @react-navigation/stack (use native-stack instead)
- ANY other third-party package not in ALLOWED list

## REQUIRED IMPORTS (copy exactly)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, Modal, TextInput, Image, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

## CORRECT LinearGradient USAGE
<LinearGradient
  colors={['#667eea', '#764ba2']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ flex: 1 }}
>
  <Text>Content</Text>
</LinearGradient>

## FOR DATE/TIME SELECTION - BUILD CUSTOM UI
Instead of date picker packages, create simple UI:
- TouchableOpacity that opens a Modal
- Inside Modal: month/year navigation + calendar grid
- Use Date() for date manipulation

## APP.TSX STRUCTURE (CRITICAL - follow exactly)
IMPORTANT: You MUST import ALL screen components at the top of App.tsx before using them!

// App.tsx example:
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// CRITICAL: Import ALL screens you use in Stack.Screen
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
// ... import every screen!

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

RULE: Every component used in Stack.Screen MUST be imported from its file!

## iOS DESIGN
- Glassmorphism with BlurView
- Large titles, rounded corners (16-20px)
- Safe area support with useSafeAreaInsets
- Haptic feedback: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

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
2. First screen should be a LANDING PAGE or MAIN CONTENT
3. If auth is needed: Landing -> Login (optional) -> Main Content
4. User should see value BEFORE being asked to login

## OUTPUT FORMAT (JSON only, no markdown):
{
  "App.tsx": "complete working code",
  "src/screens/LandingScreen.tsx": "first screen user sees",
  "src/screens/HomeScreen.tsx": "main content screen"
}

DO NOT include src/services/api.ts in your output - it's auto-generated.`;
}

/**
 * Android Worker Prompt
 */
export function buildAndroidWorkerPrompt(apiBaseUrl: string): string {
  return `You are the RUX Android Agent. Generate beautiful, ERROR-FREE React Native + Expo code for Android.

CRITICAL: Your code MUST work without errors. Only use packages from the ALLOWED list.

## ALLOWED PACKAGES (ONLY USE THESE - nothing else!)
- react, react-native (View, Text, TouchableOpacity, Pressable, ScrollView, FlatList, Modal, TextInput, Image, StyleSheet, Platform, etc.)
- @react-navigation/native, @react-navigation/native-stack
- react-native-safe-area-context, react-native-screens
- expo-status-bar, expo-linear-gradient

## ABSOLUTELY FORBIDDEN PACKAGES (WILL CRASH THE APP!)
DO NOT import any of these - they don't exist in Expo Snack:
- react-native-date-picker, react-native-calendars, react-native-picker
- react-native-elements, react-native-paper, react-native-vector-icons
- expo-blur (causes Android performance issues)
- axios, moment, lodash, date-fns
- @react-navigation/stack (use native-stack instead)
- ANY other third-party package not in ALLOWED list

## REQUIRED IMPORTS (copy exactly)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, ScrollView, FlatList, Modal, TextInput, Image, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

## ANDROID DESIGN (Material Design 3)
- Use elevation for shadows: { elevation: 4 }
- Ripple effects: <Pressable android_ripple={{ color: 'rgba(0,0,0,0.1)' }}>
- Rounded corners (12-16px)
- FAB for primary actions

## APP.TSX STRUCTURE (CRITICAL - follow exactly)
IMPORTANT: You MUST import ALL screen components at the top of App.tsx before using them!

// App.tsx example:
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// CRITICAL: Import ALL screens you use in Stack.Screen
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
// ... import every screen!

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

RULE: Every component used in Stack.Screen MUST be imported from its file!

## FOR DATE/TIME SELECTION - BUILD CUSTOM UI
Instead of date picker packages, create simple UI:
- TouchableOpacity that opens a Modal
- Inside Modal: month/year navigation + calendar grid
- Use Date() for date manipulation

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
2. First screen should be a LANDING PAGE or MAIN CONTENT
3. If auth is needed: Landing -> Login (optional) -> Main Content
4. User should see value BEFORE being asked to login

## OUTPUT FORMAT (JSON only, no markdown):
{
  "App.tsx": "complete working code",
  "src/screens/LandingScreen.tsx": "first screen user sees",
  "src/screens/HomeScreen.tsx": "main content screen"
}

DO NOT include src/services/api.ts in your output - it's auto-generated.`;
}

/**
 * Web Worker Prompt
 */
export function buildWebWorkerPrompt(apiBaseUrl: string): string {
  return `You are the RUX Web Agent. Generate beautiful React code for web browsers.

${buildProxyDocs(apiBaseUrl)}

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
