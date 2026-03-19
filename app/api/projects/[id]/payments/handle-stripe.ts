import { NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  });
}

export async function handleStripe(
  projectId: string,
  type: string,
  page: number,
  limit: number,
  search: string,
): Promise<NextResponse> {
  const stripe = getStripe();

  switch (type) {
    case "overview": {
      const charges = await stripe.charges.list({
        limit: 100,
      });

      const projectCharges = charges.data.filter(
        (c) => c.metadata?.projectId === projectId,
      );

      const totalRevenue = projectCharges
        .filter((c) => c.status === "succeeded")
        .reduce((sum, c) => sum + c.amount, 0);

      const customers = new Set(
        projectCharges.map((c) => c.customer).filter(Boolean),
      );

      return NextResponse.json({
        platform: "stripe",
        overview: {
          totalRevenue: totalRevenue / 100, // cents to dollars
          totalTransactions: projectCharges.length,
          successfulTransactions: projectCharges.filter(
            (c) => c.status === "succeeded",
          ).length,
          uniqueCustomers: customers.size,
          currency: "usd",
        },
        dashboardUrl: "https://dashboard.stripe.com",
      });
    }

    case "transactions": {
      const charges = await stripe.charges.list({
        limit: 100,
      });

      let projectCharges = charges.data.filter(
        (c) => c.metadata?.projectId === projectId,
      );

      if (search) {
        const s = search.toLowerCase();
        projectCharges = projectCharges.filter(
          (c) =>
            (c.billing_details?.email || "").toLowerCase().includes(s) ||
            (c.billing_details?.name || "").toLowerCase().includes(s) ||
            c.id.toLowerCase().includes(s),
        );
      }

      const total = projectCharges.length;
      const offset = (page - 1) * limit;
      const paginated = projectCharges.slice(offset, offset + limit);

      const transactions = paginated.map((c) => ({
        id: c.id,
        type: "charge",
        amount: c.amount / 100,
        currency: c.currency,
        status: c.status,
        customerEmail: c.billing_details?.email || null,
        customerName: c.billing_details?.name || null,
        description: c.description,
        createdAt: new Date(c.created * 1000).toISOString(),
        receiptUrl: c.receipt_url,
      }));

      return NextResponse.json({
        platform: "stripe",
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    case "subscribers": {
      const customers = await stripe.customers.list({
        limit: 100,
      });

      let projectCustomers = customers.data.filter(
        (c) => c.metadata?.projectId === projectId,
      );

      if (search) {
        const s = search.toLowerCase();
        projectCustomers = projectCustomers.filter(
          (c) =>
            (c.email || "").toLowerCase().includes(s) ||
            (c.name || "").toLowerCase().includes(s),
        );
      }

      const total = projectCustomers.length;
      const offset = (page - 1) * limit;
      const paginated = projectCustomers.slice(offset, offset + limit);

      const subscribers = paginated.map((c) => ({
        id: c.id,
        email: c.email,
        name: c.name,
        createdAt: new Date(c.created * 1000).toISOString(),
        metadata: c.metadata,
      }));

      return NextResponse.json({
        platform: "stripe",
        subscribers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    case "products": {
      const products = await stripe.products.list({
        limit: 100,
        active: true,
      });

      const projectProducts = products.data.filter(
        (p) => p.metadata?.projectId === projectId,
      );

      const result = await Promise.all(
        projectProducts.map(async (p) => {
          const prices = await stripe.prices.list({
            product: p.id,
            active: true,
            limit: 10,
          });
          return {
            id: p.id,
            name: p.name,
            description: p.description,
            type: prices.data[0]?.recurring ? "subscription" : "one_time",
            prices: prices.data.map((pr) => ({
              id: pr.id,
              amount: (pr.unit_amount || 0) / 100,
              currency: pr.currency,
              interval: pr.recurring?.interval || null,
            })),
            images: p.images,
            active: p.active,
          };
        }),
      );

      return NextResponse.json({
        platform: "stripe",
        products: result,
      });
    }

    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
}
