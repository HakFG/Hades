// src/types/tmdb.ts
// Interfaces TypeScript para respostas da API TMDB
// Criado para resolver Bug #7 (Type Casting Inseguro com `any`)

// ─── Trending / TV ───────────────────────────────────────────────────────────

export interface TmdbTrendingResult {
  id: number;
  name: string;
  title?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type?: 'tv' | 'movie';
  overview?: string;
  vote_average?: number;
  popularity?: number;
}

export interface TmdbTrendingResponse {
  results: TmdbTrendingResult[];
  page: number;
  total_pages: number;
  total_results: number;
}

// ─── Season ──────────────────────────────────────────────────────────────────

export interface TmdbEpisode {
  id: number;
  episode_number: number;
  air_date: string | null;
  name: string | null;
  still_path: string | null;
  runtime?: number | null;
}

export interface TmdbSeasonSummary {
  id: number;
  season_number: number;
  episode_count?: number | null;
  poster_path?: string | null;
  air_date?: string | null;
  name?: string | null;
}

export interface TmdbSeasonDetail {
  id: number;
  season_number: number;
  name: string | null;
  air_date: string | null;
  poster_path: string | null;
  episodes: TmdbEpisode[];
}

// ─── TV Show ─────────────────────────────────────────────────────────────────

export interface TmdbNetwork {
  id: number;
  name: string;
  logo_path: string | null;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
}

export interface TmdbTvDetail {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  status: string;
  in_production: boolean;
  vote_average: number;
  popularity: number;
  first_air_date: string | null;
  last_air_date: string | null;
  number_of_seasons: number;
  number_of_episodes: number;
  genres: TmdbGenre[];
  networks: TmdbNetwork[];
  production_companies: TmdbProductionCompany[];
  seasons: TmdbSeasonSummary[];
  next_episode_to_air: TmdbEpisode | null;
  last_episode_to_air: TmdbEpisode | null;
  /** status_code presente quando TMDB retorna erro (e.g. 34 = Not Found) */
  status_code?: number;
}

// ─── Movie ───────────────────────────────────────────────────────────────────

export interface TmdbMovieDetail {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  release_date: string | null;
  status: string;
  vote_average: number;
  popularity: number;
  runtime: number | null;
  genres: TmdbGenre[];
  production_companies: TmdbProductionCompany[];
  /** status_code presente quando TMDB retorna erro */
  status_code?: number;
}

// ─── Changes (Recently Added) ─────────────────────────────────────────────────

export interface TmdbChangeItem {
  id: number;
  adult?: boolean;
}

export interface TmdbChangesResponse {
  results: TmdbChangeItem[];
  page: number;
  total_pages: number;
  total_results: number;
}

// ─── News (RSS → JSON via rss2json) ──────────────────────────────────────────

export interface RssNewsItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  thumbnail?: string;
  enclosure?: { link?: string; type?: string; length?: string };
}

export interface RssJsonResponse {
  status: string;
  feed?: {
    url: string;
    title: string;
    link: string;
    image: string;
  };
  items?: RssNewsItem[];
}

// ─── Activity log metadata ────────────────────────────────────────────────────

export interface ActivityMetadata {
  episodeCount?: number;
  label?: string;
  multiplier?: number;
  baseXP?: number;
  streakBonusXP?: number;
  streakMilestone?: number | null;
  [key: string]: unknown;
}
