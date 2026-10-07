import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { DetailDrawer, DrawerSection, DrawerItem } from '../components/DetailDrawer.js';
import { Pagination } from '../components/Pagination.js';
import {
  FileText,
  RefreshCw,
  Filter,
  User,
  Clock,
  ChevronRight,
  Info,
  Code,
  Shield,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Detail Drawer State
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (targetTypeFilter) query.append('targetType', targetTypeFilter);
    query.append('page', String(currentPage));
    query.append('limit', String(pageSize));

    const res = await apiRequest(`/admin/audit-logs?${query.toString()}`);
    if (res.success && res.data) {
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [targetTypeFilter, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            System Audit Trail & Event Logs <FileText className="w-6 h-6 text-purple-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tamper-evident chronological audit trail recording all administrative, financial, and security actions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto shadow-md"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Logs
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Target Type:</span>
          <select
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Target Types</option>
            <option value="USER">USER</option>
            <option value="WITHDRAWAL">WITHDRAWAL</option>
            <option value="CAMPAIGN">CAMPAIGN</option>
            <option value="CONFIG">CONFIG</option>
            <option value="REWARD">REWARD</option>
            <option value="MEMBERSHIP">MEMBERSHIP</option>
            <option value="REFERRAL">REFERRAL</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">Total Recorded Audit Events: <strong className="text-white">{total}</strong></span>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Event Stream</h3>
            <p className="text-xs text-slate-400 mt-0.5">Chronological record of system mutations</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-400" /> Loading audit trail...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-700" />
            <p className="font-semibold text-slate-400">No audit logs found for the selected filter.</p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Target Entity</th>
                    <th className="py-3.5 px-4">Reason / Notes</th>
                    <th className="py-3.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.map((log) => {
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        {/* Timestamp */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] group-hover:border-purple-500/50 transition-colors">
                            {log.action}
                          </span>
                        </td>

                        {/* Actor */}
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-purple-400 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.actor?.username || 'SYSTEM'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">{log.actorId ? log.actorId.substring(0, 10) + '...' : '-'}</p>
                        </td>

                        {/* Target */}
                        <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">
                          <span className="font-bold text-pink-300">{log.targetType}</span>
                          <span className="text-slate-500">:{log.targetId ? log.targetId.substring(0, 8) + '...' : '-'}</span>
                        </td>

                        {/* Reason */}
                        <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                          {log.reason || (log.newStateJson ? 'State Updated' : '-')}
                        </td>

                        {/* Details */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 group-hover:text-white transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Adaptive Cards View */}
            <div className="md:hidden divide-y divide-slate-800/80">
              {logs.map((log) => {
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="p-4 space-y-2.5 active:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-white px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px]">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Actor:</span>
                        <span className="font-semibold text-purple-400">{log.actor?.username || 'SYSTEM'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-mono">
                        <span className="text-slate-400">Target:</span>
                        <span className="text-slate-300">{log.targetType}:{log.targetId ? log.targetId.substring(0, 8) + '...' : '-'}</span>
                      </div>
                      {log.reason && (
                        <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-900 leading-relaxed">
                          {log.reason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
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
      {selectedLog && (
        <DetailDrawer
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Audit: ${selectedLog.action}`}
          subtitle={`Event ID: ${selectedLog.id}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30">
              {selectedLog.targetType}
            </span>
          }
          icon={<FileText className="w-5 h-5 text-purple-400" />}
        >
          {/* Action Details */}
          <DrawerSection title="Event Metadata">
            <DrawerItem label="Action Type" value={selectedLog.action} />
            <DrawerItem
              label="Timestamp"
              value={new Date(selectedLog.createdAt).toLocaleString()}
            />
            <DrawerItem label="Audit ID" value={selectedLog.id} copyable />
          </DrawerSection>

          {/* Actor Section */}
          <DrawerSection title="Actor Identity">
            <DrawerItem
              label="Actor Name"
              value={selectedLog.actor?.username || 'SYSTEM'}
              copyable
            />
            <DrawerItem label="Actor ID" value={selectedLog.actorId || 'SYSTEM'} copyable />
            {selectedLog.actor?.email && (
              <DrawerItem label="Actor Email" value={selectedLog.actor.email} copyable />
            )}
            {selectedLog.ipAddress && (
              <DrawerItem label="IP Address" value={selectedLog.ipAddress} copyable />
            )}
          </DrawerSection>

          {/* Target Section */}
          <DrawerSection title="Target Entity">
            <DrawerItem label="Entity Type" value={selectedLog.targetType} />
            <DrawerItem label="Entity ID" value={selectedLog.targetId || 'N/A'} copyable />
          </DrawerSection>

          {/* Reason Section */}
          {selectedLog.reason && (
            <DrawerSection title="Audit Notes / Reason">
              <p className="text-slate-300 leading-relaxed font-sans">{selectedLog.reason}</p>
            </DrawerSection>
          )}

          {/* Old vs New State Payloads if present */}
          {selectedLog.newStateJson && (
            <DrawerSection title="State Payload / Delta">
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-pink-300 overflow-x-auto whitespace-pre-wrap">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedLog.newStateJson), null, 2);
                  } catch {
                    return selectedLog.newStateJson;
                  }
                })()}
              </pre>
            </DrawerSection>
          )}

          {selectedLog.oldStateJson && (
            <DrawerSection title="Previous State Payload">
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedLog.oldStateJson), null, 2);
                  } catch {
                    return selectedLog.oldStateJson;
                  }
                })()}
              </pre>
            </DrawerSection>
          )}
        </DetailDrawer>
      )}
    </div>
  );
};
