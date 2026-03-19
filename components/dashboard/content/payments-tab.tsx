"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Loader2,
  Inbox,
  CreditCard,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Users,
  Shield,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentsTabProps {
  projectId: string;
  paymentPlatform: "revenuecat" | "stripe" | null;
}

export function PaymentsTab({ projectId, paymentPlatform }: PaymentsTabProps) {
  const [paymentsOverview, setPaymentsOverview] = useState<any>(null);
  const [paymentsTransactions, setPaymentsTransactions] = useState<any[]>([]);
  const [paymentsSubscribers, setPaymentsSubscribers] = useState<any[]>([]);
  const [paymentsProducts, setPaymentsProducts] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsTab, setPaymentsTab] = useState<"overview" | "transactions" | "subscribers" | "products">("overview");
  const [paymentsPagination, setPaymentsPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [paymentsSearch, setPaymentsSearch] = useState("");

  const fetchPayments = useCallback(
    async (type: string, page = 1) => {
      if (!projectId) return;
      setPaymentsLoading(true);
      try {
        const params = new URLSearchParams({ type, page: String(page), limit: "20" });
        if (paymentsSearch) params.set("search", paymentsSearch);
        const res = await fetch(`/api/projects/${projectId}/payments?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (type === "overview") setPaymentsOverview(data);
          else if (type === "transactions") {
            setPaymentsTransactions(data.transactions || []);
            setPaymentsPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
          } else if (type === "subscribers") {
            setPaymentsSubscribers(data.subscribers || []);
            setPaymentsPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
          } else if (type === "products") {
            setPaymentsProducts(data.products || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setPaymentsLoading(false);
      }
    },
    [projectId, paymentsSearch],
  );

  return (
    <div className="liquid-glass-card rounded-xl overflow-hidden">
      {/* Sub-nav */}
      <div className="flex items-center gap-1 p-3 border-b border-white/10">
        {(["overview", "transactions", "subscribers", "products"] as const).map((tab) => (
          <button key={tab} onClick={() => { setPaymentsTab(tab); fetchPayments(tab); }}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize", paymentsTab === tab ? "bg-violet-500/15 text-violet-400" : "text-slate-500 hover:bg-white/5")}>
            {tab}
          </button>
        ))}
        <div className="flex-1" />
        <Badge variant="outline" className="text-[10px] gap-1">{paymentPlatform === "revenuecat" ? "RevenueCat" : "Stripe"}</Badge>
        {(paymentsTab === "transactions" || paymentsTab === "subscribers") && (
          <Input placeholder="Search..." value={paymentsSearch} onChange={(e) => setPaymentsSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") fetchPayments(paymentsTab); }} className="w-48 h-7 text-xs" />
        )}
        <Button size="sm" variant="ghost" onClick={() => fetchPayments(paymentsTab)} className="h-7 w-7 p-0">
          <RefreshCw className={cn("h-3.5 w-3.5", paymentsLoading && "animate-spin")} />
        </Button>
      </div>

      {paymentsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      ) : paymentsTab === "overview" ? (
        <div className="p-4 space-y-4">
          {paymentsOverview ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {paymentPlatform === "stripe" ? (
                  <>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><DollarSign className="h-3.5 w-3.5" />Total Revenue</div>
                      <p className="text-xl font-bold text-white">${(paymentsOverview.overview?.totalRevenue || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><TrendingUp className="h-3.5 w-3.5" />Transactions</div>
                      <p className="text-xl font-bold text-white">{paymentsOverview.overview?.totalTransactions || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><CheckCircle2 className="h-3.5 w-3.5" />Successful</div>
                      <p className="text-xl font-bold text-green-400">{paymentsOverview.overview?.successfulTransactions || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><Users className="h-3.5 w-3.5" />Customers</div>
                      <p className="text-xl font-bold text-white">{paymentsOverview.overview?.uniqueCustomers || 0}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><CreditCard className="h-3.5 w-3.5" />Subscriptions</div>
                      <p className="text-xl font-bold text-white">{paymentsOverview.overview?.totalSubscriptions || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><TrendingUp className="h-3.5 w-3.5" />Purchases</div>
                      <p className="text-xl font-bold text-white">{paymentsOverview.overview?.totalPurchases || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><CheckCircle2 className="h-3.5 w-3.5" />Active Entitlements</div>
                      <p className="text-xl font-bold text-green-400">{paymentsOverview.overview?.activeEntitlements || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><Shield className="h-3.5 w-3.5" />Total Entitlements</div>
                      <p className="text-xl font-bold text-white">{paymentsOverview.overview?.totalEntitlements || 0}</p>
                    </div>
                  </>
                )}
              </div>
              {paymentsOverview.dashboardUrl && (
                <a href={paymentsOverview.dashboardUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:underline">
                  <ExternalLink className="h-3 w-3" />Open {paymentPlatform === "revenuecat" ? "RevenueCat" : "Stripe"} Dashboard
                </a>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <CreditCard className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No payment data yet</p>
              <p className="text-xs mt-1">Click refresh to load payment overview</p>
            </div>
          )}
        </div>
      ) : paymentsTab === "transactions" ? (
        <div>
          {paymentsTransactions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-4 py-2 font-medium text-slate-500">Date</th>
                      <th className="px-4 py-2 font-medium text-slate-500">{paymentPlatform === "stripe" ? "Customer" : "Product"}</th>
                      {paymentPlatform === "stripe" && <th className="px-4 py-2 font-medium text-slate-500">Amount</th>}
                      <th className="px-4 py-2 font-medium text-slate-500">Type</th>
                      <th className="px-4 py-2 font-medium text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsTransactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 text-slate-300">{new Date(txn.createdAt || txn.purchaseDate || "").toLocaleDateString()}</td>
                        <td className="px-4 py-2.5 text-white font-medium">{paymentPlatform === "stripe" ? txn.customerEmail || txn.customerName || "\u2014" : txn.productId || "\u2014"}</td>
                        {paymentPlatform === "stripe" && <td className="px-4 py-2.5 text-white font-mono">${(txn.amount || 0).toFixed(2)} <span className="text-slate-500 uppercase">{txn.currency}</span></td>}
                        <td className="px-4 py-2.5"><Badge variant="outline" className="text-[10px]">{txn.type}</Badge></td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className={cn("text-[10px]",
                            txn.status === "succeeded" || txn.status === "completed" || txn.status === "active" ? "bg-green-400/10 text-green-400 border-green-500/20" :
                            txn.status === "pending" ? "bg-yellow-400/10 text-yellow-400 border-yellow-500/20" :
                            txn.status === "failed" ? "bg-red-400/10 text-red-400 border-red-500/20" :
                            txn.status === "expired" ? "bg-orange-400/10 text-orange-400 border-orange-500/20" : ""
                          )}>{txn.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {paymentsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-white/10">
                  <span className="text-xs text-slate-500">{paymentsPagination.total} transactions</span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" disabled={paymentsPagination.page <= 1} onClick={() => fetchPayments("transactions", paymentsPagination.page - 1)} className="h-7 w-7 p-0">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs text-slate-500">{paymentsPagination.page} / {paymentsPagination.totalPages}</span>
                    <Button size="sm" variant="ghost" disabled={paymentsPagination.page >= paymentsPagination.totalPages} onClick={() => fetchPayments("transactions", paymentsPagination.page + 1)} className="h-7 w-7 p-0">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Inbox className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No transactions found</p>
              <p className="text-xs mt-1">Transactions will appear here once payments are processed</p>
            </div>
          )}
        </div>
      ) : paymentsTab === "subscribers" ? (
        <div>
          {paymentsSubscribers.length > 0 ? (
            <div className="divide-y divide-white/5">
              {paymentsSubscribers.map((sub) => (
                <div key={sub.id} className="p-4 hover:bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{sub.email || sub.name || sub.id}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {paymentPlatform === "stripe" ? `Customer since ${new Date(sub.createdAt).toLocaleDateString()}` : `First seen: ${sub.firstSeen ? new Date(sub.firstSeen).toLocaleDateString() : "\u2014"}`}
                      </p>
                    </div>
                    {sub.entitlements && sub.entitlements.length > 0 && (
                      <div className="flex gap-1.5">
                        {sub.entitlements.map((ent: any, i: number) => (
                          <Badge key={i} variant="outline" className={cn("text-[10px]", ent.isActive ? "bg-green-400/10 text-green-400 border-green-500/20" : "bg-slate-400/10 text-slate-500 border-slate-500/20")}>{ent.name}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {sub.subscriptions && sub.subscriptions.length > 0 && (
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {sub.subscriptions.map((prodId: string) => (<Badge key={prodId} variant="secondary" className="text-[10px]">{prodId}</Badge>))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Users className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No subscribers found</p>
              <p className="text-xs mt-1">Subscribers will appear here once users make purchases</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          {paymentsProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
              {paymentsProducts.map((prod) => (
                <div key={prod.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white">{prod.name}</p>
                    <Badge variant="outline" className="text-[10px]">{prod.type === "subscription" ? "Subscription" : "One-time"}</Badge>
                  </div>
                  {prod.description && <p className="text-xs text-slate-500 mb-2">{prod.description}</p>}
                  {prod.prices && prod.prices.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {prod.prices.map((price: any) => (<span key={price.id} className="text-xs font-mono text-violet-400">${price.amount} {price.interval ? `/ ${price.interval}` : ""}</span>))}
                    </div>
                  )}
                  {prod.store && <p className="text-[10px] text-slate-500 mt-2">Store: {prod.store}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <CreditCard className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No products found</p>
              <p className="text-xs mt-1">Products defined in {paymentPlatform === "revenuecat" ? "App Store / Google Play" : "Stripe"} will appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
