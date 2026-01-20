#!/bin/bash

echo "🧹 Removing Clerk path environment variables..."

for env in production preview development; do
  echo "Removing from $env..."
  npx vercel env rm NEXT_PUBLIC_CLERK_SIGN_IN_URL $env -y 2>/dev/null || true
  npx vercel env rm NEXT_PUBLIC_CLERK_SIGN_UP_URL $env -y 2>/dev/null || true
  npx vercel env rm NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL $env -y 2>/dev/null || true
  npx vercel env rm NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL $env -y 2>/dev/null || true
done

echo ""
echo "✅ Clerk path variables removed!"
echo ""
echo "Clerk will now use Account Portal (accounts.rux.sh) for authentication"

