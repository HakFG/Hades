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
          // ─── Dados principais ───
          status: e.status,
          score: typeof e.score === 'number' ? e.score : 0,
          progress: typeof e.progress === 'number' ? e.progress : 0,
          rewatchCount: typeof e.rewatchCount === 'number' ? e.rewatchCount : 0,
          
          // ─── Datas ───
          startDate: parseDate(e.startDate),
          finishDate: parseDate(e.finishDate),
          releaseDate: e.releaseDate ?? undefined,
          endDate: e.endDate ?? undefined,
          
          // ─── Metadados TMDB ───
          rating: typeof e.rating === 'number' ? e.rating : undefined,
          popularity: typeof e.popularity === 'number' ? e.popularity : undefined,
          genres: e.genres ?? undefined,
          studio: e.studio ?? undefined,
          
          // ─── Imagens ───
          imagePath: e.imagePath ?? undefined,
          bannerPath: e.bannerPath ?? undefined,
          customImage: e.customImage ?? undefined,
          
          // ─── Conteúdo ───
          notes: e.notes ?? undefined,
          synopsis: e.synopsis ?? undefined,
          format: e.format ?? undefined,
          
          // ─── Flags ───
          hidden: e.hidden ?? false,
          isFavorite: e.isFavorite ?? false,
          private: e.private ?? false,
          favoriteRank: e.favoriteRank ?? undefined,
          
          // ─── JSON ───
          staff: e.staff ?? undefined,
        },
        create: {
          // ─── IDs ───
          id: e.id,
          tmdbId: e.tmdbId,
          parentTmdbId: e.parentTmdbId ?? null,
          seasonNumber: e.seasonNumber ?? null,
          
          // ─── Dados principais ───
          title: e.title,
          type: e.type,
          status: e.status,
          score: typeof e.score === 'number' ? e.score : 0,
          progress: typeof e.progress === 'number' ? e.progress : 0,
          totalEpisodes: typeof e.totalEpisodes === 'number' ? e.totalEpisodes : null,
          rewatchCount: typeof e.rewatchCount === 'number' ? e.rewatchCount : 0,
          
          // ─── Datas ───
          startDate: parseDate(e.startDate),
          finishDate: parseDate(e.finishDate),
          releaseDate: e.releaseDate ?? null,
          endDate: e.endDate ?? null,
          createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
          
          // ─── Metadados TMDB ───
          rating: typeof e.rating === 'number' ? e.rating : null,
          popularity: typeof e.popularity === 'number' ? e.popularity : 0,
          genres: e.genres ?? null,
          studio: e.studio ?? null,
          
          // ─── Imagens ───
          imagePath: e.imagePath ?? null,
          bannerPath: e.bannerPath ?? null,
          customImage: e.customImage ?? null,
          
          // ─── Conteúdo ───
          notes: e.notes ?? null,
          synopsis: e.synopsis ?? null,
          format: e.format ?? null,
          
          // ─── Flags ───
          hidden: e.hidden ?? false,
          isFavorite: e.isFavorite ?? false,
          private: e.private ?? false,
          favoriteRank: e.favoriteRank ?? null,
          
          // ─── JSON ───
          staff: e.staff ?? null,
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