import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TMDB    = 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TODAY   = () => new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

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

/**
 * Valida se uma string é uma data real no formato YYYY-MM-DD.
 * Rejeita nulos, strings vazias, datas futuras absurdas (> 10 anos) e
 * datas impossíveis como "0000-00-00".
 */
function isValidDate(d: unknown): d is string {
  if (!d || typeof d !== 'string') return false;
  // Formato básico
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const parsed = new Date(d + 'T00:00:00Z');
  if (isNaN(parsed.getTime())) return false;
  const year = parsed.getUTCFullYear();
  // Rejeita anos impossíveis
  if (year < 1888 || year > new Date().getUTCFullYear() + 10) return false;
  return true;
}

/**
 * Dado um array de episódios do TMDB, retorna:
 * - firstAirDate: data do primeiro episódio com data válida
 * - lastAiredDate: data do último episódio que JÁ foi ao ar (≤ hoje)
 * - lastEpisodeDate: data do último episódio com data (independente de ter ido ao ar)
 *
 * Isso evita salvar null quando o season.air_date do endpoint principal está faltando.
 */
function extractEpisodeDates(episodes: any[]): {
  firstAirDate:    string | null;
  lastAiredDate:   string | null;
  lastEpisodeDate: string | null;
} {
  const today = TODAY();

  const withDates = episodes
    .filter(ep => isValidDate(ep.air_date))
    .sort((a, b) => a.air_date.localeCompare(b.air_date));

  const aired = withDates.filter(ep => ep.air_date <= today);

  return {
    firstAirDate:    withDates[0]?.air_date    ?? null,
    lastAiredDate:   aired.at(-1)?.air_date    ?? null,
    lastEpisodeDate: withDates.at(-1)?.air_date ?? null,
  };
}

/**
 * Busca os detalhes de uma temporada e retorna as datas corretas.
 * Estratégia em camadas:
 *   1. Usa air_date da temporada (endpoint /tv/{id}/season/{n})
 *   2. Fallback: primeiro episódio com data válida
 *   3. Fallback final: air_date do stub da temporada no endpoint da série pai
 *
 * Nunca retorna uma data inválida — prefere null a uma data errada.
 */
async function fetchSeasonDates(
  showId:       number,
  seasonNumber: number,
  stubAirDate:  string | null = null,
): Promise<{
  releaseDate:  string | null;
  endDate:      string | null;
}> {
  try {
    const res = await fetch(
      `${TMDB}/tv/${showId}/season/${seasonNumber}?api_key=${API_KEY}&language=pt-BR`
    );
    if (!res.ok) throw new Error('season fetch failed');

    const data = await res.json();
    const episodes: any[] = data.episodes ?? [];

    const { firstAirDate, lastAiredDate } = extractEpisodeDates(episodes);

    // Prioridade para releaseDate:
    //   1. air_date do endpoint da temporada (mais confiável)
    //   2. primeiro episódio com data válida
    //   3. stub.air_date da série (fallback final)
    const releaseDate =
      (isValidDate(data.air_date)   ? data.air_date   : null) ??
      firstAirDate                                             ??
      (isValidDate(stubAirDate)     ? stubAirDate     : null);

    return { releaseDate, endDate: lastAiredDate };
  } catch {
    // Se a requisição falhou completamente, pelo menos tenta usar o stub
    return {
      releaseDate: isValidDate(stubAirDate) ? stubAirDate : null,
      endDate:     null,
    };
  }
}

/**
 * Busca dados extras da série pai (gêneros, studio, banner, rating).
 * Retorna objeto vazio se falhar — nunca lança.
 */
async function fetchSeriesExtra(showId: number): Promise<{
  genres:     string;
  studio:     string | null;
  bannerPath: string | null;
  rating:     number | null;
  popularity: number;
  networks:   string;
}> {
  try {
    const res = await fetch(`${TMDB}/tv/${showId}?api_key=${API_KEY}&language=pt-BR`);
    if (!res.ok) throw new Error('series fetch failed');
    const d = await res.json();
    return {
      genres:     (d.genres ?? []).map((g: any) => g.name).join(', '),
      studio:     (d.production_companies ?? [])[0]?.name ?? null,
      bannerPath: d.backdrop_path ?? null,
      rating:     typeof d.vote_average === 'number' ? d.vote_average : null,
      popularity: typeof d.popularity   === 'number' ? d.popularity   : 0,
      networks:   (d.networks ?? []).map((n: any) => n.name).join(', '),
    };
  } catch {
    return { genres: '', studio: null, bannerPath: null, rating: null, popularity: 0, networks: '' };
  }
}

// ─── POST /api/add-media ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tmdbId, parentTmdbId, type, title, poster_path, totalEpisodes, seasonNumber } = body;

    // ── Validação básica ───────────────────────────────────────────────────
    if (!tmdbId || typeof tmdbId !== 'number') {
      return NextResponse.json({ error: 'tmdbId inválido ou ausente' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: 'type é obrigatório' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 });
    }
    if (!API_KEY) {
      return NextResponse.json({ error: 'TMDB API key não configurada' }, { status: 500 });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIPO: 'tv' — adiciona TODAS as temporadas de uma série de uma vez
    // ─────────────────────────────────────────────────────────────────────────
    if (type === 'tv') {
      const seriesRes = await fetch(`${TMDB}/tv/${tmdbId}?api_key=${API_KEY}&language=pt-BR`);
      if (!seriesRes.ok) {
        return NextResponse.json({ error: 'Falha ao buscar série no TMDB' }, { status: 502 });
      }
      const seriesData = await seriesRes.json();

      const showName   = seriesData.name ?? title.trim();
      const extra      = {
        genres:     (seriesData.genres ?? []).map((g: any) => g.name).join(', '),
        studio:     (seriesData.production_companies ?? [])[0]?.name ?? null,
        bannerPath: seriesData.backdrop_path ?? null,
        rating:     typeof seriesData.vote_average === 'number' ? seriesData.vote_average : null,
        popularity: typeof seriesData.popularity   === 'number' ? seriesData.popularity   : 0,
      };

      const seasons: any[] = (seriesData.seasons ?? []).filter((s: any) => s.season_number > 0);

      // Busca datas de todas as temporadas em paralelo
      const seasonDates = await Promise.all(
        seasons.map(s => fetchSeasonDates(tmdbId, s.season_number, s.air_date ?? null))
      );

      const operations = seasons.map((season: any, idx: number) => {
        const { releaseDate, endDate } = seasonDates[idx];
        const seasonTitle  = buildSeasonTitle(showName, season.season_number);
        const seasonPoster = season.poster_path ?? seriesData.poster_path ?? null;

        return prisma.entry.upsert({
          where:  { tmdbId: season.id },
          update: {
            title:         seasonTitle,
            imagePath:     seasonPoster,
            totalEpisodes: season.episode_count ?? 0,
            seasonNumber:  season.season_number,
            releaseDate,
            endDate,
            ...extra,
          },
          create: {
            tmdbId:        season.id,
            parentTmdbId:  tmdbId,
            seasonNumber:  season.season_number,
            title:         seasonTitle,
            type:          'TV_SEASON',
            status:        'PLANNING',
            totalEpisodes: season.episode_count ?? 0,
            imagePath:     seasonPoster,
            releaseDate,
            endDate,
            ...extra,
          },
        });
      });

      await Promise.all(operations);
      return NextResponse.json({ success: true, seasons: operations.length });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIPO: 'TV_SEASON' — adiciona uma temporada específica
    // ─────────────────────────────────────────────────────────────────────────
    if (type === 'TV_SEASON') {
      if (!parentTmdbId || typeof parentTmdbId !== 'number') {
        return NextResponse.json({ error: 'parentTmdbId obrigatório para TV_SEASON' }, { status: 400 });
      }

      // Busca dados da série pai e da temporada em paralelo
      const [extra, { releaseDate, endDate }] = await Promise.all([
        fetchSeriesExtra(parentTmdbId),
        fetchSeasonDates(parentTmdbId, seasonNumber ?? 1, null),
      ]);

      await prisma.entry.upsert({
        where:  { tmdbId },
        update: {
          title:         title.trim(),
          imagePath:     poster_path ?? null,
          totalEpisodes: totalEpisodes ?? 0,
          seasonNumber:  seasonNumber ?? null,
          releaseDate,
          endDate,
          genres:        extra.genres     || undefined,
          studio:        extra.studio     ?? undefined,
          bannerPath:    extra.bannerPath ?? undefined,
          rating:        extra.rating     ?? undefined,
          popularity:    extra.popularity,
        },
        create: {
          tmdbId,
          parentTmdbId,
          seasonNumber:  seasonNumber ?? null,
          title:         title.trim(),
          type:          'TV_SEASON',
          status:        'PLANNING',
          totalEpisodes: totalEpisodes ?? 0,
          imagePath:     poster_path ?? null,
          releaseDate,
          endDate,
          genres:        extra.genres     || null,
          studio:        extra.studio     ?? null,
          bannerPath:    extra.bannerPath ?? null,
          rating:        extra.rating     ?? null,
          popularity:    extra.popularity,
        },
      });

      return NextResponse.json({ success: true, saved: title.trim() });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIPO: 'MOVIE' — adiciona um filme
    // ─────────────────────────────────────────────────────────────────────────
    if (type === 'MOVIE' || type === 'movie') {
      let releaseDate: string | null = null;
      let genres                     = '';
      let studio: string | null      = null;
      let bannerPath: string | null  = null;
      let popularity                 = 0;
      let rating: number | null      = null;

      try {
        const movieRes = await fetch(`${TMDB}/movie/${tmdbId}?api_key=${API_KEY}&language=pt-BR`);
        if (!movieRes.ok) throw new Error('movie fetch failed');
        const d = await movieRes.json();

        // Valida a data antes de salvar — evita "0000-00-00" ou datas malformadas
        releaseDate = isValidDate(d.release_date) ? d.release_date : null;
        genres      = (d.genres ?? []).map((g: any) => g.name).join(', ');
        studio      = (d.production_companies ?? [])[0]?.name ?? null;
        bannerPath  = d.backdrop_path ?? null;
        popularity  = typeof d.popularity   === 'number' ? d.popularity   : 0;
        rating      = typeof d.vote_average === 'number' ? d.vote_average : null;
      } catch { /* mantém nulls */ }

      await prisma.entry.upsert({
        where:  { tmdbId },
        update: {
          title:         title.trim(),
          imagePath:     poster_path ?? null,
          totalEpisodes: 1,
          releaseDate,
          genres:        genres     || undefined,
          studio,
          bannerPath:    bannerPath ?? undefined,
          rating:        rating     ?? undefined,
          popularity,
        },
        create: {
          tmdbId,
          title:         title.trim(),
          type:          'MOVIE',
          status:        'PLANNING',
          totalEpisodes: 1,
          imagePath:     poster_path ?? null,
          releaseDate,
          genres:        genres  || null,
          studio,
          bannerPath:    bannerPath ?? null,
          rating:        rating     ?? null,
          popularity,
        },
      });

      return NextResponse.json({ success: true, saved: title.trim() });
    }

    return NextResponse.json({ error: `Tipo desconhecido: ${type}` }, { status: 400 });

  } catch (error) {
    console.error('[add-media] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
} 