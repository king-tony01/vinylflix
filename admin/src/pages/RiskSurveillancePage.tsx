import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Eye,
  Smartphone,
  Zap,
  Activity,
} from 'lucide-react';

export const RiskSurveillancePage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRiskData = async () => {
    setLoading(true);
    const res = await apiRequest('/admin/users?limit=50');
    if (res.success && res.data) {
      // Sort by risk score descending
      const sorted = (res.data.users || []).sort(
        (a: any, b: any) => (b.riskScore?.score || 0) - (a.riskScore?.score || 0)
      );
      setUsers(sorted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

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
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Telemetry
        </button>
      </div>

      {/* Rules Explanatory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <Zap className="w-4 h-4" /> Watch Time Acceleration
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Flags watch sessions where client playback duration exceeds elapsed wall-clock duration by &gt;5 seconds.
          </p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Smartphone className="w-4 h-4" /> Device & Fingerprint Reuse
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Tracks unique canvas/browser fingerprints across registrations to detect single-user multi-account farms.
          </p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
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
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Account Risk Rankings</h3>
          <p className="text-xs text-slate-400 mt-0.5">Users ordered by risk score (0-100 scale).</p>
        </div>

        {/* Desktop / Tablet Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Risk Classification</th>
                <th className="py-3 px-4">Triggered Anomaly Flags</th>
                <th className="py-3 px-4 text-right">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {users.map((u) => {
                const score = u.riskScore?.score || 0;
                let flags: string[] = [];
                try {
                  flags = JSON.parse(u.riskScore?.flagsJson || '[]');
                } catch {}

                const level = u.riskScore?.riskLevel || (score >= 80 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW');

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{u.username}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-sm">
                      <span className={score >= 50 ? 'text-rose-400' : score >= 25 ? 'text-amber-400' : 'text-emerald-400'}>
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

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {u.status}
                      </span>
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
            const score = u.riskScore?.score || 0;
            let flags: string[] = [];
            try {
              flags = JSON.parse(u.riskScore?.flagsJson || '[]');
            } catch {}
            const level = u.riskScore?.riskLevel || (score >= 80 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW');

            return (
              <div key={u.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white text-sm">{u.username}</p>
                    <p className="text-[11px] text-slate-400">{u.email}</p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
