import { NextResponse } from 'next/server';
import { normalizeProductionStatus } from '@/lib/production-status';
import { fetchTmdbJson } from '@/lib/tmdb-json';
import { titlePageSeasonStatus } from '@/lib/tmdb-status';
import { buildSeasonTitle } from '@/lib/utils';
import type { AdvancedFilters } from '@/components/AdvancedFilterChips';
import type { SearchMediaItem } from '@/components/SearchMediaCard';

export const runtime = 'nodejs';

type MediaType = 'movie' | 'tv';

interface RawTitle {
  id: number;
  name?: string;
  title?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string | null;
  vote_average?: number;
  first_air_date?: string;
  release_date?: string;
  popularity?: number;
}

interface TmdbList<T> {
  page?: number;
  total_pages?: number;
  results?: T[];
  genres?: Array<{ id: number; name: string }>;
}

const EMPTY_ADVANCED: AdvancedFilters = {
  minRating: 0,
  maxRuntime: 0,
  network: '',
  hiddenGems: false,
};

function mediaTypeFromParams(searchParams: URLSearchParams): MediaType {
  return searchParams.get('type') === 'movie' ? 'movie' : 'tv';
}

function movieToCard(movie: RawTitle): SearchMediaItem {
  return {
    tmdbId: movie.id,
    title: movie.title ?? movie.name ?? 'Untitled',
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path ?? null,
    type: 'MOVIE',
    linkSlug: `movie-${movie.id}`,
    popularity: movie.popularity,
    airYear: movie.release_date ? movie.release_date.split('-')[0] : undefined,
    airDate: movie.release_date ?? null,
    productionStatus: 'Released',
    overview: movie.overview ?? null,
    voteAverage: movie.vote_average ?? null,
  };
}

function resolveSeasonStatus(
  season: { air_date?: string | null; season_number: number },
  allSeasons: Array<{ air_date?: string | null; season_number: number }>,
  seriesStatus: string,
  inProduction: boolean,
) {
  const today = new Date().toISOString().split('T')[0];
  const airDate = season.air_date ?? undefined;
  if (!airDate || airDate > today) return 'Not Yet Aired';
  if (!inProduction && seriesStatus !== 'Returning Series') return 'Finished';

  const airedNumbers = allSeasons
    .filter((item) => item.season_number > 0 && item.air_date && item.air_date <= today)
    .map((item) => item.season_number);
  const maxSeasonNumber = airedNumbers.length ? Math.max(...airedNumbers) : season.season_number;

  return season.season_number === maxSeasonNumber ? 'Airing' : 'Finished';
}

async function expandShow(show: RawTitle, includeSpecials = false): Promise<SearchMediaItem[]> {
  const detail = await fetchTmdbJson<{
    name?: string;
    status?: string;
    in_production?: boolean;
    poster_path?: string | null;
    backdrop_path?: string | null;
    overview?: string | null;
    vote_average?: number | null;
    seasons?: Array<{
      id: number;
      season_number: number;
      episode_count?: number | null;
      poster_path?: string | null;
      air_date?: string | null;
      overview?: string | null;
    }>;
  }>(`/tv/${show.id}`, { revalidate: 3600 });

  if (!detail) return [];

  const showName = detail.name ?? show.name ?? 'Untitled';
  const seasons = detail.seasons ?? [];
  const visibleSeasons = seasons.filter((season) => includeSpecials || season.season_number > 0);
  const productionStatus = normalizeProductionStatus(detail.status, 'tv', detail.in_production);

  return Promise.all(
    visibleSeasons.map(async (season) => {
      const seasonDetail = await fetchTmdbJson<{ episodes?: Array<{ air_date?: string | null }> }>(
        `/tv/${show.id}/season/${season.season_number}`,
        { cache: 'no-store' },
      );
      const seasonStatus =
        titlePageSeasonStatus(seasonDetail?.episodes ?? null) ??
        resolveSeasonStatus(season, seasons, detail.status ?? '', Boolean(detail.in_production));

      return {
        tmdbId: season.id,
        parentTmdbId: show.id,
        title: buildSeasonTitle(showName, season.season_number),
        poster_path: season.poster_path ?? show.poster_path,
        backdrop_path: detail.backdrop_path ?? show.backdrop_path ?? null,
        type: 'TV_SEASON' as const,
        episode_count: season.episode_count ?? null,
        season_number: season.season_number,
        linkSlug: `tv-${show.id}-s${season.season_number}`,
        popularity: show.popularity,
        airYear: season.air_date ? season.air_date.split('-')[0] : undefined,
        airDate: season.air_date ?? null,
        seriesStatus: detail.status ?? '',
        productionStatus,
        seasonStatus,
        overview: season.overview || detail.overview || show.overview || null,
        voteAverage: detail.vote_average ?? show.vote_average ?? null,
      };
    }),
  );
}

function readAdvancedFilters(searchParams: URLSearchParams): AdvancedFilters {
  return {
    ...EMPTY_ADVANCED,
    minRating: Number(searchParams.get('rating') ?? 0),
    maxRuntime: Number(searchParams.get('runtime') ?? 0),
    network: searchParams.get('network') ?? '',
    hiddenGems: searchParams.get('hidden') === '1',
  };
}

function applyClientFilters(items: SearchMediaItem[], selectedYear: string, filters: AdvancedFilters) {
  return items.filter((item) => {
    if (selectedYear && item.airYear !== selectedYear) return false;
    if (filters.minRating && (item.voteAverage ?? 0) < filters.minRating) return false;
    return true;
  });
}

async function loadGenres(type: MediaType) {
  const data = await fetchTmdbJson<TmdbList<RawTitle>>(`/genre/${type}/list`, { revalidate: 86400 });
  return NextResponse.json({ genres: data?.genres ?? [] });
}

async function expandLatest(shows: RawTitle[]) {
  const collected: SearchMediaItem[] = [];
  for (const show of shows.slice(0, 18)) {
    if (collected.length >= 8) break;
    const seasons = await expandShow(show);
    const latest = seasons.sort((a, b) => (b.season_number ?? 0) - (a.season_number ?? 0))[0];
    if (latest) collected.push({ ...latest, popularity: show.popularity });
  }
  return collected;
}

async function loadSections(type: MediaType) {
  const sortByPop = (a: SearchMediaItem, b: SearchMediaItem) => (b.popularity ?? 0) - (a.popularity ?? 0);

  if (type === 'tv') {
    const [trendData, onAirData, allTimeData] = await Promise.all([
      fetchTmdbJson<TmdbList<RawTitle>>('/trending/tv/week', { revalidate: 3600 }),
      fetchTmdbJson<TmdbList<RawTitle>>('/tv/on_the_air', { revalidate: 3600 }),
      fetchTmdbJson<TmdbList<RawTitle>>(
        '/discover/tv?sort_by=vote_count.desc&vote_count.gte=5000&page=1',
        { revalidate: 3600 },
      ),
    ]);

    const [trending, popularNow, allTimePopular] = await Promise.all([
      expandLatest(trendData?.results ?? []),
      expandLatest(onAirData?.results ?? []),
      expandLatest(allTimeData?.results ?? []),
    ]);

    return NextResponse.json({
      trending: trending.sort(sortByPop),
      popularNow: popularNow.sort(sortByPop),
      allTimePopular: allTimePopular.sort(sortByPop),
    });
  }

  const [trendData, nowPlayingData, allTimeData] = await Promise.all([
    fetchTmdbJson<TmdbList<RawTitle>>('/trending/movie/week', { revalidate: 3600 }),
    fetchTmdbJson<TmdbList<RawTitle>>('/movie/now_playing', { revalidate: 3600 }),
    fetchTmdbJson<TmdbList<RawTitle>>(
      '/discover/movie?sort_by=vote_count.desc&vote_count.gte=10000&page=1',
      { revalidate: 3600 },
    ),
  ]);

  return NextResponse.json({
    trending: (trendData?.results?.slice(0, 8) ?? []).map(movieToCard).sort(sortByPop),
    popularNow: (nowPlayingData?.results?.slice(0, 8) ?? []).map(movieToCard).sort(sortByPop),
    allTimePopular: (allTimeData?.results?.slice(0, 8) ?? []).map(movieToCard).sort(sortByPop),
  });
}

async function discover(searchParams: URLSearchParams, type: MediaType) {
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const selectedGenre = searchParams.get('genre') ?? '';
  const selectedYear = searchParams.get('year') ?? '';
  const selectedFormat = searchParams.get('format') ?? '';
  const selectedStatus = searchParams.get('status') ?? '';
  const advancedFilters = readAdvancedFilters(searchParams);

  if (type === 'movie') {
    const params = new URLSearchParams({
      sort_by: advancedFilters.hiddenGems ? 'vote_average.desc' : 'popularity.desc',
      page: String(page),
    });
    if (selectedGenre) params.set('with_genres', selectedGenre);
    if (selectedYear) params.set('primary_release_year', selectedYear);
    if (selectedFormat === 'short') params.set('with_runtime.lte', '40');
    if (advancedFilters.maxRuntime) params.set('with_runtime.lte', String(advancedFilters.maxRuntime));
    if (advancedFilters.minRating) params.set('vote_average.gte', String(advancedFilters.minRating));
    if (advancedFilters.hiddenGems) {
      params.set('vote_count.gte', '120');
      params.set('vote_count.lte', '5000');
    }

    const data = await fetchTmdbJson<TmdbList<RawTitle>>(`/discover/movie?${params.toString()}`);
    const items = applyClientFilters((data?.results ?? []).map(movieToCard), selectedYear, advancedFilters);
    return NextResponse.json({ items, hasMore: (data?.page ?? 0) < (data?.total_pages ?? 0) });
  }

  const params = new URLSearchParams({
    sort_by: advancedFilters.hiddenGems ? 'vote_average.desc' : 'popularity.desc',
    page: String(page),
  });
  if (selectedGenre) params.set('with_genres', selectedGenre);
  if (selectedFormat === 'scripted') params.set('with_type', '4');
  if (selectedFormat === 'miniseries') params.set('with_type', '2');
  if (selectedFormat === 'special') params.set('with_type', '6');
  if (selectedFormat === 'reality') params.set('with_type', '3');
  if (selectedFormat === 'documentary') params.set('with_type', '0');
  if (selectedStatus === 'airing') params.set('with_status', 'returning');
  if (selectedStatus === 'finished') params.set('with_status', 'ended');
  if (selectedStatus === 'not_yet_aired') params.set('with_status', 'planned');
  if (advancedFilters.network) params.set('with_networks', advancedFilters.network);
  if (advancedFilters.maxRuntime) params.set('with_runtime.lte', String(advancedFilters.maxRuntime));
  if (advancedFilters.minRating) params.set('vote_average.gte', String(advancedFilters.minRating));
  if (advancedFilters.hiddenGems) {
    params.set('vote_count.gte', '80');
    params.set('vote_count.lte', '3000');
  }

  const data = await fetchTmdbJson<TmdbList<RawTitle>>(`/discover/tv?${params.toString()}`);
  const shows = data?.results ?? [];
  let items = (await Promise.all(shows.map((show) => expandShow(show, selectedFormat === 'special')))).flat();
  items = applyClientFilters(items, selectedYear, advancedFilters);
  if (selectedStatus === 'airing') items = items.filter((item) => item.seasonStatus === 'Airing');
  if (selectedStatus === 'finished') items = items.filter((item) => item.seasonStatus === 'Finished');
  if (selectedStatus === 'not_yet_aired') items = items.filter((item) => item.seasonStatus === 'Not Yet Aired');

  return NextResponse.json({ items, hasMore: (data?.page ?? 0) < (data?.total_pages ?? 0) });
}

async function textSearch(searchParams: URLSearchParams, type: MediaType) {
  const query = searchParams.get('q')?.trim() ?? '';
  const selectedYear = searchParams.get('year') ?? '';
  const advancedFilters = readAdvancedFilters(searchParams);

  if (!query) return NextResponse.json({ items: [], hasMore: false });

  const data = await fetchTmdbJson<TmdbList<RawTitle>>(
    `/search/${type}?query=${encodeURIComponent(query)}`,
    { cache: 'no-store' },
  );

  if (type === 'tv') {
    const expanded = await Promise.all((data?.results ?? []).map((show) => expandShow(show)));
    return NextResponse.json({
      items: applyClientFilters(expanded.flat(), selectedYear, advancedFilters),
      hasMore: false,
    });
  }

  return NextResponse.json({
    items: applyClientFilters((data?.results ?? []).map(movieToCard), selectedYear, advancedFilters),
    hasMore: false,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const type = mediaTypeFromParams(searchParams);

  if (mode === 'genres') return loadGenres(type);
  if (mode === 'sections') return loadSections(type);
  if (mode === 'discover') return discover(searchParams, type);
  if (mode === 'text') return textSearch(searchParams, type);

  return NextResponse.json({ error: 'Invalid search mode' }, { status: 400 });
}
