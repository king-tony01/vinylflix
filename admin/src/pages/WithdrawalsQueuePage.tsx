import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import {
  DollarSign,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Landmark,
  ShieldAlert,
  AlertCircle,
  Clock,
} from 'lucide-react';

export const WithdrawalsQueuePage: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchWithdrawals = async () => {
    setLoading(true);
    const res = await apiRequest('/admin/withdrawals/pending');
    if (res.success && res.data) {
      setWithdrawals(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleReview = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const reason = window.prompt(
      action === 'APPROVE' ? 'Enter approval note (optional):' : 'Enter reason for rejection (required for audit):'
    );
    if (action === 'REJECT' && !reason) return;

    setActionLoading(id);
    setMessage(null);

    const res = await apiRequest(`/withdrawals/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reviewNote: reason || undefined }),
    });

    if (res.success) {
      setMessage({
        type: 'success',
        text: action === 'APPROVE' ? 'Withdrawal approved and marked as completed.' : 'Withdrawal rejected and funds refunded to user available balance.',
      });
      fetchWithdrawals();
    } else {
      setMessage({
        type: 'error',
        text: res.error?.message || 'Failed to process withdrawal action',
      });
    }
    setActionLoading(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            Withdrawal Authorization Queue <DollarSign className="w-6 h-6 text-emerald-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review, verify bank credentials, inspect risk scores, and approve payouts or issue compensating refunds.
          </p>
        </div>

        <button
          onClick={fetchWithdrawals}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
        </button>
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Withdrawals Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Pending Payout Requests ({withdrawals.length})</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Funds are currently on hold via immutable ledger debit. Rejection will automatically issue a refund credit.
            </p>
          </div>
        </div>

        {/* Desktop / Tablet Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Requested Date</th>
                <th className="py-3 px-4">Gross & Net Amount</th>
                <th className="py-3 px-4">Bank Account Info</th>
                <th className="py-3 px-4">Risk Evaluation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600" />
                    Loading withdrawal queue...
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/40" />
                    No pending withdrawals in queue. All requests have been processed!
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => {
                  let bankInfo: any = {};
                  try {
                    bankInfo = JSON.parse(w.accountDetailsJson);
                  } catch {}

                  const riskScore = w.user?.riskScore?.score || 0;
                  const isHighRisk = riskScore >= 50;

                  return (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* User */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{w.user?.username}</p>
                        <p className="text-[10px] text-slate-400">{w.user?.email}</p>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(w.createdAt).toLocaleString()}
                      </td>

                      {/* Amounts */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-emerald-400 text-sm">
                          Net: ₦{w.netAmount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Gross: ₦{w.amount.toLocaleString()} (Fee: ₦{w.fee})
                        </p>
                      </td>

                      {/* Bank Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-white">
                          <Landmark className="w-3.5 h-3.5 text-slate-400" />
                          {bankInfo.bankName || 'Bank'}
                        </div>
                        <p className="text-[10px] font-mono text-slate-300 mt-0.5">
                          {bankInfo.accountNumber} • {bankInfo.accountName}
                        </p>
                      </td>

                      {/* Risk Score */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                            isHighRisk
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {isHighRisk && <ShieldAlert className="w-3 h-3" />}
                          Score: {riskScore}/100
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleReview(w.id, 'APPROVE')}
                          disabled={actionLoading === w.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-all"
                        >
                          Approve Payout
                        </button>
                        <button
                          onClick={() => handleReview(w.id, 'REJECT')}
                          disabled={actionLoading === w.id}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 disabled:opacity-50 text-rose-400 font-bold text-xs transition-all"
                        >
                          Reject & Refund
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="md:hidden divide-y divide-slate-800">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600" />
              Loading withdrawal queue...
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/40" />
              No pending withdrawals in queue.
            </div>
          ) : (
            withdrawals.map((w) => {
              let bankInfo: any = {};
              try {
                bankInfo = JSON.parse(w.accountDetailsJson);
              } catch {}
              const riskScore = w.user?.riskScore?.score || 0;
              const isHighRisk = riskScore >= 50;

              return (
                <div key={w.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{w.user?.username}</p>
                      <p className="text-[10px] text-slate-400">{w.user?.email}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {new Date(w.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                        isHighRisk
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      Risk: {riskScore}/100
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Net Amount:</span>
                      <span className="font-bold text-emerald-400 text-sm">₦{w.netAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>Gross (Fee):</span>
                      <span>₦{w.amount.toLocaleString()} (₦{w.fee})</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-900 flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Landmark className="w-3 h-3 text-slate-400" /> {bankInfo.bankName}
                      </span>
                      <span className="font-mono text-slate-300">{bankInfo.accountNumber}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleReview(w.id, 'APPROVE')}
                      disabled={actionLoading === w.id}
                      className="py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(w.id, 'REJECT')}
                      disabled={actionLoading === w.id}
                      className="py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 disabled:opacity-50 text-rose-400 font-bold text-xs transition-all"
                    >
                      Reject & Refund
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
