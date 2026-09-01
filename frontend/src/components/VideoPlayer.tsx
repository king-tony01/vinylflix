import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Play,
  Pause,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  youtubeVideoId: string;
  title: string;
  isRewarded?: boolean;
  campaign?: {
    campaignId: string;
    rewardAmount: number;
    minWatchSeconds: number;
  } | null;
  onRewardEarned?: (reward: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  youtubeVideoId,
  title,
  isRewarded,
  campaign,
  onRewardEarned,
}) => {
  const { user, refreshUser } = useAuth();

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [watchSeconds, setWatchSeconds] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<number | null>(null);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const [rewardError, setRewardError] = useState<string | null>(null);

  const heartbeatIntervalRef = useRef<any>(null);
  const targetSeconds = campaign?.minWatchSeconds || 30;

  // Start watch session
  const startSession = async () => {
    if (!user) return;
    setRewardError(null);

    const res = await apiRequest('/watch-sessions/start', {
      method: 'POST',
      body: JSON.stringify({
        videoId,
        campaignId: campaign?.campaignId,
        deviceFingerprint: `browser_${navigator.userAgent.substring(0, 30)}`,
      }),
    });

    if (res.success && res.data) {
      setSessionToken(res.data.sessionToken);
      setIsPlaying(true);
    } else {
      setRewardError(res.error?.message || 'Failed to start watch session');
    }
  };

  // Heartbeat loop
  useEffect(() => {
    if (isPlaying && sessionToken && !isCompleted) {
      heartbeatIntervalRef.current = setInterval(async () => {
        setWatchSeconds((prev) => {
          const next = prev + 1;
          // Check if reached target
          if (next >= targetSeconds && !isCompleted) {
            completeSession(sessionToken, next);
          }
          return next;
        });

        // Send backend heartbeat every 5 seconds
        if (watchSeconds % 5 === 0 && watchSeconds > 0) {
          await apiRequest('/watch-sessions/heartbeat', {
            method: 'POST',
            body: JSON.stringify({
              sessionToken,
              currentPositionSeconds: watchSeconds,
              playbackState: 'PLAYING',
            }),
          });
        }
      }, 1000);
    } else {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    }

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [isPlaying, sessionToken, watchSeconds, isCompleted]);

  // Complete session & claim server-side reward
  const completeSession = async (token: string, finalSeconds: number) => {
    setIsCompleted(true);
    setIsPlaying(false);

    const res = await apiRequest('/watch-sessions/complete', {
      method: 'POST',
      body: JSON.stringify({
        sessionToken: token,
        finalPositionSeconds: finalSeconds,
      }),
    });

    if (res.success && res.data) {
      if (res.data.qualificationStatus === 'REWARDED') {
        setRewardClaimed(res.data.rewardEarned);
        setRewardMessage(res.data.message);
        refreshUser();
        if (onRewardEarned) onRewardEarned(res.data.rewardEarned);
      } else {
        setRewardMessage(res.data.message || 'Watch session finished.');
      }
    } else {
      setRewardError(res.error?.message || 'Qualification verification failed');
    }
  };

  const progressPercent = Math.min(100, Math.round((watchSeconds / targetSeconds) * 100));

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Video Embed Header */}
      <div className="relative aspect-video w-full bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0&enablejsapi=1&rel=0`}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Reward Progress Tracker & Playback Controls */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white leading-tight line-clamp-1">{title}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              {isRewarded && campaign ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  Rewarded Campaign: ₦{campaign.rewardAmount}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                  Standard Stream
                </span>
              )}
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Required: {targetSeconds}s
              </span>
            </div>
          </div>

          {/* Start/Track Playback Button */}
          {user ? (
            !sessionToken ? (
              <button
                onClick={startSession}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Rewarded Session
              </button>
            ) : !isCompleted ? (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                  isPlaying
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause Timer' : 'Resume Timer'}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Session Completed
              </div>
            )
          ) : (
            <a
              href="/login"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium text-center transition-colors"
            >
              Sign in to earn rewards
            </a>
          )}
        </div>

        {/* Real-Time Reward Countdown Bar */}
        {sessionToken && (
          <div className="mt-4 pt-2">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Playback: {watchSeconds}s / {targetSeconds}s
              </span>
              <span className="font-bold text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-300 shadow-sm shadow-emerald-500/50"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Reward Notification Banner */}
        {rewardClaimed !== null && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-300">Reward Credited: +₦{rewardClaimed}</p>
              <p className="text-xs text-emerald-400/80 mt-0.5">{rewardMessage}</p>
            </div>
          </div>
        )}

        {/* Message / Error Notification */}
        {rewardError && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-300">Notice</p>
              <p className="text-xs text-rose-400/80 mt-0.5">{rewardError}</p>
            </div>
          </div>
        )}

        {!rewardClaimed && rewardMessage && !rewardError && (
          <div className="mt-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-200">Session Status</p>
              <p className="text-xs text-slate-400 mt-0.5">{rewardMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
