/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '@/lib/prisma';

const TMDB = process.env.NEXT_PUBLIC_TMDB_BASE_URL ?? 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export type SeasonStatus = 'Airing' | 'Finished' | 'Not Yet Aired' | 'Unknown';

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

export function resolveSeasonStatus(input: {
  airDate?: string | null;
  seriesStatus?: string | null;
  inProduction?: boolean | null;
  seasonNumber: number;
  latestAiredSeasonNumber?: number | null;
}): SeasonStatus {
  if (!input.airDate) return 'Unknown';
  if (input.airDate > todayIso()) return 'Not Yet Aired';
  if (input.seriesStatus === 'Ended' || input.seriesStatus === 'Canceled' || input.inProduction === false) {
    return 'Finished';
  }
  if (input.latestAiredSeasonNumber && input.seasonNumber === input.latestAiredSeasonNumber) {
    return 'Airing';
  }
  return 'Finished';
}

export async function syncEntrySeasonEpisodes(entryId: string) {
  const entry = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!entry || entry.type !== 'TV_SEASON' || !entry.parentTmdbId || entry.seasonNumber == null) {
    return { seasons: 0, episodes: 0 };
  }

  if (!API_KEY) {
    throw new Error('TMDB API key nao configurada');
  }

  const [showRes, seasonRes] = await Promise.all([
    fetch(`${TMDB}/tv/${entry.parentTmdbId}?api_key=${API_KEY}&language=en-US`),
    fetch(`${TMDB}/tv/${entry.parentTmdbId}/season/${entry.seasonNumber}?api_key=${API_KEY}&language=en-US`),
  ]);

  if (!showRes.ok || !seasonRes.ok) {
    throw new Error('Falha ao buscar temporada no TMDB');
  }

  const [show, season] = await Promise.all([showRes.json(), seasonRes.json()]);
  const allSeasons = Array.isArray(show.seasons) ? show.seasons : [];
  const latestAiredSeasonNumber = Math.max(
    0,
    ...allSeasons
      .filter((item: any) => item.season_number > 0 && item.air_date && item.air_date <= todayIso())
      .map((item: any) => item.season_number),
  );

  const status = resolveSeasonStatus({
    airDate: season.air_date,
    seriesStatus: show.status,
    inProduction: show.in_production,
    seasonNumber: entry.seasonNumber,
    latestAiredSeasonNumber,
  });

  const seasonRecord = await prisma.season.upsert({
    where: { entryId_seasonNumber: { entryId: entry.id, seasonNumber: entry.seasonNumber } },
    update: {
      tmdbId: season.id ?? null,
      parentTmdbId: entry.parentTmdbId,
      title: season.name || entry.title,
      overview: season.overview || null,
      posterPath: season.poster_path || entry.imagePath || null,
      airDate: season.air_date || null,
      episodeCount: season.episodes?.length ?? entry.totalEpisodes ?? 0,
      status,
    },
    create: {
      entryId: entry.id,
      tmdbId: season.id ?? null,
      parentTmdbId: entry.parentTmdbId,
      seasonNumber: entry.seasonNumber,
      title: season.name || entry.title,
      overview: season.overview || null,
      posterPath: season.poster_path || entry.imagePath || null,
      airDate: season.air_date || null,
      episodeCount: season.episodes?.length ?? entry.totalEpisodes ?? 0,
      status,
    },
  });

  const episodes = Array.isArray(season.episodes) ? season.episodes : [];
  await Promise.all(
    episodes.map((episode: any) =>
      prisma.episode.upsert({
        where: {
          entryId_seasonNumber_episodeNumber: {
            entryId: entry.id,
            seasonNumber: entry.seasonNumber ?? 0,
            episodeNumber: episode.episode_number,
          },
        },
        update: {
          seasonId: seasonRecord.id,
          tmdbId: episode.id ?? null,
          title: episode.name || `Episode ${episode.episode_number}`,
          overview: episode.overview || null,
          stillPath: episode.still_path || null,
          airDate: episode.air_date || null,
          runtime: episode.runtime ?? null,
          watched: episode.episode_number <= entry.progress,
          watchedAt: episode.episode_number <= entry.progress ? undefined : null,
        },
        create: {
          entryId: entry.id,
          seasonId: seasonRecord.id,
          tmdbId: episode.id ?? null,
          parentTmdbId: entry.parentTmdbId ?? 0,
          seasonNumber: entry.seasonNumber ?? 0,
          episodeNumber: episode.episode_number,
          title: episode.name || `Episode ${episode.episode_number}`,
          overview: episode.overview || null,
          stillPath: episode.still_path || null,
          airDate: episode.air_date || null,
          runtime: episode.runtime ?? null,
          watched: episode.episode_number <= entry.progress,
        },
      }),
    ),
  );

  await prisma.entry.update({
    where: { id: entry.id },
    data: {
      totalEpisodes: episodes.length || entry.totalEpisodes,
      episodeRuntime: episodes.find((episode: any) => episode.runtime)?.runtime ?? entry.episodeRuntime,
    },
  });

  return { seasons: 1, episodes: episodes.length };
}

export async function getEntrySeasons(entryId: string) {
  return prisma.season.findMany({
    where: { entryId },
    include: { episodes: { orderBy: { episodeNumber: 'asc' } } },
    orderBy: { seasonNumber: 'asc' },
  });
}
