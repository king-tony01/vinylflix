import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { AdminActionModal } from '../components/AdminActionModal.js';
import { DetailDrawer, DrawerSection, DrawerItem } from '../components/DetailDrawer.js';
import { Pagination } from '../components/Pagination.js';
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Eye,
  Smartphone,
  Zap,
  Activity,
  ShieldCheck,
  Lock,
  Unlock,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const RiskSurveillancePage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Detail Drawer
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Action Modal State
  const [actionModalConfig, setActionModalConfig] = useState<{
    isOpen: boolean;
    user: any | null;
    targetStatus: 'ACTIVE' | 'SUSPENDED';
    title: string;
    description: string;
    variant: 'danger' | 'success';
    confirmText: string;
    isPrompt?: boolean;
    inputLabel?: string;
    inputPlaceholder?: string;
    details?: Array<{ label: string; value: React.ReactNode }>;
  }>({
    isOpen: false,
    user: null,
    targetStatus: 'SUSPENDED',
    title: '',
    description: '',
    variant: 'danger',
    confirmText: 'Confirm',
  });

  const fetchRiskData = async () => {
    setLoading(true);
    const res = await apiRequest('/admin/users?limit=100');
    if (res.success && res.data) {
      // Sort by risk score descending
      const sorted = (res.data.users || []).sort(
        (a: any, b: any) => (b.riskScore?.score || 0) - (a.riskScore?.score || 0)
      );
      setUsers(sorted);
      setCurrentPage(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  const openStatusChangeModal = (user: any, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    const isSuspension = newStatus === 'SUSPENDED';

    setActionModalConfig({
      isOpen: true,
      user,
      targetStatus: newStatus,
      title: isSuspension
        ? `Freeze High-Risk Account: @${user.username}`
        : `Restore Account Access: @${user.username}`,
      description: isSuspension
        ? `Suspending will immediately lock this account and freeze all pending payouts and referral earnings.`
        : `Re-enable account access and remove risk suspensions.`,
      variant: isSuspension ? 'danger' : 'success',
      confirmText: isSuspension ? 'Suspend Account' : 'Restore Access',
      isPrompt: true,
      inputLabel: 'Security Reason',
      inputPlaceholder: 'e.g. Fraud detection: Multi-account device collision or playback botting...',
      details: [
        { label: 'Username', value: `@${user.username}` },
        { label: 'Risk Score', value: `${user.riskScore?.score || 0}/100` },
        { label: 'Available Balance', value: `₦${(user.wallet?.availableBalance || 0).toLocaleString()}` },
      ],
    });
  };

  const handleConfirmAction = async (inputValue?: string) => {
    const user = actionModalConfig.user;
    if (!user) return;

    setActionLoading(true);
    setMessage(null);

    const res = await apiRequest(`/admin/users/${user.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: actionModalConfig.targetStatus,
        reason: inputValue || 'Risk surveillance enforcement',
      }),
    });

    if (res.success) {
      setMessage({
        type: 'success',
        text: `Account status for @${user.username} successfully updated.`,
      });
      setActionModalConfig((prev) => ({ ...prev, isOpen: false }));
      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }
      await fetchRiskData();
    } else {
      setMessage({
        type: 'error',
        text: res.error?.message || 'Failed to update account status',
      });
    }

    setActionLoading(false);
  };

  const totalItems = users.length;
  const paginatedUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            Risk Surveillance & Anti-Fraud <ShieldAlert className="w-6 h-6 text-rose-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time fraud surveillance detecting playback acceleration, multi-accounting, and referral velocity spikes.
          </p>
        </div>

        <button
          onClick={fetchRiskData}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto shadow-md"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Telemetry
        </button>
      </div>

      {/* Message Banner */}
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

      {/* Rules Explanatory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <Zap className="w-4 h-4" /> Watch Time Acceleration
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Flags watch sessions where client playback duration exceeds elapsed wall-clock duration by &gt;5 seconds.
          </p>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Smartphone className="w-4 h-4" /> Device & Fingerprint Reuse
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Tracks unique canvas/browser fingerprints across registrations to detect single-user multi-account farms.
          </p>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
            <Activity className="w-4 h-4" /> Referral Velocity Spike
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Triggers review when an account receives &gt;5 referrals within a 10-minute window.
          </p>
        </div>
      </div>

      {/* Flagged Accounts Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Account Risk Rankings</h3>
            <p className="text-xs text-slate-400 mt-0.5">Users ordered by risk score (0-100 scale).</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-rose-400" /> Computing telemetry ranking...
          </div>
        ) : totalItems === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400" />
            <p className="font-semibold text-slate-400">No risk signals detected across all users.</p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Risk Score</th>
                    <th className="py-3.5 px-4">Risk Classification</th>
                    <th className="py-3.5 px-4">Triggered Anomaly Flags</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedUsers.map((u) => {
                    const score = u.riskScore?.score || 0;
                    let flags: string[] = [];
                    try {
                      flags = JSON.parse(u.riskScore?.flagsJson || '[]');
                    } catch {}

                    const level =
                      u.riskScore?.riskLevel ||
                      (score >= 80 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW');
                    const isSuspended = u.status === 'SUSPENDED';

                    return (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white group-hover:text-rose-300 transition-colors">
                            {u.username}
                          </p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-sm">
                          <span
                            className={
                              score >= 50
                                ? 'text-rose-400'
                                : score >= 25
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }
                          >
                            {score}/100
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              level === 'CRITICAL' || level === 'HIGH'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : level === 'MEDIUM'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {level}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {flags.length === 0 ? (
                            <span className="text-slate-500 text-[11px]">No active anomalies</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {flags.map((f, idx) => (
                                <span
                                  key={idx}
                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/20"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isSuspended ? (
                              <button
                                onClick={() => openStatusChangeModal(u, 'ACTIVE')}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1"
                              >
                                <Unlock className="w-3.5 h-3.5" /> Restore
                              </button>
                            ) : (
                              <button
                                onClick={() => openStatusChangeModal(u, 'SUSPENDED')}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-1"
                              >
                                <Lock className="w-3.5 h-3.5" /> Suspend
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

            {/* Mobile Adaptive Cards View */}
            <div className="md:hidden divide-y divide-slate-800/80">
              {paginatedUsers.map((u) => {
                const score = u.riskScore?.score || 0;
                let flags: string[] = [];
                try {
                  flags = JSON.parse(u.riskScore?.flagsJson || '[]');
                } catch {}
                const level =
                  u.riskScore?.riskLevel ||
                  (score >= 80 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW');
                const isSuspended = u.status === 'SUSPENDED';

                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="p-4 space-y-2.5 active:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-sm truncate">{u.username}</p>
                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${
                          level === 'CRITICAL' || level === 'HIGH'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : level === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {level} ({score}/100)
                      </span>
                    </div>

                    {flags.length > 0 ? (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {flags.map((f, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/20"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">No active anomalies detected</p>
                    )}

                    <div
                      className="pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isSuspended ? (
                        <button
                          onClick={() => openStatusChangeModal(u, 'ACTIVE')}
                          className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5" /> Restore Account Access
                        </button>
                      ) : (
                        <button
                          onClick={() => openStatusChangeModal(u, 'SUSPENDED')}
                          className="w-full py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" /> Suspend Account
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
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
      {selectedUser && (
        <DetailDrawer
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title={`Risk Audit: @${selectedUser.username}`}
          subtitle={`User ID: ${selectedUser.id}`}
          badge={
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                (selectedUser.riskScore?.score || 0) >= 50
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              Risk: {selectedUser.riskScore?.score || 0}/100
            </span>
          }
          icon={<ShieldAlert className="w-5 h-5 text-rose-400" />}
          footerActions={
            selectedUser.status === 'SUSPENDED' ? (
              <button
                type="button"
                onClick={() => openStatusChangeModal(selectedUser, 'ACTIVE')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Unlock className="w-4 h-4" /> Restore Account Access
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openStatusChangeModal(selectedUser, 'SUSPENDED')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-lg shadow-rose-500/30 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Lock className="w-4 h-4" /> Suspend High-Risk Account
              </button>
            )
          }
        >
          {/* Risk Metrics */}
          <DrawerSection title="Risk Surveillance Score & Level">
            <DrawerItem
              label="Risk Score"
              value={`${selectedUser.riskScore?.score || 0} / 100`}
            />
            <DrawerItem
              label="Risk Classification"
              value={selectedUser.riskScore?.riskLevel || 'STANDARD'}
            />
            <DrawerItem label="Account Status" value={selectedUser.status} />
          </DrawerSection>

          {/* Anomaly Breakdown */}
          <DrawerSection title="Detected Anomaly Flags">
            {(() => {
              let flags: string[] = [];
              try {
                flags = JSON.parse(selectedUser.riskScore?.flagsJson || '[]');
              } catch {}

              if (flags.length === 0) {
                return <p className="text-slate-500 italic">No anomalies triggered on this account.</p>;
              }

              return (
                <div className="space-y-2">
                  {flags.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-[11px] flex items-center gap-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </DrawerSection>

          {/* Account Profile */}
          <DrawerSection title="User Profile Details">
            <DrawerItem label="Username" value={`@${selectedUser.username}`} copyable />
            <DrawerItem label="Email" value={selectedUser.email} copyable />
            <DrawerItem label="Role" value={selectedUser.role} />
            <DrawerItem
              label="Available Balance"
              value={`₦${(selectedUser.wallet?.availableBalance || 0).toLocaleString()}`}
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
        inputRequired={true}
        inputLabel={actionModalConfig.inputLabel}
        inputPlaceholder={actionModalConfig.inputPlaceholder}
        details={actionModalConfig.details}
        loading={actionLoading}
      />
    </div>
  );
};
