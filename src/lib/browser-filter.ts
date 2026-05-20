/* eslint-disable @typescript-eslint/no-explicit-any */

import { normalizeProductionStatus, type MediaKind, type ProductionStatus } from '@/lib/production-status';
import { titlePageSeasonStatus } from '@/lib/tmdb-status';
import { fetchTmdbJson } from '@/lib/tmdb-json';

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
  seasonStatus?: string | null;
  releaseDate?: string | null;
  overview?: string | null;
  popularity?: number | null;
  voteAverage?: number | null;
  linkSlug: string;
  /** Temporadas TMDB para navegação no card (séries). */
  seasonSummaries?: Array<{
    id: string;
    seasonNumber: number;
    title: string;
    episodeCount: number;
    status: string;
    href: string;
  }>;
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
  return (await fetchTmdbJson<any>(endpoint, { revalidate: 3600 })) ?? { results: [] };
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
  const seasonDetails = await fetchTmdb(`/tv/${show.id}/season/${seasonNumber}`).catch(() => null);
  const seasonStatus = titlePageSeasonStatus(seasonDetails?.episodes ?? null);

  const seasonSummaries = seasons
    .filter((season: { season_number?: number }) => (season.season_number ?? 0) > 0)
    .map((season: { season_number: number; episode_count?: number; name?: string; air_date?: string }) => ({
      id: `tv-${show.id}-s${season.season_number}`,
      seasonNumber: season.season_number,
      title: season.name || `Season ${season.season_number}`,
      episodeCount: season.episode_count ?? 0,
      status: season.air_date || '—',
      href: `/titles/tv-${show.id}-s${season.season_number}`,
    }))
    .sort((a: { seasonNumber: number }, b: { seasonNumber: number }) => a.seasonNumber - b.seasonNumber);

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
    seasonStatus,
    releaseDate: latest?.air_date || details.first_air_date || null,
    overview: latest?.overview || details.overview || show.overview || null,
    popularity: details.popularity ?? show.popularity ?? null,
    voteAverage: details.vote_average ?? show.vote_average ?? null,
    linkSlug: `tv-${show.id}-s${seasonNumber}`,
    seasonSummaries,
  };
}

export async function getFilteredEntriesByBrowser(
  mediaType: MediaKind,
  filter: string,
  selectedFilters: string[] = ['All'],
  limit = 30,
): Promise<BrowserMediaItem[]> {
  const data = await fetchTmdb(endpointFor(filter, mediaType));
  const source = (data.results ?? []).slice(0, limit);
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
    getFilteredEntriesByBrowser('movie', 'trending-movies', ['All'], 12),
    getFilteredEntriesByBrowser('movie', 'popular-movies', ['All'], 12),
    getFilteredEntriesByBrowser('tv', 'trending-tv', ['All'], 12),
    getFilteredEntriesByBrowser('movie', 'upcoming-movies', ['All'], 12),
    getFilteredEntriesByBrowser('tv', 'popular-tv', ['All'], 12),
  ]);

  return { trendingMovies, popularMovies, trendingTv, upcomingMovies, popularTv };
}
