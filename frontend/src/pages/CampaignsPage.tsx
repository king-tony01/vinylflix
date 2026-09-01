import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../lib/api.js';
import {
  Layers,
  Youtube,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Link as LinkIcon,
  Video,
} from 'lucide-react';

export const CampaignsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [connectedChannel] = useState<any | null>(null);
  const [syncedVideos, setSyncedVideos] = useState<any[]>([]);

  // Import Video URL state
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [importingVideo, setImportingVideo] = useState<boolean>(false);
  const [importedVideo, setImportedVideo] = useState<any | null>(null);

  // Form State
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [totalBudget, setTotalBudget] = useState<string>('50000');
  const [rewardPerView, setRewardPerView] = useState<string>('5');
  const [minWatchSeconds, setMinWatchSeconds] = useState<string>('30');
  const [dailyLimit, setDailyLimit] = useState<string>('20');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    const res = await apiRequest('/campaigns/my');
    if (res.success && res.data) {
      setCampaigns(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();

    // Check OAuth return status
    const isConnected = searchParams.get('connected');
    const channelParam = searchParams.get('channel');
    const errorParam = searchParams.get('error');

    if (isConnected && channelParam) {
      setFormSuccess(`🎉 Successfully connected YouTube channel "${decodeURIComponent(channelParam)}"!`);
    } else if (errorParam) {
      setFormError(`YouTube authorization error: ${decodeURIComponent(errorParam)}`);
    }
  }, [searchParams]);

  // Real Google OAuth flow
  const handleConnectOAuth = async () => {
    const res = await apiRequest('/youtube/oauth/url');
    const oauthUrl = res.data?.url || (res as any).url;
    if (res.success && oauthUrl) {
      window.location.href = oauthUrl;
    } else {
      setFormError(res.error?.message || 'Failed to initialize YouTube OAuth flow.');
    }
  };

  // Real Direct Video Import via YouTube API
  const handleImportVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrlInput.trim()) return;

    setImportingVideo(true);
    setFormError(null);

    const res = await apiRequest('/youtube/import-video', {
      method: 'POST',
      body: JSON.stringify({ videoUrl: videoUrlInput.trim() }),
    });

    if (res.success && res.data) {
      const vid = res.data;
      setImportedVideo(vid);
      setSelectedVideoId(vid.id);
      setTitle(vid.title || 'Promoted Video');
      setDescription(vid.description?.slice(0, 200) || `Campaign for ${vid.title}`);
      setMinWatchSeconds(String(Math.min(60, Math.max(15, Math.floor(vid.durationSeconds / 2)))));
      setSyncedVideos((prev) => [vid, ...prev.filter((v) => v.id !== vid.id)]);
      setFormSuccess(`✓ Verified & imported "${vid.title}" via YouTube API!`);
      setVideoUrlInput('');
    } else {
      setFormError(res.error?.message || 'Could not verify or fetch video from YouTube.');
    }

    setImportingVideo(false);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedVideoId) {
      setFormError('Please select or import a YouTube video for this campaign');
      return;
    }

    const res = await apiRequest('/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        videoId: selectedVideoId,
        title,
        description,
        totalBudget: parseFloat(totalBudget),
        rewardPerQualifiedView: parseFloat(rewardPerView),
        minWatchDurationSeconds: parseInt(minWatchSeconds, 10),
        dailyUserLimit: parseInt(dailyLimit, 10),
      }),
    });

    if (res.success) {
      setFormSuccess('Campaign created and submitted for platform review!');
      setShowCreateModal(false);
      fetchCampaigns();
    } else {
      setFormError(res.error?.message || 'Failed to create campaign');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            Campaigns & Promotion Hub <Layers className="w-6 h-6 text-[#FF0091]" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect YouTube channels or import video links, set targeted watch rewards, and promote your videos.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 w-full sm:w-64 self-start">
          <button
            onClick={handleConnectOAuth}
            className="w-full px-4 py-2.5 rounded-xl bg-red-600/10 border border-red-600/30 hover:bg-red-600/20 text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Youtube className="w-4 h-4" />
            Connect YouTube
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] text-white font-bold text-sm shadow-lg shadow-[#FF0091]/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Connected Channel Banner */}
      {connectedChannel && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{connectedChannel.channelTitle}</h3>
                <span className="text-[10px] font-semibold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                  CONNECTED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {connectedChannel.subscriberCount.toLocaleString()} Subscribers • {syncedVideos.length} Synced Videos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {formSuccess && (
        <div className="p-4 rounded-xl border bg-pink-500/10 border-pink-500/30 text-pink-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#FF0091] flex-shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {formError && (
        <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Campaigns Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Your Active Campaigns ({campaigns.length})
          </h3>
          <button onClick={fetchCampaigns} className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-44 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center text-slate-500 space-y-2">
            <Layers className="w-12 h-12 mx-auto text-slate-700" />
            <p>No active campaigns created yet. Click "Create Campaign" or import a video link to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {campaigns.map((c) => {
              const spentPercent = Math.min(100, Math.round((c.spentBudget / c.totalBudget) * 100));
              return (
                <div key={c.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">{c.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Target Video: {c.video?.title}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        c.status === 'ACTIVE'
                          ? 'bg-pink-500/10 text-[#FF0091] border border-pink-500/20'
                          : c.status === 'PENDING_REVIEW'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Budget Utilization</span>
                      <span className="font-bold text-white">
                        ₦{c.spentBudget.toLocaleString()} / ₦{c.totalBudget.toLocaleString()} ({spentPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FF0091] to-[#360099] rounded-full transition-all" style={{ width: `${spentPercent}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                    <div className="bg-slate-950/60 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Reward/View</span>
                      <p className="text-xs font-bold text-pink-400">₦{c.rewardPerQualifiedView}</p>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Min Watch</span>
                      <p className="text-xs font-bold text-white">{c.minWatchDurationSeconds}s</p>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Daily Limit</span>
                      <p className="text-xs font-bold text-white">{c.dailyUserLimit}/user</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#FF0091]" />
                Launch New Video Campaign
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white text-sm font-semibold">
                ✕
              </button>
            </div>

            {/* Quick Import from YouTube URL */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5">
              <label className="block text-xs font-bold text-pink-400 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#FF0091]" /> Paste Any YouTube Video URL / Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#FF0091]"
                />
                <button
                  type="button"
                  onClick={handleImportVideo}
                  disabled={importingVideo || !videoUrlInput.trim()}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] text-white text-xs font-bold disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {importingVideo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                  Verify & Import
                </button>
              </div>
            </div>

            {/* Imported Video Preview Card */}
            {importedVideo && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-pink-500/30">
                <img src={importedVideo.thumbnailUrl} alt={importedVideo.title} className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{importedVideo.title}</p>
                  <p className="text-[11px] text-pink-400 font-semibold">{importedVideo.durationSeconds}s Duration • Verified Public</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Summer App Showcase Promotion"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF0091]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  placeholder="Brief description of the promotion campaign..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#FF0091]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Video</label>
                <select
                  value={selectedVideoId}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF0091]"
                  required
                >
                  {syncedVideos.length === 0 ? (
                    <option value="">Paste YouTube URL above or select a video</option>
                  ) : (
                    syncedVideos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title} ({v.durationSeconds}s)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Campaign Budget (₦)</label>
                  <input
                    type="number"
                    min="5000"
                    step="1000"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF0091]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reward Per View (₦)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={rewardPerView}
                    onChange={(e) => setRewardPerView(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF0091]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Min Watch Duration (Seconds)</label>
                  <input
                    type="number"
                    min="15"
                    max="300"
                    value={minWatchSeconds}
                    onChange={(e) => setMinWatchSeconds(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF0091]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Limit Per User</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF0091]"
                    required
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] text-white font-bold text-sm shadow-lg shadow-[#FF0091]/25 hover:opacity-95 active:scale-[0.99] transition-all"
              >
                Submit Campaign for Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
