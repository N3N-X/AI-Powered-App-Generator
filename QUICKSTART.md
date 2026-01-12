# RUX Quick Start Guide - Dioxus Edition

## 🎯 Getting Started

### Step 1: Set Up Local Environment

```bash
# Clone repository
git clone https://github.com/your-repo/rux.git
cd rux

# Install Node.js dependencies
npm install

# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Update Rust
rustup update stable

# Start development server
npm run dev
```

### Step 2: Configure Environment Variables

Create `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# XAI API (Grok-3)
XAI_API_KEY=your-xai-api-key

# Build Configuration
RUST_BACKTRACE=1
```

### Step 3: Set Up Supabase Database

```bash
# Apply migrations
supabase migration up

# Verify tables were created
supabase db pull
```

## 🚀 Generating Your First App

### Using the Web Interface

1. Navigate to `http://localhost:3000/dashboard`
2. Click "Generate New App"
3. Fill in the form:
   - **Description**: "A simple to-do list app with tasks"
   - **Platform**: Windows (or your target platform)
   - **Build Type**: Source
4. Click "Generate"
5. Wait 10-30 seconds for AI to generate code
6. Download the generated source code

### Using the API Directly

```bash
curl -X POST http://localhost:3000/api/generate \
  -F "prompt=A simple calculator app with basic operations" \
  -F "platform=macos" \
  -F "build_type=source" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

## 📦 Building Generated Apps

### From Source

```bash
# Extract downloaded zip
unzip rux-app.zip
cd rux-app

# Build debug version
cargo build

# Build optimized release
cargo build --release

# Run the app
./target/release/rux-app

# Or on Windows
./target/release/rux-app.exe
```

### Requesting Executable Build

```bash
curl -X POST http://localhost:3000/api/generate \
  -F "prompt=A notes app with rich text editing" \
  -F "platform=linux" \
  -F "build_type=executable" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

## 📝 Example Prompts

### Simple Apps

```
"Create a timer app with start, pause, and reset buttons"
"Build a random quote generator that displays a new quote every time I click a button"
"Make a currency converter with USD, EUR, GBP, and JPY"
```

### CRUD Apps

```
"Create a task manager where I can add, edit, and delete tasks. Show them in a table with status column."
"Build a contact management app with name, email, phone, and company fields. Include add, edit, and delete functionality."
"Make an inventory system that tracks products with quantity, price, and category. Include CRUD operations."
```

### Complex Apps

```
"Create a project management app with projects, tasks within projects, and team member assignments. Include filtering by status."
"Build a customer relationship management system with contacts, deals, and activity tracking."
"Make a real estate listing app with property details, photos, price, and search filters."
```

## 🔧 Modifying Generated Apps

### Add New Component

Edit `src/components/common.rs`:

```rust
#[component]
pub fn CustomComponent(props: CustomProps) -> Element {
    rsx! {
        div {
            class: "custom-class",
            // Your component content
        }
    }
}
```

### Update Main App

Edit `src/lib.rs`:

```rust
#[component]
pub fn App() -> Element {
    rsx! {
        div {
            class: "w-screen h-screen flex flex-col",
            // Your updated app structure
        }
    }
}
```

### Add Dependencies

Edit `Cargo.toml`:

```toml
[dependencies]
dioxus = "0.4"
dioxus-desktop = "0.4"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
# Add your new dependency here
your-package = "1.0"
```

## 🧪 Testing Your App

### Run in Debug Mode

```bash
# Shows log output
RUST_LOG=debug cargo run
```

### Build for Different Platforms

```bash
# macOS (Intel)
cargo build --release --target x86_64-apple-darwin

# Windows (MSVC)
cargo build --release --target x86_64-pc-windows-msvc

# Linux (GNU)
cargo build --release --target x86_64-unknown-linux-gnu
```

### Check Compilation Warnings

```bash
cargo clippy
```

## 📊 Monitoring Usage

### Check Your Generation Quota

Request to `/api/user/usage`:

```bash
curl -X GET http://localhost:3000/api/user/usage \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

Response:

```json
{
  "current": 3,
  "limit": 5,
  "role": "free",
  "year_month": "2024-01"
}
```

## 🐛 Troubleshooting

### "Cargo not found"

```bash
rustup install stable
rustup default stable
```

### "GTK not found" (Linux)

```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-dev

# Fedora
sudo dnf install gtk3-devel
```

### "WebView2 not installed" (Windows)

Download from: <https://developer.microsoft.com/en-us/microsoft-edge/webview2/>

### "App won't compile"

```bash
# Clean build
cargo clean
cargo build --release

# Check for issues
cargo check
```

## 📚 Documentation

- [Full Dioxus Migration Guide](./DIOXUS_MIGRATION.md)
- [Complete README](./README_DIOXUS.md)
- [Migration Summary](./MIGRATION_SUMMARY.md)

## 🆘 Getting Help

### Check Logs

```bash
# Backend logs
npm run dev  # Shows all request logs

# Build logs
RUST_LOG=debug cargo build
```

### Debug Generated App

```bash
# Add this to main.rs for debugging
env_logger::init();

// Then in code:
log::debug!("Debug message");
log::error!("Error occurred");
```

## ✅ Verification Checklist

- [ ] Node.js dependencies installed (`npm install`)
- [ ] Rust installed and updated (`rustup update`)
- [ ] Environment variables configured (`.env.local`)
- [ ] Supabase migrations applied (`supabase migration up`)
- [ ] Development server starts (`npm run dev`)
- [ ] Can generate apps via web interface
- [ ] Generated apps compile successfully
- [ ] Can build for target platform

## 🎓 Next Steps

1. Generate several test apps to understand code generation
2. Explore the generated code structure
3. Modify components to customize apps
4. Deploy to production (see README_DIOXUS.md)
5. Set up CI/CD pipeline for automated builds

---

**Ready to build amazing apps with AI? Let's go! 🚀**

For issues or questions, refer to the troubleshooting section or check the full documentation.
