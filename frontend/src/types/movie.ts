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

export interface CastMember {
  name: string;
  character?: string;
  profilePath?: string | null;
}

export interface SeasonInfo {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  posterPath?: string | null;
}

export interface EpisodeItem {
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview?: string;
  airDate?: string;
  stillUrl?: string | null;
  rating?: number;
}

export interface MovieDetail extends MovieItem {
  tagline?: string;
  runtime?: number | null;
  cast: CastMember[];
  seasons: SeasonInfo[];
  similar: MovieItem[];
}

export interface SubtitleTrack {
  id?: string;
  language: string;
  url: string;
  type?: string;
}

export interface SubtitleCue {
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface StreamSource {
  serverName: string;
  quality: string;
  url: string;
  playerType: 'direct' | 'embed';
  headers?: Record<string, string>;
  isDirectHls?: boolean;
  subtitles?: SubtitleTrack[];
}
