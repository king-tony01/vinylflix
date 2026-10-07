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
  ExternalLink,
  Search,
  Clock,
  ShieldAlert,
  User,
  Check,
} from 'lucide-react';

type TabStatus = 'PENDING_REVIEW' | 'ACTIVE' | 'ALL' | 'PAUSED' | 'REJECTED';

export const CampaignReviewsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [stats, setStats] = useState<{ pendingCount: number; activeCount: number }>({
    pendingCount: 0,
    activeCount: 0,
  });
  const [activeTab, setActiveTab] = useState<TabStatus>('PENDING_REVIEW');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Review Reject Note Modal State
  const [rejectModalCampaign, setRejectModalCampaign] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const fetchCampaigns = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTab !== 'ALL') {
      params.append('status', activeTab);
    }
    if (search.trim()) {
      params.append('search', search.trim());
    }

    const res = await apiRequest(`/admin/campaigns?${params.toString()}`);
    if (res.success && res.data) {
      setCampaigns(res.data.campaigns || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCampaigns();
  };

  const handleReviewAction = async (
    campaignId: string,
    action: 'APPROVE' | 'REJECT' | 'PAUSE' | 'RESUME',
    reviewNote?: string
  ) => {
    setActionLoading(campaignId);
    setMessage(null);

    const res = await apiRequest(`/admin/campaigns/${campaignId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reviewNote }),
    });

    if (res.success) {
      setMessage({
        type: 'success',
        text: (res.data?.message as string) || `Campaign successfully updated.`,
      });
      setRejectModalCampaign(null);
      setRejectReason('');
      fetchCampaigns();
    } else {
      setMessage({
        type: 'error',
        text: res.error?.message || 'Failed to moderate campaign',
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
            Campaign Moderation & Feed Approval <Layers className="w-6 h-6 text-pink-500" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review and approve creator video promotions before they become visible on user feeds.
          </p>
        </div>

        <button
          onClick={fetchCampaigns}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-300">Pending Review</p>
            <p className="text-2xl font-black text-white mt-0.5">{stats.pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-300">Active on Feed</p>
            <p className="text-2xl font-black text-white mt-0.5">{stats.activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-pink-300">Enforcement Policy</p>
            <p className="text-xs font-bold text-white mt-0.5">Approval Required</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
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

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          {[
            { id: 'PENDING_REVIEW' as TabStatus, label: 'Pending Review', count: stats.pendingCount },
            { id: 'ACTIVE' as TabStatus, label: 'Active on Feed', count: stats.activeCount },
            { id: 'ALL' as TabStatus, label: 'All Campaigns', count: 0 },
            { id: 'PAUSED' as TabStatus, label: 'Paused', count: 0 },
            { id: 'REJECTED' as TabStatus, label: 'Rejected', count: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#FF0091] to-[#360099] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {Boolean(tab.count && tab.count > 0) && (
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
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search title, creator, video..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF0091]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-64 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-12 text-center text-slate-500 space-y-3">
          <Layers className="w-12 h-12 mx-auto text-slate-700" />
          <p className="text-sm font-semibold text-slate-400">
            No campaigns found under "{activeTab.replace('_', ' ')}".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {campaigns.map((c) => {
            const spentPercent = Math.min(100, Math.round((c.spentBudget / (c.totalBudget || 1)) * 100));
            const youtubeUrl = c.video?.youtubeVideoId
              ? `https://www.youtube.com/watch?v=${c.video.youtubeVideoId}`
              : null;

            return (
              <div key={c.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white leading-snug">{c.title}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-pink-400" />
                      <span>{c.advertiser?.username || 'Creator'} ({c.advertiser?.email})</span>
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0 ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : c.status === 'PENDING_REVIEW'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse'
                        : c.status === 'REJECTED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : c.status === 'PAUSED'
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {c.status === 'ACTIVE'
                      ? '🟢 Live on Feed'
                      : c.status === 'PENDING_REVIEW'
                      ? '⏳ Pending Review'
                      : c.status === 'REJECTED'
                      ? '🔴 Rejected'
                      : c.status}
                  </span>
                </div>

                {/* Target YouTube Video Preview */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
                  {c.video?.thumbnailUrl ? (
                    <img
                      src={c.video.thumbnailUrl}
                      alt={c.video.title}
                      className="w-20 h-12 object-cover rounded-lg flex-shrink-0 border border-slate-800"
                    />
                  ) : (
                    <div className="w-20 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                      <Youtube className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{c.video?.title || 'Promoted Video'}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {c.video?.channel?.channelTitle || 'Channel'} • {c.video?.durationSeconds || 0}s duration
                    </p>
                  </div>
                  {youtubeUrl && (
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex-shrink-0"
                      title="Open Video on YouTube"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
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
                    <span className="text-[10px] text-pink-400 font-semibold">Reward/View</span>
                    <p className="font-bold text-white mt-0.5">₦{c.rewardPerQualifiedView}</p>
                  </div>
                </div>

                {/* Spent Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Spent: ₦{c.spentBudget.toLocaleString()}</span>
                    <span>{spentPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-[#FF0091] to-[#360099] h-2 rounded-full" style={{ width: `${spentPercent}%` }} />
                  </div>
                </div>

                {/* Moderation Notes if rejected */}
                {c.reviewNote && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    <span className="text-slate-500 font-semibold">Moderator Note:</span> {c.reviewNote}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                  {c.status !== 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => handleReviewAction(c.id, 'APPROVE')}
                      disabled={actionLoading === c.id}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {actionLoading === c.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Approve & Push to Feed
                    </button>
                  )}

                  {c.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => handleReviewAction(c.id, 'PAUSE')}
                      disabled={actionLoading === c.id}
                      className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </button>
                  )}

                  {c.status !== 'REJECTED' && (
                    <button
                      type="button"
                      onClick={() => setRejectModalCampaign(c)}
                      disabled={actionLoading === c.id}
                      className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              Reject Campaign Promotion
            </h3>
            <p className="text-xs text-slate-400">
              Provide a reason for rejecting <strong className="text-white">{rejectModalCampaign.title}</strong>. This note will be visible to the creator.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Video content violates platform policies or is age-restricted..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalCampaign(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReviewAction(rejectModalCampaign.id, 'REJECT', rejectReason)}
                disabled={actionLoading === rejectModalCampaign.id}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
