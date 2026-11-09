import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Play,
  Star,
  Calendar,
  Clock,
  Film,
  Tv,
  ChevronDown,
  Users,
} from 'lucide-react';
import type { MovieItem, MovieDetail, EpisodeItem } from '../types/movie.js';
import {
  fetchMovieDetails,
  fetchSeasonEpisodes,
  getFullBackdropUrl,
  getFullPosterUrl,
} from '../lib/movieApi.js';

interface MovieDetailModalProps {
  movie: MovieItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie?: (movie: MovieItem) => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  isOpen,
  onClose,
  onSelectMovie,
}) => {
  const navigate = useNavigate();
  const [details, setDetails] = useState<MovieDetail | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  useEffect(() => {
    if (!isOpen || !movie) {
      setDetails(null);
      setEpisodes([]);
      return;
    }

    let isMounted = true;

    fetchMovieDetails(movie.tmdbId, movie.isSeries).then((data) => {
      if (!isMounted) return;
      if (data) {
        setDetails(data);
        if (data.isSeries) {
          const firstSeason = data.seasons?.[0]?.seasonNumber || 1;
          setSelectedSeason(firstSeason);
          loadEpisodes(movie.tmdbId, firstSeason);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, movie]);

  const loadEpisodes = async (tmdbId: string, seasonNum: number) => {
    setLoadingEpisodes(true);
    const eps = await fetchSeasonEpisodes(tmdbId, seasonNum);
    setEpisodes(eps);
    setLoadingEpisodes(false);
  };

  const handleSeasonChange = (seasonNum: number) => {
    setSelectedSeason(seasonNum);
    if (movie) {
      loadEpisodes(movie.tmdbId, seasonNum);
    }
  };

  const handleWatch = (season?: number, episode?: number) => {
    if (!movie) return;
    const isTv = movie.isSeries;
    let url = `/watch/${movie.tmdbId}`;
    const params = new URLSearchParams();
    if (isTv) {
      params.set('isSeries', 'true');
      params.set('season', String(season ?? selectedSeason));
      params.set('episode', String(episode ?? 1));
    }
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    onClose();
    navigate(url);
  };

  if (!isOpen || !movie) return null;

  const currentMovie = details || movie;
  const isSeries = currentMovie.isSeries;
  const backdropUrl = getFullBackdropUrl(currentMovie.backdropPath, currentMovie.posterPath);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Background click barrier */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-pink-950/20 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-950/70 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-slate-900 transition-all cursor-pointer backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          {/* Hero Backdrop Banner */}
          <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-slate-950">
            <img
              src={backdropUrl}
              alt={currentMovie.title}
              className="w-full h-full object-cover object-center filter brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent" />

            {/* Floating Title & Action Bar on Backdrop */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="px-2.5 py-1 rounded-md bg-[#FF0091] text-white flex items-center gap-1">
                  {isSeries ? <Tv className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
                  {isSeries ? 'TV Series' : 'Movie'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {currentMovie.rating ? currentMovie.rating.toFixed(1) : '8.0'}
                </span>
                {currentMovie.releaseYear && (
                  <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 flex items-center gap-1 border border-slate-700/60">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {currentMovie.releaseYear}
                  </span>
                )}
                {details?.runtime ? (
                  <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 flex items-center gap-1 border border-slate-700/60">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {details.runtime} min
                  </span>
                ) : null}
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                {currentMovie.title}
              </h2>

              {details?.tagline && (
                <p className="text-xs sm:text-sm text-pink-300/90 font-medium italic">
                  "{details.tagline}"
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => handleWatch()}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF0091] to-[#360099] text-white font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-lg shadow-[#FF0091]/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Watch Now</span>
                </button>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Genres Row */}
            {currentMovie.genres && currentMovie.genres.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {currentMovie.genres.map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/60"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Storyline
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                {currentMovie.overview ||
                  'Stream this top-rated title in uninterrupted HD with multi-language audio and captions on Vinylflix.'}
              </p>
            </div>

            {/* Cast Members */}
            {details?.cast && details.cast.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Users className="w-4 h-4 text-pink-400" />
                  Top Cast
                </h3>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {details.cast.map((actor, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-24 text-center space-y-1.5"
                    >
                      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-slate-800 border border-slate-700 shadow-md">
                        {actor.profilePath ? (
                          <img
                            src={actor.profilePath}
                            alt={actor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-lg">
                            {actor.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold text-white truncate">{actor.name}</p>
                      {actor.character && (
                        <p className="text-[10px] text-slate-400 truncate">{actor.character}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TV Series Season & Episode Picker */}
            {isSeries && details?.seasons && details.seasons.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Tv className="w-4 h-4 text-pink-400" />
                    Episodes
                  </h3>

                  {/* Season Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedSeason}
                      onChange={(e) => handleSeasonChange(Number(e.target.value))}
                      className="appearance-none bg-slate-800 border border-slate-700 text-white text-xs font-bold px-4 py-2 pr-8 rounded-xl focus:outline-none focus:border-pink-500 cursor-pointer"
                    >
                      {details.seasons
                        .filter((s) => s.seasonNumber > 0)
                        .map((s) => (
                          <option key={s.seasonNumber} value={s.seasonNumber}>
                            {s.name || `Season ${s.seasonNumber}`} ({s.episodeCount} eps)
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Episodes Grid / List */}
                {loadingEpisodes ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading episodes...</div>
                ) : episodes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {episodes.map((ep) => (
                      <button
                        key={ep.episodeNumber}
                        onClick={() => handleWatch(ep.seasonNumber, ep.episodeNumber)}
                        className="group flex items-center gap-3 p-2.5 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/50 transition-all text-left cursor-pointer"
                      >
                        <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                          {ep.stillUrl ? (
                            <img src={ep.stillUrl} alt={ep.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Play className="w-5 h-5" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-transparent flex items-center justify-center transition-all">
                            <Play className="w-4 h-4 fill-white text-white opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate group-hover:text-pink-300 transition-colors">
                            EP {ep.episodeNumber}: {ep.name}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {ep.overview || 'Stream this episode on Vinylflix'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No episodes available.</p>
                )}
              </div>
            )}

            {/* Similar Titles Carousel */}
            {details?.similar && details.similar.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  More Like This
                </h3>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {details.similar.slice(0, 10).map((sim) => (
                    <div
                      key={sim.tmdbId}
                      onClick={() => onSelectMovie?.(sim)}
                      className="flex-shrink-0 w-28 group cursor-pointer space-y-1.5"
                    >
                      <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-800 border border-slate-700/80 group-hover:border-pink-500 transition-all shadow-md">
                        <img
                          src={getFullPosterUrl(sim.posterPath)}
                          alt={sim.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-xs font-bold text-slate-200 truncate group-hover:text-pink-300">
                        {sim.title}
                      </p>
                      <p className="text-[10px] text-slate-400">★ {sim.rating.toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
