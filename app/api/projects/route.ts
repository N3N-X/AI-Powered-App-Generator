import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getUserProjects,
  getOrCreateUser,
  createProject,
  isSlugAvailable,
  isSubdomainAvailable,
} from "@/lib/supabase/db";
import { slugify } from "@/lib/utils";
import {
  generateSubdomainFromName,
  RESERVED_SUBDOMAINS,
} from "@/lib/subdomain";
import { generateApiKey } from "@/lib/proxy";
import type { ProxyService } from "@/lib/supabase/types";
import { corsHeaders, handleCorsOptions, withCors } from "@/lib/cors";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// Default services for auto-generated API keys
const DEFAULT_PROJECT_SERVICES: ProxyService[] = [
  "DATABASE",
  "EMAIL",
  "SMS",
  "MAPS",
  "STORAGE",
  "OPENAI",
];

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  template: z.string().optional(),
  platform: z.enum(["WEB", "IOS", "ANDROID"]).default("WEB"),
});

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsOptions();
}

export async function GET(request: NextRequest) {
  try {
    const { uid, email } = await getAuthenticatedUser(request);
    if (!uid || !email) {
      return withCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }

    // Get or create user
    await getOrCreateUser(uid, email);

    // Get user's projects
    const projects = await getUserProjects(uid);

    return withCors(NextResponse.json({ projects }));
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return withCors(
      NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 }),
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid, email } = await getAuthenticatedUser(request);
    if (!uid || !email) {
      return withCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }

    const body = await request.json();
    const data = createProjectSchema.parse(body);

    // Ensure user exists
    await getOrCreateUser(uid, email);

    // Generate unique slug
    let slug = slugify(data.name);
    let counter = 1;
    while (!(await isSlugAvailable(uid, slug))) {
      slug = `${slugify(data.name)}-${counter}`;
      counter++;
    }

    // Get template code if specified
    const codeFiles = getTemplateCode(data.template, data.platform);

    // Auto-assign subdomain for WEB projects
    let subdomain: string | null = null;
    if (data.platform === "WEB") {
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const candidate = generateSubdomainFromName(data.name);

        if (!RESERVED_SUBDOMAINS.has(candidate)) {
          if (await isSubdomainAvailable(candidate)) {
            subdomain = candidate;
            break;
          }
        }
        attempts++;
      }
    }

    // Create project
    const project = await createProject({
      name: data.name,
      description: data.description,
      slug,
      platform: data.platform,
      code_files: codeFiles,
      user_id: uid,
      subdomain,
      app_config: {
        name: data.name,
        slug,
        version: "1.0.0",
      },
    });

    // Auto-generate API key for the project
    const { rawKey, keyPrefix } = await generateApiKey(
      project.id,
      "Auto-generated",
      DEFAULT_PROJECT_SERVICES,
    );

    return withCors(
      NextResponse.json(
        {
          project,
          apiKey: {
            key: rawKey,
            keyPrefix,
            services: DEFAULT_PROJECT_SERVICES,
            warning: "Save this key securely - it will not be shown again!",
          },
        },
        { status: 201 },
      ),
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withCors(
        NextResponse.json(
          { error: "Validation error", details: error.errors },
          { status: 400 },
        ),
      );
    }

    console.error("Failed to create project:", error);
    return withCors(
      NextResponse.json({ error: "Failed to create project" }, { status: 500 }),
    );
  }
}

function getTemplateCode(
  template?: string,
  platform: "WEB" | "IOS" | "ANDROID" = "WEB",
): Record<string, string> {
  // Web template uses React
  if (platform === "WEB") {
    return {
      "App.tsx": `import React from 'react';

export default function App() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Welcome to Your App</h1>
        <p style={styles.subtitle}>Start building something amazing!</p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
};
`,
    };
  }

  // Mobile template uses React Native
  const baseTemplate = {
    "App.tsx": `import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Your App</Text>
        <Text style={styles.subtitle}>Start building something amazing!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
`,
  };

  switch (template) {
    case "todo":
      return {
        ...baseTemplate,
        "App.tsx": `import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState('');

  const addTodo = () => {
    if (inputText.trim()) {
      setTodos([
        ...todos,
        {
          id: Date.now().toString(),
          text: inputText.trim(),
          completed: false,
        },
      ]);
      setInputText('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Todo List</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Add a new task..."
          onSubmitEditing={addTodo}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.todoItem}
            onPress={() => toggleTodo(item.id)}
            onLongPress={() => deleteTodo(item.id)}
          >
            <View style={[styles.checkbox, item.completed && styles.checked]} />
            <Text style={[styles.todoText, item.completed && styles.completedText]}>
              {item.text}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', padding: 15, backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  addButton: { marginLeft: 10, width: 48, height: 48, backgroundColor: '#007AFF', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  list: { padding: 15 },
  todoItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ddd', marginRight: 12 },
  checked: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  todoText: { fontSize: 16, flex: 1 },
  completedText: { textDecorationLine: 'line-through', color: '#999' },
});
`,
      };

    default:
      return baseTemplate;
  }
}
