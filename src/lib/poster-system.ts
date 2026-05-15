import { prisma } from '@/lib/prisma';
import { extractTmdbPosterPath } from '@/lib/utils';

export type PosterMediaType = 'MOVIE' | 'TV_SEASON';

export interface PosterIdentity {
  mediaType: PosterMediaType;
  tmdbId: number;
  seasonNumber?: number | null;
}

export function posterChoiceKey(identity: PosterIdentity): string {
  if (identity.mediaType === 'MOVIE') return `movie:${identity.tmdbId}`;
  return `tv:${identity.tmdbId}:s${identity.seasonNumber ?? 1}`;
}

export function normalizePosterPath(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/t/p/')) {
    const parts = trimmed.split('/');
    return `/${parts.slice(4).join('/')}`;
  }

  const tmdbPath = extractTmdbPosterPath(trimmed);
  if (tmdbPath) return tmdbPath;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  return null;
}

export function posterUrl(path?: string | null, size = 'w500'): string | null {
  const normalized = normalizePosterPath(path);
  return normalized ? `https://image.tmdb.org/t/p/${size}${normalized}` : null;
}

export function choiceIsActive(
  choice: { officialPosterPath?: string | null } | null | undefined,
  liveOfficialPosterPath?: string | null,
): boolean {
  if (!choice) return false;
  const selectedAgainst = normalizePosterPath(choice.officialPosterPath);
  const liveOfficial = normalizePosterPath(liveOfficialPosterPath);

  if (!selectedAgainst || !liveOfficial) return true;
  return selectedAgainst === liveOfficial;
}

export async function getPosterChoice(identity: PosterIdentity) {
  return prisma.posterChoice.findUnique({
    where: { key: posterChoiceKey(identity) },
  });
}

export async function resolvePosterChoicePath(
  identity: PosterIdentity,
  liveOfficialPosterPath?: string | null,
): Promise<string | null> {
  const choice = await getPosterChoice(identity);
  if (!choiceIsActive(choice, liveOfficialPosterPath)) return null;
  return normalizePosterPath(choice?.posterPath);
}

export async function resolveEntryPosterPath(args: {
  mediaType: PosterMediaType;
  tmdbId: number;
  seasonNumber?: number | null;
  liveOfficialPosterPath?: string | null;
  fallbackPosterPath?: string | null;
}): Promise<string | null> {
  const chosen = await resolvePosterChoicePath(args, args.liveOfficialPosterPath);
  return chosen ?? normalizePosterPath(args.liveOfficialPosterPath) ?? args.fallbackPosterPath ?? null;
}

export function buildEntryPosterIdentity(entry: {
  type: string;
  tmdbId: number;
  parentTmdbId?: number | null;
  seasonNumber?: number | null;
}): PosterIdentity {
  if (entry.type === 'TV_SEASON') {
    return {
      mediaType: 'TV_SEASON',
      tmdbId: entry.parentTmdbId ?? entry.tmdbId,
      seasonNumber: entry.seasonNumber ?? 1,
    };
  }

  return {
    mediaType: 'MOVIE',
    tmdbId: entry.tmdbId,
  };
}
