import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Subtitles,
  Server,
  Star,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Tv,
  Film,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type {
  MovieDetail,
  EpisodeItem,
  StreamSource,
  SubtitleTrack,
  SubtitleCue,
} from '../types/movie.js';
import {
  fetchMovieDetails,
  fetchSeasonEpisodes,
  fetchMovieStreams,
  fetchAndParseSubtitles,
  getFullBackdropUrl,
} from '../lib/movieApi.js';

export const WatchPage: React.FC = () => {
  const { tmdbId } = useParams<{ tmdbId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL state
  const isSeries = searchParams.get('isSeries') === 'true';
  const currentSeason = parseInt(searchParams.get('season') || '1', 10);
  const currentEpisode = parseInt(searchParams.get('episode') || '1', 10);

  // Metadata state
  const [details, setDetails] = useState<MovieDetail | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // Streams state
  const [streams, setStreams] = useState<StreamSource[]>([]);
  const [selectedStreamIndex, setSelectedStreamIndex] = useState(0);
  const [loadingStreams, setLoadingStreams] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Subtitles state
  const [subtitlesList, setSubtitlesList] = useState<SubtitleTrack[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<SubtitleTrack | null>(null);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);

  // HTML5 Player controls state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  const activeStream: StreamSource | undefined = streams[selectedStreamIndex];

  // 1. Fetch movie/show metadata
  useEffect(() => {
    if (!tmdbId) return;
    let isMounted = true;
    setLoadingDetails(true);

    fetchMovieDetails(tmdbId, isSeries)
      .then((data) => {
        if (!isMounted) return;
        setDetails(data);
        setLoadingDetails(false);
      })
      .catch((err) => {
        console.error('[WatchPage] Failed to fetch movie details:', err);
        if (isMounted) setLoadingDetails(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tmdbId, isSeries]);

  // 2. Fetch episodes if TV series
  useEffect(() => {
    if (!tmdbId || !isSeries) return;
    let isMounted = true;
    setLoadingEpisodes(true);

    fetchSeasonEpisodes(tmdbId, currentSeason)
      .then((eps) => {
        if (!isMounted) return;
        setEpisodes(eps);
        setLoadingEpisodes(false);
      })
      .catch((err) => {
        console.error('[WatchPage] Failed to fetch episodes:', err);
        if (isMounted) setLoadingEpisodes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tmdbId, isSeries, currentSeason]);

  // 3. Fetch stream sources when tmdbId, season, or episode changes
  useEffect(() => {
    if (!tmdbId) return;
    let isMounted = true;
    setLoadingStreams(true);
    setStreamError(null);
    setSelectedStreamIndex(0);

    fetchMovieStreams(tmdbId, currentSeason, currentEpisode, isSeries)
      .then((sources) => {
        if (!isMounted) return;
        setStreams(sources);
        if (sources.length > 0) {
          const first = sources[0];
          if (first.subtitles && first.subtitles.length > 0) {
            setSubtitlesList(first.subtitles);
          } else {
            setSubtitlesList([]);
          }
        }
        setLoadingStreams(false);
      })
      .catch((err) => {
        console.error('[WatchPage] Failed to fetch streams:', err);
        if (isMounted) {
          setStreamError('Failed to load playback streams. You can switch servers below.');
          setLoadingStreams(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tmdbId, currentSeason, currentEpisode, isSeries]);

  // 4. Update subtitles when server changes
  useEffect(() => {
    if (activeStream && activeStream.subtitles && activeStream.subtitles.length > 0) {
      setSubtitlesList(activeStream.subtitles);
    }
  }, [activeStream]);

  // 5. Load and parse subtitle track when user selects one
  useEffect(() => {
    if (!selectedSubtitle) {
      setSubtitleCues([]);
      setCurrentSubtitleText('');
      return;
    }

    let isMounted = true;
    fetchAndParseSubtitles(selectedSubtitle.url).then((cues) => {
      if (!isMounted) return;
      setSubtitleCues(cues);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedSubtitle]);

  // 6. Direct video time updates & subtitle sync
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Sync subtitles
    if (subtitleCues.length > 0) {
      const activeCue = subtitleCues.find((cue) => time >= cue.start && time <= cue.end);
      setCurrentSubtitleText(activeCue ? activeCue.text : '');
    } else {
      setCurrentSubtitleText('');
    }
  };

  // Video playback handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const seekRelative = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds)
    );
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Activity timer to hide video overlay controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSubtitleMenu(false);
        setShowServerMenu(false);
      }
    }, 3500);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Episode navigation for TV Series
  const currentEpisodeIndex = useMemo(() => {
    return episodes.findIndex((ep) => ep.episodeNumber === currentEpisode);
  }, [episodes, currentEpisode]);

  const hasPrevEpisode = currentEpisodeIndex > 0;
  const hasNextEpisode = currentEpisodeIndex >= 0 && currentEpisodeIndex < episodes.length - 1;

  const navigateToEpisode = (seasonNum: number, episodeNum: number) => {
    setSearchParams({
      isSeries: 'true',
      season: String(seasonNum),
      episode: String(episodeNum),
    });
  };

  const currentEpisodeData = episodes.find((ep) => ep.episodeNumber === currentEpisode);

  return (
    <div
      className="w-full min-h-screen bg-slate-950 text-slate-100 pb-20 overflow-y-auto"
      onMouseMove={handleMouseMove}
    >
      {/* 1. TOP BAR NAVIGATION */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/movies')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-bold"
            title="Back to Movies"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Browse</span>
          </button>

          <div>
            <h1 className="text-sm md:text-base font-bold text-white line-clamp-1">
              {details?.title || 'Loading...'}
            </h1>
            {isSeries && (
              <p className="text-xs text-pink-400 font-medium">
                Season {currentSeason} • Episode {currentEpisode}
                {currentEpisodeData?.name ? `: ${currentEpisodeData.name}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Server Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowServerMenu((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-pink-500/50 text-xs font-semibold text-slate-200 transition-colors shadow-sm"
          >
            <Server className="w-3.5 h-3.5 text-pink-400" />
            <span>{activeStream?.serverName || 'Server'}</span>
          </button>

          {/* Server Dropdown */}
          {showServerMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-extrabold text-slate-400 border-b border-slate-800/80">
                Streaming Servers
              </div>
              <div className="mt-1 space-y-1">
                {streams.map((stream, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedStreamIndex(idx);
                      setShowServerMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedStreamIndex === idx
                        ? 'bg-gradient-to-r from-[#FF0091]/20 to-[#360099]/20 text-pink-300 font-bold border border-[#FF0091]/30'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="line-clamp-1">{stream.serverName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {stream.quality}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. THE MAIN PLAYER VIEWPORT */}
      <div className="max-w-7xl mx-auto px-0 md:px-6 pt-0 md:pt-4">
        <div
          ref={playerContainerRef}
          className="relative w-full aspect-video bg-black rounded-none md:rounded-3xl overflow-hidden shadow-2xl border border-slate-900 md:border-slate-800/80 select-none group"
        >
          {loadingStreams ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm z-20">
              <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
              <p className="mt-4 text-xs font-bold text-slate-300 tracking-wide">
                Resolving fastest media streams...
              </p>
            </div>
          ) : streamError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-center p-6 z-20">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Playback Encountered an Issue</h3>
              <p className="text-xs text-slate-400 max-w-md mb-4">{streamError}</p>
              <button
                onClick={() => {
                  setLoadingStreams(true);
                  fetchMovieStreams(tmdbId || '', currentSeason, currentEpisode, isSeries)
                    .then((s) => setStreams(s))
                    .finally(() => setLoadingStreams(false));
                }}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Streams
              </button>
            </div>
          ) : activeStream?.playerType === 'direct' ? (
            /* DIRECT HTML5 VIDEO PLAYER WITH CUSTOM ENGINE & SUBTITLES */
            <div className="relative w-full h-full bg-black">
              <video
                ref={videoRef}
                src={activeStream.url}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration);
                }}
                autoPlay
                playsInline
              />

              {/* Synchronized Subtitles Overlay Cue */}
              {currentSubtitleText && (
                <div className="absolute bottom-20 inset-x-4 md:inset-x-20 flex justify-center pointer-events-none z-30 transition-all">
                  <div className="max-w-2xl px-4 py-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-white font-semibold text-sm md:text-lg text-center leading-snug drop-shadow-md">
                    {currentSubtitleText}
                  </div>
                </div>
              )}

              {/* Custom Overlay Controls */}
              <div
                className={`absolute inset-0 flex flex-col justify-between p-4 md:p-6 bg-gradient-to-t from-black/90 via-transparent to-black/40 transition-opacity duration-300 z-20 ${
                  showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {/* Top Control Bar */}
                <div className="flex items-center justify-between text-white text-xs font-medium">
                  <span className="font-semibold text-slate-200">
                    {details?.title} {isSeries ? `(S${currentSeason}E${currentEpisode})` : ''}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-bold">
                    DIRECT STREAM
                  </span>
                </div>

                {/* Center Quick Play/Pause on hover */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-black/60 hover:bg-[#FF0091] text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all transform hover:scale-110 shadow-2xl"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 fill-white" />
                    ) : (
                      <Play className="w-8 h-8 fill-white translate-x-0.5" />
                    )}
                  </button>
                </div>

                {/* Bottom Control Bar */}
                <div className="space-y-3">
                  {/* Timeline Scrubber */}
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-300 w-12 text-right">
                      {formatTime(currentTime)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      value={currentTime}
                      onChange={handleSeekChange}
                      className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-[#FF0091] focus:outline-none"
                    />
                    <span className="text-[11px] font-mono text-slate-400 w-12">
                      {formatTime(duration)}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlay}
                        className="text-white hover:text-pink-400 transition-colors p-1"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={() => seekRelative(-10)}
                        className="text-slate-300 hover:text-white transition-colors p-1"
                        title="Seek backward 10 seconds"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => seekRelative(10)}
                        className="text-slate-300 hover:text-white transition-colors p-1"
                        title="Seek forward 10 seconds"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>

                      {/* Volume Slider */}
                      <div className="flex items-center gap-2 group/vol ml-2">
                        <button
                          onClick={toggleMute}
                          className="text-slate-300 hover:text-white p-1"
                        >
                          {isMuted || volume === 0 ? (
                            <VolumeX className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                      </div>
                    </div>

                    {/* Right Controls: Subtitles & Fullscreen */}
                    <div className="flex items-center gap-3 relative">
                      {/* Subtitle dropdown toggle */}
                      <div className="relative">
                        <button
                          onClick={() => setShowSubtitleMenu((prev) => !prev)}
                          className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold ${
                            selectedSubtitle
                              ? 'bg-pink-600/30 text-pink-300 border border-pink-500/40'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                          }`}
                          title="Subtitles / Captions"
                        >
                          <Subtitles className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {selectedSubtitle ? selectedSubtitle.language : 'CC'}
                          </span>
                        </button>

                        {/* Dropdown with partially transparent dark background */}
                        {showSubtitleMenu && (
                          <div className="absolute right-0 bottom-full mb-2 w-52 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 p-2 shadow-2xl z-50">
                            <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                              Subtitle Tracks
                            </div>
                            <div className="mt-1 space-y-1 max-h-48 overflow-y-auto">
                              <button
                                onClick={() => {
                                  setSelectedSubtitle(null);
                                  setShowSubtitleMenu(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  selectedSubtitle === null
                                    ? 'bg-pink-500/20 text-pink-300 font-bold'
                                    : 'text-slate-300 hover:bg-slate-800/60'
                                }`}
                              >
                                <span>Off</span>
                                {selectedSubtitle === null && <Check className="w-3.5 h-3.5" />}
                              </button>

                              {subtitlesList.map((sub, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setSelectedSubtitle(sub);
                                    setShowSubtitleMenu(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    selectedSubtitle?.url === sub.url
                                      ? 'bg-pink-500/20 text-pink-300 font-bold'
                                      : 'text-slate-300 hover:bg-slate-800/60'
                                  }`}
                                >
                                  <span>{sub.language}</span>
                                  {selectedSubtitle?.url === sub.url && (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              ))}

                              {subtitlesList.length === 0 && (
                                <div className="px-3 py-2 text-[11px] text-slate-500 text-center">
                                  No external subtitles found for this stream
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fullscreen Button */}
                      <button
                        onClick={toggleFullscreen}
                        className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-slate-800/60 transition-colors"
                      >
                        {isFullscreen ? (
                          <Minimize2 className="w-4 h-4" />
                        ) : (
                          <Maximize2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* EMBED PLAYER (VidLink / VidSrc with sandboxing & full controls) */
            <div className="relative w-full h-full bg-black">
              {activeStream ? (
                <iframe
                  key={activeStream.url}
                  src={activeStream.url}
                  title="Stream Player"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* 3. SHOW / EPISODE QUICK SWITCHER BAR (For TV Series) */}
      {isSeries && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 text-xs font-bold border border-pink-500/30">
                S{currentSeason} • E{currentEpisode}
              </span>
              <span className="text-xs md:text-sm font-semibold text-slate-200 line-clamp-1">
                {currentEpisodeData?.name || `Episode ${currentEpisode}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={!hasPrevEpisode}
                onClick={() => {
                  const prevEp = episodes[currentEpisodeIndex - 1];
                  if (prevEp) navigateToEpisode(currentSeason, prevEp.episodeNumber);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  hasPrevEpisode
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous Episode
              </button>

              <button
                disabled={!hasNextEpisode}
                onClick={() => {
                  const nextEp = episodes[currentEpisodeIndex + 1];
                  if (nextEp) navigateToEpisode(currentSeason, nextEp.episodeNumber);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  hasNextEpisode
                    ? 'bg-gradient-to-r from-[#FF0091] to-[#360099] text-white border-transparent hover:opacity-95 shadow-md shadow-pink-500/10'
                    : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                Next Episode <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DETAILS, EPISODES ACCORDION & CAST */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details, Overview & TV Episodes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Metadata Badges */}
          {loadingDetails ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-slate-900 rounded-2xl w-3/4" />
              <div className="h-5 bg-slate-900 rounded-lg w-1/2" />
              <div className="h-24 bg-slate-900 rounded-2xl w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                  {details?.title || 'Loading title...'}
                </h1>

                {details?.tagline && (
                  <p className="text-sm italic text-pink-300 font-medium">{details.tagline}</p>
                )}

                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {details?.rating ? details.rating.toFixed(1) : '8.2'}
                  </span>

                  <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {details?.releaseYear}
                  </span>

                  {details?.runtime && (
                    <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {details.runtime} min
                    </span>
                  )}

                  <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                    {isSeries ? <Tv className="w-3.5 h-3.5 text-pink-400" /> : <Film className="w-3.5 h-3.5 text-pink-400" />}
                    {isSeries ? 'TV Series' : 'Movie'}
                  </span>
                </div>

                {/* Genres */}
                {details?.genres && details.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {details.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-semibold text-slate-400"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Overview */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Overview</h3>
                <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
                  {details?.overview || 'No description available for this title.'}
                </p>
              </div>
            </>
          )}

          {/* TV Series Episode Browser List */}
          {isSeries && details?.seasons && details.seasons.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Episodes</h3>

                {/* Season Dropdown */}
                <select
                  value={currentSeason}
                  onChange={(e) => {
                    const newSeason = parseInt(e.target.value, 10);
                    navigateToEpisode(newSeason, 1);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-pink-500"
                >
                  {details.seasons.map((s) => (
                    <option key={s.seasonNumber} value={s.seasonNumber}>
                      {s.name || `Season ${s.seasonNumber}`} ({s.episodeCount} eps)
                    </option>
                  ))}
                </select>
              </div>

              {loadingEpisodes ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading episodes...</div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {episodes.map((ep) => {
                    const isSelected = ep.episodeNumber === currentEpisode;
                    return (
                      <div
                        key={ep.episodeNumber}
                        onClick={() => navigateToEpisode(currentSeason, ep.episodeNumber)}
                        className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#FF0091]/20 via-[#7928CA]/15 to-[#360099]/15 border-[#FF0091]/50 shadow-md shadow-pink-500/10'
                            : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/60'
                        }`}
                      >
                        {/* Episode Thumbnail */}
                        <div className="relative w-28 h-16 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden">
                          {ep.stillUrl ? (
                            <img
                              src={ep.stillUrl}
                              alt={ep.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Tv className="w-6 h-6" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                isSelected ? 'bg-[#FF0091] text-white' : 'bg-black/60 text-white'
                              }`}
                            >
                              <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
                            </div>
                          </div>
                        </div>

                        {/* Episode Meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white line-clamp-1">
                              {ep.episodeNumber}. {ep.name}
                            </span>
                            {ep.rating && (
                              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5 flex-shrink-0">
                                <Star className="w-2.5 h-2.5 fill-amber-400" />
                                {ep.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                            {ep.overview || 'No synopsis provided for this episode.'}
                          </p>
                          {ep.airDate && (
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              Aired: {ep.airDate}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Cast & Recommended */}
        <div className="space-y-6">
          {/* Cast */}
          {details?.cast && details.cast.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Top Cast
              </h3>
              <div className="space-y-2.5">
                {details.cast.slice(0, 6).map((member, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
                      {member.profilePath ? (
                        <img
                          src={
                            member.profilePath.startsWith('http')
                              ? member.profilePath
                              : `https://image.tmdb.org/t/p/w185${member.profilePath}`
                          }
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                          {member.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white line-clamp-1">{member.name}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {member.character || 'Actor'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Recommended Titles */}
          {details?.similar && details.similar.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Recommended Titles
              </h3>
              <div className="space-y-2">
                {details.similar.slice(0, 4).map((sim) => (
                  <Link
                    key={sim.tmdbId}
                    to={`/watch/${sim.tmdbId}${sim.isSeries ? '?isSeries=true&season=1&episode=1' : ''}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition-colors group"
                  >
                    <div className="w-12 h-16 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0">
                      <img
                        src={getFullBackdropUrl(sim.backdropPath, sim.posterPath)}
                        alt={sim.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 group-hover:text-pink-300 line-clamp-1 transition-colors">
                        {sim.title}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {sim.releaseYear} • {sim.isSeries ? 'TV Series' : 'Movie'}
                      </p>
                      <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5 mt-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        {sim.rating ? sim.rating.toFixed(1) : '8.0'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
