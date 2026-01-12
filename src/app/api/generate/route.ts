import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const LIMITS = {
  free: 5,
  pro: 50,
  admin: -1,
};

const DEFAULT_CARGO_TOML = `[package]
name = "rux-app"
version = "0.1.0"
edition = "2021"

[dependencies]
dioxus = "0.4"
dioxus-desktop = "0.4"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
log = "0.4"
env_logger = "0.11"

[target.'cfg(windows)'.dependencies]
windows = { version = "0.51", features = ["Win32_System_Memory"] }

[target.'cfg(target_os = "macos")'.dependencies]
cocoa = "0.25"
objc = "0.2"

[target.'cfg(target_os = "linux")'.dependencies]
gtk = { version = "0.17" }

[profile.release]
opt-level = 3
lto = true`;

const DEFAULT_MAIN_RS = `#![allow(non_snake_case)]

mod lib;
use dioxus::prelude::*;
use lib::App;

fn main() {
    dioxus_desktop::launch(App);
}`;

const DEFAULT_LIB_RS = `use dioxus::prelude::*;

#[component]
pub fn App() -> Element {
    let mut count = use_signal(|| 0);

    rsx! {
        div {
            class: "w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center",
            div {
                class: "bg-white rounded-lg shadow-2xl p-8 max-w-md",
                h1 {
                    class: "text-3xl font-bold text-gray-800 mb-6",
                    "Welcome to Dioxus"
                }
                p {
                    class: "text-gray-600 mb-4",
                    "This is your RUX-generated Dioxus app"
                }
                div {
                    class: "flex gap-4",
                    button {
                        class: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition",
                        onclick: move |_| count += 1,
                        "Count: {count}"
                    }
                }
            }
        }
    }
}`;

const DEFAULT_GITIGNORE = `/target
Cargo.lock
.DS_Store
*.swp
*.swo
*~
.vscode
.idea
*.iml
dist/`;

const DEFAULT_README = `# RUX Generated Dioxus Application

A cross-platform desktop application built with Dioxus and Rust.

## Building

\`\`\`bash
cargo build --release
\`\`\`

## Running

\`\`\`bash
cargo run
\`\`\`

## Features

- Cross-platform (Windows, macOS, Linux)
- Reactive UI with Dioxus
- Type-safe Rust backend
- Production-ready code

## Requirements

- Rust 1.70+
- Cargo

## License

MIT`;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const prompt = formData.get("prompt") as string;
  const platform = (formData.get("platform") as string) || "windows";
  const buildType = (formData.get("build_type") as string) || "source";
  const existingCode = formData.get("existing_code") as string;
  const changePrompt = formData.get("change_prompt") as string;

  if (!prompt || prompt.trim().length < 10) {
    return NextResponse.json(
      { error: "Prompt must be at least 10 characters" },
      { status: 400 },
    );
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() { },
        remove() { },
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({ user_id: user.id, role: "free" })
      .select("role")
      .single();
    profile = newProfile;
  }

  const role = profile?.role as "free" | "pro" | "admin" || "free";
  const limit = LIMITS[role];

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: usage } = await supabase
    .from("user_usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("year_month", yearMonth)
    .single();

  const currentUsage = usage?.count || 0;

  if (limit !== -1 && currentUsage >= limit) {
    return NextResponse.json(
      { error: `Monthly limit exceeded. ${role === "free" ? "Upgrade to Pro for more generations." : "Contact admin."}` },
      { status: 429 },
    );
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service unavailable" },
      { status: 500 },
    );
  }

  const systemPrompt = `You are an expert Rust and Dioxus developer. Generate a complete, production-ready cross-platform Dioxus application.

PLATFORM: ${platform}
BUILD TYPE: ${buildType === "executable" ? "Cross-platform executable" : "Source code"}

DIOXUS ARCHITECTURE BEST PRACTICES:
- Use functional components with #[component] macro
- Implement proper state management with use_signal() for reactive state
- Use use_future() for async operations
- Implement proper event handlers with closures
- Support responsive design with Tailwind CSS classes
- Follow Rust idioms: Result types, error handling, type safety
- Write idiomatic, well-commented production-ready code
- Support CRUD operations with forms, tables, and modals
- Include validation, error states, and user feedback
- Use structured data with serde for serialization
- Implement keyboard navigation and accessibility

RUST BEST PRACTICES:
- Use Result<T, E> for fallible operations
- Implement proper error types with #[derive(Debug)]
- Use iterators and functional patterns
- Avoid unwrap() in production code
- Use proper async/await with tokio
- Implement trait objects for flexibility
- Use generics for reusable code
- Proper lifetimes where needed

PLATFORM-SPECIFIC GUIDELINES:
${platform === "windows" ? `- Windows: Use native WebView2, supports Win32 interop, consider accessibility for enterprise apps
- Ensure manifest for Windows 10+ compatibility
- Use platform::windows utilities where beneficial` : ""}
${platform === "macos" ? `- macOS: Use native Cocoa framework, support Light/Dark mode, consider Metal for graphics
- Implement proper keyboard shortcuts (Cmd+Q, Cmd+W)
- Support Touch ID integration if applicable` : ""}
${platform === "linux" ? `- Linux: Use GTK 3.0+, support Wayland and X11, ensure accessibility
- Test on Ubuntu 20.04+, Fedora, Debian
- Proper desktop file integration` : ""}

CRUD COMPONENT PATTERNS:
1. List/Table: Display data with sorting, filtering, pagination
2. Create Form: Modal or page with validation, error handling
3. Edit Form: Load existing data, update with changes
4. Delete: Confirm dialog, handle cascading deletes
5. Search: Real-time filtering with debouncing

FILE STRUCTURE REQUIREMENTS:
Required files MUST be included:
- Cargo.toml: with dioxus 0.4, platform-specific dependencies
- src/main.rs: entry point with dioxus_desktop::launch()
- src/lib.rs: main App component, state management
- src/components/mod.rs: component module exports
- src/components/common.rs: Button, Input, Form, Table, Modal components
- src/components/pages.rs: page-level components
- src/styles.rs: Tailwind CSS utility classes
- .gitignore: standard Rust gitignore
- README.md: project documentation

RESPONSE FORMAT:
Return ONLY valid JSON object. No markdown, no explanations outside JSON.
Keys are file paths, values are complete file contents.
Example:
{
  "Cargo.toml": "[package]\\n...",
  "src/main.rs": "#![allow(non_snake_case)]\\n...",
  "src/lib.rs": "use dioxus::prelude::*;\\n...",
  ...
}

CRITICAL RULES:
- ALWAYS include all required files
- Code must compile without warnings
- No TODO comments - implement fully
- Handle all edge cases
- Include proper documentation
- Responsive design for all screen sizes
- Cross-platform compatible code ONLY
- Test code logic mentally before generating`;

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-3",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: existingCode && changePrompt
              ? `Modify this app: ${changePrompt}\n\nExisting code:\n${existingCode}`
              : prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("XAI API error");
      return NextResponse.json(
        { error: "Failed to generate code" },
        { status: 500 },
      );
    }

    const data = await response.json() as any;
    const rawCode = data.choices[0]?.message?.content || "";

    let code: Record<string, string> = {};
    try {
      let jsonString = rawCode.trim();
      
      // Handle markdown code blocks (```json, ```bash, ``` with content)
      const jsonMatch = jsonString.match(/```(?:json|bash|)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1].trim();
      }
      
      // Extract JSON object if surrounded by other text
      const start = jsonString.indexOf('{');
      const end = jsonString.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        jsonString = jsonString.substring(start, end + 1);
      }
      
      // Remove any trailing commas (common AI mistake)
      jsonString = jsonString.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      
      // Fix escaped newlines and special characters
      jsonString = jsonString
        .replace(/\\n/g, '\n')
        .replace(/\\\//g, '/');
      
      code = JSON.parse(jsonString);
      if (!code || typeof code !== 'object') {
        throw new Error('Invalid code object');
      }
    } catch (e) {
      console.error('Parse error:', e, 'Raw response preview:', rawCode.substring(0, 200));
      // Return error with details for debugging
      return NextResponse.json(
        { error: "Failed to parse AI response. The generated code format was invalid.", debug: e instanceof Error ? e.message : String(e) },
        { status: 400 },
      );
    }

    // Ensure required files
    code["Cargo.toml"] ??= DEFAULT_CARGO_TOML;
    code["src/main.rs"] ??= DEFAULT_MAIN_RS;
    code["src/lib.rs"] ??= DEFAULT_LIB_RS;
    code[".gitignore"] ??= DEFAULT_GITIGNORE;
    code["README.md"] ??= DEFAULT_README;

    const { data: appData } = await supabase
      .from("generated_apps")
      .insert({
        user_id: user.id,
        prompt,
        code: JSON.stringify(code),
        status: "generated",
        platform,
        build_type: buildType,
      })
      .select()
      .single();

    await supabase
      .from("user_usage")
      .upsert(
        { user_id: user.id, year_month: yearMonth, count: currentUsage + 1 },
        { onConflict: "user_id,year_month" },
      );

    return NextResponse.json({
      id: appData?.id,
      code,
      build_type: buildType,
      usage: {
        current: currentUsage + 1,
        limit: limit === -1 ? "unlimited" : limit,
        role,
      },
    });

  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
