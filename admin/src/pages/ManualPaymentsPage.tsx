import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Landmark,
  Search,
  Clock,
  ExternalLink,
  Eye,
  AlertCircle,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  User as UserIcon,
  FileText,
} from 'lucide-react';

export const ManualPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_REVIEW');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Receipt Modal
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<any | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
    if (searchQuery.trim()) params.append('search', searchQuery.trim());

    const res = await apiRequest(`/admin/payments/manual?${params.toString()}`);
    if (res.success && res.data) {
      setPayments(res.data.payments || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleReview = async (payment: any, action: 'APPROVE' | 'REJECT') => {
    let adminNote: string | undefined = undefined;

    if (action === 'APPROVE') {
      const confirmApprove = window.confirm(
        `Are you sure you want to APPROVE payment of ₦${payment.amount.toLocaleString()} for user @${payment.user?.username || 'user'}? This will activate their membership immediately.`
      );
      if (!confirmApprove) return;
    } else {
      const reason = window.prompt('Enter the reason for rejecting this payment proof (sent to user):');
      if (!reason) return;
      adminNote = reason;
    }

    setActionLoading(payment.id);
    setMessage(null);

    const res = await apiRequest(`/admin/payments/manual/${payment.id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, adminNote }),
    });

    if (res.success) {
      setMessage({
        type: 'success',
        text: action === 'APPROVE' ? `Payment approved! Membership activated for @${payment.user?.username}.` : `Payment rejected. User has been notified.`,
      });
      if (selectedReceiptPayment?.id === payment.id) {
        setSelectedReceiptPayment(null);
      }
      await fetchPayments();
    } else {
      setMessage({
        type: 'error',
        text: res.error?.message || 'Failed to review payment.',
      });
    }

    setActionLoading(null);
  };

  const pendingCount = payments.filter((p) => p.status === 'PENDING_REVIEW').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            Bank Transfer Verifications <CreditCard className="w-6 h-6 text-[#FF0091]" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review manual bank transfer receipts, verify incoming funds, and approve membership plan upgrades.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto shadow-md"
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'PENDING_REVIEW', label: 'Pending Verification' },
            { id: 'SETTLED', label: 'Approved & Settled' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'ALL', label: 'All Transfers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-gradient-to-r from-[#FF0091] to-[#360099] text-white shadow-md shadow-[#FF0091]/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, ref, sender..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#FF0091]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table of Payments */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Manual Transfers List</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {payments.length} transfer records
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#FF0091]" /> Loading bank transfer submissions...
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No bank transfers found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Plan / Purpose</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Sender Details</th>
                  <th className="py-3.5 px-4">Proof Receipt</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p) => {
                  let planName = 'Membership';
                  try {
                    const meta = JSON.parse(p.metadataJson || '{}');
                    if (meta.planName) planName = meta.planName;
                  } catch {}

                  const isPending = p.status === 'PENDING_REVIEW';
                  const isSettled = p.status === 'SETTLED';
                  const isRejected = p.status === 'REJECTED';

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-[#FF0091]" />
                            @{p.user?.username || 'Unknown'}
                          </p>
                          <p className="text-[11px] text-slate-400">{p.user?.email}</p>
                          {p.user?.phone && <p className="text-[10px] text-slate-500">{p.user.phone}</p>}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-pink-300">{planName}</span>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">{p.reference}</p>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold text-sm text-white">
                        ₦{p.amount.toLocaleString()}
                      </td>

                      {/* Sender Details */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-200">{p.senderAccountName || 'N/A'}</p>
                        <p className="text-[11px] text-slate-400">{p.senderBankName || 'N/A'}</p>
                      </td>

                      {/* Proof Receipt */}
                      <td className="py-3.5 px-4">
                        {p.proofOfPaymentUrl ? (
                          <button
                            onClick={() => setSelectedReceiptPayment(p)}
                            className="px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#FF0091]" /> View Receipt
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">No file</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPending
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : isSettled
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.adminNote && (
                          <p className="text-[10px] text-slate-400 mt-1 max-w-xs truncate" title={p.adminNote}>
                            Note: {p.adminNote}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReview(p, 'APPROVE')}
                              disabled={actionLoading === p.id}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1 transition-all"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleReview(p, 'REJECT')}
                              disabled={actionLoading === p.id}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1 transition-all"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Receipt Modal */}
      {selectedReceiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl max-h-[92dvh] overflow-y-auto my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-[#FF0091]" /> Payment Proof Receipt
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ref: <span className="font-mono text-pink-300">{selectedReceiptPayment.reference}</span> • Amount: <strong className="text-white">₦{selectedReceiptPayment.amount.toLocaleString()}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedReceiptPayment(null)}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sender Metadata Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">User</span>
                <p className="font-bold text-white mt-0.5">@{selectedReceiptPayment.user?.username}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Sender Account Name</span>
                <p className="font-bold text-slate-200 mt-0.5">{selectedReceiptPayment.senderAccountName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Sending Bank</span>
                <p className="font-bold text-slate-200 mt-0.5">{selectedReceiptPayment.senderBankName || 'N/A'}</p>
              </div>
            </div>

            {/* Image Preview */}
            <div className="max-h-[50vh] sm:max-h-[60vh] overflow-auto rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/80 p-2 flex items-center justify-center">
              {selectedReceiptPayment.proofOfPaymentUrl?.startsWith('data:image') ||
              selectedReceiptPayment.proofOfPaymentUrl?.startsWith('http') ? (
                <img
                  src={selectedReceiptPayment.proofOfPaymentUrl}
                  alt="Proof of Payment"
                  className="max-w-full h-auto object-contain rounded-xl"
                />
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p>Receipt Document Attachment</p>
                  <a
                    href={selectedReceiptPayment.proofOfPaymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 px-4 py-2 rounded-xl bg-[#FF0091] text-white font-bold"
                  >
                    Open Document
                  </a>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            {selectedReceiptPayment.status === 'PENDING_REVIEW' && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleReview(selectedReceiptPayment, 'REJECT')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <X className="w-4 h-4" /> Reject Payment
                </button>
                <button
                  onClick={() => handleReview(selectedReceiptPayment, 'APPROVE')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" /> Approve & Activate Plan
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
