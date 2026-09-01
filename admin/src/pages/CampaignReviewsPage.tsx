import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  XCircle,
  Youtube,
} from 'lucide-react';

export const CampaignReviewsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    const res = await apiRequest('/campaigns/my');
    if (res.success && res.data) {
      setCampaigns(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleUpdateStatus = async (
    campaignId: string,
    status: 'ACTIVE' | 'PAUSED' | 'REJECTED'
  ) => {
    const note = window.prompt(`Enter review/moderation note for status ${status}:`);
    setActionLoading(campaignId);
    setMessage(null);

    const res = await apiRequest(`/campaigns/${campaignId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewNote: note || undefined }),
    });

    if (res.success) {
      setMessage({
        type: 'success',
        text: `Campaign status updated to ${status}.`,
      });
      fetchCampaigns();
    } else {
      setMessage({
        type: 'error',
        text: res.error?.message || 'Failed to update campaign status',
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
            Campaign Moderation & Reviews <Layers className="w-6 h-6 text-indigo-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit advertiser video promotions, verify YouTube content guidelines, and approve reward funding.
          </p>
        </div>

        <button
          onClick={fetchCampaigns}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Campaigns
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

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {campaigns.map((c) => {
          const spentPercent = Math.min(100, Math.round((c.spentBudget / c.totalBudget) * 100));

          return (
            <div key={c.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">{c.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    Target: {c.video?.title || c.videoId}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    c.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : c.status === 'PENDING_REVIEW'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {c.status}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold">Total Budget</span>
                  <p className="font-bold text-white mt-0.5">₦{c.totalBudget.toLocaleString()}</p>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-emerald-400 font-semibold">Remaining</span>
                  <p className="font-bold text-emerald-400 mt-0.5">₦{c.remainingBudget.toLocaleString()}</p>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-purple-400 font-semibold">Reward / View</span>
                  <p className="font-bold text-white mt-0.5">₦{c.rewardPerQualifiedView}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Spent: ₦{c.spentBudget.toLocaleString()}</span>
                  <span>{spentPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${spentPercent}%` }} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                {c.status !== 'ACTIVE' && (
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'ACTIVE')}
                    disabled={actionLoading === c.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-all flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5" /> Approve & Activate
                  </button>
                )}

                {c.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'PAUSED')}
                    disabled={actionLoading === c.id}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-bold text-xs transition-all flex items-center gap-1"
                  >
                    <Pause className="w-3.5 h-3.5" /> Pause Campaign
                  </button>
                )}

                <button
                  onClick={() => handleUpdateStatus(c.id, 'REJECTED')}
                  disabled={actionLoading === c.id}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-bold text-xs transition-all flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
