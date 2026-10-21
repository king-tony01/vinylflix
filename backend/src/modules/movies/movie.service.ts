export interface StreamSourceItem {
  serverName: string;
  quality: string;
  url: string;
  playerType: 'embed' | 'direct';
  headers?: Record<string, string>;
}

export interface MovieItem {
  id: string;
  tmdbId: string;
  title: string;
  overview?: string;
  posterPath: string;
  backdropPath?: string;
  rating: number;
  releaseYear: string;
  genres: string[];
  isSeries?: boolean;
  seasonsCount?: number;
}

// In-memory response cache with TTL
const cache = new Map<string, { data: any; expiry: number }>();

function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCache<T>(key: string, data: T, ttlSeconds = 3600): void {
  cache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
}

export class MovieService {
  private static get apiKey(): string | undefined {
    return process.env.TMDB_API_KEY || process.env.TMDB_KEY;
  }

  private static formatTmdbItem(item: any, forceIsSeries?: boolean): MovieItem {
    const isTv = forceIsSeries !== undefined ? forceIsSeries : (item.media_type === 'tv' || !!item.first_air_date);
    const title = item.title || item.name || 'Untitled';
    const releaseDate = item.release_date || item.first_air_date || '';
    const year = releaseDate && releaseDate.length >= 4 ? releaseDate.substring(0, 4) : '';
    const genres = Array.isArray(item.genres)
      ? item.genres.map((g: any) => (typeof g === 'object' && g.name ? g.name : String(g)))
      : [];

    return {
      id: String(item.id),
      tmdbId: String(item.id),
      title,
      overview: item.overview || '',
      posterPath: item.poster_path ? (item.poster_path.startsWith('/') ? item.poster_path : `/${item.poster_path}`) : '',
      backdropPath: item.backdrop_path ? (item.backdrop_path.startsWith('/') ? item.backdrop_path : `/${item.backdrop_path}`) : undefined,
      rating: typeof item.vote_average === 'number' ? Math.round(item.vote_average * 10) / 10 : 0.0,
      releaseYear: year,
      genres,
      isSeries: isTv,
      seasonsCount: item.number_of_seasons || (isTv ? 1 : undefined),
    };
  }

  public static async getTrending(type: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week'): Promise<MovieItem[]> {
    const cacheKey = `trending_${type}_${timeWindow}`;
    const cached = getCached<MovieItem[]>(cacheKey);
    if (cached) return cached;

    const key = this.apiKey;
    if (key) {
      try {
        const url = `https://api.themoviedb.org/3/trending/${type}/${timeWindow}?api_key=${key}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = (await res.json()) as any;
          if (Array.isArray(json.results)) {
            const items = json.results.map((r: any) => this.formatTmdbItem(r, type === 'tv' ? true : type === 'movie' ? false : undefined));
            setCache(cacheKey, items, 1800); // 30 mins
            return items;
          }
        }
      } catch (err) {
        console.error('[MovieService] TMDB trending fetch error:', err);
      }
    }

    return this.getCuratedFallbackCatalog();
  }

  public static async getPopular(type: 'movie' | 'tv' = 'movie', page = 1): Promise<MovieItem[]> {
    const cacheKey = `popular_${type}_${page}`;
    const cached = getCached<MovieItem[]>(cacheKey);
    if (cached) return cached;

    const key = this.apiKey;
    if (key) {
      try {
        const url = `https://api.themoviedb.org/3/${type}/popular?api_key=${key}&page=${page}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = (await res.json()) as any;
          if (Array.isArray(json.results)) {
            const items = json.results.map((r: any) => this.formatTmdbItem(r, type === 'tv'));
            setCache(cacheKey, items, 3600);
            return items;
          }
        }
      } catch (err) {
        console.error('[MovieService] TMDB popular fetch error:', err);
      }
    }

    return this.getCuratedFallbackCatalog();
  }

  public static async search(query: string, page = 1): Promise<MovieItem[]> {
    if (!query || query.trim().length === 0) {
      return this.getTrending();
    }

    const trimmed = query.trim();
    const cacheKey = `search_${trimmed.toLowerCase()}_${page}`;
    const cached = getCached<MovieItem[]>(cacheKey);
    if (cached) return cached;

    const key = this.apiKey;
    if (key) {
      try {
        const url = `https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(trimmed)}&page=${page}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = (await res.json()) as any;
          if (Array.isArray(json.results)) {
            const items = json.results
              .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
              .map((r: any) => this.formatTmdbItem(r));
            setCache(cacheKey, items, 600);
            return items;
          }
        }
      } catch (err) {
        console.error('[MovieService] TMDB search error:', err);
      }
    }

    return this.getCuratedFallbackCatalog().filter((m) =>
      m.title.toLowerCase().includes(trimmed.toLowerCase()) ||
      (m.overview && m.overview.toLowerCase().includes(trimmed.toLowerCase()))
    );
  }

  public static async getDetails(tmdbId: string, isSeries = false): Promise<any> {
    const type = isSeries ? 'tv' : 'movie';
    const cacheKey = `details_${type}_${tmdbId}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const key = this.apiKey;
    if (key) {
      try {
        const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${key}&append_to_response=credits,recommendations,similar`;
        const res = await fetch(url);
        if (res.ok) {
          const json = (await res.json()) as any;
          const formatted = this.formatTmdbItem(json, isSeries);
          const result = {
            ...formatted,
            tagline: json.tagline || '',
            runtime: json.runtime || (Array.isArray(json.episode_run_time) ? json.episode_run_time[0] : null),
            cast: Array.isArray(json.credits?.cast)
              ? json.credits.cast.slice(0, 10).map((c: any) => ({
                  name: c.name,
                  character: c.character,
                  profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : null,
                }))
              : [],
            seasons: Array.isArray(json.seasons)
              ? json.seasons.map((s: any) => ({
                  seasonNumber: s.season_number,
                  name: s.name,
                  episodeCount: s.episode_count,
                  posterPath: s.poster_path ? `https://image.tmdb.org/t/p/w300${s.poster_path}` : null,
                }))
              : [],
            similar: Array.isArray(json.similar?.results)
              ? json.similar.results.slice(0, 15).map((r: any) => this.formatTmdbItem(r, isSeries))
              : Array.isArray(json.recommendations?.results)
                ? json.recommendations.results.slice(0, 15).map((r: any) => this.formatTmdbItem(r, isSeries))
                : [],
          };
          setCache(cacheKey, result, 7200);
          return result;
        }
      } catch (err) {
        console.error('[MovieService] TMDB details error:', err);
      }
    }

    const fallback = this.getCuratedFallbackCatalog().find((m) => m.tmdbId === tmdbId);
    const similarFallback = this.getCuratedFallbackCatalog().filter((m) => m.tmdbId !== tmdbId);
    const fallbackCast = [
      { name: 'Ryan Reynolds', character: 'Wade Wilson / Deadpool', profilePath: 'https://image.tmdb.org/t/p/w200/4SYTH5FRAxWhsvTZ6bs42Io9Av5.jpg' },
      { name: 'Hugh Jackman', character: 'Logan / Wolverine', profilePath: 'https://image.tmdb.org/t/p/w200/4Xo1ssm1B99Yp22rf419F2zHn6V.jpg' },
      { name: 'Emma Corrin', character: 'Cassandra Nova', profilePath: 'https://image.tmdb.org/t/p/w200/w9d4G3pU04iF0m0qD515qXyNf7E.jpg' },
      { name: 'Morena Baccarin', character: 'Vanessa Carlysle', profilePath: 'https://image.tmdb.org/t/p/w200/kBSKKaO62422tVvBKyN68qN2a2m.jpg' },
      { name: 'Matthew Macfadyen', character: 'Mr. Paradox', profilePath: null },
      { name: 'Dafne Keen', character: 'Laura / X-23', profilePath: null },
    ];

    if (fallback) {
      return {
        ...fallback,
        tagline: 'Stream full movies on Vinylflix',
        runtime: fallback.isSeries ? 50 : 125,
        cast: fallbackCast,
        seasons: fallback.isSeries
          ? Array.from({ length: fallback.seasonsCount || 2 }, (_, i) => ({
              seasonNumber: i + 1,
              name: `Season ${i + 1}`,
              episodeCount: 8,
            }))
          : [],
        similar: similarFallback,
      };
    }

    return {
      id: tmdbId,
      tmdbId,
      title: 'Movie Title',
      overview: 'Experience high-definition cinema streaming on Vinylflix.',
      posterPath: '/jbwYaoYWZwxtPP76AZnfYKQjCEB.jpg',
      backdropPath: '/dvBCdCohwWbsP5qAaglOXagDMtk.jpg',
      rating: 8.0,
      releaseYear: '2024',
      genres: ['Action', 'Thriller'],
      isSeries,
      cast: fallbackCast,
      similar: similarFallback,
    };
  }

  public static async getSimilar(tmdbId: string, isSeries = false): Promise<MovieItem[]> {
    const details = await this.getDetails(tmdbId, isSeries);
    return details.similar || [];
  }

  public static async getSeasonEpisodes(tmdbId: string, seasonNumber: number): Promise<any[]> {
    const cacheKey = `season_${tmdbId}_${seasonNumber}`;
    const cached = getCached<any[]>(cacheKey);
    if (cached) return cached;

    const key = this.apiKey;
    if (key) {
      try {
        const url = `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?api_key=${key}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = (await res.json()) as any;
          if (Array.isArray(json.episodes)) {
            const episodes = json.episodes.map((ep: any) => ({
              episodeNumber: ep.episode_number,
              seasonNumber: ep.season_number,
              name: ep.name,
              overview: ep.overview,
              airDate: ep.air_date,
              stillUrl: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null,
              rating: ep.vote_average,
            }));
            setCache(cacheKey, episodes, 7200);
            return episodes;
          }
        }
      } catch (err) {
        console.error('[MovieService] TMDB season fetch error:', err);
      }
    }

    return Array.from({ length: 10 }, (_, i) => ({
      episodeNumber: i + 1,
      seasonNumber,
      name: `Episode ${i + 1}`,
      overview: `Streaming episode ${i + 1} of season ${seasonNumber}.`,
      airDate: '2024',
      stillUrl: null,
      rating: 8.0,
    }));
  }

  public static resolveStreams(tmdbId: string, season?: number, episode?: number, isSeries?: boolean): StreamSourceItem[] {
    const isTv = isSeries || (season !== undefined && episode !== undefined);
    const s = season ?? 1;
    const ep = episode ?? 1;

    return [
      {
        serverName: 'Server 1 (Auto)',
        quality: '1080p Full HD',
        url: isTv
          ? `https://vidlink.pro/tv/${tmdbId}/${s}/${ep}?autoplay=true`
          : `https://vidlink.pro/movie/${tmdbId}?autoplay=true`,
        playerType: 'embed',
      },
      {
        serverName: 'Server 2 (HD)',
        quality: '1080p HD',
        url: isTv
          ? `https://vidsrc.pm/embed/tv/${tmdbId}/${s}/${ep}`
          : `https://vidsrc.pm/embed/movie/${tmdbId}`,
        playerType: 'embed',
      },
      {
        serverName: 'Server 3 (HD)',
        quality: '1080p Mirror',
        url: isTv
          ? `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${ep}`
          : `https://vidsrc.to/embed/movie/${tmdbId}`,
        playerType: 'embed',
      },
      {
        serverName: 'Server 4 (Backup)',
        quality: 'Adaptive Mirror',
        url: isTv
          ? `https://2embed.skin/embedtv/${tmdbId}&s=${s}&e=${ep}`
          : `https://2embed.skin/embed/${tmdbId}`,
        playerType: 'embed',
      },
    ];
  }

  // Expanded fallback catalog if TMDB key is not yet provided
  public static getCuratedFallbackCatalog(): MovieItem[] {
    return [
      {
        id: '533535',
        tmdbId: '533535',
        title: 'Deadpool & Wolverine',
        overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again.',
        posterPath: '/jbwYaoYWZwxtPP76AZnfYKQjCEB.jpg',
        backdropPath: '/dvBCdCohwWbsP5qAaglOXagDMtk.jpg',
        rating: 7.7,
        releaseYear: '2024',
        genres: ['Action', 'Comedy', 'Sci-Fi'],
        isSeries: false,
      },
      {
        id: '1022789',
        tmdbId: '1022789',
        title: 'Inside Out 2',
        overview: 'Teenager Riley\'s mind headquarters is undergoing a sudden demolition to make room for something entirely unexpected: new Emotions!',
        posterPath: '/lWVwWRLqpS1OaNg7KT0ZecSW0PK.jpg',
        backdropPath: '/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
        rating: 7.6,
        releaseYear: '2024',
        genres: ['Animation', 'Family', 'Adventure'],
        isSeries: false,
      },
      {
        id: '693134',
        tmdbId: '693134',
        title: 'Dune: Part Two',
        overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.',
        posterPath: '/czembW0Rk1Ke7lCJGahbOhdCLZ.jpg',
        backdropPath: '/uhUO7vQQKvCTfQWubOt5MAKokbL.jpg',
        rating: 8.2,
        releaseYear: '2024',
        genres: ['Sci-Fi', 'Adventure'],
        isSeries: false,
      },
      {
        id: '945961',
        tmdbId: '945961',
        title: 'Alien: Romulus',
        overview: 'While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form in the universe.',
        posterPath: '/b33nnPe1OGc5pV8mUQySzwKNCPK.jpg',
        backdropPath: '/iYqSQaWDttQIQzsxg9xHyg0bttG.jpg',
        rating: 7.3,
        releaseYear: '2024',
        genres: ['Horror', 'Sci-Fi'],
        isSeries: false,
      },
      {
        id: '823464',
        tmdbId: '823464',
        title: 'Godzilla x Kong: The New Empire',
        overview: 'Following their explosive showdown, Godzilla and Kong must reunite against a colossal undiscovered threat hidden within our world, challenging their very existence – and our own.',
        posterPath: '/1DTP1Ph4uzNO6ofRUm7eAimWoKD.jpg',
        backdropPath: '/qrGtVFxaD8c7et0jUtaYhyTzzPg.jpg',
        rating: 7.2,
        releaseYear: '2024',
        genres: ['Action', 'Sci-Fi'],
        isSeries: false,
      },
      {
        id: '93405',
        tmdbId: '93405',
        title: 'Squid Game',
        overview: 'Hundreds of cash-strapped players accept a strange invitation to compete in children\'s games. Inside, a tempting prize awaits with deadly high stakes.',
        posterPath: '/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg',
        backdropPath: '/2meX1nMdScFOoV4370rqHWKm5oY.jpg',
        rating: 7.8,
        releaseYear: '2021',
        genres: ['Action', 'Mystery', 'Drama'],
        isSeries: true,
        seasonsCount: 2,
      },
      {
        id: '94997',
        tmdbId: '94997',
        title: 'House of the Dragon',
        overview: 'The Targaryen dynasty is at the absolute apex of its power, with more than 15 dragons under their yoke. Most empires crumble from heights such as a slow fall begins when King Viserys breaks with a century of tradition by naming his daughter Rhaenyra heir to the Iron Throne.',
        posterPath: '/t9Xke5724fqW3429A46FeGTNVcw.jpg',
        backdropPath: '/etj5CuMuamBUVZB0feYocNtUtS3.jpg',
        rating: 8.4,
        releaseYear: '2022',
        genres: ['Drama', 'Action & Adventure', 'Sci-Fi & Fantasy'],
        isSeries: true,
        seasonsCount: 2,
      },
      {
        id: '1399',
        tmdbId: '1399',
        title: 'Game of Thrones',
        overview: 'Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north.',
        posterPath: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
        backdropPath: '/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
        rating: 8.4,
        releaseYear: '2011',
        genres: ['Sci-Fi & Fantasy', 'Drama', 'Action & Adventure'],
        isSeries: true,
        seasonsCount: 8,
      },
      {
        id: '76479',
        tmdbId: '76479',
        title: 'The Boys',
        overview: 'A fun and irreverent take on what happens when superheroes—who are as popular as celebrities, as influential as politicians, and as revered as gods—abuse their superpowers rather than use them for good.',
        posterPath: '/2zmTngn1tYCzAvfnrFLhxeD82hz.jpg',
        backdropPath: '/muth40F2bUu8wN0J4G8m4o2D6Zt.jpg',
        rating: 8.5,
        releaseYear: '2019',
        genres: ['Action & Adventure', 'Sci-Fi & Fantasy'],
        isSeries: true,
        seasonsCount: 4,
      },
      {
        id: '872585',
        tmdbId: '872585',
        title: 'Oppenheimer',
        overview: 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during World War II.',
        posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        backdropPath: '/rMvPXy8PUjj1o8o1pzgQbdNCsvj.jpg',
        rating: 8.1,
        releaseYear: '2023',
        genres: ['Drama', 'History'],
        isSeries: false,
      },
      {
        id: '519182',
        tmdbId: '519182',
        title: 'Despicable Me 4',
        overview: 'Gru and Lucy and their girls—Margo, Edith and Agnes—welcome a new member to the Gru family, Gru Jr., who is intent on tormenting his dad.',
        posterPath: '/wWba3TaojhK7NdycRhoQpsG0FaH.jpg',
        backdropPath: '/lgkFt6tc39tXYKNj1yJ1bO8vJ5c.jpg',
        rating: 7.1,
        releaseYear: '2024',
        genres: ['Animation', 'Family', 'Comedy'],
        isSeries: false,
      },
      {
        id: '573435',
        tmdbId: '573435',
        title: 'Bad Boys: Ride or Die',
        overview: 'After their late former Captain is framed, Lowrey and Burnett try to clear his name, only to end up on the run themselves.',
        posterPath: '/nP6RliHjxsz4irTKsxe8FRhKZYl.jpg',
        backdropPath: '/ga4OLm4qLxO1lrkcrbvvgf593qM.jpg',
        rating: 7.5,
        releaseYear: '2024',
        genres: ['Action', 'Comedy', 'Crime'],
        isSeries: false,
      },
    ];
  }
}
