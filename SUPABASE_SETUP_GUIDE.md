# Supabase Database Setup Guide

## Step 1: Run the SQL Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `acawzcosmhkceuaskeos`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase/schema.sql`
6. Paste it into the SQL editor
7. Click **Run** (or press Cmd/Ctrl + Enter)

This will:
- Create all tables with proper indexes
- Set up Row Level Security (RLS) policies
- Create helper functions and triggers
- Configure automatic user creation on signup

## Step 2: Verify Tables Created

After running the SQL, verify in **Table Editor**:

You should see these tables:
- ✅ users
- ✅ projects
- ✅ prompt_history
- ✅ developer_credentials
- ✅ builds
- ✅ waitlist_entries
- ✅ project_api_keys
- ✅ proxy_usage
- ✅ proxy_credits
- ✅ storage_files
- ✅ app_collections
- ✅ app_documents
- ✅ app_users
- ✅ app_sessions
- ✅ token_purchases

## Step 3: Test User Creation

The schema includes an automatic trigger that creates a user profile when someone signs up via Supabase Auth.

**To test:**
1. Sign up with a new account on your app
2. Check the `users` table in Supabase
3. You should see a new row with the user's ID, email, and default credits (3000)

## Step 4: Row Level Security (RLS)

All tables have RLS enabled. This means:
- Users can only see/modify their own data
- Projects are scoped to the user who created them
- API keys are scoped to project owners
- Secure by default!

**Key Policies:**
- Users can view/update their own profile
- Users can CRUD their own projects
- Users can view/create API keys for their projects
- Admins (future) can access everything

## Step 5: Check Functions

Verify these functions exist in **Database** → **Functions**:
- `update_updated_at_column()` - Auto-updates timestamps
- `handle_new_user()` - Creates user profile on signup

## Step 6: Test the Migration

After running the SQL:

```bash
# The app should now use Supabase for all database operations
npm run dev

# Test these flows:
# 1. Sign up → Check if user created in users table
# 2. Create project → Check projects table
# 3. View dashboard → Should load user's projects
# 4. API calls → Should work with Supabase
```

## Common Issues

### Issue: "relation already exists"
**Solution:** The table was already created. You can either:
- Drop the table first: `DROP TABLE table_name CASCADE;`
- Or skip that section of the SQL

### Issue: RLS blocking queries
**Solution:** Make sure you're authenticated via Supabase Auth. The policies require `auth.uid()` to match.

### Issue: Functions not working
**Solution:** Check the SQL output for errors. Functions should be created with `SECURITY DEFINER`.

## Database Schema Overview

```
users (linked to auth.users)
  ├── projects
  │   ├── builds
  │   ├── prompt_history
  │   ├── project_api_keys
  │   │   └── proxy_usage
  │   └── app_collections
  │       └── app_documents
  ├── developer_credentials
  ├── proxy_credits
  ├── storage_files
  └── token_purchases
```

## Benefits of This Setup

1. **Native Supabase Integration**
   - No ORM overhead
   - Direct PostgreSQL access
   - Realtime subscriptions available

2. **Row Level Security**
   - Built-in multi-tenancy
   - Users can't access others' data
   - No need for manual auth checks

3. **Automatic Migrations**
   - SQL-based migrations
   - Easy to version control
   - No Prisma generate step

4. **Better Performance**
   - Direct queries
   - Connection pooling via Supabase
   - Edge-compatible

5. **Type Safety**
   - Generated TypeScript types
   - Auto-complete in IDE
   - Compile-time checks

## Next Steps

Once the SQL is run successfully, I'll:
1. Update all API routes to use Supabase
2. Update stores and hooks
3. Remove Prisma completely
4. Test the full migration

**Ready to proceed?** Just confirm the SQL has been run successfully and I'll continue with the code migration!
