#!/bin/bash

# Migration script to replace Prisma with Supabase across all files

echo "🔄 Migrating from Prisma to Supabase..."
echo ""

# Find all TypeScript files that import prisma
FILES=$(grep -rl "import.*prisma.*from.*@/lib/db" app lib --include="*.ts" --include="*.tsx" 2>/dev/null)

if [ -z "$FILES" ]; then
  echo "✅ No Prisma imports found!"
  exit 0
fi

echo "📝 Found $(echo "$FILES" | wc -l | tr -d ' ') files to update"
echo ""

# Replace imports
echo "1️⃣  Replacing Prisma imports..."
echo "$FILES" | while read file; do
  # Replace prisma import with supabase db helpers
  sed -i '' 's/import prisma from "@\/lib\/db";/import { createClient } from "@\/lib\/supabase\/server";/g' "$file"
  sed -i '' 's/import { PrismaClient } from "@prisma\/client";/import type { Database } from "@\/lib\/supabase\/types";/g' "$file"
  sed -i '' 's/import { Prisma } from "@prisma\/client";/import type { Database } from "@\/lib\/supabase\/types";/g' "$file"

  echo "  ✓ $file"
done

# Replace Prisma Client usages with Supabase
echo ""
echo "2️⃣  Replacing Prisma Client calls (manual review needed)..."
echo "   Note: Complex queries need manual migration"
echo ""

# Replace enum imports
echo "3️⃣  Replacing Prisma enum imports..."
find app lib -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's/import { ProxyService } from "@prisma\/client";/import type { ProxyService } from "@\/lib\/supabase\/types";/g' \
  -e 's/import { Plan } from "@prisma\/client";/import type { Plan } from "@\/lib\/supabase\/types";/g' \
  -e 's/import { Platform } from "@prisma\/client";/import type { Platform } from "@\/lib\/supabase\/types";/g' \
  -e 's/import { BuildStatus } from "@prisma\/client";/import type { BuildStatus } from "@\/lib\/supabase\/types";/g' \
  {} \;

echo ""
echo "✅ Basic migration complete!"
echo ""
echo "⚠️  Manual steps required:"
echo "   1. Update complex Prisma queries to Supabase syntax"
echo "   2. Replace prisma.table.findUnique() with supabase.from('table').select()"
echo "   3. Replace prisma.table.create() with supabase.from('table').insert()"
echo "   4. Update transaction logic"
echo ""
echo "📖 See lib/supabase/db.ts for helper functions"
