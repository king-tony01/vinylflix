import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { RewardProgressBar } from '../components/RewardProgressBar.js';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Unlock,
  Clock,
  RefreshCw,
  Landmark,
  PlaySquare,
  Users,
  Crown,
  Sparkles,
  CheckCircle2,
  Building2,
} from 'lucide-react';

export const WalletPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [walletData, setWalletData] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);

  // Bank form & real-time resolution
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState<string>('999992');
  const [bankName, setBankName] = useState<string>('OPay Digital Services (Paycom)');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [resolvingAccount, setResolvingAccount] = useState<boolean>(false);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const minWithdrawalAmount = walletData?.withdrawalRules?.minWithdrawalAmount || 2000;
  const isFirstWithdrawal = walletData?.withdrawalRules?.isFirstWithdrawal ?? true;
  const userTier = walletData?.withdrawalRules?.userTier || 'FREE_STARTER';

  const [withdrawAmount, setWithdrawAmount] = useState<string>('2000');
  const [withdrawLoading, setWithdrawLoading] = useState<boolean>(false);

  const fetchWallet = async () => {
    setLoading(true);
    const res = await apiRequest('/wallet');
    if (res.success && res.data) {
      setWalletData(res.data);
      if (res.data.withdrawalRules?.minWithdrawalAmount) {
        setWithdrawAmount(res.data.withdrawalRules.minWithdrawalAmount.toString());
      }
    }

    const txRes = await apiRequest('/wallet/transactions');
    if (txRes.success && txRes.data) {
      setTransactions(txRes.data.entries || []);
    }
    setLoading(false);
  };

  // 1. Load Real Bank Directory
  useEffect(() => {
    const fetchBanks = async () => {
      const res = await apiRequest('/payments/banks');
      if (res.success && res.data?.banks) {
        setBanks(res.data.banks);
        if (res.data.banks.length > 0) {
          setSelectedBankCode(res.data.banks[0].code);
          setBankName(res.data.banks[0].name);
        }
      }
    };
    fetchBanks();
    fetchWallet();
  }, []);

  // 2. Real-time Account Resolution
  useEffect(() => {
    if (accountNumber.length === 10 && selectedBankCode) {
      let isSubscribed = true;
      const resolve = async () => {
        setResolvingAccount(true);
        const res = await apiRequest('/payments/resolve-account', {
          method: 'POST',
          body: JSON.stringify({
            accountNumber,
            bankCode: selectedBankCode,
          }),
        });

        if (isSubscribed) {
          if (res.success && res.data?.accountName) {
            setResolvedName(res.data.accountName);
            setAccountName(res.data.accountName);
          } else {
            setResolvedName(null);
          }
          setResolvingAccount(false);
        }
      };
      resolve();
      return () => {
        isSubscribed = false;
      };
    } else {
      setResolvedName(null);
      setResolvingAccount(false);
    }
  }, [accountNumber, selectedBankCode]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);

    if (isNaN(amountNum) || amountNum < minWithdrawalAmount) {
      toast.error(`Minimum withdrawal amount is ₦${minWithdrawalAmount.toLocaleString()}`);
      return;
    }

    if (accountNumber.length !== 10) {
      toast.error('Account number must be exactly 10 digits');
      return;
    }

    if (!accountName.trim()) {
      toast.error('Please ensure account holder name is verified');
      return;
    }

    setWithdrawLoading(true);
    const res = await apiRequest('/withdrawals', {
      method: 'POST',
      body: JSON.stringify({
        amount: amountNum,
        accountDetails: {
          bankName,
          bankCode: selectedBankCode,
          accountNumber,
          accountName,
        },
      }),
    });

    if (res.success) {
      toast.success('Withdrawal request submitted! Funds will be reviewed and transferred to your bank.');
      setShowWithdrawModal(false);
      fetchWallet();
      refreshUser();
    } else {
      toast.error(res.error?.message || 'Failed to submit withdrawal request.');
    }
    setWithdrawLoading(false);
  };

  const availableBal = walletData?.wallet?.availableBalance ?? (user?.wallet?.availableBalance || 0);
  const lockedBal = walletData?.wallet?.lockedBalance ?? (user?.wallet?.lockedBalance || 0);
  const pendingBal = walletData?.wallet?.pendingBalance ?? (user?.wallet?.pendingBalance || 0);
  const totalEarned = walletData?.wallet?.totalEarned ?? 0;
  const totalWithdrawn = walletData?.wallet?.totalWithdrawn ?? 0;

  const getTransactionMeta = (tx: any) => {
    const isCredit = tx.direction === 'CREDIT';
    switch (tx.entryType) {
      case 'WATCH_REWARD':
        return {
          title: 'Watched Video Reward',
          icon: PlaySquare,
          iconBg: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
          amountPrefix: '+',
          amountColor: 'text-pink-400',
        };
      case 'REFERRAL_BONUS':
        return {
          title: 'Referral Milestone Bonus',
          icon: Users,
          iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
          amountPrefix: '+',
          amountColor: 'text-purple-400',
        };
      case 'WITHDRAWAL_HOLD':
      case 'WITHDRAWAL_PAYOUT':
        return {
          title: 'Bank Withdrawal Payout',
          icon: ArrowUpRight,
          iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          amountPrefix: '-',
          amountColor: 'text-rose-400',
        };
      case 'WITHDRAWAL_REFUND':
        return {
          title: 'Withdrawal Refund',
          icon: RefreshCw,
          iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          amountPrefix: '+',
          amountColor: 'text-amber-400',
        };
      case 'MEMBERSHIP_FEE':
        return {
          title: 'Membership Upgrade',
          icon: Crown,
          iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
          amountPrefix: '-',
          amountColor: 'text-purple-300',
        };
      default:
        return {
          title: tx.description || 'Transaction',
          icon: isCredit ? ArrowDownLeft : ArrowUpRight,
          iconBg: isCredit
            ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
            : 'bg-slate-800 text-slate-400 border border-slate-700',
          amountPrefix: isCredit ? '+' : '-',
          amountColor: isCredit ? 'text-pink-400' : 'text-slate-300',
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <WalletIcon className="w-8 h-8 text-[#FF0091]" />
            Wallet & Earnings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor real-time earnings, track locked bonuses, and request instant bank payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={availableBal < 2000}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-[#FF0091]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Landmark className="w-4 h-4" /> Request Payout
          </button>
        </div>
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* 1. Available Balance */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#360099]/30 border border-pink-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5 text-[#FF0091]" /> Available for Payout
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
              Instant Payout
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ₦{availableBal.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Ready for withdrawal to any verified Nigerian bank account.</p>
        </div>

        {/* 2. Locked Milestone Bonus */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#360099]/20 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" /> Locked Bonus
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Conditional
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl sm:text-4xl font-black text-purple-300 tracking-tight">
              ₦{lockedBal.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Unlocks to your Available Balance when you satisfy your membership referral requirement.
          </p>
        </div>

        {/* 3. Pending Payouts / In-Transit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> In-Transit & Processing
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              Processing
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ₦{pendingBal.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Withdrawals currently being processed by automated bank rails.</p>
        </div>
      </div>

      {/* Lifetime Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Earned</p>
          <p className="text-xl font-bold text-pink-400 mt-1">₦{totalEarned.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Withdrawn</p>
          <p className="text-xl font-bold text-white mt-1">₦{totalWithdrawn.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Membership Status</p>
          <p className="text-sm font-bold text-white mt-1.5 flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-[#FF0091]" />
            <span>{user?.activeMembership?.plan?.name || 'Free Starter'}</span>
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Payout Threshold</p>
          <p className="text-sm font-bold text-slate-300 mt-1.5">
            {isFirstWithdrawal
              ? userTier === 'PREMIUM'
                ? '₦25,000 (1st Payout)'
                : '₦10,000 (1st Payout)'
              : userTier === 'BASIC'
              ? 'Min ₦5,000'
              : 'Min ₦2,000'}
          </p>
        </div>
      </div>

      {/* Conditional Reward Progress (If user has locked reward) */}
      {lockedBal > 0 && (
        <RewardProgressBar
          amount={lockedBal}
          qualifiedCount={walletData?.withdrawalRules?.totalQualified || 0}
          targetCount={walletData?.withdrawalRules?.requiredTotalReferrals || 10}
          requiredPremiumCount={walletData?.withdrawalRules?.requiredPremiumReferrals || 0}
          premiumQualifiedCount={walletData?.withdrawalRules?.premiumQualified || 0}
          isUnlocked={lockedBal === 0 && totalEarned > 0}
        />
      )}

      {/* Recent Immutable Ledger Transactions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF0091]" /> Immutable Ledger Records
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cryptographically verified, double-entry financial ledger entries.
            </p>
          </div>
          <button
            onClick={fetchWallet}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Transactions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#FF0091]' : ''}`} />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {loading && transactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading ledger records...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-1">
              <p className="text-xs">No transactions recorded yet.</p>
              <p className="text-[11px] text-slate-600">
                Watch rewarded videos or refer members to begin earning cash rewards.
              </p>
            </div>
          ) : (
            transactions.map((tx) => {
              const meta = getTransactionMeta(tx);
              const Icon = meta.icon;
              const formattedDate = new Date(tx.createdAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              return (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${meta.iconBg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{meta.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400">{formattedDate}</span>
                        {tx.bucket && (
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                              tx.bucket === 'AVAILABLE'
                                ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                                : tx.bucket === 'LOCKED'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {tx.bucket}
                          </span>
                        )}
                      </div>
                      {tx.description && tx.description !== meta.title && (
                        <p className="text-[11px] text-slate-400 truncate">{tx.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="text-right flex-shrink-0 pl-3">
                    <p className={`text-base font-black tracking-tight ${meta.amountColor}`}>
                      {meta.amountPrefix}₦{tx.amount.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-pink-400 font-semibold uppercase tracking-wider">
                      Completed
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Withdrawal Request Modal with Real Bank Selector & Name Resolution */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-[#FF0091]" /> Bank Payout Request
              </h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Withdrawal Amount (Min ₦{minWithdrawalAmount.toLocaleString()})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">
                    ₦
                  </span>
                  <input
                    type="number"
                    min={minWithdrawalAmount}
                    step="100"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF0091]"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Available for payout: ₦{availableBal.toLocaleString()}
                </p>
              </div>

              {/* Real Bank Selector Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#FF0091]" /> Select Bank
                </label>
                <select
                  value={selectedBankCode}
                  onChange={(e) => {
                    setSelectedBankCode(e.target.value);
                    const b = banks.find((item) => item.code === e.target.value);
                    if (b) setBankName(b.name);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF0091]"
                >
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 10-Digit NUBAN Account Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Number (10 Digits)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#FF0091]"
                  required
                />

                {/* Real-time Account Resolution Feedback */}
                {resolvingAccount ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF0091]" /> Verifying account with bank...
                  </div>
                ) : resolvedName ? (
                  <div className="flex items-center gap-1.5 text-xs text-pink-300 font-bold mt-1.5 bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF0091]" /> Verified: {resolvedName}
                  </div>
                ) : null}
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  placeholder="Verified Name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF0091]"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Gross Payout:</span>
                  <span className="font-bold text-white">₦{parseFloat(withdrawAmount || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Processing Fee (5%):</span>
                  <span>₦{(parseFloat(withdrawAmount || '0') * 0.05).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-900 text-pink-400 font-bold">
                  <span>Net Bank Credit:</span>
                  <span>₦{(parseFloat(withdrawAmount || '0') * 0.95).toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={withdrawLoading || parseFloat(withdrawAmount) > availableBal}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] text-white font-bold text-sm shadow-lg shadow-[#FF0091]/25 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {withdrawLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>Confirm & Request Payout</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
