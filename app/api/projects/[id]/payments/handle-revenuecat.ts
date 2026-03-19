import { NextResponse } from "next/server";

const REVENUECAT_V1_URL = "https://api.revenuecat.com/v1";
const REVENUECAT_SECRET_KEY = process.env.REVENUECAT_SECRET_KEY || "";

async function rcFetch(path: string) {
  const res = await fetch(`${REVENUECAT_V1_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${REVENUECAT_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`RevenueCat API error (${res.status}):`, text);
    return null;
  }
  return res.json();
}

export async function handleRevenueCat(
  projectId: string,
  type: string,
  page: number,
  limit: number,
  search: string,
): Promise<NextResponse> {
  const appUserId = `rux_${projectId}`;

  switch (type) {
    case "overview": {
      const data = await rcFetch(`/subscribers/${appUserId}`);
      const subscriber = data?.subscriber;

      const subscriptions = subscriber?.subscriptions
        ? Object.entries(subscriber.subscriptions)
        : [];
      const nonSubscriptions = subscriber?.non_subscriptions
        ? Object.entries(subscriber.non_subscriptions)
        : [];
      const entitlements = subscriber?.entitlements
        ? Object.entries(subscriber.entitlements)
        : [];

      return NextResponse.json({
        platform: "revenuecat",
        overview: {
          totalSubscriptions: subscriptions.length,
          totalPurchases: nonSubscriptions.reduce(
            (sum, [, txns]) => sum + (Array.isArray(txns) ? txns.length : 0),
            0,
          ),
          activeEntitlements: entitlements.filter(
            ([, e]: [string, any]) =>
              e.expires_date === null || new Date(e.expires_date) > new Date(),
          ).length,
          totalEntitlements: entitlements.length,
          firstSeen: subscriber?.first_seen,
          lastSeen: subscriber?.last_seen,
        },
        dashboardUrl: "https://app.revenuecat.com",
      });
    }

    case "transactions": {
      const data = await rcFetch(`/subscribers/${appUserId}`);
      const subscriber = data?.subscriber;
      if (!subscriber) {
        return NextResponse.json({
          platform: "revenuecat",
          transactions: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }

      const transactions: any[] = [];

      // Subscriptions
      for (const [productId, sub] of Object.entries(
        subscriber.subscriptions || {},
      )) {
        const s = sub as any;
        transactions.push({
          id: `sub_${productId}`,
          type: "subscription",
          productId,
          purchaseDate: s.purchase_date,
          expiresDate: s.expires_date,
          store: s.store,
          isSandbox: s.is_sandbox,
          unsubscribeDetectedAt: s.unsubscribe_detected_at,
          status:
            s.expires_date && new Date(s.expires_date) < new Date()
              ? "expired"
              : "active",
        });
      }

      // Non-subscription purchases
      for (const [productId, purchaseList] of Object.entries(
        subscriber.non_subscriptions || {},
      )) {
        const purchases = purchaseList as any[];
        for (const p of purchases) {
          transactions.push({
            id: p.id || `purchase_${productId}_${p.purchase_date}`,
            type: "purchase",
            productId,
            purchaseDate: p.purchase_date,
            store: p.store,
            isSandbox: p.is_sandbox,
            status: "completed",
          });
        }
      }

      // Sort by date descending
      transactions.sort(
        (a, b) =>
          new Date(b.purchaseDate).getTime() -
          new Date(a.purchaseDate).getTime(),
      );

      // Filter by search
      const filtered = search
        ? transactions.filter(
            (t) =>
              t.productId.toLowerCase().includes(search.toLowerCase()) ||
              t.type.toLowerCase().includes(search.toLowerCase()),
          )
        : transactions;

      const total = filtered.length;
      const offset = (page - 1) * limit;
      const paginated = filtered.slice(offset, offset + limit);

      return NextResponse.json({
        platform: "revenuecat",
        transactions: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    case "subscribers": {
      const data = await rcFetch(`/subscribers/${appUserId}`);
      const subscriber = data?.subscriber;

      const subscribers = subscriber
        ? [
            {
              id: appUserId,
              firstSeen: subscriber.first_seen,
              lastSeen: subscriber.last_seen,
              entitlements: Object.entries(subscriber.entitlements || {}).map(
                ([name, e]: [string, any]) => ({
                  name,
                  isActive:
                    e.expires_date === null ||
                    new Date(e.expires_date) > new Date(),
                  expiresDate: e.expires_date,
                  productId: e.product_identifier,
                  purchaseDate: e.purchase_date,
                }),
              ),
              subscriptions: Object.keys(subscriber.subscriptions || {}),
            },
          ]
        : [];

      return NextResponse.json({
        platform: "revenuecat",
        subscribers,
        pagination: {
          page: 1,
          limit: 20,
          total: subscribers.length,
          totalPages: 1,
        },
      });
    }

    case "products": {
      const data = await rcFetch(`/subscribers/${appUserId}`);
      const subscriber = data?.subscriber;

      const productIds = new Set<string>();
      for (const productId of Object.keys(subscriber?.subscriptions || {})) {
        productIds.add(productId);
      }
      for (const productId of Object.keys(
        subscriber?.non_subscriptions || {},
      )) {
        productIds.add(productId);
      }

      const products = Array.from(productIds).map((id) => ({
        id,
        name: id,
        type: (subscriber?.subscriptions || {})[id]
          ? "subscription"
          : "one_time",
        store: (subscriber?.subscriptions?.[id] as any)?.store || "unknown",
      }));

      return NextResponse.json({
        platform: "revenuecat",
        products,
      });
    }

    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
}
