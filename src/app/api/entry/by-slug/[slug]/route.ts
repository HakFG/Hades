import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncEntryWithTmdb } from '@/lib/tmdb-sync';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const movieMatch = slug.match(/^movie-(\d+)$/);
  const tvMatch = slug.match(/^tv-(\d+)-s(\d+)$/);

  let where: { tmdbId?: number; parentTmdbId?: number; seasonNumber?: number } = {};

  if (movieMatch) {
    const tmdbId = parseInt(movieMatch[1]);
    where = { tmdbId };
  } else if (tvMatch) {
    const parentTmdbId = parseInt(tvMatch[1]);
    const seasonNumber = parseInt(tvMatch[2]);
    where = { parentTmdbId, seasonNumber };
  } else {
    return NextResponse.json({ error: 'Slug invalido' }, { status: 400 });
  }

  try {
    const entry = await prisma.entry.findFirst({ where });
    if (!entry) {
      return NextResponse.json({ error: 'Entry nao encontrada' }, { status: 404 });
    }

    try {
      await syncEntryWithTmdb(entry.id);
    } catch (syncError) {
      console.warn('[GET /api/entry/by-slug/[slug]] Falha ao sincronizar com TMDB, usando dados locais:', syncError);
    }

    const refreshed = await prisma.entry.findUnique({ where: { id: entry.id } });
    return NextResponse.json(refreshed ?? entry);
  } catch (error) {
    console.error('[GET /api/entry/[slug]]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
