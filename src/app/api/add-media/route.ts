import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TMDB = 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrdinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

function buildSeasonTitle(showName: string, seasonNumber: number): string {
  if (seasonNumber === 0) return `${showName} Specials`;
  if (seasonNumber === 1) return showName;
  return `${showName} ${getOrdinal(seasonNumber)} Season`;
}

// ─── POST /api/add-media ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ seasonNumber adicionado ao destructuring
    const { tmdbId, parentTmdbId, type, title, poster_path, totalEpisodes, seasonNumber } = body;

    // ── Validação básica ────────────────────────────────────────────────────
    if (!tmdbId || typeof tmdbId !== 'number') {
      return NextResponse.json({ error: 'tmdbId inválido ou ausente' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: 'type é obrigatório' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 });
    }

    // ── TV_SEASON ────────────────────────────────────────────────────────────
    if (type === 'TV_SEASON') {
      if (!parentTmdbId || typeof parentTmdbId !== 'number') {
        return NextResponse.json({ error: 'parentTmdbId obrigatório para TV_SEASON' }, { status: 400 });
      }

      await prisma.entry.upsert({
        where: { tmdbId },
        update: {
          title: title.trim(),
          imagePath: poster_path ?? null,
          totalEpisodes: totalEpisodes ?? 0,
          seasonNumber: seasonNumber ?? null, // ✅ salvo no update
        },
        create: {
          tmdbId,
          parentTmdbId,
          seasonNumber: seasonNumber ?? null, // ✅ salvo no create
          title: title.trim(),
          type: 'TV_SEASON',
          status: 'PLANNING',
          totalEpisodes: totalEpisodes ?? 0,
          imagePath: poster_path ?? null,
        },
      });

      return NextResponse.json({ success: true, saved: title.trim() });
    }

    // ── MOVIE ────────────────────────────────────────────────────────────────
    if (type === 'MOVIE' || type === 'movie') {
      await prisma.entry.upsert({
        where: { tmdbId },
        update: {
          title: title.trim(),
          imagePath: poster_path ?? null,
        },
        create: {
          tmdbId,
          title: title.trim(),
          type: 'MOVIE',
          status: 'PLANNING',
          totalEpisodes: 1,
          imagePath: poster_path ?? null,
        },
      });

      return NextResponse.json({ success: true, saved: title.trim() });
    }

    // ── Fallback: type === 'tv' (safety net — não deveria ocorrer) ───────────
    if (type === 'tv') {
      if (!API_KEY) {
        return NextResponse.json({ error: 'API key ausente' }, { status: 500 });
      }

      const res = await fetch(`${TMDB}/tv/${tmdbId}?api_key=${API_KEY}&language=pt-BR`);
      if (!res.ok) {
        return NextResponse.json({ error: 'Falha ao buscar série no TMDB' }, { status: 502 });
      }

      const tvData = await res.json();
      const showName: string = tvData.name ?? title.trim();
      const seasons: any[] = tvData.seasons ?? [];

      if (seasons.length === 0) {
        return NextResponse.json({ error: 'Nenhuma temporada encontrada' }, { status: 404 });
      }

      const operations = seasons.map((season: any) => {
        const seasonTitle = buildSeasonTitle(showName, season.season_number);

        return prisma.entry.upsert({
          where: { tmdbId: season.id },
          update: {
            title: seasonTitle,
            imagePath: season.poster_path ?? null,
            totalEpisodes: season.episode_count ?? 0,
            seasonNumber: season.season_number ?? null, // ✅ salvo no update
          },
          create: {
            tmdbId: season.id,
            parentTmdbId: tmdbId,
            seasonNumber: season.season_number ?? null, // ✅ salvo no create
            title: seasonTitle,
            type: 'TV_SEASON',
            status: 'PLANNING',
            totalEpisodes: season.episode_count ?? 0,
            imagePath: season.poster_path ?? null,
          },
        });
      });

      await Promise.all(operations);
      return NextResponse.json({ success: true, seasons: seasons.length });
    }

    return NextResponse.json({ error: `Tipo desconhecido: ${type}` }, { status: 400 });

  } catch (error) {
    console.error('[add-media] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}