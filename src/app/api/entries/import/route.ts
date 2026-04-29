import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  try {
    const entries = await request.json();
    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    let restored = 0;
    for (const e of entries) {
      await prisma.entry.upsert({
        where: { id: e.id },
        update: {
          status: e.status,
          score: e.score ?? 0,
          progress: e.progress ?? 0,
          startDate: parseDate(e.startDate),
          finishDate: parseDate(e.finishDate),
          rewatchCount: e.rewatchCount ?? 0,
          notes: e.notes ?? null,
          hidden: e.hidden ?? false,
          isFavorite: e.isFavorite ?? false,
        },
        create: {
          id: e.id,
          tmdbId: e.tmdbId,
          parentTmdbId: e.parentTmdbId ?? null,
          seasonNumber: e.seasonNumber ?? null,
          title: e.title,
          type: e.type,
          status: e.status,
          score: e.score ?? 0,
          progress: e.progress ?? 0,
          totalEpisodes: e.totalEpisodes ?? null,
          imagePath: e.imagePath ?? null,
          isFavorite: e.isFavorite ?? false,
          startDate: parseDate(e.startDate),
          finishDate: parseDate(e.finishDate),
          rewatchCount: e.rewatchCount ?? 0,
          notes: e.notes ?? null,
          hidden: e.hidden ?? false,
          genres: e.genres ?? null,
          runtime: e.runtime ?? null,
          releaseDate: e.releaseDate ?? null,
          format: e.format ?? null,
        },
      });
      restored++;
    }

    return NextResponse.json({ restored });
  } catch (error) {
    console.error('[POST /api/entries/import] Erro:', error);
    return NextResponse.json({ error: 'Falha na importação' }, { status: 500 });
  }
}