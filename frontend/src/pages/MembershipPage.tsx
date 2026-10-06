import React, { useEffect, useState, useRef } from 'react';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { BankSelect } from '../components/BankSelect.js';
import {
  Check,
  Sparkles,
  Lock,
  Landmark,
  Copy,
  CheckCircle2,
  Upload,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const MembershipPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userPayments, setUserPayments] = useState<any[]>([]);

  // Bank Details from backend
  const [bankDetails, setBankDetails] = useState<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    instructions: string;
    currency: string;
  }>({
    bankName: 'Opay',
    accountName: 'Okolie Amauche Anthony',
    accountNumber: '9063213825',
    instructions: 'Transfer the exact amount to the account below, then upload your payment receipt for instant manual verification.',
    currency: 'NGN',
  });

  // Modal state
  const [selectedPlanForTransfer, setSelectedPlanForTransfer] = useState<any | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [senderAccountName, setSenderAccountName] = useState<string>('');
  const [senderBankName, setSenderBankName] = useState<string>('OPay Digital Services Limited (Paycom)');
  const [customBankName, setCustomBankName] = useState<string>('');
  const [proofFileBase64, setProofFileBase64] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPlansAndData = async () => {
    setLoading(true);
    const [plansRes, bankRes, historyRes] = await Promise.all([
      apiRequest('/memberships/plans'),
      apiRequest('/payments/bank-details'),
      user ? apiRequest('/payments/my-history') : Promise.resolve({ success: false, data: null }),
    ]);

    if (plansRes.success && plansRes.data) {
      const plansList = Array.isArray(plansRes.data) ? plansRes.data : plansRes.data.plans || [];
      setPlans(plansList);
    }

    if (bankRes.success && bankRes.data) {
      setBankDetails(bankRes.data);
    }

    if (historyRes.success && historyRes.data) {
      setUserPayments(historyRes.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPlansAndData();
  }, [user]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Account number copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenTransferModal = (plan: any) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setSelectedPlanForTransfer(plan);
    setSenderAccountName(user?.profile?.fullName || user?.username || '');
    setSenderBankName('OPay');
    setCustomBankName('');
    setProofFileBase64('');
    setProofFileName('');
    setPaymentNotes('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size too large. Please upload an image under 5MB.');
      return;
    }

    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!senderAccountName.trim()) {
      toast.error('Please enter the account name you transferred from.');
      return;
    }

    const effectiveBank = senderBankName === 'Other Bank' ? customBankName.trim() : senderBankName;
    if (!effectiveBank) {
      toast.error('Please specify your sending bank.');
      return;
    }

    if (!proofFileBase64) {
      toast.error('Please upload your proof of payment receipt image.');
      return;
    }

    setSubmittingPayment(true);

    const res = await apiRequest('/payments/manual-transfer', {
      method: 'POST',
      body: JSON.stringify({
        amount: selectedPlanForTransfer.price,
        currency: selectedPlanForTransfer.currency || 'NGN',
        purpose: 'MEMBERSHIP_PURCHASE',
        planId: selectedPlanForTransfer.id,
        planName: selectedPlanForTransfer.name,
        senderAccountName: senderAccountName.trim(),
        senderBankName: effectiveBank,
        proofOfPaymentUrl: proofFileBase64,
        notes: paymentNotes.trim() || undefined,
      }),
    });

    if (res.success) {
      toast.success('🎉 Proof of payment submitted! Our team will verify and activate your plan shortly.');
      setSelectedPlanForTransfer(null);
      await fetchPlansAndData();
      await refreshUser();
    } else {
      toast.error(res.error?.message || 'Failed to submit payment proof.');
    }

    setSubmittingPayment(false);
  };

  const pendingPayment = userPayments.find((p) => p.status === 'PENDING_REVIEW');

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

      {/* Active Pending Payment Banner */}
      {pendingPayment && (
        <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                Bank Transfer Verification In Progress
              </h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Your payment of <strong className="text-white">₦{pendingPayment.amount.toLocaleString()}</strong> (Ref: {pendingPayment.reference}) is currently being reviewed. Your plan will activate automatically upon approval.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold whitespace-nowrap self-end sm:self-center">
            Pending Review
          </span>
        </div>
      )}

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
                      onClick={() => handleOpenTransferModal(plan)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                        isFeatured
                          ? 'bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] text-white shadow-[#FF0091]/20 hover:scale-[1.02] active:scale-[0.98]'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Upgrade
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Direct Bank Transfer Checkout Modal */}
      {selectedPlanForTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF0091]/20 to-[#360099]/20 border border-[#FF0091]/30 flex items-center justify-center text-[#FF0091]">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Direct Bank Transfer</h3>
                  <p className="text-xs text-slate-400">
                    Upgrade to <strong className="text-pink-300">{selectedPlanForTransfer.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlanForTransfer(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bank Details Presentation Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#120029] to-[#1e003b] border border-[#FF0091]/30 space-y-4 relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between text-xs font-bold text-pink-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#FF0091]" /> Official Payment Account
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 text-[11px]">Bank Name</p>
                  <p className="font-bold text-white text-sm mt-0.5">{bankDetails.bankName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">Account Name</p>
                  <p className="font-bold text-white text-sm mt-0.5 truncate" title={bankDetails.accountName}>
                    {bankDetails.accountName}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-pink-500/20 flex items-center justify-between gap-2">
                <div>
                  <p className="text-slate-400 text-[11px]">Account Number</p>
                  <p className="text-xl font-black font-mono text-white tracking-wider">
                    {bankDetails.accountNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(bankDetails.accountNumber)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    copied
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-white text-slate-950 hover:bg-pink-100 shadow-md'
                  }`}
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Number'}
                </button>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Exact Amount to Send:</span>
                <span className="text-base font-black text-[#FF0091]">
                  ₦{selectedPlanForTransfer.price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleSubmitProof} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sender Account Name <span className="text-[#FF0091]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Okolie Anthony"
                  value={senderAccountName}
                  onChange={(e) => setSenderAccountName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#FF0091] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Sending Bank <span className="text-[#FF0091]">*</span>
                  </label>
                  <BankSelect
                    value={senderBankName}
                    onChange={setSenderBankName}
                  />
                </div>

                {senderBankName === 'Other Bank' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Specify Bank Name <span className="text-[#FF0091]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Heritage Bank"
                      value={customBankName}
                      onChange={(e) => setCustomBankName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#FF0091] transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Proof of Payment File Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Upload Proof of Payment (Screenshot / Receipt) <span className="text-[#FF0091]">*</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    proofFileBase64
                      ? 'border-emerald-500/60 bg-emerald-500/5 text-emerald-300'
                      : 'border-slate-700 hover:border-[#FF0091]/60 bg-slate-950/60 text-slate-400'
                  }`}
                >
                  {proofFileBase64 ? (
                    <div className="space-y-2 w-full">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="truncate max-w-xs">{proofFileName || 'Receipt selected'}</span>
                      </div>
                      {proofFileBase64.startsWith('data:image') && (
                        <div className="max-h-32 overflow-hidden rounded-xl border border-emerald-500/30 mx-auto inline-block">
                          <img
                            src={proofFileBase64}
                            alt="Receipt Preview"
                            className="h-28 object-contain mx-auto"
                          />
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400">Click to change receipt image</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                        <Upload className="w-5 h-5 text-[#FF0091]" />
                      </div>
                      <p className="text-xs font-semibold text-slate-200">
                        Click to upload payment receipt
                      </p>
                      <p className="text-[10px] text-slate-500">Supports PNG, JPG, JPEG or PDF (Max 5MB)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Optional Note / Transaction Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Session ID or transfer narration"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#FF0091] transition-colors"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlanForTransfer(null)}
                  className="w-1/3 py-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment || !proofFileBase64}
                  className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] text-white text-xs font-black shadow-lg shadow-[#FF0091]/25 hover:shadow-[#FF0091]/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {submittingPayment ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Submit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
