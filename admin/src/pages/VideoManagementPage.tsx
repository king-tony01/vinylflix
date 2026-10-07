import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { AdminActionModal } from '../components/AdminActionModal.js';
import { DetailDrawer, DrawerSection, DrawerItem } from '../components/DetailDrawer.js';
import { Pagination } from '../components/Pagination.js';
import {
  Film,
  Plus,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  ExternalLink,
  Sparkles,
  DollarSign,
  PlaySquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Tv,
  Info,
  ChevronRight,
} from 'lucide-react';

interface VideoItem {
  id: string;
  youtubeVideoId: string;
  title: string;
  description?: string;
  durationSeconds: number;
  thumbnailUrl?: string;
  availabilityStatus: string;
  createdAt: string;
  isCurated: boolean;
  watchCount: number;
  channel?: {
    channelTitle?: string;
    channelThumbnail?: string;
    customUrl?: string;
  };
  campaigns?: Array<{
    id: string;
    title: string;
    status: string;
    rewardPerQualifiedView: number;
    remainingBudget: number;
  }>;
}

interface VideoStats {
  totalVideos: number;
  curatedCount: number;
  campaignCount: number;
  totalViews: number;
}

export const VideoManagementPage: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [stats, setStats] = useState<VideoStats>({
    totalVideos: 0,
    curatedCount: 0,
    campaignCount: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Detail Drawer State
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  // Custom Action Modal (for Delete confirmation)
  const [deleteModalVideo, setDeleteModalVideo] = useState<VideoItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Add Video Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [addTitle, setAddTitle] = useState<string>('');
  const [addDescription, setAddDescription] = useState<string>('');
  const [addChannelTitle, setAddChannelTitle] = useState<string>('');
  const [addVisibility, setAddVisibility] = useState<string>('PUBLIC');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Edit Video Modal State
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editVisibility, setEditVisibility] = useState<string>('PUBLIC');
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);

  // Action Loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchVideos = async () => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    if (filterType !== 'ALL') queryParams.set('type', filterType);
    if (search.trim()) queryParams.set('search', search.trim());
    queryParams.set('limit', String(pageSize));
    queryParams.set('offset', String((currentPage - 1) * pageSize));

    const res = await apiRequest(`/admin/videos?${queryParams.toString()}`);
    if (res.success && res.data) {
      setVideos(res.data.videos || []);
      setTotal(res.data.total || 0);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, [filterType, currentPage, pageSize]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVideos();
  };

  // Preview YouTube Video metadata
  const handleFetchPreview = async () => {
    if (!videoUrlInput.trim()) return;
    setPreviewLoading(true);
    setPreviewError(null);

    const res = await apiRequest('/admin/videos/preview', {
      method: 'POST',
      body: JSON.stringify({ videoUrlOrId: videoUrlInput.trim() }),
    });

    if (res.success && res.data) {
      setPreviewData(res.data);
      setAddTitle(res.data.title || '');
      setAddDescription(res.data.description || '');
      setAddChannelTitle(res.data.channelTitle || '');
    } else {
      setPreviewError(res.error?.message || 'Could not fetch video details. Verify the YouTube URL or ID.');
      setPreviewData(null);
    }
    setPreviewLoading(false);
  };

  const handleAddVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrlInput.trim()) {
      setFormError('Please provide a YouTube video URL or ID.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    const res = await apiRequest('/admin/videos', {
      method: 'POST',
      body: JSON.stringify({
        videoUrlOrId: videoUrlInput.trim(),
        title: addTitle.trim() || undefined,
        description: addDescription.trim() || undefined,
        channelTitle: addChannelTitle.trim() || undefined,
        availabilityStatus: addVisibility,
        thumbnailUrl: previewData?.thumbnailUrl || undefined,
        durationSeconds: previewData?.durationSeconds || undefined,
      }),
    });

    if (res.success) {
      setFormSuccess('Video successfully added to the platform!');
      fetchVideos();
      setTimeout(() => {
        setIsAddModalOpen(false);
        resetAddForm();
      }, 1000);
    } else {
      setFormError(res.error?.message || 'Failed to add video.');
    }
    setSubmitting(false);
  };

  const resetAddForm = () => {
    setVideoUrlInput('');
    setPreviewData(null);
    setPreviewError(null);
    setAddTitle('');
    setAddDescription('');
    setAddChannelTitle('');
    setAddVisibility('PUBLIC');
    setFormError(null);
    setFormSuccess(null);
  };

  const handleToggleVisibility = async (video: VideoItem) => {
    const newStatus = video.availabilityStatus === 'PUBLIC' ? 'UNAVAILABLE' : 'PUBLIC';
    setActionLoadingId(video.id);

    const res = await apiRequest(`/admin/videos/${video.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ availabilityStatus: newStatus }),
    });

    if (res.success) {
      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, availabilityStatus: newStatus } : v))
      );
      if (selectedVideo?.id === video.id) {
        setSelectedVideo((prev) => (prev ? { ...prev, availabilityStatus: newStatus } : null));
      }
    }
    setActionLoadingId(null);
  };

  const handleOpenEditModal = (video: VideoItem) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description || '');
    setEditVisibility(video.availabilityStatus);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    setEditSubmitting(true);

    const res = await apiRequest(`/admin/videos/${editingVideo.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDescription.trim(),
        availabilityStatus: editVisibility,
      }),
    });

    if (res.success) {
      setEditingVideo(null);
      fetchVideos();
      if (selectedVideo?.id === editingVideo.id) {
        setSelectedVideo((prev) =>
          prev
            ? {
                ...prev,
                title: editTitle.trim(),
                description: editDescription.trim(),
                availabilityStatus: editVisibility,
              }
            : null
        );
      }
    }
    setEditSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalVideo) return;
    setDeleteLoading(true);

    const res = await apiRequest(`/admin/videos/${deleteModalVideo.id}`, {
      method: 'DELETE',
    });

    if (res.success) {
      if (selectedVideo?.id === deleteModalVideo.id) {
        setSelectedVideo(null);
      }
      setDeleteModalVideo(null);
      fetchVideos();
    }
    setDeleteLoading(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Film className="w-5 h-5 text-[#FF0091]" /> Video Library & Entertainment
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Curate non-campaign entertainment videos and manage sponsored campaign catalog.
          </p>
        </div>

        <button
          onClick={() => {
            resetAddForm();
            setIsAddModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] text-white font-bold text-xs shadow-lg shadow-[#FF0091]/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Curated Video
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] sm:text-xs font-semibold">Total Library</span>
            <Tv className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{stats.totalVideos}</p>
          <p className="text-[10px] text-slate-500">Across all catalog categories</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] sm:text-xs font-semibold">Curated Entertainment</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400">{stats.curatedCount}</p>
          <p className="text-[10px] text-emerald-400/80">Non-campaign entertainment stream</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] sm:text-xs font-semibold">Sponsored Campaigns</span>
            <DollarSign className="w-4 h-4 text-[#FF0091]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-pink-400">{stats.campaignCount}</p>
          <p className="text-[10px] text-slate-500">Cash rewards enabled</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] sm:text-xs font-semibold">Total Watch Sessions</span>
            <PlaySquare className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{stats.totalViews.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500">Verified platform views</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto select-none">
            {[
              { id: 'ALL', label: 'All Videos' },
              { id: 'CURATED', label: 'Curated Entertainment' },
              { id: 'CAMPAIGN', label: 'Sponsored Campaigns' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterType(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  filterType === tab.id
                    ? 'bg-gradient-to-r from-[#FF0091] to-[#360099] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, channel, video ID..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF0091]"
              />
            </form>

            <button
              onClick={fetchVideos}
              title="Refresh Video Catalog"
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* VIDEO CATALOG CONTAINER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">
            Loading video catalog...
          </div>
        ) : videos.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
              <Film className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">No videos found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search
                ? `No videos matched the query "${search}".`
                : 'Your platform video catalog is currently empty. Click "Add Curated Video" to add entertainment content.'}
            </p>
          </div>
        ) : (
          <>
            {/* 1. DESKTOP MODERN CLASSIC TABLE (>= md screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Video Info</th>
                    <th className="py-3 px-4">Channel / Creator</th>
                    <th className="py-3 px-4">Model & Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Views</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {videos.map((video) => {
                    const isPublic = video.availabilityStatus === 'PUBLIC';
                    const activeCampaign = video.campaigns?.[0];

                    return (
                      <tr
                        key={video.id}
                        onClick={() => setSelectedVideo(video)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        {/* Video Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3 min-w-[220px] max-w-[320px]">
                            <div className="relative w-16 h-10 rounded-lg bg-black overflow-hidden flex-shrink-0 border border-slate-800">
                              {video.thumbnailUrl ? (
                                <img
                                  src={video.thumbnailUrl}
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-600">
                                  <Film className="w-4 h-4" />
                                </div>
                              )}
                              <div className="absolute bottom-0.5 right-0.5 bg-black/80 px-1 rounded text-[8px] font-mono text-white">
                                {formatDuration(video.durationSeconds)}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <p className="font-bold text-white truncate text-xs group-hover:text-pink-300 transition-colors">
                                {video.title}
                              </p>
                              <span className="text-[10px] font-mono text-slate-400">
                                ID: {video.youtubeVideoId}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Channel */}
                        <td className="py-3.5 px-4 text-slate-300">
                          <span className="truncate max-w-[140px] font-medium block">
                            {video.channel?.channelTitle || 'Platform Curated'}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4">
                          {video.isCurated ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Sparkles className="w-3 h-3" /> Free Stream
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                                <DollarSign className="w-3 h-3" /> Sponsored
                              </span>
                              {activeCampaign && (
                                <p className="text-[10px] text-slate-400">
                                  ₦{activeCampaign.rewardPerQualifiedView}/view
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Visibility Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              isPublic
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPublic ? 'bg-emerald-400' : 'bg-slate-500'
                              }`}
                            />
                            {isPublic ? 'Live' : 'Hidden'}
                          </span>
                        </td>

                        {/* Watch Sessions */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-white">
                          {video.watchCount.toLocaleString()}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedVideo(video)}
                              title="Inspect Details"
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleVisibility(video)}
                              disabled={actionLoadingId === video.id}
                              title={isPublic ? 'Hide from Feed' : 'Publish to Feed'}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isPublic
                                  ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-400'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              }`}
                            >
                              {isPublic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(video)}
                              title="Edit Video"
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-pink-400 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeleteModalVideo(video)}
                              title="Remove Video"
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. MOBILE ADAPTIVE CARDS (< md screens, 100% viewport width, zero horizontal scroll) */}
            <div className="block md:hidden divide-y divide-slate-800/80">
              {videos.map((video) => {
                const isPublic = video.availabilityStatus === 'PUBLIC';

                return (
                  <div
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className="p-3.5 hover:bg-slate-800/40 transition-colors cursor-pointer space-y-3"
                  >
                    {/* Top Row: Thumbnail + Title + Type Badge */}
                    <div className="flex items-start gap-3">
                      <div className="relative w-20 h-14 rounded-xl bg-black overflow-hidden flex-shrink-0 border border-slate-800">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-600">
                            <Film className="w-5 h-5" />
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[8px] font-mono text-white">
                          {formatDuration(video.durationSeconds)}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          {video.isCurated ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Sparkles className="w-2.5 h-2.5" /> Free Stream
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                              <DollarSign className="w-2.5 h-2.5" /> Sponsored
                            </span>
                          )}

                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                              isPublic
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPublic ? 'bg-emerald-400' : 'bg-slate-500'
                              }`}
                            />
                            {isPublic ? 'Live' : 'Hidden'}
                          </span>
                        </div>

                        <h4 className="font-bold text-white text-xs line-clamp-2 leading-snug">
                          {video.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {video.channel?.channelTitle || 'Platform Curated'}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Views & Quick Actions */}
                    <div
                      className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-xs text-slate-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-mono text-[11px] text-slate-300">
                        {video.watchCount.toLocaleString()} views
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleVisibility(video)}
                          disabled={actionLoadingId === video.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-semibold flex items-center gap-1"
                        >
                          {isPublic ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-emerald-400" />}
                          {isPublic ? 'Hide' : 'Show'}
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(video)}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => setDeleteModalVideo(video)}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => setSelectedVideo(video)}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-pink-400"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {/* 3. SIDE DETAIL DRAWER (Inspect video, channel, campaign data & quick actions) */}
      {selectedVideo && (
        <DetailDrawer
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          title={selectedVideo.title}
          subtitle={`YouTube ID: ${selectedVideo.youtubeVideoId}`}
          icon={<Film className="w-5 h-5" />}
          badge={
            selectedVideo.isCurated ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Free Entertainment
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                Sponsored Campaign
              </span>
            )
          }
          footerActions={
            <>
              <button
                onClick={() => handleToggleVisibility(selectedVideo)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {selectedVideo.availabilityStatus === 'PUBLIC' ? (
                  <>
                    <EyeOff className="w-4 h-4 text-amber-400" /> Hide from Feed
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-emerald-400" /> Publish Live to Feed
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  handleOpenEditModal(selectedVideo);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-4 h-4" /> Edit Details
              </button>

              <button
                onClick={() => setDeleteModalVideo(selectedVideo)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Video
              </button>
            </>
          }
        >
          {/* Video Preview Player / Thumbnail */}
          <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-xl">
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo.youtubeVideoId}?rel=0`}
              title={selectedVideo.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Quick External Link */}
          <a
            href={`https://www.youtube.com/watch?v=${selectedVideo.youtubeVideoId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-pink-400 hover:text-pink-300 font-semibold"
          >
            <span>Open on Official YouTube App / Web</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Video Metadata Section */}
          <DrawerSection title="Video Specifications">
            <DrawerItem label="Video Title" value={selectedVideo.title} />
            <DrawerItem
              label="YouTube Video ID"
              value={selectedVideo.youtubeVideoId}
              copyable
            />
            <DrawerItem
              label="Play Duration"
              value={`${formatDuration(selectedVideo.durationSeconds)} (${selectedVideo.durationSeconds}s)`}
            />
            <DrawerItem
              label="Visibility Status"
              value={
                <span
                  className={
                    selectedVideo.availabilityStatus === 'PUBLIC'
                      ? 'text-emerald-400 font-bold'
                      : 'text-slate-400'
                  }
                >
                  {selectedVideo.availabilityStatus}
                </span>
              }
            />
            <DrawerItem
              label="Total Views Recorded"
              value={`${selectedVideo.watchCount.toLocaleString()} sessions`}
            />
            <DrawerItem
              label="Date Imported"
              value={new Date(selectedVideo.createdAt).toLocaleString()}
            />
          </DrawerSection>

          {/* Channel Info Section */}
          <DrawerSection title="Channel & Creator Identity">
            <DrawerItem
              label="Channel Name"
              value={selectedVideo.channel?.channelTitle || 'Platform Curated'}
            />
            <DrawerItem
              label="Channel Handle"
              value={selectedVideo.channel?.customUrl || 'N/A'}
            />
          </DrawerSection>

          {/* Description Snippet */}
          {selectedVideo.description && (
            <DrawerSection title="Description & Synopsis">
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedVideo.description}
              </p>
            </DrawerSection>
          )}

          {/* Linked Campaign (if any) */}
          {selectedVideo.campaigns && selectedVideo.campaigns.length > 0 && (
            <DrawerSection title="Sponsored Promotion Campaign">
              {selectedVideo.campaigns.map((camp) => (
                <div key={camp.id} className="space-y-1.5 pt-1">
                  <DrawerItem label="Campaign Name" value={camp.title} />
                  <DrawerItem label="Campaign Status" value={camp.status} />
                  <DrawerItem
                    label="Reward per Qualified View"
                    value={`₦${camp.rewardPerQualifiedView}`}
                  />
                  <DrawerItem
                    label="Remaining Budget"
                    value={`₦${camp.remainingBudget.toLocaleString()}`}
                  />
                </div>
              ))}
            </DrawerSection>
          )}
        </DetailDrawer>
      )}

      {/* 4. CUSTOM CONFIRMATION MODAL (For Deleting Video) */}
      <AdminActionModal
        isOpen={!!deleteModalVideo}
        onClose={() => setDeleteModalVideo(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Remove Video from Platform"
        description="Are you sure you want to remove this video? If watch history exists, it will be safely hidden without breaking accounting records."
        confirmText="Delete Video"
        loading={deleteLoading}
        details={
          deleteModalVideo
            ? [
                { label: 'Video Title', value: deleteModalVideo.title },
                { label: 'YouTube ID', value: deleteModalVideo.youtubeVideoId },
                { label: 'Total Views', value: `${deleteModalVideo.watchCount} views` },
              ]
            : []
        }
      />

      {/* 5. ADD VIDEO MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Add Curated Entertainment Video</h3>
                  <p className="text-[11px] text-slate-400">
                    Import any public YouTube video directly to the discovery feed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddVideoSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* URL Input & Fetch Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  YouTube Video Link or Video ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    placeholder="e.g. https://www.youtube.com/watch?v=... or shorts/..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF0091]"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleFetchPreview}
                    disabled={previewLoading || !videoUrlInput.trim()}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
                  >
                    {previewLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Fetch Details'
                    )}
                  </button>
                </div>
                {previewError && <p className="text-[11px] text-rose-400 mt-1">{previewError}</p>}
              </div>

              {/* Video Preview Card */}
              {previewData && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex gap-3 items-center">
                  <div className="w-24 h-16 rounded-lg bg-black overflow-hidden flex-shrink-0 relative border border-slate-800">
                    <img
                      src={previewData.thumbnailUrl}
                      alt={previewData.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[8px] font-mono text-white">
                      {formatDuration(previewData.durationSeconds)}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white line-clamp-1">{previewData.title}</p>
                    <p className="text-[11px] text-pink-400 font-medium">{previewData.channelTitle}</p>
                    <p className="text-[10px] text-slate-500 font-mono">ID: {previewData.youtubeVideoId}</p>
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Video Title (Customizable)
                </label>
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="Enter video display title"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF0091]"
                />
              </div>

              {/* Channel / Creator Display */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Channel / Creator Name
                </label>
                <input
                  type="text"
                  value={addChannelTitle}
                  onChange={(e) => setAddChannelTitle(e.target.value)}
                  placeholder="e.g. Vinylflix Entertainment or Creator Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF0091]"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  placeholder="Brief description or tags..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF0091]"
                />
              </div>

              {/* Visibility Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Feed Visibility
                </label>
                <select
                  value={addVisibility}
                  onChange={(e) => setAddVisibility(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF0091]"
                >
                  <option value="PUBLIC">Public (Live on Discovery Feed Immediately)</option>
                  <option value="UNAVAILABLE">Hidden (Draft / Archive)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !videoUrlInput.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] text-white font-bold text-xs shadow-lg shadow-[#FF0091]/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Adding Video...' : 'Add Video to Platform'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. EDIT VIDEO MODAL */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Edit Video Metadata</h3>
              <button
                onClick={() => setEditingVideo(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF0091]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF0091]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Visibility</label>
                <select
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF0091]"
                >
                  <option value="PUBLIC">Public (Live on Feed)</option>
                  <option value="UNAVAILABLE">Hidden (Unavailable)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF0091] to-[#360099] text-white font-bold text-xs shadow-lg shadow-[#FF0091]/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
