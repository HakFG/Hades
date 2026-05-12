import { normalizeProductionStatus } from '@/lib/production-status';
import { productionStatusToDisplayStatus, entryStatusToBubbleStatus, type EntryStatusSource } from '@/lib/series-status';

const TMDB = process.env.NEXT_PUBLIC_TMDB_BASE_URL ?? 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

type LiveStatusEntry = EntryStatusSource & {
  id?: string;
  tmdbId: number;
  parentTmdbId?: number | null;
  type?: string | null;
};

type TmdbEpisode = {
  air_date?: string | null;
};

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

export function titlePageSeasonStatus(episodes?: TmdbEpisode[] | null): string | null {
  if (!episodes) return null;

  const today = todayIso();
  const aired = episodes.filter((episode) => episode.air_date && episode.air_date <= today);

  if (!aired.length) return 'Not Yet Aired';
  if (aired.length === episodes.length) return 'Finished';
  return 'Airing';
}

async function fetchTmdbJson(endpoint: string) {
  if (!API_KEY) return null;
  const response = await fetch(`${TMDB}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}&language=en-US`, {
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return response.json();
}

export type LiveBubbleStatusSnapshot = {
  bubbleStatus: string | null;
  productionStatus?: string | null;
  season?: {
    tmdbId?: number | null;
    title?: string | null;
    overview?: string | null;
    posterPath?: string | null;
    airDate?: string | null;
    episodeCount?: number | null;
    status: string | null;
  } | null;
};

export async function getLiveBubbleStatusSnapshot(entry: LiveStatusEntry): Promise<LiveBubbleStatusSnapshot> {
  if (!API_KEY) {
    return { bubbleStatus: entryStatusToBubbleStatus(entry), productionStatus: entry.productionStatus };
  }

  if (entry.type === 'TV_SEASON') {
    const showId = entry.parentTmdbId ?? entry.tmdbId;
    const seasonNumber = entry.seasonNumber ?? 1;
    const [show, season] = await Promise.all([
      fetchTmdbJson(`/tv/${showId}`),
      fetchTmdbJson(`/tv/${showId}/season/${seasonNumber}`),
    ]);

    const productionStatus = normalizeProductionStatus(show?.status, 'tv', show?.in_production);
    const episodeStatus = titlePageSeasonStatus(season?.episodes ?? null);
    const bubbleStatus = episodeStatus ?? productionStatusToDisplayStatus(productionStatus);

    return {
      bubbleStatus,
      productionStatus,
      season: season
        ? {
            tmdbId: typeof season.id === 'number' ? season.id : null,
            title: season.name ?? null,
            overview: season.overview ?? null,
            posterPath: season.poster_path ?? null,
            airDate: season.air_date ?? null,
            episodeCount: Array.isArray(season.episodes) ? season.episodes.length : null,
            status: bubbleStatus,
          }
        : null,
    };
  }

  if (entry.type === 'MOVIE') {
    const movie = await fetchTmdbJson(`/movie/${entry.tmdbId}`);
    const productionStatus = normalizeProductionStatus(movie?.status, 'movie');
    return {
      bubbleStatus: productionStatusToDisplayStatus(productionStatus),
      productionStatus,
    };
  }

  return { bubbleStatus: entryStatusToBubbleStatus(entry), productionStatus: entry.productionStatus };
}

export async function getLiveBubbleStatus(entry: LiveStatusEntry): Promise<string | null> {
  if (!API_KEY) return entryStatusToBubbleStatus(entry);

  try {
    return (await getLiveBubbleStatusSnapshot(entry)).bubbleStatus;
  } catch {
    return entryStatusToBubbleStatus(entry);
  }

  return entryStatusToBubbleStatus(entry);
}

export async function getLiveBubbleStatusWithFallback(entry: LiveStatusEntry): Promise<string | null> {
  try {
    return await getLiveBubbleStatus(entry);
  } catch {
    return entryStatusToBubbleStatus(entry);
  }
}
