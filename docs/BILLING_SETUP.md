# Billing Setup Guide

This guide covers setting up Clerk Billing for subscriptions and direct Stripe integration for token purchases.

## Architecture Overview

- **Subscriptions (Pro/Elite Plans)**: Managed entirely by Clerk Billing
- **Token Purchases**: Direct Stripe integration for one-time credit purchases
- **User Credits**: Stored in database, reset monthly for paid plans
- **Plan Sync**: Automatic sync between Clerk metadata and database

## Step 1: Set Up Clerk Billing

### 1.1 Enable Clerk Billing

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Billing** in the sidebar
4. Click **Enable Billing**

### 1.2 Connect Stripe Account

1. In Clerk Billing settings, click **Connect Stripe**
2. Authorize Clerk to access your Stripe account
3. Choose your Stripe account (Test or Live mode)

### 1.3 Create Subscription Products

Create two subscription products in Clerk Dashboard:

**Pro Plan:**
- Name: `Pro`
- Description: `For serious app builders`
- Price: `$19/month`
- Billing Interval: `Monthly`
- Metadata: `plan: PRO`

**Elite Plan:**
- Name: `Elite`
- Description: `Maximum power and flexibility`
- Price: `$49/month`
- Billing Interval: `Monthly`
- Metadata: `plan: ELITE`

### 1.4 Configure Clerk Metadata Sync

Clerk automatically syncs subscription status to `user.publicMetadata.plan`.

Ensure your webhook handler is configured (already done in `/app/api/webhooks/clerk/route.ts`).

## Step 2: Set Up Token Purchases (Direct Stripe)

### 2.1 Create Stripe Products

In your [Stripe Dashboard](https://dashboard.stripe.com), create 4 one-time payment products:

**Small Pack:**
- Product Name: `Small Token Pack`
- Price: `$5` (one-time payment)
- Description: `10,000 credits`

**Medium Pack:**
- Product Name: `Medium Token Pack`
- Price: `$10` (one-time payment)
- Description: `25,000 credits`

**Large Pack:**
- Product Name: `Large Token Pack`
- Price: `$20` (one-time payment)
- Description: `60,000 credits`

**Mega Pack:**
- Product Name: `Mega Token Pack`
- Price: `$40` (one-time payment)
- Description: `150,000 credits`

### 2.2 Get Price IDs

After creating each product, copy the Price ID (starts with `price_`).

### 2.3 Add Price IDs to Environment Variables

Add these to your `.env.local`, `.env.production`, etc.:

```bash
# Token Package Price IDs
STRIPE_TOKEN_SMALL_PRICE_ID="price_xxxxx"
STRIPE_TOKEN_MEDIUM_PRICE_ID="price_xxxxx"
STRIPE_TOKEN_LARGE_PRICE_ID="price_xxxxx"
STRIPE_TOKEN_MEGA_PRICE_ID="price_xxxxx"
```

## Step 3: Configure Webhooks

### 3.1 Clerk Webhooks (Subscriptions)

**Already configured in:** `/app/api/webhooks/clerk/route.ts`

1. Go to Clerk Dashboard → Webhooks
2. Create endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`

When a user subscribes/cancels via Clerk Billing, Clerk automatically updates `user.publicMetadata.plan`, which triggers the `user.updated` webhook.

### 3.2 Stripe Webhooks (Token Purchases)

**Already configured in:** `/app/api/billing/webhook/route.ts`

1. Go to Stripe Dashboard → Developers → Webhooks
2. Create endpoint: `https://yourdomain.com/api/billing/webhook`
3. Subscribe to events:
   - `checkout.session.completed`
   - `charge.refunded`

4. Copy the webhook signing secret and add to environment:

```bash
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
```

## Step 4: Environment Variables

Complete list of required environment variables:

```bash
# Clerk (existing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."  # or sk_live_ for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."  # For token purchase webhooks

# Stripe Token Package Price IDs
STRIPE_TOKEN_SMALL_PRICE_ID="price_..."
STRIPE_TOKEN_MEDIUM_PRICE_ID="price_..."
STRIPE_TOKEN_LARGE_PRICE_ID="price_..."
STRIPE_TOKEN_MEGA_PRICE_ID="price_..."
```

## Step 5: Deploy to Vercel

### 5.1 Add Environment Variables

Add all the above environment variables to Vercel:

```bash
vercel env add STRIPE_TOKEN_SMALL_PRICE_ID
vercel env add STRIPE_TOKEN_MEDIUM_PRICE_ID
vercel env add STRIPE_TOKEN_LARGE_PRICE_ID
vercel env add STRIPE_TOKEN_MEGA_PRICE_ID
```

Or use the Vercel Dashboard → Settings → Environment Variables.

### 5.2 Deploy

```bash
git push origin main
```

Vercel will automatically deploy and run migrations.

## Step 6: Testing

### 6.1 Test Subscription Flow (Clerk Billing)

1. Sign up for a new account
2. Go to `/pricing`
3. Click "Upgrade" on Pro or Elite plan
4. Complete checkout (use Stripe test card: `4242 4242 4242 4242`)
5. Verify:
   - User's plan updated in Clerk metadata
   - Database user record shows correct plan
   - Credits reset to plan amount

### 6.2 Test Token Purchase

1. Sign in to your account
2. Go to `/pricing` and scroll to Token Packages
3. Click "Purchase" on any package
4. Complete checkout (use Stripe test card)
5. Verify:
   - Credits added to account
   - TokenPurchase record created in database

### 6.3 Test Webhooks

Use Stripe CLI to test webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
stripe trigger checkout.session.completed
```

## Credit System

### Monthly Credit Allocation

- **Free**: 3,000 credits/month
- **Pro**: 50,000 credits/month  
- **Elite**: 200,000 credits/month

### Credit Costs (examples)

Defined in `/lib/billing.ts`:

- Small prompt: 10 credits
- Medium prompt: 50 credits
- Large prompt: 200 credits
- Android build: 1,000 credits
- iOS build: 2,000 credits
- Image generation: 100 credits

### Credit Reset

Paid plans reset credits on the 1st of each month. This is handled automatically by Clerk Billing subscription renewal events.

## Troubleshooting

### Subscription not updating plan

1. Check Clerk webhook is receiving events: Clerk Dashboard → Webhooks → Logs
2. Check webhook handler logs: Vercel → Deployments → Functions
3. Verify metadata is set correctly: Clerk Dashboard → Users → User Details

### Token purchase not adding credits

1. Check Stripe webhook is receiving events: Stripe Dashboard → Webhooks → Logs
2. Check webhook signature is valid
3. Verify `STRIPE_WEBHOOK_SECRET` is correct
4. Check database for TokenPurchase record

### Clerk Billing not showing

1. Ensure Billing is enabled in Clerk Dashboard
2. Verify Stripe account is connected
3. Check subscription products are created
4. Make sure user is signed in when accessing billing

## Architecture Decisions

### Why Clerk Billing for Subscriptions?

- **Automatic metadata sync** - Plan info syncs to user.publicMetadata automatically
- **Built-in components** - Pre-built UI for subscription management
- **Simplified webhooks** - Single webhook handler instead of separate Clerk + Stripe
- **User portal** - Clerk provides billing portal out of the box

### Why Direct Stripe for Token Purchases?

- **Flexibility** - Full control over one-time payment flow
- **Independent from subscription** - Users can buy tokens regardless of plan
- **Custom logic** - Ability to add bonus credits, promotions, etc.
- **Direct database updates** - Immediate credit addition without metadata delay

## Next Steps

1. Set up production Stripe account
2. Create production Clerk application
3. Add production environment variables to Vercel
4. Test end-to-end in production
5. Set up monitoring and alerts for failed payments
6. Create customer support documentation

## Support

For issues or questions:
- Clerk Documentation: https://clerk.com/docs
- Stripe Documentation: https://stripe.com/docs
- RUX Support: support@rux.sh
