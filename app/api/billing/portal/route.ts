import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

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
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe || !isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 },
      );
    }

    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has a Stripe customer ID
    let customerId = user.stripe_customer_id;

    // If no customer ID, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          id: uid,
          userId: user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
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
