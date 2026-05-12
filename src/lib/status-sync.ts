import { prisma } from '@/lib/prisma';
import { getLiveBubbleStatusSnapshot } from '@/lib/tmdb-status';
import { entryStatusToBubbleStatus } from '@/lib/series-status';

type SyncableEntry = {
  id: string;
  tmdbId: number;
  parentTmdbId?: number | null;
  seasonNumber?: number | null;
  type: string;
  productionStatus?: string | null;
  seasonStatus?: string | null;
  seasons?: Array<{
    status?: string | null;
    airDate?: string | null;
    seasonNumber?: number | null;
    episodes?: Array<{ airDate?: string | null }> | null;
  }> | null;
};

export async function syncEntryVisualStatus(entry: SyncableEntry) {
  const fallbackStatus = entryStatusToBubbleStatus(entry);
  const snapshot = await getLiveBubbleStatusSnapshot(entry).catch(() => ({
    bubbleStatus: fallbackStatus,
    productionStatus: entry.productionStatus ?? null,
    season: null,
  }));

  const updates: Promise<unknown>[] = [];

  if (snapshot.productionStatus && snapshot.productionStatus !== entry.productionStatus) {
    updates.push(
      prisma.entry.update({
        where: { id: entry.id },
        data: {
          productionStatus: snapshot.productionStatus,
          lastSyncedAt: new Date(),
        },
      }),
    );
  }

  if (entry.type === 'TV_SEASON' && entry.parentTmdbId && entry.seasonNumber != null && snapshot.season) {
    updates.push(
      prisma.season.upsert({
        where: { entryId_seasonNumber: { entryId: entry.id, seasonNumber: entry.seasonNumber } },
        update: {
          tmdbId: snapshot.season.tmdbId ?? undefined,
          parentTmdbId: entry.parentTmdbId,
          title: snapshot.season.title ?? undefined,
          overview: snapshot.season.overview ?? undefined,
          posterPath: snapshot.season.posterPath ?? undefined,
          airDate: snapshot.season.airDate ?? null,
          episodeCount: snapshot.season.episodeCount ?? undefined,
          status: snapshot.bubbleStatus ?? 'Unknown',
        },
        create: {
          entryId: entry.id,
          tmdbId: snapshot.season.tmdbId ?? null,
          parentTmdbId: entry.parentTmdbId,
          seasonNumber: entry.seasonNumber,
          title: snapshot.season.title || 'Season',
          overview: snapshot.season.overview ?? null,
          posterPath: snapshot.season.posterPath ?? null,
          airDate: snapshot.season.airDate ?? null,
          episodeCount: snapshot.season.episodeCount ?? 0,
          status: snapshot.bubbleStatus ?? 'Unknown',
        },
      }),
    );
  }

  if (updates.length) await Promise.all(updates);

  return {
    bubbleStatus: snapshot.bubbleStatus,
    productionStatus: snapshot.productionStatus ?? entry.productionStatus ?? null,
    synced: updates.length > 0,
  };
}
