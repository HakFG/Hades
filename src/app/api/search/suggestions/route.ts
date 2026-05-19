import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildSeasonTitle } from '@/lib/utils';
import { normalizeProductionStatus } from '@/lib/production-status';
import { titlePageSeasonStatus } from '@/lib/tmdb-status';

const TMDB = process.env.NEXT_PUBLIC_TMDB_BASE_URL ?? 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

type MediaType = 'movie' | 'tv';

interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
  genre_ids?: number[];
  popularity?: number;
  vote_average?: number;
}

async function tmdbJson(endpoint: string) {
  if (!API_KEY) return { results: [] };
  const glue = endpoint.includes('?') ? '&' : '?';
  const response = await fetch(`${TMDB}${endpoint}${glue}api_key=${API_KEY}&language=en-US`, {
    next: { revalidate: 60 * 60 },
  });
  if (!response.ok) return { results: [] };
  return response.json();
}

function splitGenres(value: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((genre) => genre.trim())
    .filter(Boolean);
}

async function favoriteGenreNames() {
  const entries = await prisma.entry.findMany({
    where: { status: { in: ['WATCHING', 'COMPLETED', 'REWATCHING'] } },
    select: { genres: true },
    take: 200,
  });

  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const genre of splitGenres(entry.genres)) {
      counts.set(genre.toLowerCase(), (counts.get(genre.toLowerCase()) ?? 0) + 1);
    }
  }

  return new Set(
    [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([genre]) => genre),
  );
}

async function genreMap(type: MediaType) {
  const data = await tmdbJson(`/genre/${type}/list`);
  return new Map<number, string>(
    (data.genres ?? []).map((genre: { id: number; name: string }) => [genre.id, genre.name]),
  );
}

function sortSmart(items: TmdbItem[], favorites: Set<string>, namesById: Map<number, string>) {
  return [...items].sort((a, b) => {
    const score = (item: TmdbItem) => {
      const genreBoost = (item.genre_ids ?? []).some((id) => favorites.has((namesById.get(id) ?? '').toLowerCase()))
        ? 200
        : 0;
      return genreBoost + (item.vote_average ?? 0) * 10 + (item.popularity ?? 0);
    };
    return score(b) - score(a);
  });
}

async function movieSuggestion(item: TmdbItem) {
  const detail = await tmdbJson(`/movie/${item.id}`);
  return {
    tmdbId: item.id,
    title: detail.title ?? item.title ?? 'Untitled',
    poster_path: detail.poster_path ?? item.poster_path ?? null,
    backdrop_path: detail.backdrop_path ?? item.backdrop_path ?? null,
    type: 'MOVIE',
    linkSlug: `movie-${item.id}`,
    airYear: (detail.release_date ?? item.release_date ?? '').split('-')[0] || undefined,
    airDate: detail.release_date ?? item.release_date ?? null,
    productionStatus: normalizeProductionStatus(detail.status, 'movie'),
    overview: detail.overview ?? item.overview ?? null,
    popularity: detail.popularity ?? item.popularity ?? 0,
    voteAverage: detail.vote_average ?? item.vote_average ?? 0,
  };
}

async function tvSuggestion(item: TmdbItem) {
  const detail = await tmdbJson(`/tv/${item.id}`);
  const seasons = (detail.seasons ?? [])
    .filter((season: { season_number?: number }) => (season.season_number ?? 0) > 0)
    .sort((a: { season_number: number }, b: { season_number: number }) => b.season_number - a.season_number);
  const latest = seasons[0];
  const seasonNumber = latest?.season_number ?? 1;
  const seasonDetail = await tmdbJson(`/tv/${item.id}/season/${seasonNumber}`);
  const seasonStatus = titlePageSeasonStatus(seasonDetail.episodes ?? null) ?? undefined;
  const title = buildSeasonTitle(detail.name ?? item.name ?? 'Untitled', seasonNumber);

  return {
    tmdbId: latest?.id ?? item.id,
    parentTmdbId: item.id,
    season_number: seasonNumber,
    title,
    poster_path: latest?.poster_path ?? detail.poster_path ?? item.poster_path ?? null,
    backdrop_path: detail.backdrop_path ?? item.backdrop_path ?? null,
    type: 'TV_SEASON',
    linkSlug: `tv-${item.id}-s${seasonNumber}`,
    episode_count: latest?.episode_count ?? null,
    airYear: (latest?.air_date ?? detail.first_air_date ?? item.first_air_date ?? '').split('-')[0] || undefined,
    airDate: latest?.air_date ?? detail.first_air_date ?? item.first_air_date ?? null,
    productionStatus: normalizeProductionStatus(detail.status, 'tv', detail.in_production),
    seasonStatus,
    overview: latest?.overview || detail.overview || item.overview || null,
    popularity: detail.popularity ?? item.popularity ?? 0,
    voteAverage: detail.vote_average ?? item.vote_average ?? 0,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') === 'movie' ? 'movie' : 'tv';

  const entries = await prisma.entry.findMany({
    select: { tmdbId: true, parentTmdbId: true },
  });
  const existingTmdbIds = new Set(entries.map((entry) => entry.tmdbId));
  const existingParentIds = new Set(entries.map((entry) => entry.parentTmdbId).filter(Boolean));

  const [favorites, namesById, trending, popular, discovery] = await Promise.all([
    favoriteGenreNames(),
    genreMap(type),
    tmdbJson(`/trending/${type}/week`),
    tmdbJson(type === 'movie' ? '/movie/popular' : '/tv/popular'),
    tmdbJson(`/discover/${type}?sort_by=vote_average.desc&vote_count.gte=${type === 'movie' ? 800 : 350}`),
  ]);

  const seen = new Set<number>();
  const candidates = [...(trending.results ?? []), ...(popular.results ?? []), ...(discovery.results ?? [])]
    .filter((item: TmdbItem) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return type === 'movie' ? !existingTmdbIds.has(item.id) : !existingParentIds.has(item.id);
    });

  const ranked = sortSmart(candidates, favorites, namesById).slice(0, 10);
  const hydrated = await Promise.all(
    ranked.map((item) => (type === 'movie' ? movieSuggestion(item) : tvSuggestion(item))),
  );

  const suggestions = hydrated.filter((item) => !existingTmdbIds.has(item.tmdbId)).slice(0, 8);
  return NextResponse.json({ suggestions });
}
