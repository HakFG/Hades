/* eslint-disable @typescript-eslint/no-explicit-any */

import cron from 'node-cron';
import PQueue from 'p-queue';
import { prisma } from '@/lib/prisma';
import { normalizeProductionStatus } from '@/lib/production-status';
import { syncEntrySeasonEpisodes } from '@/lib/seasons';
import { buildSeasonTitle } from '@/lib/utils';
import { isCustomNonTmdbPoster } from '@/lib/entry-poster-sync';
import { resolveEntryPosterPath } from '@/lib/poster-system';

const TMDB = process.env.NEXT_PUBLIC_TMDB_BASE_URL ?? 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

const originalFetch = globalThis.fetch;
const fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const urlStr = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as any).url || '');
  if (urlStr.includes('api.themoviedb.org')) {
    const headers = new Headers(init?.headers);
    if (!headers.has('Accept-Encoding')) {
      headers.set('Accept-Encoding', 'identity');
    }
    return originalFetch(input, { ...init, headers });
  }
  return originalFetch(input, init);
};
const queue = new PQueue({ concurrency: 5 });

type SyncStatus = 'success' | 'partial' | 'failed';

function compactNames(items: any[] | undefined, key = 'name') {
  return Array.isArray(items)
    ? items.map((item) => item?.[key]).filter(Boolean).join(', ')
    : '';
}

function hasChanged(current: unknown, next: unknown) {
  return (current ?? null) !== (next ?? null);
}

async function writeSyncLog(
  entryId: string,
  status: SyncStatus,
  changedFields: string[] = [],
  errorMessage?: string,
) {
  await prisma.syncLog.create({
    data: {
      entryId,
      status,
      changedFields,
      errorMessage,
    },
  });
}

export async function syncEntryWithTmdb(entryId: string) {
  const entry = await prisma.entry.findUnique({ where: { id: entryId } });

  if (!entry) {
    throw new Error('Entrada nao encontrada');
  }

  if (!API_KEY) {
    await writeSyncLog(entry.id, 'failed', [], 'TMDB API key nao configurada');
    throw new Error('TMDB API key nao configurada');
  }

  try {
    const isTV = entry.type === 'TV_SEASON';
    const showId = entry.parentTmdbId ?? entry.tmdbId;
    const mediaEndpoint = isTV ? `${TMDB}/tv/${showId}` : `${TMDB}/movie/${entry.tmdbId}`;
    const mediaRes = await fetch(`${mediaEndpoint}?api_key=${API_KEY}&language=en-US`);

    if (!mediaRes.ok) {
      throw new Error(`TMDB retornou HTTP ${mediaRes.status}`);
    }

    const media = await mediaRes.json();
    let season: any = null;

    if (isTV && entry.seasonNumber != null) {
      const seasonRes = await fetch(
        `${TMDB}/tv/${showId}/season/${entry.seasonNumber}?api_key=${API_KEY}&language=en-US`,
      );
      if (seasonRes.ok) {
        season = await seasonRes.json();
      }
    }

    const productionStatus = normalizeProductionStatus(
      media.status,
      isTV ? 'tv' : 'movie',
      media.in_production,
    );

    const liveOfficialPosterPath = isTV
      ? season?.poster_path ?? media.poster_path ?? null
      : media.poster_path ?? null;
    const syncedPosterPath = isCustomNonTmdbPoster(entry.imagePath)
      ? entry.imagePath
      : await resolveEntryPosterPath({
          mediaType: isTV ? 'TV_SEASON' : 'MOVIE',
          tmdbId: isTV ? showId : entry.tmdbId,
          seasonNumber: isTV ? entry.seasonNumber : null,
          liveOfficialPosterPath,
          fallbackPosterPath: entry.imagePath,
        });

    const nextData: Record<string, any> = isTV
      ? {
          title: buildSeasonTitle(media.name ?? entry.title, entry.seasonNumber ?? 1),
          productionStatus,
          imagePath: syncedPosterPath,
          bannerPath: media.backdrop_path ?? null,
          synopsis: season?.overview || media.overview || null,
          releaseDate: season?.air_date || entry.releaseDate || media.first_air_date || null,
          endDate: media.last_air_date || entry.endDate || null,
          lastAirDate: media.last_air_date || null,
          totalEpisodes: Array.isArray(season?.episodes) ? season.episodes.length : entry.totalEpisodes,
          totalSeasons: media.number_of_seasons ?? entry.totalSeasons,
          episodeRuntime: media.episode_run_time?.[0] ?? entry.episodeRuntime,
          genres: compactNames(media.genres),
          studio: compactNames(media.production_companies).split(', ')[0] || null,
          networks: compactNames(media.networks),
          languages: Array.isArray(media.languages) ? media.languages.join(', ') : null,
          popularity: typeof media.popularity === 'number' ? media.popularity : entry.popularity,
          rating: typeof media.vote_average === 'number' ? media.vote_average : entry.rating,
          hasNewEpisodes:
            Array.isArray(season?.episodes) && entry.totalEpisodes != null
              ? season.episodes.length > entry.totalEpisodes
              : entry.hasNewEpisodes,
        }
      : {
          title: media.title ?? entry.title,
          productionStatus,
          imagePath: syncedPosterPath,
          bannerPath: media.backdrop_path ?? null,
          synopsis: media.overview || null,
          releaseDate: media.release_date || null,
          endDate: media.release_date || null,
          totalEpisodes: 1,
          episodeRuntime: media.runtime ?? entry.episodeRuntime,
          genres: compactNames(media.genres),
          studio: compactNames(media.production_companies).split(', ')[0] || null,
          languages: Array.isArray(media.spoken_languages)
            ? compactNames(media.spoken_languages, 'english_name')
            : null,
          popularity: typeof media.popularity === 'number' ? media.popularity : entry.popularity,
          rating: typeof media.vote_average === 'number' ? media.vote_average : entry.rating,
        };

    const changedFields = Object.keys(nextData).filter((key) =>
      hasChanged((entry as any)[key], nextData[key]),
    );

    const updated = await prisma.entry.update({
      where: { id: entry.id },
      data: {
        ...nextData,
        lastSyncedAt: new Date(),
      },
    });

    if (isTV) {
      await syncEntrySeasonEpisodes(entry.id);
    }

    await writeSyncLog(entry.id, 'success', changedFields);

    return { entry: updated, changedFields };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    await writeSyncLog(entry.id, 'failed', [], message);
    throw error;
  }
}

export async function syncAllEntriesWithTmdb() {
  const entries = await prisma.entry.findMany({
    select: { id: true },
    orderBy: [{ lastSyncedAt: 'asc' }, { updatedAt: 'asc' }],
  });

  const results = await Promise.allSettled(
    entries.map((entry) => queue.add(() => syncEntryWithTmdb(entry.id))),
  );

  return {
    total: results.length,
    synced: results.filter((result) => result.status === 'fulfilled').length,
    failed: results.filter((result) => result.status === 'rejected').length,
  };
}

declare global {
  var __hadesTmdbSyncStarted: boolean | undefined;
}

export function startTmdbSyncScheduler() {
  if (globalThis.__hadesTmdbSyncStarted) return;
  globalThis.__hadesTmdbSyncStarted = true;

  cron.schedule('0 */6 * * *', () => {
    syncAllEntriesWithTmdb().catch((error) => {
      console.error('[tmdb-sync] background sync failed:', error);
    });
  });
}
