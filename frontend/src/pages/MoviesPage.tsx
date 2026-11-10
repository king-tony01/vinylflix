import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info, Star, Search, Film, Tv, Flame, X } from "lucide-react";
import type { MovieItem } from "../types/movie.js";
import {
  fetchTrending,
  fetchPopular,
  searchMovies,
  getFullBackdropUrl,
  getFullPosterUrl,
} from "../lib/movieApi.js";
import { MovieDetailModal } from "../components/MovieDetailModal.js";

const GENRES = [
  "All",
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
];

export const MoviesPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [selectedType, setSelectedType] = useState<"all" | "movie" | "tv">(
    "all",
  );
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [trendingMovies, setTrendingMovies] = useState<MovieItem[]>([]);
  const [catalogMovies, setCatalogMovies] = useState<MovieItem[]>([]);
  const [searchResults, setSearchResults] = useState<MovieItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // Modal State
  const [activeModalMovie, setActiveModalMovie] = useState<MovieItem | null>(
    null,
  );

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Initial load & genre/type change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const [trending, popular] = await Promise.all([
          fetchTrending(selectedType, selectedGenre),
          fetchPopular(
            selectedType === "all" ? "movie" : selectedType,
            1,
            selectedGenre,
          ),
        ]);

        if (!isMounted) return;
        setTrendingMovies(trending);
        setCatalogMovies(popular);
      } catch (err) {
        console.error("[MoviesPage] Failed to load movies:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedType, selectedGenre]);

  // Search effect
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      return;
    }

    let isMounted = true;
    setSearchLoading(true);

    searchMovies(debouncedQuery).then((results) => {
      if (!isMounted) return;
      setSearchResults(results);
      setSearchLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Billboard Hero item (first trending title)
  const heroItem = useMemo(() => {
    return trendingMovies.length > 0
      ? trendingMovies[0]
      : catalogMovies[0] || null;
  }, [trendingMovies, catalogMovies]);

  // Display list (Search results if searching, otherwise catalog)
  const displayMovies = useMemo(() => {
    if (debouncedQuery) return searchResults;
    return catalogMovies;
  }, [debouncedQuery, searchResults, catalogMovies]);

  const handleWatch = (item: MovieItem) => {
    navigate(
      `/watch/${item.tmdbId}${item.isSeries ? "?isSeries=true&season=1&episode=1" : ""}`,
    );
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 pb-24 overflow-y-auto">
      {/* 1. SPOTLIGHT BILLBOARD HERO (Hidden when actively searching) */}
      {!debouncedQuery && heroItem && (
        <div className="relative w-full h-[55vh] min-h-[380px] max-h-[560px] overflow-hidden bg-slate-950">
          <img
            src={getFullBackdropUrl(heroItem.backdropPath, heroItem.posterPath)}
            alt={heroItem.title}
            className="w-full h-full object-cover object-center filter brightness-90 transform scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />

          {/* Hero Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-4xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#FF0091] to-[#360099] text-white text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-lg shadow-pink-500/20">
                <Flame className="w-3.5 h-3.5 fill-white" />
                Featured Spotlight
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {heroItem.rating ? heroItem.rating.toFixed(1) : "8.2"}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {heroItem.releaseYear} •{" "}
                {heroItem.isSeries ? "TV Series" : "Movie"}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg line-clamp-1">
              {heroItem.title}
            </h1>

            {heroItem.overview && (
              <p className="text-sm md:text-base text-slate-300/90 font-normal line-clamp-2 md:line-clamp-3 leading-relaxed max-w-2xl drop-shadow">
                {heroItem.overview}
              </p>
            )}

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => handleWatch(heroItem)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF0091] to-[#360099] text-white font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-[#FF0091]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Watch Now</span>
              </button>
              <button
                onClick={() => setActiveModalMovie(heroItem)}
                className="px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold text-sm flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer"
              >
                <Info className="w-4 h-4 text-slate-300" />
                <span>More Details</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONTROLS, SEARCH & FILTERS BAR */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 md:px-8 py-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Type Toggle Tabs: All / Movies / TV Shows */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800/80 self-start max-[500px]:w-full max-[500px]:grid max-[500px]:grid-cols-3 max-[500px]:gap-1.5">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedType === "all"
                  ? "bg-gradient-to-r from-[#FF0091] to-[#360099] text-white shadow-md shadow-pink-950/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType("movie")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedType === "movie"
                  ? "bg-gradient-to-r from-[#FF0091] to-[#360099] text-white shadow-md shadow-pink-950/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Movies</span>
            </button>
            <button
              onClick={() => setSelectedType("tv")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedType === "tv"
                  ? "bg-gradient-to-r from-[#FF0091] to-[#360099] text-white shadow-md shadow-pink-950/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>TV Shows</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies, TV shows..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {GENRES.map((genre) => {
            const isSelected = selectedGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-pink-600/20 text-pink-300 border border-pink-500/50 shadow-sm"
                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CONTENT AREA */}
      <div className="px-4 md:px-8 pt-6 space-y-6">
        {/* Trending Highlights Carousel (When not searching and viewing All genres) */}
        {!debouncedQuery &&
          selectedGenre === "All" &&
          trendingMovies.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2 tracking-tight">
                <Flame className="w-5 h-5 text-[#FF0091]" />
                Trending Releases
              </h2>
              <div className="flex items-center gap-4 overflow-x-auto pb-3 scrollbar-none">
                {trendingMovies.slice(1, 12).map((item) => (
                  <div
                    key={item.tmdbId}
                    onClick={() => setActiveModalMovie(item)}
                    className="flex-shrink-0 w-36 sm:w-44 group cursor-pointer space-y-2"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 group-hover:border-[#FF0091]/60 shadow-lg group-hover:shadow-pink-950/30 transition-all duration-300">
                      <img
                        src={getFullPosterUrl(item.posterPath)}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-950/80 border border-white/10 text-amber-400 text-[10px] font-bold flex items-center gap-1 backdrop-blur-md">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {item.rating ? item.rating.toFixed(1) : "8.0"}
                      </div>
                      {/* Hover Play Button */}
                      <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF0091] to-[#360099] flex items-center justify-center shadow-lg shadow-[#FF0091]/50 transform scale-75 group-hover:scale-100 transition-transform">
                          <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate group-hover:text-pink-300 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.releaseYear} •{" "}
                        {item.isSeries ? "Series" : "Movie"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Main Grid Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
            {debouncedQuery
              ? `Search Results for "${debouncedQuery}"`
              : selectedGenre !== "All"
                ? `${selectedGenre} Titles`
                : "Popular on Vinylflix"}
          </h2>
          <span className="text-xs text-slate-500 font-semibold">
            {displayMovies.length} titles
          </span>
        </div>

        {/* Movies Grid */}
        {loading || searchLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="aspect-[2/3] w-full bg-slate-800 rounded-2xl" />
                <div className="h-3 w-3/4 bg-slate-800 rounded" />
                <div className="h-2.5 w-1/2 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : displayMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {displayMovies.map((item) => (
              <div
                key={item.tmdbId}
                onClick={() => setActiveModalMovie(item)}
                className="group cursor-pointer space-y-2"
              >
                {/* Poster Card */}
                <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 group-hover:border-[#FF0091]/70 shadow-lg group-hover:shadow-pink-950/40 transition-all duration-300">
                  <img
                    src={getFullPosterUrl(item.posterPath)}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Rating Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-950/80 border border-white/10 text-amber-400 text-[10px] font-bold flex items-center gap-1 backdrop-blur-md">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {item.rating ? item.rating.toFixed(1) : "8.0"}
                  </div>

                  {/* Series / Movie Tag */}
                  {item.isSeries && (
                    <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md bg-[#FF0091] text-white text-[9px] font-black uppercase tracking-wider shadow">
                      TV
                    </div>
                  )}

                  {/* Quick Action Overlay on Hover */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 p-3 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWatch(item);
                      }}
                      className="w-11 h-11 rounded-full bg-gradient-to-r from-[#FF0091] to-[#360099] flex items-center justify-center text-white shadow-lg shadow-[#FF0091]/40 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </button>
                    <span className="text-[11px] font-bold text-white/90">
                      Play Now
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <p className="text-xs font-bold text-white truncate group-hover:text-pink-300 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {item.releaseYear || "2024"} •{" "}
                    {item.isSeries ? "Series" : "Movie"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty Search State */
          <div className="py-20 text-center space-y-3">
            <Film className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">
              No movies or TV shows found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              We couldn't find matches for "{debouncedQuery}". Try another
              title, actor name, or genre.
            </p>
          </div>
        )}
      </div>

      {/* 4. MOVIE DETAIL MODAL */}
      <MovieDetailModal
        movie={activeModalMovie}
        isOpen={!!activeModalMovie}
        onClose={() => setActiveModalMovie(null)}
        onSelectMovie={(m) => setActiveModalMovie(m)}
      />
    </div>
  );
};
