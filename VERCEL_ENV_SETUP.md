# Vercel Environment Variables Setup

## Required Environment Variables for Supabase

You need to add the `DIRECT_URL` environment variable to Vercel to fix the Prisma migration error.

### Steps to Add Environment Variables in Vercel:

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your **RUX** project
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:

### New Variable to Add:

**Variable Name:**
```
DIRECT_URL
```

**Value:**
```
postgresql://postgres.acawzcosmhkceuaskeos:lmDHjLsXCGvEEBPL@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**Environment:** 
- ✅ Production
- ✅ Preview
- ✅ Development

### Existing Supabase Variables (Verify These Exist):

Make sure these are also set in Vercel:

**1. NEXT_PUBLIC_SUPABASE_URL**
```
https://acawzcosmhkceuaskeos.supabase.co
```

**2. NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjYXd6Y29zbWhreGV1YXNrZW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNjQ1MDEsImV4cCI6MjA1MjY0MDUwMX0.V2tF1hZW1k3rJr66DRxzhb26prmzVNTKqUjS9r4ATJI
```

**3. DATABASE_URL** (Update if needed)
```
postgresql://postgres.acawzcosmhkceuaskeos:lmDHjLsXCGvEEBPL@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Understanding the URLs:

- **DATABASE_URL** (Port 6543): Uses pgBouncer connection pooling for API routes
- **DIRECT_URL** (Port 5432): Direct PostgreSQL connection for Prisma migrations

### After Adding Variables:

1. **Redeploy** your application or wait for auto-deploy
2. The Prisma migration warning will disappear
3. All database operations will work correctly

## Variables to Remove (Firebase - No Longer Needed):

If you haven't already, remove these Firebase variables:

- ❌ `NEXT_PUBLIC_FIREBASE_API_KEY`
- ❌ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ❌ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ❌ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ❌ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ❌ `NEXT_PUBLIC_FIREBASE_APP_ID`
- ❌ `FIREBASE_ADMIN_PROJECT_ID`
- ❌ `FIREBASE_ADMIN_CLIENT_EMAIL`
- ❌ `FIREBASE_ADMIN_PRIVATE_KEY`
- ❌ `FIREBASE_SERVER_KEY`

## Quick Copy-Paste for Vercel UI:

Open your terminal and copy this for quick reference:

```bash
# Add to Vercel Environment Variables

# Name: DIRECT_URL
# Value: postgresql://postgres.acawzcosmhkceuaskeos:lmDHjLsXCGvEEBPL@aws-0-us-east-1.pooler.supabase.com:5432/postgres
# Environments: Production, Preview, Development
```

## Verification:

After deployment, check the build logs. You should see:
```
✓ Generated Prisma Client
✓ Migrations complete!
✓ Compiled successfully
```

The `DIRECT_URL` error will be gone!

## Git Branches Updated:

✅ **main** branch - Updated and pushed  
✅ **staging** branch - Merged from main and pushed  

Both branches now have the complete Supabase migration.
