import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { FileText, RefreshCw, Filter } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (targetTypeFilter) query.append('targetType', targetTypeFilter);

    const res = await apiRequest(`/admin/audit-logs?${query.toString()}`);
    if (res.success && res.data) {
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [targetTypeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            System Audit Trail & Event Logs <FileText className="w-6 h-6 text-purple-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tamper-evident chronological audit trail recording all administrative and financial actions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Logs
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Filter Target Type:</span>
          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Types</option>
            <option value="USER">USER</option>
            <option value="WITHDRAWAL">WITHDRAWAL</option>
            <option value="CAMPAIGN">CAMPAIGN</option>
            <option value="CONFIG">CONFIG</option>
            <option value="REWARD">REWARD</option>
            <option value="MEMBERSHIP">MEMBERSHIP</option>
            <option value="REFERRAL">REFERRAL</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">Total Recorded Events: {total}</span>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {/* Desktop / Tablet Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Reason / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {logs.map((log) => {
                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-purple-400">{log.actor?.username || 'SYSTEM'}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{log.actorId || '-'}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                      {log.targetType}:{log.targetId ? log.targetId.substring(0, 8) + '...' : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.reason || (log.newStateJson ? `State: ${log.newStateJson}` : '-')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="md:hidden divide-y divide-slate-800">
          {logs.map((log) => {
            return (
              <div key={log.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                    {log.action}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <p className="text-slate-300">
                    <span className="text-slate-500">Actor:</span>{' '}
                    <span className="font-semibold text-purple-400">{log.actor?.username || 'SYSTEM'}</span>
                  </p>
                  <p className="font-mono text-[11px] text-slate-400">
                    <span className="text-slate-500">Target:</span> {log.targetType}:{log.targetId ? log.targetId.substring(0, 8) + '...' : '-'}
                  </p>
                  {log.reason && (
                    <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                      {log.reason}
                    </p>
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
