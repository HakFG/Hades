import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TMDB = 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

// Helper para buscar dados atualizados do filme no TMDB (sem título)
async function refreshMovie(entry: any) {
  try {
    const res = await fetch(`${TMDB}/movie/${entry.tmdbId}?api_key=${API_KEY}&language=pt-BR`);
    if (!res.ok) return null;
    const d = await res.json();
    return {
      imagePath: d.poster_path,
      totalEpisodes: 1,
      releaseDate: d.release_date,
      genres: (d.genres ?? []).map((g: any) => g.name).join(', '),
      studio: (d.production_companies ?? [])[0]?.name ?? null,
      bannerPath: d.backdrop_path,
      rating: d.vote_average,
      popularity: d.popularity,
    };
  } catch { return null; }
}

// Helper para buscar dados atualizados da temporada (série) – sem título
async function refreshTVSeason(entry: any) {
  if (!entry.parentTmdbId || !entry.seasonNumber) return null;
  try {
    const [showRes, seasonRes] = await Promise.all([
      fetch(`${TMDB}/tv/${entry.parentTmdbId}?api_key=${API_KEY}&language=pt-BR`),
      fetch(`${TMDB}/tv/${entry.parentTmdbId}/season/${entry.seasonNumber}?api_key=${API_KEY}&language=pt-BR`),
    ]);
    if (!showRes.ok || !seasonRes.ok) return null;
    const showData = await showRes.json();
    const seasonData = await seasonRes.json();
    return {
      imagePath: seasonData.poster_path ?? showData.poster_path,
      totalEpisodes: seasonData.episodes?.length ?? 0,
      releaseDate: seasonData.air_date,
      genres: (showData.genres ?? []).map((g: any) => g.name).join(', '),
      studio: (showData.production_companies ?? [])[0]?.name ?? null,
      bannerPath: showData.backdrop_path,
      rating: showData.vote_average,
      popularity: showData.popularity,
    };
  } catch { return null; }
}

export async function POST() {
  try {
    const allEntries = await prisma.entry.findMany();
    let updated = 0;
    let failed = 0;

    for (const entry of allEntries) {
      let freshData = null;
      if (entry.type === 'MOVIE') {
        freshData = await refreshMovie(entry);
      } else if (entry.type === 'TV_SEASON') {
        freshData = await refreshTVSeason(entry);
      }
      if (freshData) {
        await prisma.entry.update({
          where: { id: entry.id },
          data: {
            imagePath: freshData.imagePath,
            totalEpisodes: freshData.totalEpisodes,
            releaseDate: freshData.releaseDate,
            genres: freshData.genres,
            studio: freshData.studio,
            bannerPath: freshData.bannerPath,
            rating: freshData.rating,
            popularity: freshData.popularity,
            // NÃO altera: title, status, score, progress, isFavorite, startDate, finishDate, notes, hidden
          },
        });
        updated++;
      } else {
        failed++;
      }
      await new Promise(r => setTimeout(r, 150)); // delay para não sobrecarregar a API
    }

    return NextResponse.json({ success: true, updated, failed });
  } catch (error) {
    console.error('[refresh-all]', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}