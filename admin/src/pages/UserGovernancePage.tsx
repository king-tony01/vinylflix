import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Shield,
} from 'lucide-react';

export const UserGovernancePage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (roleFilter) query.append('role', roleFilter);
    if (statusFilter) query.append('status', statusFilter);

    const res = await apiRequest(`/admin/users?${query.toString()}`);
    if (res.success && res.data) {
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter]);

  const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED') => {
    const reason = window.prompt(`Enter reason for setting status to ${newStatus}:`);
    if (!reason) return;

    setActionLoading(userId);
    setMessage(null);

    const res = await apiRequest(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, reason }),
    });

    if (res.success) {
      setMessage({
        type: 'success',
        text: `User status successfully updated to ${newStatus}.`,
      });
      fetchUsers();
    } else {
      setMessage({
        type: 'error',
        text: res.error?.message || 'Failed to update user status',
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
            User Accounts & Governance <Users className="w-6 h-6 text-purple-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search registered accounts, view wallet balances & risk metrics, and manage user status.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
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
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by username, email, referral code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
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
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="RESTRICTED">RESTRICTED</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Registered Users ({total})</h3>
        </div>

        {/* Desktop / Tablet Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Role & Tier</th>
                <th className="py-3 px-4">Wallet Balances</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {users.map((u) => {
                const isSuspended = u.status === 'SUSPENDED';
                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* User */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{u.username}</p>
                      <p className="text-[10px] text-slate-400">
                        {u.email} • Code: <span className="font-mono text-purple-400">{u.referralCode}</span>
                      </p>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-[10px]">
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Score: {u.riskScore?.score || 0}/100
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {isSuspended ? (
                        <button
                          onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                          disabled={actionLoading === u.id}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold transition-all"
                        >
                          <Unlock className="w-3 h-3 inline mr-1" /> Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                          disabled={actionLoading === u.id}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-[10px] font-bold transition-all"
                        >
                          <Lock className="w-3 h-3 inline mr-1" /> Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="md:hidden divide-y divide-slate-800">
          {users.map((u) => {
            const isSuspended = u.status === 'SUSPENDED';
            return (
              <div key={u.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-sm">{u.username}</p>
                      <span className="font-semibold px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                        {u.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{u.email}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Code: <span className="font-mono text-purple-400">{u.referralCode}</span>
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      u.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {u.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400">Available:</span>
                    <p className="font-bold text-emerald-400">₦{(u.wallet?.availableBalance || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Risk Score:</span>
                    <p className="font-bold text-slate-300">{u.riskScore?.score || 0}/100</p>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  {isSuspended ? (
                    <button
                      onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                      disabled={actionLoading === u.id}
                      className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold"
                    >
                      <Unlock className="w-3.5 h-3.5 inline mr-1" /> Restore Account
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                      disabled={actionLoading === u.id}
                      className="w-full py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold"
                    >
                      <Lock className="w-3.5 h-3.5 inline mr-1" /> Suspend Account
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
