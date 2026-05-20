import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  choiceIsActive,
  normalizePosterPath,
  posterChoiceKey,
  posterUrl,
  type PosterMediaType,
} from '@/lib/poster-system';

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

type GallerySource = 'movie' | 'season' | 'series';

interface TmdbPoster {
  file_path?: string | null;
  iso_639_1?: string | null;
  vote_average?: number;
  vote_count?: number;
  width?: number;
  height?: number;
}

interface GalleryPosterItem {
  path: string;
  url: string | null;
  originalUrl: string | null;
  language: string | null;
  voteAverage: number;
  voteCount: number;
  width: number | null;
  height: number | null;
  source: GallerySource;
  isOfficial: boolean;
  isSelected: boolean;
}

function parseIdentity(searchParams: URLSearchParams) {
  const mediaType = searchParams.get('mediaType') as PosterMediaType | null;
  const tmdbId = Number(searchParams.get('tmdbId'));
  const seasonNumberParam = searchParams.get('seasonNumber');
  const seasonNumber = seasonNumberParam ? Number(seasonNumberParam) : null;

  if (mediaType !== 'MOVIE' && mediaType !== 'TV_SEASON') {
    return { error: 'mediaType invalido' };
  }

  if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
    return { error: 'tmdbId invalido' };
  }

  if (mediaType === 'TV_SEASON' && (!Number.isFinite(seasonNumber) || !seasonNumber || seasonNumber < 0)) {
    return { error: 'seasonNumber invalido' };
  }

  return {
    identity: {
      mediaType,
      tmdbId,
      seasonNumber: mediaType === 'TV_SEASON' ? seasonNumber : null,
    },
  };
}

async function tmdbJson(endpoint: string) {
  if (!API_KEY) throw new Error('TMDB API key nao configurada');
  const separator = endpoint.includes('?') ? '&' : '?';
  const response = await fetch(`${TMDB}${endpoint}${separator}api_key=${API_KEY}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`TMDB ${response.status}`);
  return response.json();
}

function buildPosterItems(
  posters: TmdbPoster[] | undefined,
  source: GallerySource,
  officialPosterPath: string | null,
  selectedPosterPath: string | null,
): GalleryPosterItem[] {
  return (posters ?? [])
    .map((poster): GalleryPosterItem | null => {
      const path = normalizePosterPath(poster.file_path);
      if (!path) return null;

      return {
        path,
        url: posterUrl(path, 'w500'),
        originalUrl: posterUrl(path, 'original'),
        language: poster.iso_639_1 ?? null,
        voteAverage: poster.vote_average ?? 0,
        voteCount: poster.vote_count ?? 0,
        width: poster.width ?? null,
        height: poster.height ?? null,
        source,
        isOfficial: officialPosterPath === path,
        isSelected: selectedPosterPath === path,
      };
    })
    .filter((item): item is GalleryPosterItem => item !== null);
}

function uniqueAndSortPosters(items: GalleryPosterItem[]) {
  const byPath = new Map<string, GalleryPosterItem>();
  for (const item of items) {
    const existing = byPath.get(item.path);
    if (!existing) {
      byPath.set(item.path, item);
      continue;
    }
    byPath.set(item.path, {
      ...existing,
      isOfficial: existing.isOfficial || item.isOfficial,
      isSelected: existing.isSelected || item.isSelected,
      source: existing.source === 'season' ? existing.source : item.source,
      voteAverage: Math.max(existing.voteAverage, item.voteAverage),
      voteCount: Math.max(existing.voteCount, item.voteCount),
    });
  }

  return Array.from(byPath.values()).sort((a, b) => {
    if (a.isSelected !== b.isSelected) return a.isSelected ? -1 : 1;
    if (a.isOfficial !== b.isOfficial) return a.isOfficial ? -1 : 1;
    if (a.source !== b.source) return a.source === 'season' ? -1 : 1;
    if (a.voteCount !== b.voteCount) return b.voteCount - a.voteCount;
    return b.voteAverage - a.voteAverage;
  });
}

async function updateMatchingEntries(args: {
  mediaType: PosterMediaType;
  tmdbId: number;
  seasonNumber?: number | null;
  imagePath: string | null;
}) {
  if (args.mediaType === 'MOVIE') {
    await prisma.entry.updateMany({
      where: { type: 'MOVIE', tmdbId: args.tmdbId },
      data: { imagePath: args.imagePath },
    });
    return;
  }

  await prisma.entry.updateMany({
    where: {
      type: 'TV_SEASON',
      parentTmdbId: args.tmdbId,
      seasonNumber: args.seasonNumber ?? 1,
    },
    data: { imagePath: args.imagePath },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseIdentity(searchParams);
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { identity } = parsed;

    const key = posterChoiceKey(identity);
    const choice = await prisma.posterChoice.findUnique({ where: { key } });
    const requestOfficial = normalizePosterPath(searchParams.get('officialPosterPath'));
    const includeGallery = searchParams.get('gallery') !== 'false';
    let officialPosterPath = requestOfficial;
    let posters: GalleryPosterItem[] = [];

    if (includeGallery) {
      if (identity.mediaType === 'MOVIE') {
        const [movie, images] = await Promise.all([
          tmdbJson(`/movie/${identity.tmdbId}?language=en-US`),
          tmdbJson(`/movie/${identity.tmdbId}/images?include_image_language=en,pt,null`),
        ]);
        officialPosterPath = normalizePosterPath(movie.poster_path) ?? officialPosterPath;
        const selected = choiceIsActive(choice, officialPosterPath)
          ? normalizePosterPath(choice?.posterPath)
          : null;
        posters = uniqueAndSortPosters(
          buildPosterItems(images.posters, 'movie', officialPosterPath, selected),
        );
      } else {
        const [show, season, showImages, seasonImages] = await Promise.all([
          tmdbJson(`/tv/${identity.tmdbId}?language=en-US`),
          tmdbJson(`/tv/${identity.tmdbId}/season/${identity.seasonNumber ?? 1}?language=en-US`),
          tmdbJson(`/tv/${identity.tmdbId}/images?include_image_language=en,pt,null`),
          tmdbJson(`/tv/${identity.tmdbId}/season/${identity.seasonNumber ?? 1}/images?include_image_language=en,pt,null`),
        ]);
        officialPosterPath =
          normalizePosterPath(season.poster_path) ??
          normalizePosterPath(show.poster_path) ??
          officialPosterPath;
        const selected = choiceIsActive(choice, officialPosterPath)
          ? normalizePosterPath(choice?.posterPath)
          : null;
        posters = uniqueAndSortPosters([
          ...buildPosterItems(seasonImages.posters, 'season', officialPosterPath, selected),
          ...buildPosterItems(showImages.posters, 'series', officialPosterPath, selected),
        ]);
      }
    }

    const activeChoice = choiceIsActive(choice, officialPosterPath);

    return NextResponse.json({
      key,
      officialPosterPath,
      activeChoice,
      choice: choice && activeChoice ? choice : null,
      inactiveChoice: choice && !activeChoice ? choice : null,
      posters,
    });
  } catch (error) {
    console.error('[GET /api/posters]', error);
    const message = error instanceof Error ? error.message : 'Erro ao carregar capas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mediaType = body.mediaType as PosterMediaType;
    const tmdbId = Number(body.tmdbId);
    const seasonNumber = body.seasonNumber == null ? null : Number(body.seasonNumber);
    const posterPath = normalizePosterPath(body.posterPath);
    const officialPosterPath = normalizePosterPath(body.officialPosterPath);

    if (mediaType !== 'MOVIE' && mediaType !== 'TV_SEASON') {
      return NextResponse.json({ error: 'mediaType invalido' }, { status: 400 });
    }
    if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
      return NextResponse.json({ error: 'tmdbId invalido' }, { status: 400 });
    }
    if (mediaType === 'TV_SEASON' && (!Number.isFinite(seasonNumber) || !seasonNumber || seasonNumber < 0)) {
      return NextResponse.json({ error: 'seasonNumber invalido' }, { status: 400 });
    }
    if (!posterPath) {
      return NextResponse.json({ error: 'posterPath invalido' }, { status: 400 });
    }

    const identity = { mediaType, tmdbId, seasonNumber };
    const choice = await prisma.posterChoice.upsert({
      where: { key: posterChoiceKey(identity) },
      update: {
        posterPath,
        officialPosterPath,
        title: typeof body.title === 'string' ? body.title.trim() || null : null,
        source: 'tmdb',
      },
      create: {
        key: posterChoiceKey(identity),
        mediaType,
        tmdbId,
        seasonNumber: mediaType === 'TV_SEASON' ? seasonNumber : null,
        posterPath,
        officialPosterPath,
        title: typeof body.title === 'string' ? body.title.trim() || null : null,
        source: 'tmdb',
      },
    });

    await updateMatchingEntries({
      mediaType,
      tmdbId,
      seasonNumber,
      imagePath: posterPath,
    });

    return NextResponse.json({ success: true, choice });
  } catch (error) {
    console.error('[POST /api/posters]', error);
    return NextResponse.json({ error: 'Erro ao salvar capa' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const mediaType = body.mediaType as PosterMediaType;
    const tmdbId = Number(body.tmdbId);
    const seasonNumber = body.seasonNumber == null ? null : Number(body.seasonNumber);
    const officialPosterPath = normalizePosterPath(body.officialPosterPath);

    if (mediaType !== 'MOVIE' && mediaType !== 'TV_SEASON') {
      return NextResponse.json({ error: 'mediaType invalido' }, { status: 400 });
    }
    if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
      return NextResponse.json({ error: 'tmdbId invalido' }, { status: 400 });
    }

    const identity = { mediaType, tmdbId, seasonNumber };
    await prisma.posterChoice.deleteMany({ where: { key: posterChoiceKey(identity) } });
    await updateMatchingEntries({
      mediaType,
      tmdbId,
      seasonNumber,
      imagePath: officialPosterPath,
    });

    return NextResponse.json({ success: true, posterPath: officialPosterPath });
  } catch (error) {
    console.error('[DELETE /api/posters]', error);
    return NextResponse.json({ error: 'Erro ao restaurar capa oficial' }, { status: 500 });
  }
}
