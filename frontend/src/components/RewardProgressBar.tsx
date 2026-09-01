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
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 rounded-2xl border border-amber-500/30 p-6 shadow-xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              {isUnlocked ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
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
          <span className="text-xl font-bold text-amber-300">
            {qualifiedCount} <span className="text-sm text-slate-500">/ {targetCount}</span>
          </span>
          <span className="text-[11px] text-amber-400/80 mt-0.5">
            {remaining > 0 ? `${remaining} more qualified referrals needed` : 'Milestone completed!'}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span className="text-slate-400">Referral Progress</span>
          <span className="text-amber-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isUnlocked || progressPercent >= 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                : 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-sm shadow-amber-500/50'
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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            Invite Friends <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
