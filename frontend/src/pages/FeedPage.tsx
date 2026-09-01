import React, { useEffect, useState, useRef } from 'react';
import { apiRequest } from '../lib/api.js';
import { TikTokVideoCard, VideoData } from '../components/TikTokVideoCard.js';
import {
  PlaySquare,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const FeedPage: React.FC = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);

  const fetchVideos = async () => {
    setLoading(true);
    const res = await apiRequest('/videos/feed');
    if (res.success && res.data) {
      const videoList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.feed)
        ? res.data.feed
        : [];
      setVideos(videoList);
    } else {
      setVideos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Scroll handler for deterministic active video tracking across mobile & desktop
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    if (clientHeight > 0) {
      const newIndex = Math.round(scrollTop / clientHeight);
      if (newIndex >= 0 && newIndex < videos.length && newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    }
  };

  // IntersectionObserver as secondary precision detector
  useEffect(() => {
    if (videos.length === 0 || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.5,
      }
    );

    videoRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [videos]);

  // Keyboard navigation (ArrowUp & ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, videos.length]);

  const scrollToIndex = (index: number) => {
    if (index < 0 || index >= videos.length) return;
    const targetElement = videoRefs.current[index];
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
      setActiveIndex(index);
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center animate-pulse shadow-lg shadow-emerald-500/20">
            <PlaySquare className="w-6 h-6 text-slate-950" />
          </div>
          <p className="text-xs font-semibold text-slate-400">Loading Watch Feed...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-6 space-y-4 max-w-sm mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Videos in Feed</h3>
            <p className="text-xs text-slate-400 mt-1">
              Active campaigns and synced creator videos will automatically appear here.
            </p>
          </div>
          <button
            onClick={fetchVideos}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Feed
          </button>
        </div>
      ) : (
        <>
          {/* VERTICAL SNAP SCROLL CONTAINER */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="w-full h-full min-h-full max-h-full snap-y snap-mandatory overflow-y-scroll scroll-smooth select-none focus:outline-none flex flex-col"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {videos.map((video, idx) => (
              <div
                key={video.id}
                ref={(el) => {
                  videoRefs.current[idx] = el;
                }}
                data-index={idx}
                className="w-full h-full min-h-full max-h-full flex-shrink-0 snap-start snap-always flex items-center justify-center relative overflow-hidden"
              >
                <TikTokVideoCard
                  video={video}
                  isActive={activeIndex === idx}
                  onNext={() => scrollToIndex(idx + 1)}
                  onPrev={() => scrollToIndex(idx - 1)}
                />
              </div>
            ))}
          </div>

          {/* DESKTOP FLOATING NAVIGATION CONTROLS (Up & Down arrows) */}
          <div className="hidden lg:flex flex-col gap-3 absolute right-8 top-1/2 -translate-y-1/2 z-30">
            <button
              onClick={() => scrollToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              title="Previous Video (Arrow Up)"
              className="w-11 h-11 rounded-full bg-slate-900/80 border border-slate-700/60 text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none backdrop-blur-md shadow-xl flex items-center justify-center transition-all hover:scale-110"
            >
              <ChevronUp className="w-5 h-5" />
            </button>

            <button
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={activeIndex === videos.length - 1}
              title="Next Video (Arrow Down)"
              className="w-11 h-11 rounded-full bg-slate-900/80 border border-slate-700/60 text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none backdrop-blur-md shadow-xl flex items-center justify-center transition-all hover:scale-110"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
