import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
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
  const [stats, setStats] = useState<VideoStats>({
    totalVideos: 0,
    curatedCount: 0,
    campaignCount: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

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

    const res = await apiRequest(`/admin/videos?${queryParams.toString()}`);
    if (res.success && res.data) {
      setVideos(res.data.videos || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, [filterType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      }, 1200);
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
    }
    setEditSubmitting(false);
  };

  const handleDeleteVideo = async (video: VideoItem) => {
    if (
      !window.confirm(
        `Are you sure you want to remove "${video.title}" from the platform?`
      )
    ) {
      return;
    }

    setActionLoadingId(video.id);
    const res = await apiRequest(`/admin/videos/${video.id}`, {
      method: 'DELETE',
    });

    if (res.success) {
      fetchVideos();
    }
    setActionLoadingId(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Film className="w-5 h-5 text-[#FF0091]" /> Video Library & Entertainment
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Curate non-campaign entertainment videos so user feeds are always active, and manage sponsored content.
          </p>
        </div>

        <button
          onClick={() => {
            resetAddForm();
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] text-white font-bold text-xs shadow-lg shadow-[#FF0091]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Curated Video
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Library Videos</span>
            <Tv className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats.totalVideos}</p>
          <p className="text-[10px] text-slate-500">Across all catalog categories</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Curated Entertainment</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{stats.curatedCount}</p>
          <p className="text-[10px] text-emerald-400/80">Non-campaign entertainment stream</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Sponsored Campaigns</span>
            <DollarSign className="w-4 h-4 text-[#FF0091]" />
          </div>
          <p className="text-2xl font-black text-pink-400">{stats.campaignCount}</p>
          <p className="text-[10px] text-slate-500">Paid advertiser rewards enabled</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Watch Sessions</span>
            <PlaySquare className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats.totalViews.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500">Verified platform playback sessions</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Videos' },
              { id: 'CURATED', label: 'Curated Entertainment' },
              { id: 'CAMPAIGN', label: 'Sponsored Campaigns' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
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
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Videos Catalog List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">
            Loading video library catalog...
          </div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center space-y-3">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Video Info</th>
                  <th className="py-3 px-4">Channel / Creator</th>
                  <th className="py-3 px-4">Type & Model</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4">Watch Sessions</th>
                  <th className="py-3 px-4">Date Added</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {videos.map((video) => {
                  const isPublic = video.availabilityStatus === 'PUBLIC';
                  const activeCampaign = video.campaigns?.[0];

                  return (
                    <tr key={video.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Video Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-[240px] max-w-[320px]">
                          <div className="relative w-20 h-12 rounded-lg bg-black overflow-hidden flex-shrink-0 border border-slate-800">
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
                            <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[9px] font-mono text-white flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {formatDuration(video.durationSeconds)}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-white truncate text-xs" title={video.title}>
                              {video.title}
                            </p>
                            <span className="text-[10px] font-mono text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20">
                              ID: {video.youtubeVideoId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                            {video.channel?.channelTitle?.[0]?.toUpperCase() || 'C'}
                          </div>
                          <span className="truncate max-w-[140px] font-medium">
                            {video.channel?.channelTitle || 'Platform Curated'}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4">
                        {video.isCurated ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Sparkles className="w-3 h-3" /> Entertainment (Free)
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                              <DollarSign className="w-3 h-3" /> Sponsored Campaign
                            </span>
                            {activeCampaign && (
                              <p className="text-[10px] text-slate-400">
                                ₦{activeCampaign.rewardPerQualifiedView} / view ({activeCampaign.status})
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
                          {isPublic ? 'Live on Feed' : 'Hidden'}
                        </span>
                      </td>

                      {/* Watch Sessions */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        {video.watchCount.toLocaleString()} views
                      </td>

                      {/* Date Added */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(video.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Open on YouTube */}
                          <a
                            href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Open on YouTube"
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Toggle Visibility */}
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

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(video)}
                            title="Edit Video Details"
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-pink-400 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteVideo(video)}
                            disabled={actionLoadingId === video.id}
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
        )}
      </div>

      {/* ADD VIDEO MODAL */}
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
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5"
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] text-white font-bold text-xs shadow-lg shadow-[#FF0091]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Adding Video...' : 'Add Video to Platform'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VIDEO MODAL */}
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF0091] to-[#360099] text-white font-bold text-xs shadow-lg shadow-[#FF0091]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
