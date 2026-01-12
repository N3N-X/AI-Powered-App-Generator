# RUX - AI-Powered Cross-Platform Desktop App Generator

> Generate production-ready Dioxus desktop applications with AI, powered by Rust and optimized for Windows, macOS, and Linux.

## 🚀 Major Milestone: Tauri → Dioxus Migration

We've migrated from Tauri to **Dioxus**, a modern Rust UI framework that offers:

✅ **Pure Rust** - No JavaScript runtime overhead  
✅ **Better Performance** - Faster startup, lower memory usage  
✅ **Unified Codebase** - Single source for all platforms  
✅ **Reactive UI** - Modern component architecture  
✅ **Type Safety** - Full Rust type system protection  
✅ **Production Ready** - Built for enterprise applications  

## 📋 Project Structure

```
RUX/
├── src/
│   ├── app/                          # Next.js application
│   │   ├── api/
│   │   │   ├── generate/route.ts     # AI code generation endpoint
│   │   │   └── build/[id]/route.ts   # Cross-platform build system
│   │   ├── auth/                     # Authentication pages
│   │   ├── dashboard/                # Main dashboard
│   │   └── page.tsx                  # Landing page
│   └── lib/
│       └── componentTemplates.ts     # Reusable component templates
├── supabase/
│   ├── config.toml                   # Supabase configuration
│   └── migrations/                   # Database migrations
├── temp-builds/                      # Temporary build output
├── DIOXUS_MIGRATION.md               # Migration documentation
└── README.md                         # This file
```

## 🛠️ API Endpoints

### POST `/api/generate`

Generate a new Dioxus application from a natural language description.

**Parameters:**

- `prompt` (required): Application description
- `platform` (optional): `windows|macos|linux` (default: `windows`)
- `build_type` (optional): `source|executable` (default: `source`)
- `existing_code` (optional): Existing code to modify
- `change_prompt` (optional): Modification instructions

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": {
    "Cargo.toml": "...",
    "src/main.rs": "...",
    "src/lib.rs": "...",
    "src/components/mod.rs": "...",
    "src/components/common.rs": "...",
    "src/components/pages.rs": "...",
    ".gitignore": "...",
    "README.md": "..."
  },
  "build_type": "source",
  "usage": {
    "current": 5,
    "limit": 50,
    "role": "pro"
  }
}
```

### POST `/api/build/[id]`

Build and package the generated application.

**Body:**

```json
{
  "code": { /* files object */ },
  "platform": "macos",
  "build_type": "executable"
}
```

**Response:** ZIP file containing either source code or compiled executable

## 📦 Generated Project Structure

Each generated app follows this structure:

```
rux-app/
├── Cargo.toml                   # Rust project manifest
├── src/
│   ├── main.rs                  # Entry point
│   ├── lib.rs                   # Main App component
│   ├── components/
│   │   ├── mod.rs               # Component exports
│   │   ├── common.rs            # Reusable components
│   │   └── pages.rs             # Page components
│   └── styles.rs                # Tailwind utilities
├── README.md                    # Project documentation
└── .gitignore                   # Git configuration
```

## 🎨 Available Components

### Button

```rust
#[component]
fn Example() -> Element {
    rsx! {
        Button {
            label: "Click me",
            onclick: Some(|| println!("Clicked!")),
            variant: "primary",
            disabled: false,
        }
    }
}
```

### Input

```rust
#[component]
fn Example() -> Element {
    let mut value = use_signal(|| String::new());
    rsx! {
        Input {
            value: value(),
            onchange: Some(|v| value.set(v)),
            placeholder: "Enter text...",
            input_type: "text",
            required: true,
        }
    }
}
```

### Table

```rust
#[component]
fn Example() -> Element {
    let headers = vec!["Name", "Email", "Role"];
    let rows = vec![
        vec!["Alice".to_string(), "alice@example.com".to_string(), "Admin".to_string()],
        vec!["Bob".to_string(), "bob@example.com".to_string(), "User".to_string()],
    ];
    
    rsx! {
        Table { headers, rows }
    }
}
```

### Modal

```rust
#[component]
fn Example() -> Element {
    let mut is_open = use_signal(|| false);
    rsx! {
        Modal {
            is_open: is_open(),
            title: "Confirm",
            on_close: || is_open.set(false),
            // Modal content
        }
    }
}
```

### Form

```rust
#[component]
fn Example() -> Element {
    let mut form_data = use_signal(|| FormData::default());
    rsx! {
        form {
            onsubmit: move |e: FormEvent| {
                // Handle submission
            },
            FormField {
                label: "Name",
                Input {
                    value: form_data().name,
                    // ...
                }
            }
        }
    }
}
```

## 🗄️ Database Schema

### generated_apps Table

```sql
id                  UUID (primary key)
user_id             UUID (foreign key)
prompt              TEXT
code                JSONB (file contents)
status              TEXT (generated, building, completed, failed)
platform            TEXT (windows, macos, linux)
build_type          TEXT (source, executable)
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### user_usage Table

```sql
id                  UUID (primary key)
user_id             UUID (foreign key)
year_month          TEXT (YYYY-MM)
count               INTEGER
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

## 👥 User Tiers & Rate Limits

| Tier | Monthly Limit | Features |
|------|---------------|----------|
| Free | 5 apps | Basic generation |
| Pro | 50 apps | Executable builds, priority support |
| Admin | Unlimited | All features, API access |

## 🔐 Authentication

- **Provider**: Supabase Auth
- **Methods**: Email/Password, OAuth (Google, GitHub)
- **Flows**: Sign up, login, password reset

## 🚀 Deployment Guide

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local

# Run development server
npm run dev

# Build production
npm run build
```

### Docker (Production)

```bash
docker build -t rux:latest .
docker run -p 3000:3000 rux:latest
```

## 📝 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# XAI API (Grok-3)
XAI_API_KEY=your-xai-api-key

# Build System
RUST_BACKTRACE=1
```

## 🏗️ Architecture

### API Layer (TypeScript/Next.js)

- User authentication with Supabase
- Rate limiting by user tier
- Request validation and error handling
- File streaming and downloads

### Generation Layer (XAI Grok-3)

- Natural language understanding
- Code generation with custom prompts
- Multi-platform code synthesis
- CRUD component generation

### Build Layer (Rust/Cargo)

- Cross-platform Rust compilation
- Dioxus framework integration
- Executable packaging
- Source distribution

### Storage (Supabase PostgreSQL)

- User profiles and authentication
- Generated app metadata
- Usage tracking and billing
- Code storage

## 🔧 Development

### Adding New Components

1. Create component in `src/lib/componentTemplates.ts`
2. Update system prompt to reference new component
3. Add to generated `src/components/common.rs`

### Modifying Build Process

Edit `src/app/api/build/[id]/route.ts`:

- Change `buildDioxusApp()` function
- Update platform-specific build commands
- Modify output packaging

### Testing Generated Apps

```bash
# Download and extract generated app
unzip rux-app.zip
cd rux-app

# Build
cargo build --release

# Run
./target/release/rux-app
```

## 🐛 Troubleshooting

### Build Fails with "Cargo not found"

- Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Update: `rustup update`

### macOS Code Signing Issues

```bash
# Sign the binary
codesign --deep --force --verify --verbose --sign - ./target/release/rux-app
```

### Linux GTK Issues

```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-dev

# Fedora
sudo dnf install gtk3-devel
```

## 📊 Performance Metrics

- **App Generation**: ~10-30 seconds (depends on complexity)
- **Source Build**: ~2-5 minutes (first build, cached dependencies)
- **Executable Build**: ~3-8 minutes (including compilation)
- **Binary Size**: ~15-30 MB (optimized release build)
- **Memory Usage**: ~50-100 MB at runtime

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙋 Support

- Documentation: [DIOXUS_MIGRATION.md](./DIOXUS_MIGRATION.md)
- Issues: GitHub Issues
- Email: <support@rux.dev>

## 🎯 Roadmap

- [ ] Component marketplace
- [ ] Template library
- [ ] Backend scaffolding
- [ ] Database schema generator
- [ ] API client generation
- [ ] Testing framework integration
- [ ] Native module support
- [ ] Plugin system

---

**Version**: 2.0.0 (Dioxus Edition)  
**Last Updated**: 2024  
**Maintainer**: RUX Team
