import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

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
    const supabase = createAdminClient();

    switch (event.type) {
      // ============================================
      // Token Purchase Events (One-time payments)
      // ============================================

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        // Only process token purchases (ignore subscription checkouts)
        if (metadata.type === "token_purchase") {
          const { userId, credits, packageType } = metadata;

          if (!userId || !credits) {
            console.warn(
              "[Token Purchase Webhook] Missing metadata in token purchase",
            );
            break;
          }

          const creditsToAdd = parseInt(credits);
          const paymentIntentId = session.payment_intent as string;

          // Idempotency guard: check if this payment was already processed
          if (paymentIntentId) {
            const { data: existingPurchase } = await supabase
              .from("token_purchases")
              .select("id")
              .eq("stripe_payment_intent_id", paymentIntentId)
              .single();

            if (existingPurchase) {
              console.log(
                `[Token Purchase Webhook] Duplicate event for ${paymentIntentId}, skipping`,
              );
              break;
            }
          }

          // Record the purchase FIRST (serves as idempotency lock via unique constraint)
          const { error: purchaseError } = await supabase
            .from("token_purchases")
            .insert({
              user_id: userId,
              credits: creditsToAdd,
              amount_paid: session.amount_total || 0,
              currency: session.currency || "usd",
              stripe_payment_intent_id: paymentIntentId,
              status: "completed",
            });

          if (purchaseError) {
            // If unique constraint violation, this is a duplicate
            if (purchaseError.code === "23505") {
              console.log(
                `[Token Purchase Webhook] Duplicate insert for ${paymentIntentId}, skipping`,
              );
              break;
            }
            console.error(
              "[Token Purchase Webhook] Failed to record purchase:",
              purchaseError,
            );
            break;
          }

          // Get current user credits
          const { data: user, error: fetchError } = await supabase
            .from("users")
            .select("credits")
            .eq("id", userId)
            .single();

          if (fetchError || !user) {
            console.error(
              "[Token Purchase Webhook] User not found:",
              fetchError,
            );
            break;
          }

          // Add credits to user account
          const { error: updateError } = await supabase
            .from("users")
            .update({ credits: user.credits + creditsToAdd })
            .eq("id", userId);

          if (updateError) {
            console.error(
              "[Token Purchase Webhook] Failed to update credits:",
              updateError,
            );
            break;
          }

          console.log(
            `[Token Purchase Webhook] ${packageType}: ${creditsToAdd} credits added to user ${userId}`,
          );
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        // Check if this was a token purchase
        const { data: purchase, error: fetchError } = await supabase
          .from("token_purchases")
          .select("*")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .single();

        if (fetchError || !purchase) {
          console.log("[Token Purchase Webhook] No purchase found for refund");
          break;
        }

        if (purchase.status !== "refunded") {
          // Get current user credits
          const { data: user, error: userError } = await supabase
            .from("users")
            .select("credits")
            .eq("id", purchase.user_id)
            .single();

          if (userError || !user) {
            console.error(
              "[Token Purchase Webhook] User not found for refund:",
              userError,
            );
            break;
          }

          // Deduct the credits from user
          const { error: updateError } = await supabase
            .from("users")
            .update({ credits: Math.max(0, user.credits - purchase.credits) })
            .eq("id", purchase.user_id);

          if (updateError) {
            console.error(
              "[Token Purchase Webhook] Failed to deduct credits:",
              updateError,
            );
            break;
          }

          // Mark purchase as refunded
          const { error: refundError } = await supabase
            .from("token_purchases")
            .update({
              status: "refunded",
              refunded_at: new Date().toISOString(),
            })
            .eq("id", purchase.id);

          if (refundError) {
            console.error(
              "[Token Purchase Webhook] Failed to mark purchase as refunded:",
              refundError,
            );
          }

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
