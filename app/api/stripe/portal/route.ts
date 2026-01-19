import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import prisma from "@/lib/db";

/**
 * @swagger
 * /api/stripe/portal:
 *   post:
 *     summary: Create billing portal session
 *     description: Creates a Stripe billing portal session for the authenticated user to manage their subscription. Requires Stripe configuration and an existing customer ID.
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
export async function POST(request: NextRequest) {
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

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 400 },
      );
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 },
    );
  }
}
