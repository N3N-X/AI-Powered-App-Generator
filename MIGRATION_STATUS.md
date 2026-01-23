# Prisma to Supabase Migration Status

## Completed ✅
- Schema migrated to Supabase (15 tables with RLS policies)
- Supabase CLI configured and schema deployed
- Prisma removed from project (package.json, prisma directory)
- Type definitions created (`lib/supabase/types.ts`)
- Helper functions created (`lib/supabase/db.ts`)
- **28 API routes converted** to Supabase

### Converted Routes:
- ✅ /api/user
- ✅ /api/projects (GET, POST)
- ✅ /api/admin/maintenance
- ✅ /api/billing/tokens/purchase
- ✅ /api/billing/portal  
- ✅ /api/billing/webhook
- ✅ /api/creds/connect-apple (GET, POST, DELETE)
- ✅ /api/creds/connect-google (GET, POST, DELETE)
- ✅ /api/vibe/refine
- ✅ /api/vibe/build
- ✅ /api/vibe/generate
- ✅ /api/export
- ✅ /api/serve
- ✅ /api/build (GET, POST)
- ✅ /api/health
- ✅ /api/admin/stats
- ✅ /api/admin/users (GET, PATCH)
- ✅ /api/projects/[id] (GET, PATCH, DELETE)
- ✅ /api/preview
- ✅ /api/projects/[id]/chat (POST, DELETE)
- ✅ /api/projects/[id]/domain (GET, PATCH, DELETE)
- ✅ /api/github/connect (GET, POST, DELETE)

## Remaining 🚧
### 9 API Routes (58 Prisma calls):
1. `app/api/github/create-repo/route.ts` - 2 calls
2. `app/api/github/push/route.ts` - 1 call
3. `app/api/build/android/route.ts` - 2 calls
4. `app/api/build/ios/route.ts` - 2 calls
5. `app/api/projects/[id]/domain/verify/route.ts` - 3 calls
6. `app/api/proxy/keys/route.ts` - 6 calls
7. `app/api/proxy/db/route.ts` - 13 calls
8. `app/api/proxy/storage/route.ts` - 6 calls
9. `app/api/proxy/auth/route.ts` - 23 calls ⚠️ (largest file)

### Additional Tasks:
- Update Zustand stores to use Supabase Realtime
- Update React hooks to use Supabase queries
- Test full application functionality
- Push changes to all three branches (main, staging, development)

## Conversion Patterns
Common replacements needed:

### Pattern 1: Simple user lookup
```typescript
// Before:
const user = await prisma.user.findUnique({ where: { id: uid } });

// After:
const supabase = await createClient();
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', uid)
  .single();
```

### Pattern 2: User update
```typescript
// Before:
await prisma.user.update({
  where: { id: uid },
  data: { field: value }
});

// After:
await supabase
  .from('users')
  .update({ field: value })
  .eq('id', uid);
```

### Pattern 3: Create record
```typescript
// Before:
await prisma.table.create({
  data: { ...data }
});

// After:
await supabase
  .from('table')
  .insert({ ...data });
```

### Field Name Mapping:
- `codeFiles` → `code_files`
- `appConfig` → `app_config`
- `userId` → `user_id`
- `projectId` → `project_id`
- `customDomain` → `custom_domain`
- `domainVerified` → `domain_verified`
- `githubTokenEncrypted` → `github_token_encrypted`
- `stripeCustomerId` → `stripe_customer_id`
- `totalCreditsUsed` → `total_credits_used`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`

## Database Schema
All tables use snake_case field names in Supabase while TypeScript types preserve camelCase for compatibility.
