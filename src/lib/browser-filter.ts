/* eslint-disable @typescript-eslint/no-explicit-any */

import { normalizeProductionStatus, type MediaKind, type ProductionStatus } from '@/lib/production-status';

const TMDB = process.env.NEXT_PUBLIC_TMDB_BASE_URL ?? 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export interface BrowserMediaItem {
  id: string;
  tmdbId: number;
  parentTmdbId?: number | null;
  seasonNumber?: number | null;
  title: string;
  type: 'MOVIE' | 'TV_SEASON';
  posterPath?: string | null;
  backdropPath?: string | null;
  productionStatus: ProductionStatus;
  releaseDate?: string | null;
  overview?: string | null;
  popularity?: number | null;
  voteAverage?: number | null;
  linkSlug: string;
}

function endpointFor(filter: string, mediaType: MediaKind) {
  if (filter === 'trending-movies') return '/trending/movie/week';
  if (filter === 'popular-movies') return '/movie/popular';
  if (filter === 'upcoming-movies') return '/movie/upcoming';
  if (filter === 'trending-tv') return '/trending/tv/week';
  if (filter === 'popular-tv') return '/tv/popular';
  return mediaType === 'movie' ? '/trending/movie/week' : '/trending/tv/week';
}

async function fetchTmdb(endpoint: string) {
  if (!API_KEY) return { results: [] };
  const glue = endpoint.includes('?') ? '&' : '?';
  const response = await fetch(`${TMDB}${endpoint}${glue}api_key=${API_KEY}&language=en-US`);
  if (!response.ok) throw new Error(`TMDB HTTP ${response.status}`);
  return response.json();
}

async function hydrateMovie(movie: any): Promise<BrowserMediaItem> {
  let details = movie;
  try {
    details = await fetchTmdb(`/movie/${movie.id}`);
  } catch {
    details = movie;
  }

  const productionStatus = normalizeProductionStatus(details.status, 'movie');

  return {
    id: `movie-${movie.id}`,
    tmdbId: movie.id,
    title: details.title || movie.title || 'Untitled',
    type: 'MOVIE',
    posterPath: details.poster_path || movie.poster_path || null,
    backdropPath: details.backdrop_path || movie.backdrop_path || null,
    productionStatus,
    releaseDate: details.release_date || movie.release_date || null,
    overview: details.overview || movie.overview || null,
    popularity: details.popularity ?? movie.popularity ?? null,
    voteAverage: details.vote_average ?? movie.vote_average ?? null,
    linkSlug: `movie-${movie.id}`,
  };
}

async function hydrateTv(show: any): Promise<BrowserMediaItem | null> {
  let details = show;
  try {
    details = await fetchTmdb(`/tv/${show.id}`);
  } catch {
    details = show;
  }

  const seasons = Array.isArray(details.seasons)
    ? details.seasons.filter((season: any) => season.season_number > 0)
    : [];
  const latest = seasons.sort((a: any, b: any) => (b.season_number ?? 0) - (a.season_number ?? 0))[0];
  if (!latest && !show.poster_path) return null;

  const seasonNumber = latest?.season_number ?? 1;
  const productionStatus = normalizeProductionStatus(details.status, 'tv', details.in_production);

  return {
    id: `tv-${show.id}-s${seasonNumber}`,
    tmdbId: latest?.id ?? show.id,
    parentTmdbId: show.id,
    seasonNumber,
    title: seasonNumber > 1 ? `${details.name || show.name} ${seasonNumber}th Season` : details.name || show.name || 'Untitled',
    type: 'TV_SEASON',
    posterPath: latest?.poster_path || details.poster_path || show.poster_path || null,
    backdropPath: details.backdrop_path || show.backdrop_path || null,
    productionStatus,
    releaseDate: latest?.air_date || details.first_air_date || null,
    overview: latest?.overview || details.overview || show.overview || null,
    popularity: details.popularity ?? show.popularity ?? null,
    voteAverage: details.vote_average ?? show.vote_average ?? null,
    linkSlug: `tv-${show.id}-s${seasonNumber}`,
  };
}

export async function getFilteredEntriesByBrowser(
  mediaType: MediaKind,
  filter: string,
  selectedFilters: string[] = ['All'],
): Promise<BrowserMediaItem[]> {
  const data = await fetchTmdb(endpointFor(filter, mediaType));
  const source = (data.results ?? []).slice(0, 30);
  const hydrated = await Promise.all(
    source.map((item: any) => (mediaType === 'movie' ? hydrateMovie(item) : hydrateTv(item))),
  );

  const items = hydrated.filter(Boolean) as BrowserMediaItem[];
  const statusFilters = selectedFilters.filter((item) => item && item !== 'All');

  if (statusFilters.length === 0) return items;
  return items.filter((item) => statusFilters.includes(item.productionStatus));
}

export async function getBrowserHomeSections() {
  const [trendingMovies, popularMovies, trendingTv, upcomingMovies, popularTv] = await Promise.all([
    getFilteredEntriesByBrowser('movie', 'trending-movies'),
    getFilteredEntriesByBrowser('movie', 'popular-movies'),
    getFilteredEntriesByBrowser('tv', 'trending-tv'),
    getFilteredEntriesByBrowser('movie', 'upcoming-movies'),
    getFilteredEntriesByBrowser('tv', 'popular-tv'),
  ]);

  return { trendingMovies, popularMovies, trendingTv, upcomingMovies, popularTv };
}
