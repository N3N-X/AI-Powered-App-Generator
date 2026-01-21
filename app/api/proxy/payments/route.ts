import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { validateApiKey } from "@/lib/proxy";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

interface PaymentOperation {
  operation:
    | "createCheckout"
    | "createSubscription"
    | "createPaymentIntent"
    | "getProducts"
    | "getCustomer"
    | "createCustomer";
  // createCheckout
  items?: { name: string; price: number; quantity: number }[];
  successUrl?: string;
  cancelUrl?: string;
  // createSubscription
  priceId?: string;
  customerId?: string;
  // createPaymentIntent
  amount?: number;
  currency?: string;
  // createCustomer
  email?: string;
  name?: string;
  metadata?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get("X-RUX-API-Key");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const validation = await validateApiKey(apiKey);
    if (!validation.valid) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Check if PAYMENTS service is enabled for this key
    if (!validation.apiKey?.services?.includes("PAYMENTS")) {
      return NextResponse.json(
        { error: "Payments service not enabled for this API key" },
        { status: 403 },
      );
    }

    const projectId = validation.apiKey.projectId;

    const body: PaymentOperation = await request.json();
    const { operation } = body;

    switch (operation) {
      case "createCheckout": {
        const { items, successUrl, cancelUrl } = body;

        if (!items || !successUrl || !cancelUrl) {
          return NextResponse.json(
            { error: "Missing required fields: items, successUrl, cancelUrl" },
            { status: 400 },
          );
        }

        const lineItems = items.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
            },
            unit_amount: Math.round(item.price * 100), // Convert to cents
          },
          quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: lineItems,
          mode: "payment",
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            projectId,
          },
        });

        return NextResponse.json({
          success: true,
          sessionId: session.id,
          url: session.url,
        });
      }

      case "createSubscription": {
        const { priceId, customerId } = body;

        if (!priceId) {
          return NextResponse.json(
            { error: "Missing required field: priceId" },
            { status: 400 },
          );
        }

        // Create checkout session for subscription
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url:
            body.successUrl || `${request.headers.get("origin")}/success`,
          cancel_url:
            body.cancelUrl || `${request.headers.get("origin")}/cancel`,
          customer: customerId,
          metadata: {
            projectId,
          },
        });

        return NextResponse.json({
          success: true,
          sessionId: session.id,
          url: session.url,
        });
      }

      case "createPaymentIntent": {
        const { amount, currency = "usd" } = body;

        if (!amount) {
          return NextResponse.json(
            { error: "Missing required field: amount" },
            { status: 400 },
          );
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          metadata: {
            projectId,
          },
        });

        return NextResponse.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        });
      }

      case "getProducts": {
        const products = await stripe.products.list({
          active: true,
          limit: 100,
        });

        const prices = await stripe.prices.list({
          active: true,
          limit: 100,
        });

        // Combine products with their prices
        const productsWithPrices = products.data.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          prices: prices.data
            .filter((price) => price.product === product.id)
            .map((price) => ({
              id: price.id,
              unitAmount: price.unit_amount,
              currency: price.currency,
              recurring: price.recurring,
            })),
        }));

        return NextResponse.json({
          success: true,
          products: productsWithPrices,
        });
      }

      case "createCustomer": {
        const { email, name, metadata } = body;

        if (!email) {
          return NextResponse.json(
            { error: "Missing required field: email" },
            { status: 400 },
          );
        }

        const customer = await stripe.customers.create({
          email,
          name,
          metadata: {
            ...metadata,
            projectId,
          },
        });

        return NextResponse.json({
          success: true,
          customerId: customer.id,
        });
      }

      case "getCustomer": {
        const { customerId } = body;

        if (!customerId) {
          return NextResponse.json(
            { error: "Missing required field: customerId" },
            { status: 400 },
          );
        }

        const customer = await stripe.customers.retrieve(customerId);

        return NextResponse.json({
          success: true,
          customer,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Payments proxy error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Payment operation failed" },
      { status: 500 },
    );
  }
}
