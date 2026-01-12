```
╔══════════════════════════════════════════════════════════════════════════════╗
║                   RUX - DIOXUS SYSTEM ARCHITECTURE                          ║
║                         Cross-Platform Desktop App Generator                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ SYSTEM OVERVIEW                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

    User Interface (Web)
         ▲
         │
    ┌────▼───────┐
    │ Next.js UI  │ ◄─── Authentication (Supabase)
    └────┬───────┘
         │
         ▼
    ┌─────────────────────────────────────────┐
    │     API Layer (TypeScript/Next.js)      │
    ├─────────────────────────────────────────┤
    │  /api/generate  ──► AI Code Generation  │
    │  /api/build/[id] ─► Cross-Platform Build
    └────────┬────────────────────────────────┘
             │
    ┌────────▼────────┐
    │   Supabase DB   │
    │  ┌───────────┐  │
    │  │ Profiles  │  │
    │  ├───────────┤  │
    │  │Gen Apps   │  │
    │  ├───────────┤  │
    │  │Usage      │  │
    │  └───────────┘  │
    └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ API LAYER ARCHITECTURE                                                      │
└─────────────────────────────────────────────────────────────────────────────┘

POST /api/generate
├─ Authentication (Supabase)
├─ Rate Limit Check (User Tier)
├─ Validate Input
├─ Call XAI Grok-3 API
│  └─ System Prompt: Dioxus + Platform Guidelines
│     ├─ Component Patterns
│     ├─ Rust Best Practices
│     └─ File Structure Requirements
├─ Parse AI Response
├─ Validate Generated Code
├─ Store in Database
├─ Update Usage Count
└─ Return Generated Files + Metadata

POST /api/build/[id]
├─ Authentication (Supabase)
├─ Fetch App from Database
├─ Create Temp Build Directory
├─ Write All Files to Disk
├─ Branch: Build Type
│  ├─ SOURCE:
│  │  ├─ Zip all project files
│  │  └─ Return source.zip
│  └─ EXECUTABLE:
│     ├─ Detect Platform
│     ├─ Run Cargo Build
│     │  ├─ Windows: x86_64-pc-windows-msvc
│     │  ├─ macOS: x86_64-apple-darwin
│     │  └─ Linux: x86_64-unknown-linux-gnu
│     ├─ Zip Executable + README
│     └─ Return executable.zip
├─ Cleanup Temp Directory
└─ Stream File to Client

┌─────────────────────────────────────────────────────────────────────────────┐
│ GENERATED DIOXUS APP STRUCTURE                                              │
└─────────────────────────────────────────────────────────────────────────────┘

rux-app/
├── Cargo.toml
│   ├─ [package]
│   ├─ [dependencies] ◄─ dioxus-0.4
│   ├─ [target.'cfg(windows)']
│   ├─ [target.'cfg(target_os = "macos")']
│   └─ [target.'cfg(target_os = "linux")']
│
├── src/
│   ├── main.rs ◄─ Entry Point
│   │   └─ dioxus_desktop::launch(App)
│   │
│   ├── lib.rs ◄─ Main Component
│   │   └─ #[component] pub fn App() -> Element
│   │
│   ├── components/
│   │   ├── mod.rs ◄─ Module Exports
│   │   ├── common.rs ◄─ Reusable Components
│   │   │   ├─ Button
│   │   │   ├─ Input
│   │   │   ├─ Form
│   │   │   ├─ Table
│   │   │   ├─ Modal
│   │   │   ├─ Card
│   │   │   └─ FormField
│   │   └── pages.rs ◄─ Page Components
│   │       └─ Application-specific pages
│   │
│   └── styles.rs ◄─ Tailwind Utilities
│       └─ Responsive design helpers
│
├── .gitignore ◄─ Git Configuration
└── README.md ◄─ Documentation

┌─────────────────────────────────────────────────────────────────────────────┐
│ COMPONENT HIERARCHY                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

App (Main Component)
│
├── Header
│   └── Navigation
│
├── Sidebar (if applicable)
│   ├── MenuItems
│   └── Status
│
├── MainContent
│   ├── PageComponents
│   │   ├── ListPage
│   │   │   └── Table
│   │   ├── DetailPage
│   │   │   ├── Card
│   │   │   └── Form
│   │   └── CreatePage
│   │       ├── Modal
│   │       └── Form
│   └── UtilityComponents
│       ├── Button
│       ├── Input
│       └── Message
│
└── Footer (if applicable)

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE MANAGEMENT (Dioxus Signals)                                           │
└─────────────────────────────────────────────────────────────────────────────┘

#[component]
fn Example() -> Element {
    // Reactive state with signals
    let mut count = use_signal(|| 0);
    let mut items = use_signal(|| Vec::new());
    let mut form_data = use_signal(|| FormData::default());
    
    // Async operations
    let mut data = use_future(|| async {
        // Fetch data
    });
    
    rsx! {
        button {
            onclick: move |_| count += 1,
            "Count: {count}"
        }
    }
}

┌─────────────────────────────────────────────────────────────────────────────┐
│ PLATFORM COMPILATION FLOW                                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Project Source
│
├─ WINDOWS PATH
│  ├─ Cargo check --target x86_64-pc-windows-msvc
│  ├─ Cargo build --release --target x86_64-pc-windows-msvc
│  ├─ target/x86_64-pc-windows-msvc/release/rux-app.exe
│  └─ WebView2 Integration ◄─ Native Rendering
│
├─ MACOS PATH
│  ├─ Cargo check --target x86_64-apple-darwin
│  ├─ Cargo build --release --target x86_64-apple-darwin
│  ├─ target/x86_64-apple-darwin/release/rux-app
│  └─ Cocoa Framework ◄─ Native Rendering
│
└─ LINUX PATH
   ├─ Cargo check --target x86_64-unknown-linux-gnu
   ├─ Cargo build --release --target x86_64-unknown-linux-gnu
   ├─ target/x86_64-unknown-linux-gnu/release/rux-app
   └─ GTK 3.0+ ◄─ Native Rendering

┌─────────────────────────────────────────────────────────────────────────────┐
│ DATABASE SCHEMA                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

generated_apps
├─ id (UUID) ◄─ Primary Key
├─ user_id (UUID) ◄─ Foreign Key → auth.users
├─ prompt (TEXT) ◄─ Original user description
├─ code (JSONB) ◄─ Generated source files
├─ status (TEXT) ◄─ generated|building|completed|failed
├─ platform (TEXT) ◄─ windows|macos|linux
├─ build_type (TEXT) ◄─ source|executable
├─ created_at (TIMESTAMP)
└─ updated_at (TIMESTAMP)

profiles
├─ id (UUID) ◄─ Primary Key
├─ user_id (UUID) ◄─ Foreign Key → auth.users
├─ role (TEXT) ◄─ free|pro|admin
└─ created_at (TIMESTAMP)

user_usage
├─ id (UUID) ◄─ Primary Key
├─ user_id (UUID) ◄─ Foreign Key → auth.users
├─ year_month (TEXT) ◄─ YYYY-MM
├─ count (INTEGER) ◄─ App generations this month
└─ updated_at (TIMESTAMP)

┌─────────────────────────────────────────────────────────────────────────────┐
│ AI PROMPT ENGINEERING LAYERS                                                │
└─────────────────────────────────────────────────────────────────────────────┘

System Prompt Layer
│
├─ Framework Knowledge
│  ├─ Dioxus syntax & patterns
│  ├─ Component macros
│  └─ Signal state management
│
├─ Platform Guidance
│  ├─ Windows specifics (WebView2)
│  ├─ macOS specifics (Cocoa)
│  └─ Linux specifics (GTK)
│
├─ Rust Best Practices
│  ├─ Error handling (Result types)
│  ├─ Async patterns (Tokio)
│  └─ Type safety
│
├─ CRUD Patterns
│  ├─ List/Table rendering
│  ├─ Form validation
│  └─ Modal dialogs
│
└─ File Structure Requirements
   ├─ Cargo.toml format
   ├─ Component organization
   └─ Styling conventions

User Prompt → AI Generation → Validation → Storage

┌─────────────────────────────────────────────────────────────────────────────┐
│ PERFORMANCE CHARACTERISTICS                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Generation Time:
  Simple App:        ~10 seconds
  Medium App:        ~20 seconds
  Complex App:       ~30 seconds
  AI Processing:     ~8-25 seconds (depends on Grok-3 load)

Build Time (from source):
  First Build:       ~120-300 seconds (depends on cache)
  Incremental:       ~30-60 seconds
  Release Build:     ~180-400 seconds

Runtime Characteristics:
  Startup Time:      ~200 ms
  Memory Usage:      ~50-100 MB
  CPU Usage:         <5% at idle
  Binary Size:       15-30 MB (optimized)

┌─────────────────────────────────────────────────────────────────────────────┐
│ RATE LIMITING STRATEGY                                                      │
└─────────────────────────────────────────────────────────────────────────────┘

Free Tier:
  ├─ 5 generations/month
  ├─ Source builds only
  └─ Community support

Pro Tier:
  ├─ 50 generations/month
  ├─ Source + Executable builds
  └─ Priority support

Admin Tier:
  ├─ Unlimited generations
  ├─ All build types
  ├─ Full API access
  └─ Direct support

Calculation: COUNT_THIS_MONTH = (current_usage + 1)
Check: IF COUNT > LIMIT THEN REJECT

┌─────────────────────────────────────────────────────────────────────────────┐
│ SECURITY ARCHITECTURE                                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Authentication
├─ Supabase Auth (JWT)
├─ Per-endpoint verification
└─ User isolation in queries

Authorization
├─ User tier checking
├─ Rate limit enforcement
└─ Ownership verification

Data Protection
├─ User data encrypted in transit (HTTPS)
├─ Database encryption at rest
├─ No sensitive data in logs
└─ Temporary build cleanup

Code Validation
├─ JSON schema validation
├─ File path sanitization
└─ No shell injection vectors

┌─────────────────────────────────────────────────────────────────────────────┐
│ DEPLOYMENT TOPOLOGY                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   Users (Web)    │
└────────┬─────────┘
         │ HTTPS
    ┌────▼─────────────────────┐
    │  Next.js Frontend         │
    │  (Vercel / Self-hosted)   │
    └────┬─────────────────────┘
         │ API Calls
    ┌────▼─────────────────────┐
    │  Next.js Backend          │
    │  (Serverless / Container) │
    └────┬──────────────────────┘
         │
    ┌────┴─────────────┬────────────────┐
    │                  │                │
    ▼                  ▼                ▼
┌─────────┐     ┌──────────────┐  ┌──────────┐
│Supabase │     │XAI/Grok-3 API│  │Build Env │
│(DB/Auth)│     │   (AI Calls) │  │(Rust)   │
└─────────┘     └──────────────┘  └──────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ KEY DESIGN DECISIONS                                                        │
└─────────────────────────────────────────────────────────────────────────────┘

1. Dioxus over Tauri
   ✓ Pure Rust, no JS overhead
   ✓ Better performance
   ✓ Type-safe UI definition
   ✗ Smaller ecosystem
   ✗ Less documentation

2. Signal-based State Management
   ✓ Reactive updates
   ✓ Simple, intuitive API
   ✓ Efficient VirtualDOM
   ✗ Different from other frameworks

3. Cargo for Building
   ✓ Standard Rust tool
   ✓ Cross-platform support
   ✓ Dependency management
   ✗ Compilation times

4. XAI Grok-3 for Code Generation
   ✓ Latest models
   ✓ Fast inference
   ✓ Good code generation
   ✗ API dependency
   ✗ Costs per request

5. Supabase for Backend
   ✓ Open source
   ✓ Managed PostgreSQL
   ✓ Authentication included
   ✗ Vendor lock-in

╔══════════════════════════════════════════════════════════════════════════════╗
║ ARCHITECTURE VERSION: 2.0 (Dioxus Edition)                                  ║
║ LAST UPDATED: January 2024                                                  ║
║ STATUS: Production Ready                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
