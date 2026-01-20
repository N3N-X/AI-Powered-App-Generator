import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/billing";
import prisma from "@/lib/db";
import Stripe from "stripe";

/**
 * @swagger
 * /api/billing/webhook:
 *   post:
 *     summary: Handle Stripe webhook events for token purchases
 *     description: Handles Stripe webhook events for one-time token purchases only. Subscription billing is handled by Clerk Billing automatically.
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
 *       400:
 *         description: Invalid signature
 *       503:
 *         description: Stripe not configured
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
    console.error(
      "[Token Purchase Webhook] Signature verification failed:",
      error,
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[Token Purchase Webhook] Received: ${event.type}`);

  try {
    switch (event.type) {
      // ============================================
      // Token Purchase Events (One-time payments)
      // Note: Subscription events are handled by Clerk Billing
      // ============================================

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        // Only process token purchases (ignore subscription checkouts)
        if (metadata.type === "token_purchase") {
          const { userId, clerkId, credits, packageType } = metadata;

          if (!userId || !credits) {
            console.warn(
              "[Token Purchase Webhook] Missing metadata in token purchase",
            );
            break;
          }

          const creditsToAdd = parseInt(credits);

          // Add credits to user account
          await prisma.user.update({
            where: { id: userId },
            data: {
              credits: {
                increment: creditsToAdd,
              },
            },
          });

          // Record the purchase
          await prisma.tokenPurchase.create({
            data: {
              userId: userId,
              credits: creditsToAdd,
              amountPaid: session.amount_total || 0,
              currency: session.currency || "usd",
              stripePaymentIntentId: session.payment_intent as string,
              status: "completed",
            },
          });

          console.log(
            `[Token Purchase Webhook] ${packageType}: ${creditsToAdd} credits added to user ${clerkId || userId}`,
          );
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        // Check if this was a token purchase
        const purchase = await prisma.tokenPurchase.findUnique({
          where: { stripePaymentIntentId: paymentIntentId },
        });

        if (purchase && purchase.status !== "refunded") {
          // Deduct the credits from user
          await prisma.user.update({
            where: { id: purchase.userId },
            data: {
              credits: {
                decrement: purchase.credits,
              },
            },
          });

          // Mark purchase as refunded
          await prisma.tokenPurchase.update({
            where: { id: purchase.id },
            data: {
              status: "refunded",
              refundedAt: new Date(),
            },
          });

          console.log(
            `[Token Purchase Webhook] Refunded: ${purchase.credits} credits deducted`,
          );
        }
        break;
      }

      default:
        console.log(
          `[Token Purchase Webhook] Unhandled event type: ${event.type}`,
        );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Token Purchase Webhook] Handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
