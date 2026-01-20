import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/billing";
import prisma from "@/lib/db";

/**
 * @swagger
 * /api/billing/portal:
 *   post:
 *     summary: Create billing portal session
 *     description: Creates a Stripe billing portal session for the authenticated user to manage their subscription and view token purchase history. Works with Clerk Billing.
 *     responses:
 *       200:
 *         description: Portal session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL to the Stripe billing portal
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: No billing account found
 *       404:
 *         description: User not found
 *       503:
 *         description: Stripe not configured
 *       500:
 *         description: Failed to create billing portal session
 */
export async function POST(_request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe || !isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 },
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has a Stripe customer ID
    let customerId = user.stripeCustomerId;

    // If no customer ID, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          clerkId: userId,
          userId: user.id,
        },
      });
      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Billing Portal] Error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 },
    );
  }
}
