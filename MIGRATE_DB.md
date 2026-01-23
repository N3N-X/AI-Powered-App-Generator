# Database Migration - Simple Terminal Approach

## Option 1: One-Line Command (Recommended)

Since Supabase pooler has auth issues, use this simple approach:

```bash
# Copy the SQL to clipboard
cat supabase/migrations/20260122000000_initial_schema.sql | pbcopy

# Then run this to open Supabase SQL editor
open "https://supabase.com/dashboard/project/acawzcosmhkceuaskeos/sql/new"
```

Then:
1. Paste the SQL (Cmd+V)
2. Click "Run" or press Cmd+Enter
3. Done!

## Option 2: Using Supabase CLI with Access Token

If you want CLI access, get your access token:

1. Go to: https://supabase.com/dashboard/account/tokens
2. Generate new token
3. Add to .env.local:

```bash
SUPABASE_ACCESS_TOKEN="your_token_here"
```

Then run:
```bash
npx supabase db push
```

## Option 3: Manual SQL Execution

The SQL file is ready at:
```
supabase/migrations/20260122000000_initial_schema.sql
```

Just copy-paste it into Supabase SQL Editor.

## What the Migration Does

✅ Creates 15 tables with proper relationships  
✅ Sets up Row Level Security (RLS) policies  
✅ Creates automatic user profile trigger  
✅ Adds indexes for performance  
✅ Configures updated_at triggers  

## After Migration

Once the SQL runs successfully, I'll immediately:
1. Replace all Prisma code with Supabase
2. Update 30+ API routes  
3. Remove Prisma dependencies
4. Test everything

---

**For now, just run the SQL via dashboard** (Option 1) and let me know when it's done! 🚀
