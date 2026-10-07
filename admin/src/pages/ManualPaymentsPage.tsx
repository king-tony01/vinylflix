import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { AdminActionModal } from '../components/AdminActionModal.js';
import { DetailDrawer, DrawerSection, DrawerItem } from '../components/DetailDrawer.js';
import { Pagination } from '../components/Pagination.js';
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
  ChevronRight,
  Info,
} from 'lucide-react';

export const ManualPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_REVIEW');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Detail Drawer State
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  // Full-size Receipt Modal Preview
  const [receiptImageModal, setReceiptImageModal] = useState<string | null>(null);

  // Action Modal State (Replaces window.confirm and window.prompt)
  const [actionModalConfig, setActionModalConfig] = useState<{
    isOpen: boolean;
    payment: any | null;
    action: 'APPROVE' | 'REJECT';
    title: string;
    description: string;
    variant: 'success' | 'danger';
    confirmText: string;
    isPrompt?: boolean;
    inputLabel?: string;
    inputPlaceholder?: string;
    details?: Array<{ label: string; value: React.ReactNode }>;
  }>({
    isOpen: false,
    payment: null,
    action: 'APPROVE',
    title: '',
    description: '',
    variant: 'success',
    confirmText: 'Confirm',
  });

  const fetchPayments = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
    if (searchQuery.trim()) params.append('search', searchQuery.trim());

    const res = await apiRequest(`/admin/payments/manual?${params.toString()}`);
    if (res.success && res.data) {
      setPayments(res.data.payments || []);
      setCurrentPage(1);
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

  const openApproveModal = (payment: any) => {
    let planName = 'Membership Upgrade';
    try {
      const meta = JSON.parse(payment.metadataJson || '{}');
      if (meta.planName) planName = meta.planName;
    } catch {}

    setActionModalConfig({
      isOpen: true,
      payment,
      action: 'APPROVE',
      title: 'Approve Bank Transfer Payment',
      description: `Confirm receipt of funds for user @${payment.user?.username || 'user'}. This will immediately activate their ${planName} membership.`,
      variant: 'success',
      confirmText: 'Approve & Activate Plan',
      isPrompt: false,
      details: [
        { label: 'User', value: `@${payment.user?.username} (${payment.user?.email})` },
        { label: 'Plan', value: planName },
        { label: 'Transfer Amount', value: `₦${payment.amount.toLocaleString()}` },
        { label: 'Payment Ref', value: payment.reference },
        { label: 'Sender Name', value: payment.senderAccountName || 'N/A' },
        { label: 'Sender Bank', value: payment.senderBankName || 'N/A' },
      ],
    });
  };

  const openRejectModal = (payment: any) => {
    setActionModalConfig({
      isOpen: true,
      payment,
      action: 'REJECT',
      title: 'Reject Bank Transfer Proof',
      description: `Please enter the reason for rejecting this payment proof. This note will be sent directly to @${payment.user?.username || 'the user'}.`,
      variant: 'danger',
      confirmText: 'Reject Payment',
      isPrompt: true,
      inputLabel: 'Rejection Reason',
      inputPlaceholder: 'e.g. Funds not received in company bank account, or illegible receipt...',
      details: [
        { label: 'User', value: `@${payment.user?.username}` },
        { label: 'Amount', value: `₦${payment.amount.toLocaleString()}` },
        { label: 'Payment Ref', value: payment.reference },
      ],
    });
  };

  const handleConfirmAction = async (inputValue?: string) => {
    const payment = actionModalConfig.payment;
    if (!payment) return;

    setActionLoading(true);
    setMessage(null);

    const res = await apiRequest(`/admin/payments/manual/${payment.id}/review`, {
      method: 'POST',
      body: JSON.stringify({
        action: actionModalConfig.action,
        adminNote: inputValue || undefined,
      }),
    });

    if (res.success) {
      setMessage({
        type: 'success',
        text:
          actionModalConfig.action === 'APPROVE'
            ? `Payment approved! Membership activated for @${payment.user?.username}.`
            : `Payment rejected. User has been notified.`,
      });
      setActionModalConfig((prev) => ({ ...prev, isOpen: false }));
      if (selectedPayment?.id === payment.id) {
        setSelectedPayment(null);
      }
      await fetchPayments();
    } else {
      setMessage({
        type: 'error',
        text: res.error?.message || 'Failed to review payment.',
      });
    }

    setActionLoading(false);
  };

  // Pagination calculation
  const totalItems = payments.length;
  const paginatedPayments = payments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
            { id: 'PENDING_REVIEW', label: 'Pending Verification', count: statusFilter === 'PENDING_REVIEW' ? payments.length : null },
            { id: 'SETTLED', label: 'Approved & Settled', count: null },
            { id: 'REJECTED', label: 'Rejected', count: null },
            { id: 'ALL', label: 'All Transfers', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-gradient-to-r from-[#FF0091] to-[#360099] text-white shadow-md shadow-[#FF0091]/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                  {tab.count}
                </span>
              )}
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

      {/* Table Container */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">Manual Transfers Queue</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {totalItems} total transfer records
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#FF0091]" /> Loading bank transfer submissions...
          </div>
        ) : totalItems === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No bank transfers found matching the selected filter.
          </div>
        ) : (
          <>
            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
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
                  {paginatedPayments.map((p) => {
                    let planName = 'Membership';
                    try {
                      const meta = JSON.parse(p.metadataJson || '{}');
                      if (meta.planName) planName = meta.planName;
                    } catch {}

                    const isPending = p.status === 'PENDING_REVIEW';
                    const isSettled = p.status === 'SETTLED';
                    const isRejected = p.status === 'REJECTED';

                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPayment(p)}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        {/* User */}
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-white flex items-center gap-1.5 group-hover:text-pink-300 transition-colors">
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setReceiptImageModal(p.proofOfPaymentUrl);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#FF0091]" /> View Receipt
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[11px]">No receipt</span>
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
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => openApproveModal(p)}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1 transition-all"
                                  title="Approve transfer"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => openRejectModal(p)}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1 transition-all"
                                  title="Reject transfer"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setSelectedPayment(p)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title="Inspect details"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Adaptive Cards View (visible on < md) */}
            <div className="md:hidden divide-y divide-slate-800/80">
              {paginatedPayments.map((p) => {
                let planName = 'Membership';
                try {
                  const meta = JSON.parse(p.metadataJson || '{}');
                  if (meta.planName) planName = meta.planName;
                } catch {}

                const isPending = p.status === 'PENDING_REVIEW';
                const isSettled = p.status === 'SETTLED';

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPayment(p)}
                    className="p-4 space-y-3 active:bg-slate-800/40 transition-colors"
                  >
                    {/* User Header & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-sm flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-[#FF0091] flex-shrink-0" />
                          <span className="truncate">@{p.user?.username || 'Unknown'}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{p.user?.email}</p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                          isPending
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            : isSettled
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    {/* Metadata Card Box */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Plan:</span>
                        <span className="font-bold text-pink-300">{planName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Transfer Amount:</span>
                        <span className="font-bold text-white text-sm">₦{p.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Sender:</span>
                        <span className="text-slate-200 font-medium truncate max-w-[160px]">
                          {p.senderAccountName || 'N/A'} ({p.senderBankName || 'Bank'})
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                        <span className="font-mono">{p.reference}</span>
                        <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div
                      className="flex items-center gap-2 pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {p.proofOfPaymentUrl && (
                        <button
                          onClick={() => setReceiptImageModal(p.proofOfPaymentUrl)}
                          className="flex-1 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> Receipt
                        </button>
                      )}

                      {isPending ? (
                        <>
                          <button
                            onClick={() => openApproveModal(p)}
                            className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(p)}
                            className="flex-1 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <Info className="w-3.5 h-3.5" /> View Details
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* Slide-Over Detail Drawer */}
      {selectedPayment && (
        <DetailDrawer
          isOpen={Boolean(selectedPayment)}
          onClose={() => setSelectedPayment(null)}
          title={`Transfer @${selectedPayment.user?.username || 'User'}`}
          subtitle={`Ref: ${selectedPayment.reference}`}
          badge={
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                selectedPayment.status === 'PENDING_REVIEW'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  : selectedPayment.status === 'SETTLED'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}
            >
              {selectedPayment.status}
            </span>
          }
          icon={<CreditCard className="w-5 h-5" />}
          footerActions={
            selectedPayment.status === 'PENDING_REVIEW' ? (
              <>
                <button
                  type="button"
                  onClick={() => openRejectModal(selectedPayment)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <X className="w-4 h-4" /> Reject Payment
                </button>
                <button
                  type="button"
                  onClick={() => openApproveModal(selectedPayment)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Check className="w-4 h-4" /> Approve & Activate
                </button>
              </>
            ) : undefined
          }
        >
          {/* User Section */}
          <DrawerSection title="User Information">
            <DrawerItem label="Username" value={`@${selectedPayment.user?.username}`} copyable />
            <DrawerItem label="Email" value={selectedPayment.user?.email || 'N/A'} copyable />
            <DrawerItem label="Phone" value={selectedPayment.user?.phone || 'N/A'} copyable />
            <DrawerItem label="User ID" value={selectedPayment.userId} copyable />
          </DrawerSection>

          {/* Payment Section */}
          <DrawerSection title="Payment Details">
            {(() => {
              let planName = 'Membership Upgrade';
              try {
                const meta = JSON.parse(selectedPayment.metadataJson || '{}');
                if (meta.planName) planName = meta.planName;
              } catch {}
              return <DrawerItem label="Plan Requested" value={planName} />;
            })()}
            <DrawerItem
              label="Amount"
              value={`₦${selectedPayment.amount.toLocaleString()}`}
            />
            <DrawerItem label="Payment Method" value="MANUAL_TRANSFER" />
            <DrawerItem label="Payment Reference" value={selectedPayment.reference} copyable />
            <DrawerItem
              label="Submission Date"
              value={new Date(selectedPayment.createdAt).toLocaleString()}
            />
          </DrawerSection>

          {/* Sender Bank Section */}
          <DrawerSection title="Sender Bank Information">
            <DrawerItem
              label="Account Name"
              value={selectedPayment.senderAccountName || 'N/A'}
              copyable
            />
            <DrawerItem
              label="Bank Name"
              value={selectedPayment.senderBankName || 'N/A'}
              copyable
            />
          </DrawerSection>

          {/* Proof Receipt Preview */}
          <DrawerSection title="Proof of Payment Document">
            {selectedPayment.proofOfPaymentUrl ? (
              <div className="space-y-2">
                <div
                  onClick={() => setReceiptImageModal(selectedPayment.proofOfPaymentUrl)}
                  className="cursor-pointer group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 p-2 flex items-center justify-center max-h-60"
                >
                  {selectedPayment.proofOfPaymentUrl.startsWith('data:image') ||
                  selectedPayment.proofOfPaymentUrl.startsWith('http') ? (
                    <img
                      src={selectedPayment.proofOfPaymentUrl}
                      alt="Proof Receipt"
                      className="max-h-56 w-auto object-contain rounded-lg group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="p-6 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      <p>Attached Document</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                    <Eye className="w-4 h-4" /> Tap to view full size
                  </div>
                </div>

                <a
                  href={selectedPayment.proofOfPaymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                </a>
              </div>
            ) : (
              <p className="text-slate-500 italic">No receipt document attached.</p>
            )}
          </DrawerSection>

          {/* Admin Note if present */}
          {selectedPayment.adminNote && (
            <DrawerSection title="Admin Review Note">
              <p className="text-slate-300 leading-relaxed">{selectedPayment.adminNote}</p>
            </DrawerSection>
          )}
        </DetailDrawer>
      )}

      {/* Full Size Receipt Modal */}
      {receiptImageModal && (
        <div
          onClick={() => setReceiptImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#FF0091]" /> Proof of Payment Document
              </h3>
              <button
                onClick={() => setReceiptImageModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center bg-slate-950 rounded-xl p-2 max-h-[70vh] overflow-auto">
              <img
                src={receiptImageModal}
                alt="Full receipt"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Custom Admin Action Modal */}
      <AdminActionModal
        isOpen={actionModalConfig.isOpen}
        onClose={() => setActionModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        title={actionModalConfig.title}
        description={actionModalConfig.description}
        variant={actionModalConfig.variant}
        confirmText={actionModalConfig.confirmText}
        isPrompt={actionModalConfig.isPrompt}
        isTextArea={true}
        inputRequired={actionModalConfig.action === 'REJECT'}
        inputLabel={actionModalConfig.inputLabel}
        inputPlaceholder={actionModalConfig.inputPlaceholder}
        details={actionModalConfig.details}
        loading={actionLoading}
      />
    </div>
  );
};
