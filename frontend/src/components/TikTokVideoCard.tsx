import React, { useEffect, useState, useRef } from 'react';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Heart,
  Share2,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Copy,
  Check,
  UserCheck,
} from 'lucide-react';

export interface VideoData {
  id: string;
  youtubeVideoId: string;
  title: string;
  description?: string;
  durationSeconds: number;
  channelTitle?: string;
  channel?: {
    channelId?: string;
    channelTitle?: string;
    channelThumbnail?: string;
    customUrl?: string;
  };
  thumbnailUrl?: string;
  isRewarded?: boolean;
  campaign?: {
    campaignId: string;
    rewardAmount: number;
    minWatchSeconds: number;
  } | null;
  campaigns?: Array<{
    id: string;
    title?: string;
    rewardPerQualifiedView: number;
    minWatchDurationSeconds?: number;
    remainingBudget?: number;
    status?: string;
  }>;
}

interface TikTokVideoCardProps {
  video: VideoData;
  isActive: boolean;
  onNext?: () => void;
  onPrev?: () => void;
}

export const TikTokVideoCard: React.FC<TikTokVideoCardProps> = ({
  video,
  isActive,
}) => {
  const { user, refreshUser } = useAuth();

  const channelTitle = video.channel?.channelTitle || video.channelTitle || 'Creator Channel';
  const channelHandle = video.channel?.customUrl || `@${channelTitle.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
  const channelThumbnail = video.channel?.channelThumbnail;
  const channelId = video.channel?.channelId;

  const campaignId = video.campaign?.campaignId || video.campaigns?.[0]?.id;
  const initialReward = video.campaign?.rewardAmount || video.campaigns?.[0]?.rewardPerQualifiedView || 10;
  const initialMinWatch = video.campaign?.minWatchSeconds || video.campaigns?.[0]?.minWatchDurationSeconds || 30;
  const hasReward = !!(video.campaign || video.campaigns?.[0] || video.isRewarded);

  // Watch session & player states
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [rewardAmount, setRewardAmount] = useState<number>(initialReward);
  const [rewardAwarded, setRewardAwarded] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(() => Math.floor(Math.random() * 800) + 120);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<boolean>(false);
  const [rewardToast, setRewardToast] = useState<string | null>(null);
  const [subscribeToast, setSubscribeToast] = useState<string | null>(null);

  const heartbeatIntervalRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentPositionRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  isPlayingRef.current = isPlaying;

  // 1. Start watch session when video becomes active
  useEffect(() => {
    if (!isActive) {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      setSessionId(null);
      setSessionToken(null);
      setRewardAwarded(false);
      setIsPlaying(false);
      currentPositionRef.current = 0;
      return;
    }

    let isMounted = true;
    setIsPlaying(true);

    const startSession = async () => {
      try {
        const res = await apiRequest('/watch-sessions/start', {
          method: 'POST',
          body: JSON.stringify({
            videoId: video.id,
            campaignId: campaignId || undefined,
          }),
        });

        if (isMounted && res.success && res.data) {
          setSessionId(res.data.sessionId);
          setSessionToken(res.data.sessionToken);
          if (res.data.rewardAmount) {
            setRewardAmount(res.data.rewardAmount);
          }
        }
      } catch (err) {
        console.error('Failed to start watch session:', err);
      }
    };

    startSession();

    return () => {
      isMounted = false;
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [isActive, video.id, campaignId]);

  // 2. Heartbeat interval (Every 5 seconds of active playback)
  useEffect(() => {
    if (!isActive || !sessionId || !sessionToken || rewardAwarded) {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      return;
    }

    heartbeatIntervalRef.current = setInterval(async () => {
      currentPositionRef.current += 5;

      try {
        const res = await apiRequest('/watch-sessions/heartbeat', {
          method: 'POST',
          body: JSON.stringify({
            sessionId,
            sessionToken,
            currentPositionSeconds: currentPositionRef.current,
            isPlaying: isPlayingRef.current,
          }),
        });

        if (res.success && res.data) {
          if (res.data.isRewarded && !rewardAwarded) {
            setRewardAwarded(true);
            setRewardToast(`🎉 +₦${res.data.rewardCredited || rewardAmount} Added to Wallet!`);
            refreshUser();
            setTimeout(() => setRewardToast(null), 4000);
          }
        }
      } catch (err) {
        console.error('Heartbeat sync notice:', err);
      }
    }, 5000);

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [isActive, sessionId, sessionToken, rewardAwarded, rewardAmount, initialMinWatch, refreshUser]);

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleShareReferral = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user?.referralCode) {
      const inviteUrl = `${window.location.origin}/register?ref=${user.referralCode}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 3000);
    }
  };

  // 1-Click Subscribe Link Handler
  const handleSubscribe = (e: React.MouseEvent) => {
    e.stopPropagation();

    let subscribeUrl = '';
    if (channelId) {
      subscribeUrl = `https://www.youtube.com/channel/${channelId}?sub_confirmation=1`;
    } else if (video.channel?.customUrl) {
      const cleanHandle = video.channel.customUrl.replace(/^@/, '');
      subscribeUrl = `https://www.youtube.com/@${cleanHandle}?sub_confirmation=1`;
    } else {
      subscribeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(channelTitle)}`;
    }

    window.open(subscribeUrl, '_blank', 'noopener,noreferrer');

    setIsSubscribed(true);
    setSubscribeToast(`Subscribed to ${channelTitle}! 🎉`);
    setTimeout(() => setSubscribeToast(null), 3500);
  };

  const originParam = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
  const youtubeEmbedUrl = `https://www.youtube.com/embed/${video.youtubeVideoId}?autoplay=1&mute=${
    isMuted ? 1 : 0
  }&controls=0&rel=0&playsinline=1&enablejsapi=1&origin=${originParam}&widgetid=1`;

    return (
      <div className="w-full h-full min-h-full max-h-full flex-shrink-0 relative flex items-center justify-center bg-black select-none overflow-hidden">
        {/* DESKTOP/TABLET WRAPPER (9:16 Frame) / MOBILE 100% FULL BLEED VIEWPORT */}
        <div className="w-full h-full min-h-full max-h-full md:max-w-[440px] md:h-[calc(100vh-2rem)] md:my-4 md:rounded-3xl relative bg-black overflow-hidden shadow-2xl border-0 md:border md:border-slate-800/80 flex items-center justify-center">
          
          {/* YOUTUBE IFRAME */}
          {isActive ? (
            <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center bg-black">
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <iframe
                  ref={iframeRef}
                  src={youtubeEmbedUrl}
                  title={video.title}
                  className="pointer-events-none border-0 select-none"
                  style={{
                    width: '135%',
                    height: '135%',
                    minWidth: '135%',
                    minHeight: '135%',
                    position: 'absolute',
                    top: '-17.5%',
                    left: '-17.5%',
                    objectFit: 'cover',
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
          <div className="absolute inset-0 w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-600">
            {video.thumbnailUrl && (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover opacity-50"
              />
            )}
          </div>
        )}

        {/* TRANSPARENT TAP SHIELD */}
        <div
          onClick={() => setIsMuted(!isMuted)}
          className="absolute inset-0 z-10 cursor-pointer"
          title="Tap to toggle sound"
        />

        {/* TOP GRADIENT & SPONSOR BADGE */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-16 md:pt-4 bg-gradient-to-b from-black/85 via-black/30 to-transparent flex items-center justify-between z-20 pointer-events-none">
          {/* Sponsor Tag */}
          {hasReward ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#FF0091]" />
              <span className="text-[11px] font-bold text-pink-300">
                Earn ₦{rewardAmount} Rewarded View
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700/50 backdrop-blur-md">
              <span className="text-[11px] font-semibold text-slate-300">Sponsored Video</span>
            </div>
          )}

          {/* Sound Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="pointer-events-auto w-9 h-9 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/80 transition-all shadow-lg"
            title={isMuted ? 'Tap to Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-pink-400" />}
          </button>
        </div>

        {/* UNMUTE PROMPT OVERLAY (IF MUTED) */}
        {isMuted && isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(false);
            }}
            className="absolute top-28 md:top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-black/80 border border-pink-500/40 text-pink-300 text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-2 hover:scale-105 transition-all pointer-events-auto"
          >
            <VolumeX className="w-4 h-4 text-[#FF0091]" /> Tap for Sound
          </button>
        )}

        {/* RIGHT INTERACTION RAIL */}
        <div className="absolute right-3 bottom-24 md:bottom-16 z-20 flex flex-col items-center gap-4 sm:gap-5 pointer-events-auto">
          {/* Creator Avatar & 1-Click Subscribe Button */}
          <div className="relative flex flex-col items-center cursor-pointer group" onClick={handleSubscribe} title="1-Click Subscribe on YouTube">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-[#FF0091] p-0.5 bg-slate-900 shadow-xl overflow-hidden flex items-center justify-center font-bold text-white text-xs group-hover:scale-105 transition-transform">
              {channelThumbnail ? (
                <img src={channelThumbnail} alt={channelTitle} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span>{channelTitle[0]?.toUpperCase() || 'C'}</span>
              )}
            </div>

            {/* Subscribe Action Button: + to ✓ */}
            <button
              onClick={handleSubscribe}
              title={isSubscribed ? 'Subscribed' : 'Subscribe to Channel'}
              className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-xs -mt-2.5 shadow-md border-2 border-slate-950 transition-all ${
                isSubscribed
                  ? 'bg-gradient-to-r from-[#FF0091] to-[#360099] text-white scale-110'
                  : 'bg-red-500 hover:bg-red-400 text-white hover:scale-110 animate-pulse'
              }`}
            >
              {isSubscribed ? <Check className="w-3 h-3 stroke-[3]" /> : '+'}
            </button>
          </div>

          {/* Like Button */}
          <button
            onClick={handleToggleLike}
            className="flex flex-col items-center gap-1 group transition-transform active:scale-125"
          >
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all ${
                liked
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-500'
                  : 'bg-black/50 border-white/20 text-white hover:bg-black/70'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current text-rose-500' : ''}`} />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md">{likesCount}</span>
          </button>

          {/* Share Referral Link Button */}
          <button
            onClick={handleShareReferral}
            className="flex flex-col items-center gap-1 group transition-transform active:scale-125"
            title="Copy Referral Link"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-all">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md">Share</span>
          </button>

          {/* Reward Status Pill */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full backdrop-blur-md border flex items-center justify-center ${
                rewardAwarded
                  ? 'bg-gradient-to-tr from-[#FF0091] to-[#360099] border-[#FF0091] text-white font-black shadow-lg shadow-[#FF0091]/50 animate-bounce'
                  : 'bg-black/50 border-pink-500/40 text-pink-400'
              }`}
            >
              {rewardAwarded ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <DollarSign className="w-5 h-5" />}
            </div>
            <span className="text-[10px] font-bold text-pink-300 drop-shadow-md">
              {rewardAwarded ? 'Earned' : `₦${rewardAmount}`}
            </span>
          </div>
        </div>

        {/* BOTTOM OVERLAY DETAILS */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 md:pb-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-20 space-y-1.5 pointer-events-none">
          <div className="space-y-1 max-w-[78%] pointer-events-auto">
            {/* Custom Channel Identity */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleSubscribe} title="View Channel">
              <span className="font-extrabold text-sm text-white drop-shadow-md tracking-tight hover:text-pink-300 transition-colors">
                {channelHandle}
              </span>
              <span className="text-[11px] text-slate-300 font-medium truncate">
                • {channelTitle}
              </span>
            </div>

            {/* Video Title */}
            <p className="text-xs text-slate-100 line-clamp-2 leading-relaxed drop-shadow font-medium">
              {video.title}
            </p>
          </div>
        </div>

        {/* TOAST NOTIFICATION: 1-CLICK SUBSCRIBE CONFIRMATION */}
        {subscribeToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold text-xs shadow-2xl shadow-red-500/40 animate-in fade-in zoom-in flex items-center gap-2 border border-white/20 pointer-events-auto">
            <UserCheck className="w-4 h-4 text-white" />
            {subscribeToast}
          </div>
        )}

        {/* TOAST NOTIFICATION: REWARD CELEBRATION */}
        {rewardToast && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-30 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] text-white font-black text-sm shadow-2xl shadow-[#FF0091]/50 animate-bounce flex items-center gap-2 border-2 border-white pointer-events-auto">
            <Sparkles className="w-5 h-5 text-white" />
            {rewardToast}
          </div>
        )}

        {/* TOAST NOTIFICATION: COPIED REFERRAL */}
        {copyToast && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-slate-900/90 border border-purple-500/50 text-purple-300 font-bold text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-auto">
            <Copy className="w-4 h-4 text-[#FF0091]" /> Referral link copied to clipboard!
          </div>
        )}
      </div>
    </div>
  );
};
