# RUX Development Workflow

## Branch Strategy

- **main** → Production (rux.sh)
- **staging** → Staging (preview URL)
- **development** → Development (preview URL)

## Local Development

### Start working on a new feature:
```bash
git checkout development
git pull origin development
npm run dev
```

### Pull latest environment variables from Vercel:
```bash
npx vercel env pull .env.local
# Copy database URLs to .env for Prisma
grep "DATABASE_URL\|POSTGRES_URL" .env.local | head -3 > .env
```

### Create a database migration:
```bash
npx prisma migrate dev --name your_migration_name
```

### Generate Prisma client after schema changes:
```bash
npx prisma generate
```

## Deployment Workflow

### 1. Development → Staging
```bash
git checkout development
git add .
git commit -m "Your feature"
git push origin development
# Auto-deploys to development preview URL

# When ready for testing:
git checkout staging
git merge development
git push origin staging
# Auto-deploys to staging preview URL
```

### 2. Staging → Production
```bash
# After testing on staging:
git checkout main
git merge staging
git push origin main
# Auto-deploys to rux.sh
```

## Database Management

### Run migrations on production:
Migrations run automatically via `npm run build` script:
```json
"build": "prisma generate && prisma migrate deploy && next build"
```

### View database in browser:
```bash
npx prisma studio
```

### Reset local database (DANGER):
```bash
npx prisma migrate reset
```

## Vercel CLI Commands

### Link project (already done):
```bash
npx vercel link
```

### Pull environment variables:
```bash
npx vercel env pull .env.local
```

### Deploy manually:
```bash
npx vercel --prod  # Production
npx vercel         # Preview
```

## Environment Files

- `.env.local` - Local development (from Vercel, not committed)
- `.env` - Prisma-specific (DATABASE_URL, not committed)
- `.env.example` - Template for required env vars (committed)

## Useful Commands

```bash
# Check current branch
git branch

# View Vercel deployments
npx vercel ls

# View production logs
npx vercel logs rux.sh

# Check database connection
npx prisma db pull
```
