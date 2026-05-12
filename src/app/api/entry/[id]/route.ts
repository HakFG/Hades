import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncEntryWithTmdb } from '@/lib/tmdb-sync';

async function syncAndReturnEntry(entry: { id: string }) {
  try {
    await syncEntryWithTmdb(entry.id);
  } catch (error) {
    console.warn('[GET /api/entry/:id] Falha ao sincronizar com TMDB, usando dados locais:', error);
  }

  return prisma.entry.findUnique({ where: { id: entry.id } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ── TV Season: slug "tv-{showId}-s{seasonNumber}" ──────────────────────────
  const tvMatch = id.match(/^tv-(\d+)-s(\d+)$/);
  if (tvMatch) {
    const parentTmdbId = parseInt(tvMatch[1]);
    const seasonNumber  = parseInt(tvMatch[2]);

    const entry = await prisma.entry.findFirst({
      where: { parentTmdbId, seasonNumber },
    });

    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(await syncAndReturnEntry(entry));
  }

  // ── Movie: slug "movie-{id}" ou ID numérico legado ─────────────────────────
  const movieMatch = id.match(/^movie-(\d+)$/) ?? id.match(/^(\d+)$/);
  if (movieMatch) {
    const tmdbId = parseInt(movieMatch[1]);

    const entry = await prisma.entry.findUnique({
      where: { tmdbId },
    });

    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(await syncAndReturnEntry(entry));
  }

  return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
}
