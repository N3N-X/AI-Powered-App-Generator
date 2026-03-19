export const webhooksSection = {
  title: "Webhooks",
  content: `
# Webhooks

Rulxy uses Stripe webhooks for billing events.

## POST /api/billing/webhook

Handles subscription and token purchase events.

### Events
- checkout.session.completed
- invoice.paid
- customer.subscription.updated
- customer.subscription.deleted
    `,
};
