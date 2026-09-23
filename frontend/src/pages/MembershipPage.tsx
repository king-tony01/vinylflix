import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import {
  Check,
  Sparkles,
  Lock,
} from 'lucide-react';

export const MembershipPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    const res = await apiRequest('/memberships/plans');
    if (res.success && res.data) {
      const plansList = Array.isArray(res.data) ? res.data : res.data.plans || [];
      setPlans(plansList);
    }
    setLoading(false);
  };

  // 1. Verify Payment if redirected back from Paystack
  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (reference) {
      const verifyCheckout = async () => {
        setLoading(true);
        const res = await apiRequest(`/payments/verify/${encodeURIComponent(reference)}`);
        if (res.success && res.data?.status === 'SETTLED') {
          toast.success('🎉 Payment confirmed! Your membership tier has been successfully upgraded.');
          await refreshUser();
        } else {
          toast.warning('Payment verification is pending or was cancelled.');
        }
        setLoading(false);
      };
      verifyCheckout();
    }
    fetchPlans();
  }, [searchParams]);

  const handlePurchase = async (plan: any) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setPurchasingPlanId(plan.id);

    // 1. Initialize real payment gateway checkout
    const initRes = await apiRequest('/memberships/purchase', {
      method: 'POST',
      body: JSON.stringify({
        planId: plan.id,
        callbackUrl: `${window.location.origin}/memberships`,
      }),
    });

    if (initRes.success && initRes.data) {
      const paymentUrl = initRes.data.paymentUrl || initRes.data.payment?.paymentUrl;
      const reference = initRes.data.payment?.reference;

      if (paymentUrl && paymentUrl.startsWith('http')) {
        // Redirect to Paystack Checkout Gateway
        window.location.href = paymentUrl;
        return;
      }

      // If direct settlement in dev
      if (reference) {
        const verifyRes = await apiRequest(`/payments/verify/${encodeURIComponent(reference)}`);
        if (verifyRes.success) {
          toast.success(`Successfully activated ${plan.name}!`);
          await refreshUser();
        }
      }
    } else {
      toast.error(initRes.error?.message || 'Failed to initialize payment checkout.');
    }

    setPurchasingPlanId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Unlock Earning Power & Exclusive Benefits
        </h1>
        <p className="text-sm text-slate-400">
          Choose a membership plan that aligns with your goals. Paid members earn cash rewards on qualifying campaigns and receive locked conditional bonus credits.
        </p>
      </div>


      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-12 text-slate-500 text-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-[#FF0091]" /> Loading membership tiers...
        </div>
      )}

      {/* Plans Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {plans.map((plan) => {
            let benefits: string[] = [];
            try {
              benefits = JSON.parse(plan.benefitsJson);
            } catch {}

            const isCurrentPlan = user?.activeMembership?.planId === plan.id;
            const isFeatured = plan.tier === 'BASIC' || plan.tier === 'PREMIUM';

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 relative ${
                  isFeatured
                    ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-[#360099]/20 border-[#FF0091]/40 shadow-xl shadow-[#FF0091]/5 ring-1 ring-[#FF0091]/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-lg'
                }`}
              >
                {plan.tier === 'BASIC' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF0091] to-[#360099] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md shadow-[#FF0091]/30">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {plan.price === 0 || plan.durationDays >= 365 ? 'Lifetime Access' : `${plan.durationDays} Days`}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">₦{plan.price.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">/{plan.currency}</span>
                  </div>

                  {/* Conditional Reward Highlight */}
                  {plan.conditionalRewardAmount > 0 && (
                    <div className="mt-4 p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-pink-300">
                        <Lock className="w-3.5 h-3.5 text-[#FF0091]" />
                        ₦{plan.conditionalRewardAmount.toLocaleString()} Locked Reward
                      </div>
                      <p className="text-[11px] text-pink-400/80 mt-1">
                        Unlocks to available balance upon {plan.referralRequirementCount} qualified referrals.
                      </p>
                    </div>
                  )}

                  {/* Benefits List */}
                  <div className="mt-6 space-y-3">
                    {benefits.map((b, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-[#FF0091] flex-shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800">
                  {isCurrentPlan ? (
                    <div className="w-full py-2.5 rounded-xl bg-slate-800 text-pink-400 text-xs font-bold text-center border border-pink-500/30 flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4" /> Active Plan
                    </div>
                  ) : plan.price === 0 ? (
                    <div className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold text-center">
                      Default Free Tier
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchase(plan)}
                      disabled={purchasingPlanId === plan.id}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                        isFeatured
                          ? 'bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] text-white shadow-[#FF0091]/20 hover:scale-[1.02] active:scale-[0.98]'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {purchasingPlanId === plan.id ? (
                        'Connecting Gateway...'
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" /> Upgrade
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
