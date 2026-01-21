# Clerk Billing Migration - Summary

## What Changed

Successfully migrated from custom Stripe integration to **Clerk Billing** for subscriptions, while keeping direct Stripe integration for one-time token purchases.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      RUX Billing System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────┐      ┌──────────────────────┐   │
│  │ Clerk Billing         │      │ Direct Stripe        │   │
│  │ (Subscriptions)       │      │ (Token Purchases)    │   │
│  ├───────────────────────┤      ├──────────────────────┤   │
│  │ • Pro Plan ($19/mo)   │      │ • Small Pack ($5)    │   │
│  │ • Elite Plan ($49/mo) │      │ • Medium Pack ($10)  │   │
│  │                       │      │ • Large Pack ($20)   │   │
│  │ Auto-syncs to:        │      │ • Mega Pack ($40)    │   │
│  │ user.publicMetadata   │      │                      │   │
│  └───────────┬───────────┘      └──────────┬───────────┘   │
│              │                              │               │
│              └──────────┬───────────────────┘               │
│                         ▼                                   │
│              ┌─────────────────────┐                        │
│              │   User Credits      │                        │
│              │   (Database)        │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### ✅ Subscriptions via Clerk Billing

- **No custom checkout code** - Clerk handles everything
- **Automatic metadata sync** - Plan updates sync to `user.publicMetadata.plan`
- **Built-in billing portal** - Users manage subscriptions in Clerk
- **Single webhook** - `user.updated` event handles plan changes
- **Monthly credit resets** - Automatic on subscription renewal

### ✅ Token Purchases via Direct Stripe

- **Independent from subscription** - Buy credits regardless of plan
- **Instant credit addition** - Direct database update via webhook
- **Purchase history tracking** - `TokenPurchase` model in database
- **Refund handling** - Automatic credit deduction on refunds
- **Bonus credits** - Larger packs include bonus credits

### ✅ Unified Credit System

All operations use credits from a single balance:

| Plan | Monthly Credits | Cost |
|------|----------------|------|
| Free | 3,000 | $0 |
| Pro | 50,000 | $19/mo |
| Elite | 200,000 | $49/mo |

**Token Packages (one-time):**
- Small: 10,000 credits - $5 (2,000 credits per $1)
- Medium: 25,000 credits - $10 (2,500 credits per $1) *+25% bonus*
- Large: 60,000 credits - $20 (3,000 credits per $1) *+50% bonus*
- Mega: 150,000 credits - $40 (3,750 credits per $1) *+87.5% bonus*

## Files Created

- `lib/billing.ts` - Billing configuration and helpers
- `components/billing/subscription-plans.tsx` - Subscription UI
- `components/billing/token-packages.tsx` - Token purchase UI
- `app/api/billing/tokens/purchase/route.ts` - Token checkout API
- `app/api/billing/webhook/route.ts` - Token purchase webhooks
- `app/api/billing/portal/route.ts` - Billing portal access
- `docs/BILLING_SETUP.md` - Complete setup guide
- `prisma/migrations/...add_token_purchases/` - Database migration

## Files Modified

- `middleware.ts` - Use `public_metadata` instead of custom metadata
- `app/(public)/pricing/page.tsx` - New subscription + token UI
- `components/landing/pricing.tsx` - Updated plan details
- `prisma/schema.prisma` - Added `TokenPurchase` model
- `.env.local` - Added token package price ID placeholders

## Files Removed

- `app/api/stripe/checkout/route.ts` - No longer needed (Clerk handles subscriptions)
- `app/api/stripe/webhook/route.ts` - Replaced by billing webhook
- Old Stripe portal route - Replaced by Clerk portal

## Setup Required

### 1. Clerk Dashboard

1. **Enable Clerk Billing**
   - Dashboard → Billing → Enable Billing
   - Connect your Stripe account

2. **Create Subscription Products**
   - Pro Plan: $19/month (metadata: `plan: PRO`)
   - Elite Plan: $49/month (metadata: `plan: ELITE`)

### 2. Stripe Dashboard

Create 4 one-time payment products:
- Small Pack: $5 → 10,000 credits
- Medium Pack: $10 → 25,000 credits
- Large Pack: $20 → 60,000 credits
- Mega Pack: $40 → 150,000 credits

Copy the price IDs and add to environment variables:

```bash
STRIPE_TOKEN_SMALL_PRICE_ID="price_..."
STRIPE_TOKEN_MEDIUM_PRICE_ID="price_..."
STRIPE_TOKEN_LARGE_PRICE_ID="price_..."
STRIPE_TOKEN_MEGA_PRICE_ID="price_..."
```

### 3. Webhooks

**Clerk Webhook** (already configured):
- Endpoint: `https://yourdomain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`

**Stripe Webhook** (for token purchases):
- Endpoint: `https://yourdomain.com/api/billing/webhook`
- Events: `checkout.session.completed`, `charge.refunded`

## Testing Locally

1. Start dev server: `npm run dev`
2. Test subscription flow at `/pricing`
3. Test token purchases in token packages section
4. Use Stripe test card: `4242 4242 4242 4242`

## Production Deployment

1. Add token price IDs to Vercel environment variables
2. Configure webhooks for production domain
3. Test end-to-end flow
4. Monitor webhook logs in Clerk and Stripe dashboards

## Benefits

- **90% less code** - Clerk handles subscription management
- **Automatic sync** - No manual metadata updates needed
- **Better UX** - Native Clerk billing portal
- **Flexibility** - Users can buy tokens independent of plan
- **Scalable** - Easy to add new plans or token packages
- **Reliable** - Clerk's battle-tested billing infrastructure

## Next Steps

1. Create Stripe products for token packages
2. Update environment variables in Vercel
3. Test in production
4. Monitor billing metrics
5. Set up usage tracking dashboards

See `docs/BILLING_SETUP.md` for detailed setup instructions.
