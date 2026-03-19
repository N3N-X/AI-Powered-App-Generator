import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { stripe, isStripeConfigured } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
  if (limited) return limited;

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

    const supabase = await createClient();

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, stripe_customer_id")
      .eq("id", uid)
      .single();

    if (userError || !user) {
      console.error("Failed to fetch user:", userError);
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

      const { error: updateError } = await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);

      if (updateError) {
        console.error(
          "Failed to update user with Stripe customer ID:",
          updateError,
        );
      }
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
