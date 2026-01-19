# RUX - AI-Powered Mobile App Generator

RUX is a production-grade web application that lets users describe iOS/Android apps in natural language and generates cross-platform React Native + Expo code.

## Features

- **Natural Language Input**: Describe your app idea and get production-ready code
- **Live Preview**: See your app render in real-time with React Native Web
- **Iterative Refinement**: Chat with AI to refine and improve your app
- **Cloud Builds**: Build APKs and IPAs using EAS (Expo Application Services)
- **GitHub Integration**: Create repos and push code directly from the dashboard
- **Secure Credentials**: End-to-end encrypted storage for API keys and dev accounts
- **Multi-tier Plans**: Free, Pro, and Elite plans with different AI models and limits

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: Clerk
- **Database**: PostgreSQL + Prisma
- **State**: Zustand
- **AI**: xAI Grok + Anthropic Claude
- **Rate Limiting**: Upstash Redis
- **Code Editor**: Monaco Editor
- **Preview**: React Native Web + Expo

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account
- Upstash Redis account
- xAI API key (and optionally Claude API key)

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
   Then edit `.env.local` with your actual credentials.

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Clerk Setup

1. Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Copy your API keys to `.env.local`
3. Set up a webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
4. Copy the webhook signing secret to `CLERK_WEBHOOK_SECRET`

### Clerk User Metadata for Plans

To upgrade a user's plan, update their `publicMetadata` in Clerk:

```json
{
  "plan": "PRO"
}
```

Valid values: `FREE`, `PRO`, `ELITE`

### Upstash Setup

1. Create a Redis database at [console.upstash.com](https://console.upstash.com)
2. Copy the REST URL and token to your environment variables

### EAS Build Setup

1. Create an Expo account at [expo.dev](https://expo.dev)
2. Generate an access token in account settings
3. Set up `EAS_ACCESS_TOKEN` in your environment

## Project Structure

```
rux/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (public)/          # Public pages (pricing, etc.)
│   ├── api/               # API routes
│   │   ├── vibe/          # AI generation endpoints
│   │   ├── build/         # EAS build endpoints
│   │   ├── github/        # GitHub integration
│   │   └── creds/         # Credential management
│   └── dashboard/         # Protected dashboard
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── landing/           # Landing page components
│   ├── dashboard/         # Dashboard components
│   └── shared/            # Shared components
├── lib/                   # Utility libraries
│   ├── ai.ts              # AI integration
│   ├── db.ts              # Prisma client
│   ├── encrypt.ts         # Encryption utilities
│   ├── eas.ts             # EAS build integration
│   ├── github.ts          # GitHub API
│   ├── rate-limit.ts      # Rate limiting
│   └── utils.ts           # General utilities
├── stores/                # Zustand stores
├── types/                 # TypeScript types
├── prisma/                # Database schema
└── public/                # Static assets
```

## API Routes

### Vibe Generation
- `POST /api/vibe/generate` - Generate new code
- `POST /api/vibe/refine` - Refine existing code

### Builds
- `POST /api/build/android` - Trigger Android build
- `POST /api/build/ios` - Trigger iOS build

### GitHub
- `GET/POST/DELETE /api/github/connect` - Manage GitHub connection
- `POST /api/github/create-repo` - Create repository
- `POST /api/github/push` - Push code to repo

### Credentials
- `GET/POST/DELETE /api/creds/connect-apple` - Apple Developer credentials
- `GET/POST/DELETE /api/creds/connect-google` - Google Play credentials

## Plan Limits

| Feature | Free | Pro | Elite |
|---------|------|-----|-------|
| Daily Prompts | 20 | 100 | 500 |
| Projects | 3 | 20 | Unlimited |
| AI Model | Grok | Grok | Claude |
| GitHub Integration | No | Yes | Yes |
| Cloud Builds | No | Yes | Yes |
| Custom Claude Key | No | No | Yes |
| Priority Queue | No | Yes | Yes |

## Security

- All sensitive data (API keys, credentials) encrypted with AES-256-GCM
- Rate limiting per user and endpoint
- CSRF protection via Clerk
- Input validation with Zod
- Secure session management

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Self-hosted

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

Built with AI, for developers who want to move fast.
