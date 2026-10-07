import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { AdminActionModal } from '../components/AdminActionModal.js';
import { DetailDrawer, DrawerSection, DrawerItem } from '../components/DetailDrawer.js';
import { Pagination } from '../components/Pagination.js';
import { MobileTable, MobileTableRow, MobileDataCell } from '../components/MobileTable.js';
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
  X,
  ChevronRight,
  Info,
  DollarSign,
  BarChart2,
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
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Detail Drawer State
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);

  // Action Modal State
  const [actionModalConfig, setActionModalConfig] = useState<{
    isOpen: boolean;
    campaign: any | null;
    action: 'APPROVE' | 'REJECT' | 'PAUSE' | 'RESUME';
    title: string;
    description: string;
    variant: 'success' | 'danger' | 'warning' | 'primary';
    confirmText: string;
    isPrompt?: boolean;
    inputLabel?: string;
    inputPlaceholder?: string;
    details?: Array<{ label: string; value: React.ReactNode }>;
  }>({
    isOpen: false,
    campaign: null,
    action: 'APPROVE',
    title: '',
    description: '',
    variant: 'success',
    confirmText: 'Confirm',
  });

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
      setCurrentPage(1);
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

  const openApproveModal = (campaign: any) => {
    setActionModalConfig({
      isOpen: true,
      campaign,
      action: 'APPROVE',
      title: 'Approve Campaign & Push Live to Feed',
      description: `Approve "${campaign.title}" to start distributing rewarded views across eligible user feeds.`,
      variant: 'success',
      confirmText: 'Approve & Push to Feed',
      isPrompt: false,
      details: [
        { label: 'Campaign Title', value: campaign.title },
        { label: 'Creator', value: `@${campaign.advertiser?.username || 'Creator'}` },
        { label: 'Total Budget', value: `₦${campaign.totalBudget.toLocaleString()}` },
        { label: 'Reward / View', value: `₦${campaign.rewardPerQualifiedView}` },
        { label: 'Video', value: campaign.video?.title || 'YouTube Video' },
      ],
    });
  };

  const openRejectModal = (campaign: any) => {
    setActionModalConfig({
      isOpen: true,
      campaign,
      action: 'REJECT',
      title: 'Reject Campaign Promotion',
      description: `Provide a reason for rejecting "${campaign.title}". This note will be recorded and displayed to the creator.`,
      variant: 'danger',
      confirmText: 'Confirm Rejection',
      isPrompt: true,
      inputLabel: 'Rejection Reason',
      inputPlaceholder: 'e.g. Video violates community guidelines, copyright issues, or low content quality...',
      details: [
        { label: 'Campaign Title', value: campaign.title },
        { label: 'Creator', value: `@${campaign.advertiser?.username}` },
        { label: 'Budget to Refund', value: `₦${campaign.remainingBudget.toLocaleString()}` },
      ],
    });
  };

  const openPauseModal = (campaign: any) => {
    setActionModalConfig({
      isOpen: true,
      campaign,
      action: 'PAUSE',
      title: 'Pause Campaign',
      description: `Are you sure you want to pause "${campaign.title}"? The video will be temporarily hidden from user feeds.`,
      variant: 'warning',
      confirmText: 'Pause Campaign',
      isPrompt: false,
      details: [
        { label: 'Campaign Title', value: campaign.title },
        { label: 'Remaining Budget', value: `₦${campaign.remainingBudget.toLocaleString()}` },
      ],
    });
  };

  const handleConfirmAction = async (inputValue?: string) => {
    const campaign = actionModalConfig.campaign;
    if (!campaign) return;

    setActionLoading(true);
    setMessage(null);

    const res = await apiRequest(`/admin/campaigns/${campaign.id}/review`, {
      method: 'POST',
      body: JSON.stringify({
        action: actionModalConfig.action,
        reviewNote: inputValue || undefined,
      }),
    });

    if (res.success) {
      setMessage({
        type: 'success',
        text: (res.data?.message as string) || `Campaign successfully updated.`,
      });
      setActionModalConfig((prev) => ({ ...prev, isOpen: false }));
      if (selectedCampaign?.id === campaign.id) {
        setSelectedCampaign(null);
      }
      await fetchCampaigns();
    } else {
      setMessage({
        type: 'error',
        text: res.error?.message || 'Failed to moderate campaign',
      });
    }

    setActionLoading(false);
  };

  const totalItems = campaigns.length;
  const paginatedCampaigns = campaigns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto shadow-md"
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
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'PENDING_REVIEW' as TabStatus, label: 'Pending Review', count: stats.pendingCount },
            { id: 'ACTIVE' as TabStatus, label: 'Active on Feed', count: stats.activeCount },
            { id: 'ALL' as TabStatus, label: 'All Campaigns', count: null },
            { id: 'PAUSED' as TabStatus, label: 'Paused', count: null },
            { id: 'REJECTED' as TabStatus, label: 'Rejected', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#FF0091] to-[#360099] text-white shadow-md shadow-[#FF0091]/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
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
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF0091]"
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

      {/* Campaigns Table Container */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Campaign Directory</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {totalItems} total campaigns under {activeTab.replace('_', ' ')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-pink-500" /> Loading campaigns...
          </div>
        ) : totalItems === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Layers className="w-10 h-10 mx-auto text-slate-700" />
            <p className="font-semibold text-slate-400">No campaigns found under "{activeTab.replace('_', ' ')}".</p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Campaign & Creator</th>
                    <th className="py-3.5 px-4">Promoted Video</th>
                    <th className="py-3.5 px-4">Budget & Spend</th>
                    <th className="py-3.5 px-4">Reward/View</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedCampaigns.map((c) => {
                    const spentPercent = Math.min(100, Math.round((c.spentBudget / (c.totalBudget || 1)) * 100));
                    const isPending = c.status === 'PENDING_REVIEW';
                    const isActive = c.status === 'ACTIVE';

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCampaign(c)}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        {/* Title & Creator */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white group-hover:text-pink-300 transition-colors leading-snug">
                            {c.title}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-pink-400" />
                            @{c.advertiser?.username || 'Creator'} ({c.advertiser?.email})
                          </p>
                        </td>

                        {/* Video */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {c.video?.thumbnailUrl ? (
                              <img
                                src={c.video.thumbnailUrl}
                                alt={c.video.title}
                                className="w-14 h-9 object-cover rounded-md flex-shrink-0 border border-slate-800"
                              />
                            ) : (
                              <div className="w-14 h-9 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                                <Youtube className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0 max-w-[200px]">
                              <p className="font-semibold text-slate-200 truncate text-[11px]">
                                {c.video?.title || 'YouTube Video'}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {c.video?.channel?.channelTitle || 'Channel'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Budget */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="font-bold text-white">₦{c.totalBudget.toLocaleString()}</span>
                              <span className="text-slate-400">({spentPercent}% spent)</span>
                            </div>
                            <div className="w-28 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                              <div
                                className="bg-gradient-to-r from-[#FF0091] to-[#360099] h-1.5 rounded-full"
                                style={{ width: `${spentPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Reward */}
                        <td className="py-3.5 px-4 font-bold text-pink-300">
                          ₦{c.rewardPerQualifiedView}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : isPending
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse'
                                : c.status === 'REJECTED'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isActive
                              ? 'Live on Feed'
                              : isPending
                              ? 'Pending Review'
                              : c.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isPending && (
                              <button
                                onClick={() => openApproveModal(c)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1 transition-all"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                            )}

                            {isActive && (
                              <button
                                onClick={() => openPauseModal(c)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-bold text-xs flex items-center gap-1 transition-all"
                              >
                                <Pause className="w-3.5 h-3.5" /> Pause
                              </button>
                            )}

                            {c.status !== 'REJECTED' && (
                              <button
                                onClick={() => openRejectModal(c)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-bold text-xs flex items-center gap-1 transition-all"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
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
                {paginatedCampaigns.map((c) => {
                  const spentPercent = Math.min(100, Math.round((c.spentBudget / (c.totalBudget || 1)) * 100));
                  const isPending = c.status === 'PENDING_REVIEW';
                  const isActive = c.status === 'ACTIVE';

                  return (
                    <MobileTableRow
                      key={c.id}
                      onClick={() => setSelectedCampaign(c)}
                      avatar={
                        c.video?.thumbnailUrl ? (
                          <img
                            src={c.video.thumbnailUrl}
                            alt={c.video.title}
                            className="w-12 h-9 object-cover rounded-lg border border-slate-800"
                          />
                        ) : (
                          <div className="w-12 h-9 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                            <Layers className="w-4 h-4" />
                          </div>
                        )
                      }
                      title={c.title}
                      subtitle={`@${c.advertiser?.username || 'Creator'}`}
                      badge={
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {c.status}
                        </span>
                      }
                      dataGrid={
                        <>
                          <MobileDataCell label="Total Budget" value={`₦${c.totalBudget.toLocaleString()}`} highlight highlightColor="text-white font-bold" />
                          <MobileDataCell label="Remaining" value={`₦${c.remainingBudget.toLocaleString()}`} highlight highlightColor="text-emerald-400 font-bold" />
                          <MobileDataCell label="Reward/View" value={`₦${c.rewardPerQualifiedView}`} highlight highlightColor="text-pink-300" />
                          <MobileDataCell label="Spent" value={`${spentPercent}% (₦${c.spentBudget.toLocaleString()})`} />
                        </>
                      }
                      actions={
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <button
                              onClick={() => openApproveModal(c)}
                              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1 transition-all"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Feed
                            </button>
                          )}

                          {isActive && (
                            <button
                              onClick={() => openPauseModal(c)}
                              className="flex-1 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                            >
                              <Pause className="w-3.5 h-3.5" /> Pause
                            </button>
                          )}

                          {c.status !== 'REJECTED' && (
                            <button
                              onClick={() => openRejectModal(c)}
                              className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}
                        </div>
                      }
                    />
                  );
                })}
              </MobileTable>
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
      {selectedCampaign && (
        <DetailDrawer
          isOpen={Boolean(selectedCampaign)}
          onClose={() => setSelectedCampaign(null)}
          title={selectedCampaign.title}
          subtitle={`By @${selectedCampaign.advertiser?.username || 'Creator'}`}
          badge={
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                selectedCampaign.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : selectedCampaign.status === 'PENDING_REVIEW'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {selectedCampaign.status}
            </span>
          }
          icon={<Layers className="w-5 h-5 text-pink-500" />}
          footerActions={
            <>
              {selectedCampaign.status !== 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => openApproveModal(selectedCampaign)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Approve & Push Live
                </button>
              )}
              {selectedCampaign.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => openPauseModal(selectedCampaign)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Pause className="w-4 h-4" /> Pause Campaign
                </button>
              )}
              {selectedCampaign.status !== 'REJECTED' && (
                <button
                  type="button"
                  onClick={() => openRejectModal(selectedCampaign)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Reject Campaign
                </button>
              )}
            </>
          }
        >
          {/* Target Video Section */}
          <DrawerSection title="Promoted YouTube Video">
            {selectedCampaign.video?.thumbnailUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-800 mb-2">
                <img
                  src={selectedCampaign.video.thumbnailUrl}
                  alt={selectedCampaign.video.title}
                  className="w-full h-40 object-cover"
                />
              </div>
            )}
            <DrawerItem label="Video Title" value={selectedCampaign.video?.title || 'N/A'} />
            <DrawerItem
              label="Channel"
              value={selectedCampaign.video?.channel?.channelTitle || 'N/A'}
            />
            <DrawerItem
              label="Duration"
              value={`${selectedCampaign.video?.durationSeconds || 0} seconds`}
            />
            {selectedCampaign.video?.youtubeVideoId && (
              <div className="pt-2">
                <a
                  href={`https://www.youtube.com/watch?v=${selectedCampaign.video.youtubeVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Youtube className="w-4 h-4 text-red-500" /> Watch on YouTube <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </DrawerSection>

          {/* Budget Section */}
          <DrawerSection title="Budget & Pricing Breakdown">
            <DrawerItem
              label="Total Allocated Budget"
              value={`₦${selectedCampaign.totalBudget.toLocaleString()}`}
            />
            <DrawerItem
              label="Spent Budget"
              value={`₦${selectedCampaign.spentBudget.toLocaleString()}`}
            />
            <DrawerItem
              label="Remaining Available Budget"
              value={`₦${selectedCampaign.remainingBudget.toLocaleString()}`}
            />
            <DrawerItem
              label="Reward per Qualified View"
              value={`₦${selectedCampaign.rewardPerQualifiedView}`}
            />
          </DrawerSection>

          {/* Advertiser Section */}
          <DrawerSection title="Advertiser / Creator Profile">
            <DrawerItem
              label="Creator Username"
              value={`@${selectedCampaign.advertiser?.username}`}
              copyable
            />
            <DrawerItem
              label="Creator Email"
              value={selectedCampaign.advertiser?.email || 'N/A'}
              copyable
            />
            <DrawerItem label="Advertiser ID" value={selectedCampaign.advertiserId} copyable />
          </DrawerSection>

          {/* Review Notes if any */}
          {selectedCampaign.reviewNote && (
            <DrawerSection title="Moderation Note">
              <p className="text-slate-300 leading-relaxed">{selectedCampaign.reviewNote}</p>
            </DrawerSection>
          )}
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
