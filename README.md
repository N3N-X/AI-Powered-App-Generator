# RUX

AI-powered cross-platform desktop app generator built with Dioxus, Next.js, and Supabase.

Generate desktop apps for Windows, macOS, and Linux using natural language prompts.

## Features

- 🤖 AI-driven code generation
- 🦀 Pure Rust desktop apps with Dioxus
- 🔄 Cross-platform builds
- 🎨 Tailwind CSS integration
- 🗄️ Supabase database
- 📊 User tiers and rate limiting

## Quick Start

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Visit http://localhost:3000

For detailed instructions, see [QUICKSTART.md](./QUICKSTART.md)

## Documentation

- [Documentation Index](./INDEX.md)
- [Quick Start](./QUICKSTART.md)
- [Architecture](./ARCHITECTURE.md)
- [Dioxus Migration](./DIOXUS_MIGRATION.md)
- [Complete Reference](./README_DIOXUS.md)

## API Endpoints

- `POST /api/generate` - Generate app code
- `POST /api/build/:id` - Build for target platform

## License

[Your License Here]