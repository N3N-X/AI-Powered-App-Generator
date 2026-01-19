import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, PlanType, isStripeConfigured } from "@/lib/stripe";
import prisma from "@/lib/db";

/**
 * @swagger
 * /api/stripe/checkout:
 *   post:
 *     summary: Create Stripe checkout session
 *     description: Creates a Stripe checkout session for subscription to a plan (PRO or ELITE). Requires authentication and valid Stripe configuration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [PRO, ELITE]
 *                 description: The plan to subscribe to
 *             required:
 *               - plan
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
 *         description: Invalid plan or missing configuration
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
            "Stripe is not configured. Please add STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID, and STRIPE_ELITE_PRICE_ID to your environment variables.",
        },
        { status: 503 },
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();

    if (!plan || !["PRO", "ELITE"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planConfig = PLANS[plan as PlanType];
    if (!planConfig.priceId) {
      return NextResponse.json(
        {
          error: `Price ID for ${plan} plan is not configured. Please set STRIPE_${plan}_PRICE_ID in your environment.`,
        },
        { status: 400 },
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
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
          clerkId: userId,
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

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?success=true&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?canceled=true`,
      metadata: {
        userId: user.id,
        clerkId: userId,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          clerkId: userId,
          plan: plan,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create checkout session";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
