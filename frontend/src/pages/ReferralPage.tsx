import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { RewardProgressBar } from '../components/RewardProgressBar.js';
import {
  Users,
  Copy,
  Check,
  UserCheck,
  Clock,
  Share2,
} from 'lucide-react';

export const ReferralPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchReferralStats = async () => {
    setLoading(true);
    const res = await apiRequest('/referrals/stats');
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const referralCode = data?.referralCode || user?.referralCode || 'REFCODE';
  const fullReferralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullReferralLink);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          Referral Program & Milestones <Users className="w-6 h-6 text-[#FF0091]" />
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Invite new members to Vinylflix. Server-verified qualified referrals unlock your conditional membership bonus.
        </p>
      </div>

      {loading && (
        <div className="text-center py-2 text-xs text-slate-500 flex items-center justify-center gap-2">
          <Clock className="w-3.5 h-3.5 animate-spin text-[#FF0091]" /> Loading referral statistics...
        </div>
      )}

      {/* Conditional Reward Progress Banner */}
      {data?.stats?.milestone?.hasLockedReward && (
        <RewardProgressBar
          amount={data.stats.milestone.lockedRewardAmount}
          currency={data.stats.milestone.currency}
          qualifiedCount={data.stats.milestone.qualifiedCount}
          targetCount={data.stats.milestone.targetRequirement}
          requiredPremiumCount={data.stats.milestone.requiredPremiumCount}
          premiumQualifiedCount={data.stats.milestone.premiumQualifiedCount}
          isUnlocked={data.stats.milestone.isSatisfied && !data.stats.milestone.hasLockedReward}
        />
      )}

      {/* Creator Info Notice */}
      {data?.stats?.isCreator && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold flex items-center gap-3">
          <Users className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>
            Creator accounts focus on campaign creation and do not accrue new referral commissions. Any earnings accumulated prior to upgrading remain withdrawable in your Wallet.
          </span>
        </div>
      )}

      {/* Share Link & Referral Code Box */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-[#FF0091]" />
              Your Unique Referral Link
            </span>
            <h3 className="text-lg font-bold text-white mt-1">Share & Earn Milestone Rewards</h3>
            <p className="text-xs text-slate-400 mt-1">
              Give your friends your invite link. When they register and activate their membership, they count towards your qualified referral milestones.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 flex-1 text-xs font-mono text-slate-300 truncate">
                {fullReferralLink}
              </div>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-[#FF0091]/25 flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800/80 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-slate-400 font-semibold">Your Referral Code</span>
            <span className="text-3xl font-black font-mono tracking-widest mt-1 text-[#FF0091]">
              {referralCode}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">Directly enterable during registration</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Referrals</span>
          <h3 className="text-3xl font-black text-white mt-2">{data?.stats?.totalReferrals || 0}</h3>
          <p className="text-[11px] text-slate-500 mt-1">All registered accounts with your code</p>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-pink-500/30 p-5 shadow-lg bg-gradient-to-b from-slate-900 to-[#360099]/20">
          <span className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-[#FF0091]" />
            Qualified Referrals
          </span>
          <h3 className="text-3xl font-black text-[#FF0091] mt-2">{data?.stats?.qualifiedReferrals || 0}</h3>
          <p className="text-[11px] text-pink-400/80 mt-1">Paid members satisfying qualification rules</p>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pending Qualification
          </span>
          <h3 className="text-3xl font-black text-white mt-2">{data?.stats?.pendingReferrals || 0}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Free users awaiting membership activation</p>
        </div>
      </div>

      {/* Referred Members Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Referred Community Members</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent breakdown of every invited user and their server-verified qualification state.
          </p>
        </div>

        {/* Desktop / Tablet Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Member Username</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Membership Plan</th>
                <th className="py-3 px-4 text-right">Qualification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {!data?.referrals || data.referrals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500">
                    No referred members yet. Share your referral code to start building your community!
                  </td>
                </tr>
              ) : (
                data.referrals.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF0091] to-[#360099] flex items-center justify-center text-[10px] text-white font-bold">
                        {r.referredUsername[0]?.toUpperCase()}
                      </div>
                      {r.referredUsername}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(r.registeredAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4">
                      {r.hasActiveMembership ? (
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                            r.isPremium
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                          }`}
                        >
                          {r.membershipName || 'Active Paid Member'}
                        </span>
                      ) : (
                        <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                          Free Account
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-semibold px-2.5 py-1 rounded-full text-[10px] ${
                          r.status === 'QUALIFIED'
                            ? 'bg-pink-500/10 text-[#FF0091] border border-pink-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="md:hidden divide-y divide-slate-800">
          {!data?.referrals || data.referrals.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs px-4">
              No referred members yet. Share your referral code to start building your community!
            </div>
          ) : (
            data.referrals.map((r: any) => (
              <div key={r.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF0091] to-[#360099] border border-pink-500/30 flex items-center justify-center text-xs text-white font-bold">
                      {r.referredUsername[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">{r.referredUsername}</p>
                      <p className="text-[10px] text-slate-400">{new Date(r.registeredAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                      r.status === 'QUALIFIED'
                        ? 'bg-pink-500/10 text-[#FF0091] border border-pink-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-slate-400">Membership:</span>
                  {r.hasActiveMembership ? (
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        r.isPremium
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                      }`}
                    >
                      {r.membershipName || 'Active Paid Member'}
                    </span>
                  ) : (
                    <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                      Free Account
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
