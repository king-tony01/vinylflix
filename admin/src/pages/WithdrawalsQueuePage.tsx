import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { AdminActionModal } from '../components/AdminActionModal.js';
import { DetailDrawer, DrawerSection, DrawerItem } from '../components/DetailDrawer.js';
import { Pagination } from '../components/Pagination.js';
import { MobileTable, MobileTableRow, MobileDataCell } from '../components/MobileTable.js';
import {
  DollarSign,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Landmark,
  ShieldAlert,
  AlertCircle,
  Clock,
  User as UserIcon,
  Check,
  X,
  ChevronRight,
  Info,
  ShieldCheck,
  Search,
} from 'lucide-react';

export const WithdrawalsQueuePage: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Detail Drawer State
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);

  // Action Modal State
  const [actionModalConfig, setActionModalConfig] = useState<{
    isOpen: boolean;
    withdrawal: any | null;
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
    withdrawal: null,
    action: 'APPROVE',
    title: '',
    description: '',
    variant: 'success',
    confirmText: 'Confirm',
  });

  const fetchWithdrawals = async () => {
    setLoading(true);
    const res = await apiRequest('/admin/withdrawals/pending');
    if (res.success && res.data) {
      setWithdrawals(res.data || []);
      setCurrentPage(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const openApproveModal = (w: any) => {
    let bankInfo: any = {};
    try {
      bankInfo = JSON.parse(w.accountDetailsJson || '{}');
    } catch {}

    setActionModalConfig({
      isOpen: true,
      withdrawal: w,
      action: 'APPROVE',
      title: 'Approve Payout Request',
      description: `Confirm payout authorization for @${w.user?.username || 'user'}. The net amount of ₦${w.netAmount.toLocaleString()} will be marked as disbursed.`,
      variant: 'success',
      confirmText: 'Approve Payout',
      isPrompt: true,
      inputLabel: 'Approval Reference / Admin Note (Optional)',
      inputPlaceholder: 'e.g. Bank transfer session ID or reference...',
      details: [
        { label: 'Recipient', value: `@${w.user?.username} (${w.user?.email})` },
        { label: 'Net Payout', value: `₦${w.netAmount.toLocaleString()}` },
        { label: 'Gross & Fee', value: `₦${w.amount.toLocaleString()} (Fee: ₦${w.fee})` },
        { label: 'Bank Name', value: bankInfo.bankName || 'N/A' },
        { label: 'Account Number', value: bankInfo.accountNumber || 'N/A' },
        { label: 'Account Name', value: bankInfo.accountName || 'N/A' },
        { label: 'Risk Score', value: `${w.user?.riskScore?.score || 0}/100` },
      ],
    });
  };

  const openRejectModal = (w: any) => {
    let bankInfo: any = {};
    try {
      bankInfo = JSON.parse(w.accountDetailsJson || '{}');
    } catch {}

    setActionModalConfig({
      isOpen: true,
      withdrawal: w,
      action: 'REJECT',
      title: 'Reject & Refund Withdrawal',
      description: `Rejecting this request will immediately cancel the payout and credit ₦${w.amount.toLocaleString()} back to @${w.user?.username}'s wallet available balance.`,
      variant: 'danger',
      confirmText: 'Reject & Issue Refund',
      isPrompt: true,
      inputLabel: 'Rejection Reason (Required for audit & user notification)',
      inputPlaceholder: 'e.g. Invalid bank account name mismatch, fraud flag, suspicious watch velocity...',
      details: [
        { label: 'Recipient', value: `@${w.user?.username}` },
        { label: 'Refund Amount', value: `₦${w.amount.toLocaleString()}` },
        { label: 'Bank Account', value: `${bankInfo.bankName} - ${bankInfo.accountNumber}` },
      ],
    });
  };

  const handleConfirmAction = async (inputValue?: string) => {
    const w = actionModalConfig.withdrawal;
    if (!w) return;

    setActionLoading(true);
    setMessage(null);

    const res = await apiRequest(`/withdrawals/${w.id}/review`, {
      method: 'POST',
      body: JSON.stringify({
        action: actionModalConfig.action,
        reviewNote: inputValue || undefined,
      }),
    });

    if (res.success) {
      setMessage({
        type: 'success',
        text:
          actionModalConfig.action === 'APPROVE'
            ? `Withdrawal approved and marked as completed.`
            : `Withdrawal rejected and funds refunded to user available balance.`,
      });
      setActionModalConfig((prev) => ({ ...prev, isOpen: false }));
      if (selectedWithdrawal?.id === w.id) {
        setSelectedWithdrawal(null);
      }
      await fetchWithdrawals();
    } else {
      setMessage({
        type: 'error',
        text: res.error?.message || 'Failed to process withdrawal action',
      });
    }

    setActionLoading(false);
  };

  // Filter withdrawals by search query
  const filteredWithdrawals = withdrawals.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    let bankInfo: any = {};
    try {
      bankInfo = JSON.parse(w.accountDetailsJson || '{}');
    } catch {}

    return (
      w.user?.username?.toLowerCase().includes(q) ||
      w.user?.email?.toLowerCase().includes(q) ||
      bankInfo.bankName?.toLowerCase().includes(q) ||
      bankInfo.accountNumber?.includes(q) ||
      bankInfo.accountName?.toLowerCase().includes(q)
    );
  });

  const totalItems = filteredWithdrawals.length;
  const paginatedWithdrawals = filteredWithdrawals.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by username, email, bank, account number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Queue Count:</span>
          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            {totalItems} Pending
          </span>
        </div>
      </div>

      {/* Withdrawals Table Container */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Pending Payout Requests</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Funds are currently on hold via immutable ledger debit. Rejection will automatically issue a refund credit.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Loading withdrawal queue...
          </div>
        ) : totalItems === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/40" />
            <p className="font-semibold text-slate-400">No pending withdrawals in queue.</p>
            <p className="text-[11px]">All payout requests have been verified and settled.</p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">User Details</th>
                    <th className="py-3.5 px-4">Requested Date</th>
                    <th className="py-3.5 px-4">Gross & Net Amount</th>
                    <th className="py-3.5 px-4">Bank Account Info</th>
                    <th className="py-3.5 px-4">Risk Evaluation</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedWithdrawals.map((w) => {
                    let bankInfo: any = {};
                    try {
                      bankInfo = JSON.parse(w.accountDetailsJson || '{}');
                    } catch {}

                    const riskScore = w.user?.riskScore?.score || 0;
                    const isHighRisk = riskScore >= 50;

                    return (
                      <tr
                        key={w.id}
                        onClick={() => setSelectedWithdrawal(w)}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        {/* User */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white flex items-center gap-1.5 group-hover:text-emerald-300 transition-colors">
                            <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                            @{w.user?.username || 'User'}
                          </p>
                          <p className="text-[11px] text-slate-400">{w.user?.email}</p>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(w.createdAt).toLocaleDateString()} {new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                            {isHighRisk ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                            Score: {riskScore}/100
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => openApproveModal(w)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1 transition-all"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(w)}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-1 transition-all"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Table View (100% responsive, zero horizontal overflow) */}
            <div className="md:hidden">
              <MobileTable>
                {paginatedWithdrawals.map((w) => {
                  let bankInfo: any = {};
                  try {
                    bankInfo = JSON.parse(w.accountDetailsJson || '{}');
                  } catch {}
                  const riskScore = w.user?.riskScore?.score || 0;
                  const isHighRisk = riskScore >= 50;

                  return (
                    <MobileTableRow
                      key={w.id}
                      onClick={() => setSelectedWithdrawal(w)}
                      avatar={
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      }
                      title={`@${w.user?.username || 'User'}`}
                      subtitle={w.user?.email}
                      badge={
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 flex-shrink-0 ${
                            isHighRisk
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {isHighRisk && <ShieldAlert className="w-3 h-3" />}
                          Risk: {riskScore}/100
                        </span>
                      }
                      dataGrid={
                        <>
                          <MobileDataCell label="Net Payout" value={`₦${w.netAmount.toLocaleString()}`} highlight highlightColor="text-emerald-400 font-bold" />
                          <MobileDataCell label="Gross & Fee" value={`₦${w.amount.toLocaleString()} (Fee: ₦${w.fee})`} />
                          <MobileDataCell label="Bank Name" value={bankInfo.bankName || 'Bank'} />
                          <MobileDataCell label="Account No" value={bankInfo.accountNumber || 'N/A'} copyable />
                          <MobileDataCell label="Account Name" value={bankInfo.accountName || 'N/A'} />
                          <MobileDataCell label="Requested" value={new Date(w.createdAt).toLocaleDateString()} />
                        </>
                      }
                      actions={
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => openApproveModal(w)}
                            className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(w)}
                            className="py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      }
                    />
                  );
                })}
              </MobileTable>
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
      {selectedWithdrawal && (
        <DetailDrawer
          isOpen={Boolean(selectedWithdrawal)}
          onClose={() => setSelectedWithdrawal(null)}
          title={`Payout @${selectedWithdrawal.user?.username || 'User'}`}
          subtitle={`Requested: ${new Date(selectedWithdrawal.createdAt).toLocaleDateString()}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Pending Payout
            </span>
          }
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          footerActions={
            <>
              <button
                type="button"
                onClick={() => openRejectModal(selectedWithdrawal)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <X className="w-4 h-4" /> Reject & Refund
              </button>
              <button
                type="button"
                onClick={() => openApproveModal(selectedWithdrawal)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" /> Approve Payout
              </button>
            </>
          }
        >
          {/* User Section */}
          <DrawerSection title="User Information">
            <DrawerItem label="Username" value={`@${selectedWithdrawal.user?.username}`} copyable />
            <DrawerItem label="Email" value={selectedWithdrawal.user?.email || 'N/A'} copyable />
            <DrawerItem label="User ID" value={selectedWithdrawal.userId} copyable />
          </DrawerSection>

          {/* Amount Section */}
          <DrawerSection title="Withdrawal Amounts">
            <DrawerItem
              label="Net Payout Amount"
              value={`₦${selectedWithdrawal.netAmount.toLocaleString()}`}
            />
            <DrawerItem
              label="Gross Requested Amount"
              value={`₦${selectedWithdrawal.amount.toLocaleString()}`}
            />
            <DrawerItem
              label="Processing Fee"
              value={`₦${selectedWithdrawal.fee.toLocaleString()}`}
            />
            <DrawerItem
              label="Requested Date"
              value={new Date(selectedWithdrawal.createdAt).toLocaleString()}
            />
          </DrawerSection>

          {/* Bank Section */}
          {(() => {
            let bankInfo: any = {};
            try {
              bankInfo = JSON.parse(selectedWithdrawal.accountDetailsJson || '{}');
            } catch {}
            return (
              <DrawerSection title="Destination Bank Account">
                <DrawerItem label="Bank Name" value={bankInfo.bankName || 'N/A'} copyable />
                <DrawerItem
                  label="Account Number"
                  value={bankInfo.accountNumber || 'N/A'}
                  copyable
                />
                <DrawerItem
                  label="Account Holder Name"
                  value={bankInfo.accountName || 'N/A'}
                  copyable
                />
                {bankInfo.recipientCode && (
                  <DrawerItem
                    label="Paystack Recipient Code"
                    value={bankInfo.recipientCode}
                    copyable
                  />
                )}
              </DrawerSection>
            );
          })()}

          {/* Risk Evaluation Section */}
          <DrawerSection title="Risk Surveillance Metrics">
            <DrawerItem
              label="Calculated Risk Score"
              value={`${selectedWithdrawal.user?.riskScore?.score || 0} / 100`}
            />
            <DrawerItem
              label="Risk Classification"
              value={
                (selectedWithdrawal.user?.riskScore?.score || 0) >= 50 ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> High Risk Account
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Normal Risk Account
                  </span>
                )
              }
            />
          </DrawerSection>
        </DetailDrawer>
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
