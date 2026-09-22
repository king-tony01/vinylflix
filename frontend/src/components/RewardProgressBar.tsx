import React from 'react';
import { Lock, Unlock, ArrowRight, Sparkles, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RewardProgressBarProps {
  amount: number;
  currency?: string;
  qualifiedCount: number;
  targetCount: number;
  requiredPremiumCount?: number;
  premiumQualifiedCount?: number;
  isUnlocked?: boolean;
}

export const RewardProgressBar: React.FC<RewardProgressBarProps> = ({
  amount,
  currency = 'NGN',
  qualifiedCount,
  targetCount,
  requiredPremiumCount = 0,
  premiumQualifiedCount = 0,
  isUnlocked = false,
}) => {
  const remainingTotal = Math.max(0, targetCount - qualifiedCount);
  const remainingPremium = requiredPremiumCount > 0 ? Math.max(0, requiredPremiumCount - premiumQualifiedCount) : 0;
  
  const totalPercent = Math.min(100, Math.round((qualifiedCount / targetCount) * 100));
  const premiumPercent = requiredPremiumCount > 0 ? Math.min(100, Math.round((premiumQualifiedCount / requiredPremiumCount) * 100)) : 100;
  
  const isSatisfied = remainingTotal === 0 && remainingPremium === 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#360099]/20 rounded-2xl border border-pink-500/30 p-6 shadow-xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#FF0091]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              {isUnlocked ? <Unlock className="w-3 h-3 text-[#FF0091]" /> : <Lock className="w-3 h-3 text-pink-400" />}
              {isUnlocked ? 'UNLOCKED & AVAILABLE' : 'CONDITIONAL MILESTONE BONUS'}
            </span>
          </div>
          <h3 className="text-3xl font-black text-white mt-2 tracking-tight">
            ₦{amount.toLocaleString()} <span className="text-sm font-semibold text-slate-400">{currency}</span>
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-lg">
            {isUnlocked
              ? 'Congratulations! Milestone bonus unlocked. After first withdrawal, you earn ₦1,000 instant available credit for every additional qualified referral!'
              : requiredPremiumCount > 0
              ? `Requires ${targetCount} qualified referrals (including at least ${requiredPremiumCount} Premium members) to unlock.`
              : `Requires ${targetCount} qualified referrals to unlock.`}
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end">
          <span className="text-xs font-semibold text-slate-400">Total Milestone Progress</span>
          <span className="text-xl font-bold text-pink-300">
            {qualifiedCount} <span className="text-sm text-slate-500">/ {targetCount}</span>
          </span>
          <span className="text-[11px] text-pink-400/80 mt-0.5">
            {isSatisfied ? 'Requirements met! Ready for payout' : `${remainingTotal} more referrals required`}
          </span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="mt-5 space-y-4">
        {/* Total Referrals Meter */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-medium">
            <span className="text-slate-400">Total Qualified Referrals ({qualifiedCount}/{targetCount})</span>
            <span className="text-pink-400 font-bold">{totalPercent}%</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isUnlocked || totalPercent >= 100
                  ? 'bg-gradient-to-r from-[#FF0091] to-[#360099] shadow-sm shadow-[#FF0091]/50'
                  : 'bg-gradient-to-r from-pink-500 to-purple-400'
              }`}
              style={{ width: `${totalPercent}%` }}
            />
          </div>
        </div>

        {/* Premium Referrals Meter (for Premium Tier) */}
        {requiredPremiumCount > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-medium">
              <span className="text-amber-300 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> Premium Members Included ({premiumQualifiedCount}/{requiredPremiumCount})
              </span>
              <span className="text-amber-400 font-bold">{premiumPercent}%</span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  premiumPercent >= 100
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600 shadow-sm shadow-amber-500/50'
                    : 'bg-gradient-to-r from-amber-500 to-orange-400'
                }`}
                style={{ width: `${premiumPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Post-Milestone Earning Tag */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <span className="text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#FF0091]" />
          <span>Post-milestone referral bonus: <strong className="text-pink-300">₦1,000</strong> per qualified referral.</span>
        </span>
        {!isUnlocked && (
          <Link
            to="/referrals"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors"
          >
            Invite Friends <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};
