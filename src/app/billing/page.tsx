'use client';

import { useState } from 'react';
import Link from 'next/link';
import { theme } from '@/lib/theme';
import { Check } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  color: string;
  priceId: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out RUX',
    priceId: '',
    color: 'from-gray-400 to-gray-500',
    features: [
      '5 app generations per month',
      'Basic platform support (Windows, macOS, Linux)',
      'Community support',
      'Source code download',
      'Access to templates',
    ],
  },
  {
    id: 'pro',
    name: 'PRO',
    price: 29,
    description: 'For serious builders',
    priceId: 'price_1QhZmjIg5vC4cE7iZwXyAbcd',
    color: 'from-blue-400 to-blue-500',
    features: [
      '50 app generations per month',
      'All platform support',
      'Priority email support',
      'Source & executable builds',
      'Advanced templates',
      'Custom styling options',
      'Build logs & debugging',
    ],
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    price: 99,
    description: 'Unlimited power',
    priceId: 'price_1QhZmjIg5vC4cE7iZwUltmte',
    color: 'from-purple-400 to-purple-500',
    features: [
      'Unlimited app generations',
      'All platform support',
      '24/7 priority support',
      'Source & executable builds',
      'All templates & plugins',
      'Custom styling & branding',
      'Build optimization',
      'API access',
      'Team collaboration',
      'Dedicated account manager',
    ],
  },
];

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    if (!priceId) return; // Free plan

    setLoading(priceId);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const { sessionId } = await response.json();
      
      // Redirect to Stripe checkout
      if (sessionId) {
        window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradients.background} text-white relative overflow-hidden`}>
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className={theme.nav.base}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div className={`text-3xl font-bold bg-gradient-to-r ${theme.gradients.primary} bg-clip-text text-transparent`}>
              rux.sh
            </div>
          </Link>
          <Link href="/dashboard" className={theme.buttons.outline}>
            Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto p-6 py-20">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-4 py-2 rounded-full mb-6 border border-white/10">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-300 text-sm font-medium">Simple, Transparent Pricing</span>
          </div>
          <h1 className={`${theme.text.h1} mb-6`}>
            Choose Your Plan
          </h1>
          <p className="text-gray-300 text-xl max-w-2xl mx-auto">
            Scale your app generation with a plan that fits your needs. All plans include access to our powerful AI builder.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative group rounded-3xl border-2 transition-all duration-500 overflow-hidden ${
                plan.id === 'pro'
                  ? `border-blue-500 bg-gradient-to-br from-blue-500/10 to-purple-500/10 scale-105 shadow-2xl shadow-blue-500/30`
                  : `border-white/10 bg-white/5 hover:border-white/20 hover:shadow-2xl`
              }`}
            >
              {/* Card glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${plan.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

              {/* Recommended badge */}
              {plan.id === 'pro' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-1 rounded-full text-sm font-bold shadow-lg">
                    ⭐ Most Popular
                  </span>
                </div>
              )}

              <div className="relative p-8">
                {/* Plan name and price */}
                <div className="mb-8">
                  <h3 className={`text-3xl font-bold mb-2 bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                    {plan.name}
                  </h3>
                  <p className="text-gray-400 mb-6">{plan.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span className="text-gray-400 ml-2">/month</span>
                  </div>
                  {plan.id === 'free' && <p className="text-sm text-gray-500 mt-2">Always free, no credit card needed</p>}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleCheckout(plan.priceId)}
                  disabled={loading !== null}
                  className={`w-full py-3 rounded-xl font-semibold mb-8 transition-all duration-300 ${
                    plan.id === 'pro'
                      ? `bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 disabled:opacity-50`
                      : `bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-105 disabled:opacity-50`
                  }`}
                >
                  {loading === plan.priceId ? 'Processing...' : plan.id === 'free' ? 'Get Started Free' : 'Start 14-Day Trial'}
                </button>

                {/* Features list */}
                <div className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 rounded-3xl border border-white/10 p-12">
          <h2 className={`${theme.text.h2} mb-12 text-center`}>Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-cyan-300 mb-3">Can I upgrade or downgrade?</h3>
              <p className="text-gray-400">
                Yes! You can change your plan anytime. Changes take effect on your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-cyan-300 mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-400">
                We accept all major credit cards via Stripe. Your payment information is secure.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-cyan-300 mb-3">Is there a free trial?</h3>
              <p className="text-gray-400">
                PRO and Ultimate plans include a 14-day free trial. No credit card required to start the Free plan.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-cyan-300 mb-3">What if I cancel?</h3>
              <p className="text-gray-400">
                You can cancel anytime. Your access continues until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
