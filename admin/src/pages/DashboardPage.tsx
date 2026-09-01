import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import {
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMetrics = async () => {
    setLoading(true);
    const res = await apiRequest('/admin/metrics');
    if (res.success && res.data) {
      setMetrics(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            Platform Executive Overview <Sparkles className="w-6 h-6 text-purple-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time financial reconciliation, user telemetry, active memberships, and risk indicators.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Telemetry
        </button>
      </div>

      {loading && !metrics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : metrics ? (
        <>
          {/* Top Level Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Users */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Accounts</span>
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-white mt-3">{metrics.users.total}</h3>
              <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
                {metrics.users.paidMembers} Active Paid Members
              </p>
            </div>

            {/* Total Revenue */}
            <div className="bg-slate-900/90 rounded-2xl border border-emerald-500/30 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Settled Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-emerald-400 mt-3">
                ₦{metrics.financials.totalRevenue.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">From membership & ad funding</p>
            </div>

            {/* Total Rewards Issued */}
            <div className="bg-slate-900/90 rounded-2xl border border-amber-500/30 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Rewards Distributed</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-amber-300 mt-3">
                ₦{metrics.financials.totalRewardsIssued.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Immutable ledger credits</p>
            </div>

            {/* Pending Withdrawals */}
            <div className="bg-slate-900/90 rounded-2xl border border-sky-500/30 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Withdrawal Queue</span>
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-white mt-3">
                {metrics.financials.pendingWithdrawalsCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {metrics.financials.completedWithdrawalsCount} Completed Payouts
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link
              to="/withdrawals"
              className="bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 p-6 rounded-2xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      Review Withdrawals
                    </h4>
                    <p className="text-xs text-slate-400">{metrics.financials.pendingWithdrawalsCount} pending requests</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
              </div>
            </Link>

            <Link
              to="/users"
              className="bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 p-6 rounded-2xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      User Governance
                    </h4>
                    <p className="text-xs text-slate-400">Directory, tiers & suspensions</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
              </div>
            </Link>

            <Link
              to="/risk"
              className="bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 p-6 rounded-2xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      Risk & Anti-Fraud
                    </h4>
                    <p className="text-xs text-slate-400">{metrics.risk.highRiskAlerts} high risk alerts</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
              </div>
            </Link>
          </div>

          {/* System Health & Ledger Status Box */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">System Health & Financial Ledger Integrity</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Services Operational
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Accounting Model:</span>
                <p className="font-bold text-white mt-1">Append-Only Double-Entry Ledger</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Cryptographically traceable balances</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Watch Anti-Cheat Engine:</span>
                <p className="font-bold text-emerald-400 mt-1">Active (Continuous Heartbeats)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Wall-clock & duration velocity checks</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Referral Qualification:</span>
                <p className="font-bold text-sky-400 mt-1">Server-Side Verified</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Automated milestone unlock triggers</p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
