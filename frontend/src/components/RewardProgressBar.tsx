import React from 'react';
import { Lock, Unlock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RewardProgressBarProps {
  amount: number;
  currency?: string;
  qualifiedCount: number;
  targetCount: number;
  isUnlocked?: boolean;
}

export const RewardProgressBar: React.FC<RewardProgressBarProps> = ({
  amount,
  currency = 'NGN',
  qualifiedCount,
  targetCount,
  isUnlocked = false,
}) => {
  const remaining = Math.max(0, targetCount - qualifiedCount);
  const progressPercent = Math.min(100, Math.round((qualifiedCount / targetCount) * 100));

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#360099]/20 rounded-2xl border border-pink-500/30 p-6 shadow-xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#FF0091]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              {isUnlocked ? <Unlock className="w-3 h-3 text-[#FF0091]" /> : <Lock className="w-3 h-3 text-pink-400" />}
              {isUnlocked ? 'UNLOCKED & WITHDRAWABLE' : 'CONDITIONAL MEMBERSHIP REWARD'}
            </span>
          </div>
          <h3 className="text-3xl font-black text-white mt-2 tracking-tight">
            ₦{amount.toLocaleString()} <span className="text-sm font-semibold text-slate-400">{currency}</span>
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            {isUnlocked
              ? 'Congratulations! Milestone achieved. This conditional reward has been unlocked and transferred to your available balance.'
              : `Unlockable upon referring ${targetCount} qualified members. Currently at ${qualifiedCount} / ${targetCount} referrals.`}
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end">
          <span className="text-xs font-semibold text-slate-400">Milestone Target</span>
          <span className="text-xl font-bold text-pink-300">
            {qualifiedCount} <span className="text-sm text-slate-500">/ {targetCount}</span>
          </span>
          <span className="text-[11px] text-pink-400/80 mt-0.5">
            {remaining > 0 ? `${remaining} more qualified referrals needed` : 'Milestone completed!'}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span className="text-slate-400">Referral Progress</span>
          <span className="text-pink-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isUnlocked || progressPercent >= 100
                ? 'bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] shadow-sm shadow-[#FF0091]/50'
                : 'bg-gradient-to-r from-pink-500 to-purple-400 shadow-sm shadow-pink-500/50'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Action Footer */}
      {!isUnlocked && (
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Qualifies when a referred member completes paid registration.
          </span>
          <Link
            to="/referrals"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors"
          >
            Invite Friends <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
