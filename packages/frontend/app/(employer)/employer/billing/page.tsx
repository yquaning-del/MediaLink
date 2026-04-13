'use client';

import { useEffect, useState } from 'react';
import api, { extractError } from '@/lib/api';
import { MOCK_EMPLOYER_BILLING } from '@/lib/demo';
import { openPaystackModal } from '@/lib/paystack';
import { useAuthStore } from '@/lib/store';
import { useToastStore } from '@/lib/store';

interface BillingInfo {
  subscriptionTier: string;
  subscriptionExpiry?: string;
  paymentHistory: { id: string; type: string; amount: number; status: string; createdAt: string }[];
}

const PLANS = [
  {
    tier: 'BASIC',
    name: 'Basic',
    price: 500,
    features: ['5 active job listings', '50 candidate views/month', 'Standard support'],
    color: 'border-slate-200',
    badge: '',
  },
  {
    tier: 'PREMIUM',
    name: 'Premium',
    price: 1000,
    features: ['20 active job listings', 'Unlimited candidate views', '3 featured listings/month', 'Priority support'],
    color: 'border-[#1B4F72]',
    badge: 'Most Popular',
  },
  {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    price: 2000,
    features: ['Unlimited job listings', 'Unlimited candidate views', 'Dedicated account manager', 'Analytics dashboard', 'API access'],
    color: 'border-amber-400',
    badge: 'Best Value',
  },
];

export default function EmployerBillingPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    api.get('/employers/billing').then(({ data }) => setBilling(data.data)).catch(() => setBilling(MOCK_EMPLOYER_BILLING)).finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (billing?.subscriptionTier === plan.tier) return;
    setSubscribing(plan.tier);
    try {
      const { data } = await api.post('/payments/subscription/initiate', { tier: plan.tier });
      openPaystackModal({
        key: data.data.publicKey,
        email: user?.email ?? '',
        amount: plan.price * 100,
        ref: data.data.reference,
        currency: 'GHS',
        callback: async () => {
          addToast({ type: 'success', title: `Subscribed to ${plan.name} plan!` });
          const res = await api.get('/employers/billing');
          setBilling(res.data.data);
        },
        onClose: () => {},
      });
    } catch (err) {
      addToast({ type: 'error', title: extractError(err) });
    } finally { setSubscribing(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4F72]" />
      </div>
    );
  }

  const currentTier = billing?.subscriptionTier ?? 'FREE';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
        <p className="text-slate-500 mt-1">Manage your MediaLink subscription plan.</p>
      </div>

      {/* Current plan */}
      <div className="bg-[#1B4F72] text-white rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm">Current Plan</p>
            <p className="text-2xl font-bold mt-1">{currentTier}</p>
            {billing?.subscriptionExpiry && (
              <p className="text-blue-200 text-sm mt-1">
                Renews {new Date(billing.subscriptionExpiry).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          {currentTier === 'FREE' && (
            <div className="bg-white/10 rounded-lg px-4 py-2">
              <p className="text-sm font-semibold">Upgrade to unlock more features</p>
            </div>
          )}
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isActive = currentTier === plan.tier;
          return (
            <div key={plan.tier} className={`relative bg-white rounded-xl border-2 ${plan.color} p-5`}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full bg-[#1B4F72] text-white whitespace-nowrap">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <p className="text-3xl font-bold text-[#1B4F72] mt-2">
                GHC {plan.price.toLocaleString()}<span className="text-sm text-slate-500 font-normal">/mo</span>
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isActive || subscribing === plan.tier}
                className={`w-full mt-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-[#1B4F72] text-white hover:bg-[#2E86C1] disabled:opacity-60'
                }`}
              >
                {isActive ? 'Current Plan' : subscribing === plan.tier ? 'Processing...' : 'Subscribe'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment history */}
      {(billing?.paymentHistory?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-3">Payment History</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {billing?.paymentHistory?.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-slate-700">{p.type.replace('_', ' ')}</td>
                    <td className="px-4 py-3 font-semibold">GHC {Number(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'SUCCESS' ? 'bg-green-50 text-green-700' :
                        p.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(p.createdAt).toLocaleDateString('en-GH')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
