import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/db";
import Stripe from "stripe";

/**
 * @swagger
 * /api/stripe/webhook:
 *   post:
 *     summary: Handle Stripe webhook events
 *     description: Processes incoming Stripe webhook events to update user subscriptions, payment statuses, and plan changes. Verifies webhook signature and handles events like checkout completion, subscription updates, deletions, and payment failures.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw Stripe webhook event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *       400:
 *         description: Invalid signature or missing signature
 *       503:
 *         description: Stripe or webhook secret not configured
 *       500:
 *         description: Webhook handler failed
 */
export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, plan } = session.metadata || {};

        if (userId && plan) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: plan as "FREE" | "PRO" | "ELITE",
              stripeSubscriptionId: session.subscription as string,
            },
          });
          console.log(`User ${userId} upgraded to ${plan}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const { userId, plan } = subscription.metadata || {};

        if (userId) {
          // Check if subscription is active
          const isActive = ["active", "trialing"].includes(subscription.status);

          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: isActive ? (plan as "FREE" | "PRO" | "ELITE") : "FREE",
              stripeSubscriptionId: subscription.id,
            },
          });
          console.log(
            `Subscription updated for user ${userId}: ${subscription.status}`,
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const { userId } = subscription.metadata || {};

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: "FREE",
              stripeSubscriptionId: null,
            },
          });
          console.log(
            `User ${userId} subscription cancelled, downgraded to FREE`,
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId && stripe) {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          const { userId } = subscription.metadata || {};

          if (userId) {
            // Optionally notify user or take action
            console.log(`Payment failed for user ${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
