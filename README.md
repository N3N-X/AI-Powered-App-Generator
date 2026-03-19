# RUX - AI-Powered App Generator

RUX is a production-grade platform that lets users describe iOS, Android, and web apps in natural language and generates cross-platform React Native + Expo code using a multi-agent AI system.

## Features

- **Natural Language Input** - Describe your app idea and get production-ready code
- **AI Code Generation** - Codex-powered generation with platform-specific rules
- **Live Preview** - See your app render in real-time with React Native Web
- **Iterative Refinement** - Chat with AI to refine and improve your app
- **Cloud Builds** - Build APKs and IPAs using EAS (Expo Application Services)
- **GitHub Integration** - Create repos and push code directly from the dashboard
- **Managed Proxy Services** - 40+ API integrations (AI, email, SMS, maps, storage, etc.) without exposing user keys
- **Secure Credentials** - AES-256-GCM encrypted storage for API keys and dev accounts
- **Multi-tier Plans** - Free, Pro, and Elite plans with credits-based usage

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth |
| Database | PostgreSQL (Supabase) |
| State | Zustand |
| AI | OpenAI Codex + Anthropic Claude |
| Rate Limiting | Upstash Redis |
| Code Editor | Monaco Editor |
| Preview | React Native Web + Expo Snack |
| Payments | Stripe |
| Storage | Cloudflare R2 |
| Builds | EAS (Expo Application Services) |

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project (database + auth)
- Upstash Redis account
- OpenAI API key (for Codex)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/rux.git
   cd rux
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your actual credentials.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
rux/
├── app/                        # Next.js App Router
│   ├── (public)/               # Public pages (landing, pricing, legal)
│   ├── auth/                   # Auth callback, MFA, email verification
│   ├── dashboard/              # Protected dashboard
│   │   ├── generate/           # AI code generation workspace
│   │   ├── builds/             # Build history & management
│   │   ├── content/            # Content management
│   │   ├── settings/           # User settings
│   │   └── admin/              # Admin panel
│   └── api/                    # API routes
│       ├── vibe/               # Agent endpoint (SSE streaming)
│       ├── build/              # EAS build triggers
│       ├── projects/           # Project CRUD + nested resources
│       ├── proxy/              # Managed API proxy (40+ services)
│       ├── github/             # GitHub integration
│       ├── billing/            # Stripe payments & webhooks
│       └── admin/              # Admin endpoints
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── landing/                # Landing page components
│   ├── dashboard/              # Dashboard components
│   └── billing/                # Billing components
├── lib/
│   ├── codex/                  # AI code generation system
│   │   ├── generate.ts         # Main generation orchestrator
│   │   ├── client.ts           # Codex SDK client
│   │   ├── agents-md.ts        # AGENTS.md builder for Codex
│   │   ├── workspace.ts        # File workspace utilities
│   │   ├── ensure-config-files.ts  # Config file generation
│   │   └── prompts/            # Platform rules & proxy docs
│   ├── supabase/               # Supabase client (browser + server)
│   ├── build/                  # Pre-build checks & store guidelines
│   ├── eas/                    # EAS build integration
│   ├── github/                 # GitHub API integration
│   ├── proxy/                  # API proxy utilities
│   ├── voice/                  # Twilio voice integration
│   ├── preview-html/           # Web preview HTML generation
│   ├── rate-limit.ts           # Upstash Redis rate limiting
│   ├── encrypt.ts              # AES-256-GCM encryption
│   ├── billing.ts              # Stripe billing logic
│   ├── storage.ts              # R2 file storage
│   └── cors.ts                 # CORS configuration
├── stores/                     # Zustand state stores
├── types/                      # TypeScript type definitions
├── contexts/                   # React contexts (Auth)
├── hooks/                      # Custom React hooks
└── supabase/                   # Database migrations
```

## API Routes

### Generation
- `POST /api/vibe/generate` - Code generation endpoint (SSE streaming)
- `POST /api/vibe/pre-build-check` - Pre-build validation
- `POST /api/vibe/fix-build-issues` - Auto-fix build issues

### Projects
- `GET/POST /api/projects` - List/create projects
- `GET/PATCH/DELETE /api/projects/[id]` - Project CRUD
- `GET/POST /api/projects/[id]/chat` - Chat history
- `POST /api/projects/[id]/images` - Image uploads

### Builds
- `POST /api/build/android` - Trigger Android build
- `POST /api/build/ios` - Trigger iOS build
- `POST /api/build/publish` - Publish built app

### GitHub
- `GET/POST/DELETE /api/github/connect` - Manage GitHub connection
- `POST /api/github/create-repo` - Create repository
- `POST /api/github/push` - Push code to repo

## Plan Limits

| Feature | Free | Pro | Elite |
|---------|------|-----|-------|
| Credits | 3,000 (one-time) | 20,000/month | 50,000/month |
| Projects | 3 | 20 | Unlimited |
| AI Model | Codex | Codex | Codex + Claude |
| GitHub | No | Yes | Yes |
| Cloud Builds | Yes | Yes | Yes |
| Custom API Keys | No | No | Yes |
| Priority Queue | No | Yes | Yes |

## Security

- AES-256-GCM encryption for all sensitive data (API keys, credentials)
- Supabase Auth with MFA support
- Rate limiting per user and endpoint via Upstash Redis
- Input validation with Zod on all API routes
- Security headers (HSTS, CSP, X-Frame-Options, etc.)
- Encrypted proxy system - user API keys never exposed to frontend

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

## License

MIT License - see LICENSE file for details.
