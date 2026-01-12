# RUX - Cross-Platform Desktop App Generator

A modern, AI-powered desktop application generator using Dioxus and Rust.

## Architecture Changes: Tauri → Dioxus

### Why Dioxus?

- **Pure Rust**: No JavaScript runtime overhead
- **Better Performance**: Faster startup, lower memory footprint
- **Cross-Platform**: Unified codebase for Windows, macOS, and Linux
- **Reactive UI**: Modern component-based architecture with signals
- **Type Safety**: Full Rust type system support
- **Community**: Growing ecosystem with excellent Tailwind CSS integration

### Supported Platforms

- **Windows**: x86_64-pc-windows-msvc with WebView2
- **macOS**: x86_64-apple-darwin with Cocoa
- **Linux**: x86_64-unknown-linux-gnu with GTK 3.0+

### Build Options

1. **Source Code**: Full project source, ready to compile
2. **Executable**: Pre-compiled binary for your platform

## API Endpoints

### Generate App

```bash
POST /api/generate
Content-Type: multipart/form-data

Parameters:
- prompt: string (required) - App description
- platform: string (windows|macos|linux, default: windows)
- build_type: string (source|executable, default: source)
- existing_code?: string - Code to modify
- change_prompt?: string - Modification instructions
```

Response:

```json
{
  "id": "uuid",
  "code": { "file_path": "file_content", ... },
  "build_type": "source|executable",
  "usage": {
    "current": 5,
    "limit": 50,
    "role": "pro"
  }
}
```

### Build App

```bash
POST /api/build/[id]
Content-Type: application/json

Response: ZIP file download
```

## Generated Project Structure

```
project/
├── Cargo.toml              # Rust project manifest
├── .gitignore              # Git ignore rules
├── README.md               # Project documentation
├── src/
│   ├── main.rs             # Entry point
│   ├── lib.rs              # Main App component
│   ├── components/
│   │   ├── mod.rs          # Component exports
│   │   ├── common.rs       # Reusable components
│   │   └── pages.rs        # Page components
│   └── styles.rs           # Tailwind utilities
```

## CRUD Components

### Available Components

#### Button

```rust
#[component]
fn MyForm() -> Element {
    rsx! {
        Button {
            label: "Submit",
            onclick: move |_| {
                // Handle click
            }
        }
    }
}
```

#### Input

```rust
#[component]
fn MyForm() -> Element {
    let mut value = use_signal(|| String::new());
    rsx! {
        Input {
            value: value(),
            onchange: move |e: FormEvent| {
                value.set(e.value());
            },
            placeholder: "Enter text..."
        }
    }
}
```

#### Form

```rust
#[component]
fn MyForm() -> Element {
    let mut form_data = use_signal(|| Default::default());
    rsx! {
        Form {
            onsubmit: move |e: FormEvent| {
                // Handle form submission
            },
            // Form fields...
        }
    }
}
```

#### Table

```rust
#[component]
fn MyTable() -> Element {
    let items = vec![
        ("Alice", "Engineering"),
        ("Bob", "Sales"),
    ];
    
    rsx! {
        Table {
            headers: vec!["Name", "Department"],
            rows: items.iter().map(|(name, dept)| {
                vec![name.to_string(), dept.to_string()]
            }).collect::<Vec<_>>()
        }
    }
}
```

#### Modal

```rust
#[component]
fn MyModal() -> Element {
    let mut is_open = use_signal(|| false);
    rsx! {
        button {
            onclick: move |_| is_open.toggle(),
            "Open Modal"
        }
        Modal {
            is_open: is_open(),
            title: "Confirm Action",
            on_close: move |_| is_open.set(false),
            // Content...
        }
    }
}
```

## Rust Best Practices Implemented

### Error Handling

- Result types for all fallible operations
- Custom error types where appropriate
- Proper error propagation with `?` operator

### Async Patterns

- Tokio runtime for async operations
- Proper spawning of tasks
- Correct cancellation handling

### Type Safety

- Strong typing for component props
- Type-safe event handlers
- Generic components where applicable

### Performance

- Memoized components for expensive computations
- Lazy evaluation with signals
- Efficient re-rendering with Dioxus VirtualDOM

### Code Organization

- Modular component structure
- Clear separation of concerns
- Reusable utility functions

## Platform-Specific Considerations

### Windows

- Requires Visual C++ redistributable
- Uses native WebView2 for rendering
- Supports Windows 10+

### macOS

- Requires macOS 10.12+
- Uses native Cocoa framework
- Code-signing may be required for distribution

### Linux

- Requires GTK 3.0+
- Tested on Ubuntu 20.04+
- May require additional system packages (libgtk-3-dev, etc.)

## Usage Flow

1. **Generate**: User describes app → AI generates Dioxus code
2. **Build**: Code compiled to platform-specific executable or source
3. **Deploy**: User downloads and runs the app

## Development

### Local Setup

```bash
rustup default stable
cargo build
cargo run
```

### Testing Generated Apps

```bash
# Build and run generated app
cd generated_project
cargo run
```

### Rate Limiting

- Free: 5 apps/month
- Pro: 50 apps/month
- Admin: Unlimited

## Future Enhancements

- [ ] Component marketplace
- [ ] Template library
- [ ] Backend integration templates
- [ ] Database schema generator
- [ ] API client generation
- [ ] Testing framework integration
- [ ] Native module support
