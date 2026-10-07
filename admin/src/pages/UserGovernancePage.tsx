import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { AdminActionModal } from '../components/AdminActionModal.js';
import { DetailDrawer, DrawerSection, DrawerItem } from '../components/DetailDrawer.js';
import { Pagination } from '../components/Pagination.js';
import { MobileTable, MobileTableRow, MobileDataCell } from '../components/MobileTable.js';
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  DollarSign,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const UserGovernancePage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Detail Drawer State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Action Modal State
  const [actionModalConfig, setActionModalConfig] = useState<{
    isOpen: boolean;
    user: any | null;
    targetStatus: 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED';
    title: string;
    description: string;
    variant: 'danger' | 'warning' | 'success';
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

  const fetchUsers = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (roleFilter) query.append('role', roleFilter);
    if (statusFilter) query.append('status', statusFilter);
    query.append('page', String(currentPage));
    query.append('limit', String(pageSize));

    const res = await apiRequest(`/admin/users?${query.toString()}`);
    if (res.success && res.data) {
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, currentPage, pageSize]);

  const openStatusChangeModal = (user: any, newStatus: 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED') => {
    const isSuspension = newStatus === 'SUSPENDED';
    const isRestoration = newStatus === 'ACTIVE';

    setActionModalConfig({
      isOpen: true,
      user,
      targetStatus: newStatus,
      title: isRestoration
        ? `Restore Account Access: @${user.username}`
        : isSuspension
        ? `Suspend User Account: @${user.username}`
        : `Restrict User Account: @${user.username}`,
      description: isRestoration
        ? `Re-enable account privileges and allow @${user.username} to log in and withdraw funds.`
        : isSuspension
        ? `Suspending will immediately lock this account, prevent logins, and freeze all wallet disbursements.`
        : `Restricting will limit high-risk privileges for this account.`,
      variant: isRestoration ? 'success' : isSuspension ? 'danger' : 'warning',
      confirmText: isRestoration ? 'Restore Access' : isSuspension ? 'Suspend Account' : 'Apply Restriction',
      isPrompt: true,
      inputLabel: 'Audit & Notification Reason',
      inputPlaceholder: 'Enter clear reason for this action (logged for security audit)...',
      details: [
        { label: 'Username', value: `@${user.username}` },
        { label: 'Email', value: user.email },
        { label: 'Current Role', value: user.role },
        { label: 'Available Balance', value: `₦${(user.wallet?.availableBalance || 0).toLocaleString()}` },
        { label: 'Risk Score', value: `${user.riskScore?.score || 0}/100` },
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
        reason: inputValue || 'Administrative action',
      }),
    });

    if (res.success) {
      setMessage({
        type: 'success',
        text: `User status for @${user.username} updated to ${actionModalConfig.targetStatus}.`,
      });
      setActionModalConfig((prev) => ({ ...prev, isOpen: false }));
      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }
      await fetchUsers();
    } else {
      setMessage({
        type: 'error',
        text: res.error?.message || 'Failed to update user status',
      });
    }

    setActionLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            User Accounts & Governance <Users className="w-6 h-6 text-purple-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search registered accounts, view wallet balances & risk metrics, and manage user status.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto shadow-md"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Directory
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

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by username, email, referral code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Roles</option>
            <option value="USER">Free User (USER)</option>
            <option value="PAID_MEMBER">Paid Member</option>
            <option value="CREATOR">Creator / Advertiser</option>
            <option value="ADMIN">Administrator</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="RESTRICTED">RESTRICTED</option>
          </select>
        </div>
      </div>

      {/* Directory Table Container */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Registered Users Directory</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {users.length} of {total} registered accounts
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-400" /> Loading user directory...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-700" />
            <p className="font-semibold text-slate-400">No users found matching the query.</p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">User Details</th>
                    <th className="py-3.5 px-4">Role & Tier</th>
                    <th className="py-3.5 px-4">Wallet Balances</th>
                    <th className="py-3.5 px-4">Risk Level</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => {
                    const isSuspended = u.status === 'SUSPENDED';
                    const riskScore = u.riskScore?.score || 0;

                    return (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        {/* User */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white group-hover:text-purple-300 transition-colors">
                            {u.username}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {u.email} • Code: <span className="font-mono text-purple-400">{u.referralCode}</span>
                          </p>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-[10px]">
                            {u.role}
                          </span>
                        </td>

                        {/* Balances */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-emerald-400">
                            Avail: ₦{(u.wallet?.availableBalance || 0).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-amber-400">
                            Locked: ₦{(u.wallet?.lockedBalance || 0).toLocaleString()}
                          </p>
                        </td>

                        {/* Risk */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                              riskScore >= 50
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            Score: {riskScore}/100
                          </span>
                        </td>

                        {/* Status */}
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

                        {/* Actions */}
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

            {/* Mobile Table View (100% responsive, zero horizontal overflow) */}
            <div className="md:hidden">
              <MobileTable>
                {users.map((u) => {
                  const isSuspended = u.status === 'SUSPENDED';
                  const riskScore = u.riskScore?.score || 0;

                  return (
                    <MobileTableRow
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      avatar={
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                          {u.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      }
                      title={`@${u.username}`}
                      subtitle={`${u.email} • Code: ${u.referralCode}`}
                      badge={
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {u.status}
                        </span>
                      }
                      dataGrid={
                        <>
                          <MobileDataCell label="Assigned Role" value={u.role} highlight highlightColor="text-purple-300" />
                          <MobileDataCell label="Available Balance" value={`₦${(u.wallet?.availableBalance || 0).toLocaleString()}`} highlight highlightColor="text-emerald-400 font-bold" />
                          <MobileDataCell label="Locked Balance" value={`₦${(u.wallet?.lockedBalance || 0).toLocaleString()}`} />
                          <MobileDataCell
                            label="Risk Score"
                            value={`${riskScore}/100`}
                            highlight
                            highlightColor={riskScore >= 50 ? 'text-rose-400 font-bold' : 'text-slate-300'}
                          />
                        </>
                      }
                      actions={
                        isSuspended ? (
                          <button
                            onClick={() => openStatusChangeModal(u, 'ACTIVE')}
                            className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Unlock className="w-3.5 h-3.5" /> Restore Account Access
                          </button>
                        ) : (
                          <button
                            onClick={() => openStatusChangeModal(u, 'SUSPENDED')}
                            className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Lock className="w-3.5 h-3.5" /> Suspend Account
                          </button>
                        )
                      }
                    />
                  );
                })}
              </MobileTable>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={total}
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
          title={`@${selectedUser.username}`}
          subtitle={`User ID: ${selectedUser.id}`}
          badge={
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                selectedUser.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {selectedUser.status}
            </span>
          }
          icon={<Users className="w-5 h-5 text-purple-400" />}
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
                <Lock className="w-4 h-4" /> Suspend Account
              </button>
            )
          }
        >
          {/* Identity Section */}
          <DrawerSection title="Account Identity">
            <DrawerItem label="Username" value={`@${selectedUser.username}`} copyable />
            <DrawerItem label="Email" value={selectedUser.email} copyable />
            <DrawerItem label="Phone" value={selectedUser.phone || 'N/A'} copyable />
            <DrawerItem label="Referral Code" value={selectedUser.referralCode} copyable />
            <DrawerItem
              label="Joined Date"
              value={new Date(selectedUser.createdAt).toLocaleDateString()}
            />
          </DrawerSection>

          {/* Membership & Role */}
          <DrawerSection title="Role & Membership">
            <DrawerItem label="Assigned Role" value={selectedUser.role} />
            <DrawerItem
              label="Email Verified"
              value={selectedUser.emailVerified ? 'Verified' : 'Unverified'}
            />
            {selectedUser.membership && (
              <DrawerItem
                label="Membership Plan"
                value={selectedUser.membership.tier?.name || 'Active Plan'}
              />
            )}
          </DrawerSection>

          {/* Wallet Section */}
          <DrawerSection title="Ledger & Wallet Balances">
            <DrawerItem
              label="Available Balance"
              value={`₦${(selectedUser.wallet?.availableBalance || 0).toLocaleString()}`}
            />
            <DrawerItem
              label="Locked / Escrow Balance"
              value={`₦${(selectedUser.wallet?.lockedBalance || 0).toLocaleString()}`}
            />
            <DrawerItem
              label="Total Earnings"
              value={`₦${(selectedUser.wallet?.totalEarnings || 0).toLocaleString()}`}
            />
            <DrawerItem
              label="Total Withdrawn"
              value={`₦${(selectedUser.wallet?.totalWithdrawn || 0).toLocaleString()}`}
            />
          </DrawerSection>

          {/* Risk Section */}
          <DrawerSection title="Risk Surveillance">
            <DrawerItem
              label="Risk Score"
              value={`${selectedUser.riskScore?.score || 0} / 100`}
            />
            <DrawerItem
              label="Risk Level"
              value={
                (selectedUser.riskScore?.score || 0) >= 50 ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> High Risk
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Normal
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
        inputRequired={true}
        inputLabel={actionModalConfig.inputLabel}
        inputPlaceholder={actionModalConfig.inputPlaceholder}
        details={actionModalConfig.details}
        loading={actionLoading}
      />
    </div>
  );
};
