import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import {
  stripe,
  TOKEN_PACKAGES,
  TokenPackageType,
  isStripeConfigured,
} from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

/**
 * @swagger
 * /api/billing/tokens/purchase:
 *   post:
 *     summary: Purchase token credits
 *     description: Creates a Stripe checkout session for one-time token purchase. Works independently from subscription plans.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               package:
 *                 type: string
 *                 enum: [SMALL, MEDIUM, LARGE, MEGA]
 *                 description: The token package to purchase
 *             required:
 *               - package
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL to the Stripe checkout page
 *       400:
 *         description: Invalid package
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       503:
 *         description: Stripe not configured
 *       500:
 *         description: Failed to create checkout session
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe || !isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.",
        },
        { status: 503 },
      );
    }

    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { package: packageType } = await request.json();

    if (
      !packageType ||
      !["SMALL", "MEDIUM", "LARGE", "MEGA"].includes(packageType)
    ) {
      return NextResponse.json(
        { error: "Invalid token package" },
        { status: 400 },
      );
    }

    const tokenPackage = TOKEN_PACKAGES[packageType as TokenPackageType];
    if (!tokenPackage.priceId) {
      return NextResponse.json(
        {
          error: `Price ID for ${packageType} package is not configured. Please set STRIPE_TOKEN_${packageType}_PRICE_ID in your environment.`,
        },
        { status: 400 },
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has a Stripe customer ID
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          id: uid,
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save the customer ID to the database
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment", // One-time payment, not subscription
      payment_method_types: ["card"],
      line_items: [
        {
          price: tokenPackage.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?token_purchase=success&credits=${tokenPackage.credits}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?token_purchase=canceled`,
      metadata: {
        userId: user.id,
        id: uid,
        packageType: packageType,
        credits: tokenPackage.credits.toString(),
        type: "token_purchase",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Token Purchase] Checkout error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create checkout session";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
