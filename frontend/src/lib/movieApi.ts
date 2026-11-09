import { apiRequest } from './api.js';
import type { MovieItem, MovieDetail, EpisodeItem, StreamSource, SubtitleCue } from '../types/movie.js';

export function getFullPosterUrl(path?: string | null): string {
  if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
}

export function getFullBackdropUrl(path?: string | null, posterPath?: string | null): string {
  if (path && path.startsWith('http')) return path;
  if (path) return `https://image.tmdb.org/t/p/original${path}`;
  return getFullPosterUrl(posterPath);
}

export async function fetchTrending(type: 'all' | 'movie' | 'tv' = 'all', genre?: string): Promise<MovieItem[]> {
  const params = new URLSearchParams();
  if (type !== 'all') params.set('type', type);
  if (genre && genre !== 'All') params.set('genre', genre);

  const res = await apiRequest<MovieItem[]>(`/movies/trending?${params.toString()}`);
  if (res.success && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

export async function fetchPopular(type: 'movie' | 'tv' = 'movie', page = 1, genre?: string): Promise<MovieItem[]> {
  const params = new URLSearchParams();
  params.set('type', type);
  params.set('page', String(page));
  if (genre && genre !== 'All') params.set('genre', genre);

  const res = await apiRequest<MovieItem[]>(`/movies/popular?${params.toString()}`);
  if (res.success && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

export async function searchMovies(query: string, page = 1): Promise<MovieItem[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({ q: query.trim(), page: String(page) });
  const res = await apiRequest<MovieItem[]>(`/movies/search?${params.toString()}`);
  if (res.success && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

export async function fetchMovieDetails(tmdbId: string, isSeries = false): Promise<MovieDetail | null> {
  const res = await apiRequest<MovieDetail>(`/movies/${tmdbId}?isSeries=${isSeries}`);
  if (res.success && res.data) {
    return res.data;
  }
  return null;
}

export async function fetchSimilarMovies(tmdbId: string, isSeries = false): Promise<MovieItem[]> {
  const res = await apiRequest<MovieItem[]>(`/movies/${tmdbId}/similar?isSeries=${isSeries}`);
  if (res.success && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

export async function fetchSeasonEpisodes(tmdbId: string, seasonNumber: number): Promise<EpisodeItem[]> {
  const res = await apiRequest<EpisodeItem[]>(`/movies/${tmdbId}/season/${seasonNumber}`);
  if (res.success && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

export async function fetchMovieStreams(
  tmdbId: string,
  season?: number,
  episode?: number,
  isSeries = false
): Promise<StreamSource[]> {
  const params = new URLSearchParams();
  if (season !== undefined) params.set('season', String(season));
  if (episode !== undefined) params.set('episode', String(episode));
  if (isSeries) params.set('isSeries', 'true');

  const res = await apiRequest<StreamSource[]>(`/movies/${tmdbId}/streams?${params.toString()}`);
  if (res.success && Array.isArray(res.data) && res.data.length > 0) {
    return res.data;
  }

  // Client-side fallback if backend API is offline
  const s = season ?? 1;
  const ep = episode ?? 1;
  return [
    {
      serverName: 'Server 1 (VidLink Auto)',
      quality: '1080p Auto',
      url: isSeries
        ? `https://vidlink.pro/tv/${tmdbId}/${s}/${ep}?autoplay=true`
        : `https://vidlink.pro/movie/${tmdbId}?autoplay=true`,
      playerType: 'embed',
    },
    {
      serverName: 'Server 2 (VidSrc HD)',
      quality: '1080p HD',
      url: isSeries
        ? `https://vidsrc.pm/embed/tv/${tmdbId}/${s}/${ep}`
        : `https://vidsrc.pm/embed/movie/${tmdbId}`,
      playerType: 'embed',
    },
    {
      serverName: 'Server 3 (VidSrc Mirror)',
      quality: '1080p Mirror',
      url: isSeries
        ? `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${ep}`
        : `https://vidsrc.to/embed/movie/${tmdbId}`,
      playerType: 'embed',
    },
  ];
}

// Subtitle parser for WebVTT and SRT
export function parseSubtitles(raw: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  if (!raw) return cues;

  const clean = raw.replace(/\uFEFF/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n');

  let currentStart: number | null = null;
  let currentEnd: number | null = null;
  const textBuffer: string[] = [];

  const parseTimestamp = (ts: string): number | null => {
    const match = /(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})[,\.](\d{1,3})/.exec(ts);
    if (!match) return null;
    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = parseInt(match[2], 10) || 0;
    const seconds = parseInt(match[3], 10) || 0;
    const ms = parseInt((match[4] || '0').padEnd(3, '0').slice(0, 3), 10) || 0;
    return hours * 3600 + minutes * 60 + seconds + ms / 1000;
  };

  const flush = () => {
    if (currentStart !== null && currentEnd !== null && textBuffer.length > 0) {
      let text = textBuffer.join(' ').replace(/<[^>]+>/g, '').trim();
      text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      if (text) {
        cues.push({ start: currentStart, end: currentEnd, text });
      }
    }
    currentStart = null;
    currentEnd = null;
    textBuffer.length = 0;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes('-->')) {
      flush();
      const parts = trimmed.split('-->');
      if (parts.length >= 2) {
        currentStart = parseTimestamp(parts[0].trim());
        const endPart = parts[1].trim().split(/\s+/)[0];
        currentEnd = parseTimestamp(endPart);
      }
      continue;
    }

    if (!trimmed || trimmed.startsWith('WEBVTT') || trimmed.startsWith('NOTE') || trimmed.startsWith('STYLE')) {
      if (!trimmed) flush();
      continue;
    }

    if (currentStart === null) continue;
    textBuffer.push(trimmed);
  }

  flush();
  return cues.sort((a, b) => a.start - b.start);
}

export async function fetchAndParseSubtitles(url: string): Promise<SubtitleCue[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    return parseSubtitles(text);
  } catch (err) {
    console.warn('[movieApi] Failed to fetch/parse subtitle track:', err);
    return [];
  }
}
