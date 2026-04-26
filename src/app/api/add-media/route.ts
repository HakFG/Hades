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

// Determina o status de exibição (airing status) para séries
function getAiringStatus(
  status: string,
  firstAirDate: string | null,
  lastAirDate: string | null,
  inProduction: boolean
): 'Airing' | 'Finished' | 'Not Yet Aired' {
  const today = new Date().toISOString().split('T')[0];
  if (status === 'Returning Series' || inProduction) return 'Airing';
  if (status === 'Ended') return 'Finished';
  if (firstAirDate && firstAirDate > today) return 'Not Yet Aired';
  if (lastAirDate && lastAirDate < today) return 'Finished';
  return 'Airing';
}

// Determina o formato (TV / Streaming) baseado nas redes/produtoras
function getFormat(networks: any[], productionCompanies: any[]): 'TV' | 'Streaming' {
  const streamingKeywords = ['Netflix', 'Amazon', 'Prime Video', 'Hulu', 'Disney+', 'Apple TV+', 'Max', 'Paramount+', 'Crunchyroll', 'Peacock'];
  const all = [...networks, ...productionCompanies];
  const isStreaming = all.some(c => streamingKeywords.some(kw => c.name?.toLowerCase().includes(kw.toLowerCase())));
  return isStreaming ? 'Streaming' : 'TV';
}

// ─── POST /api/add-media ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tmdbId, parentTmdbId, type, title, poster_path, totalEpisodes, seasonNumber } = body;

    // Validação básica
    if (!tmdbId || typeof tmdbId !== 'number') {
      return NextResponse.json({ error: 'tmdbId inválido ou ausente' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: 'type é obrigatório' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 });
    }

    // ─── Séries (caso o frontend envie tipo 'tv' para adicionar todas as temporadas) ───
    if (type === 'tv') {
      if (!API_KEY) {
        return NextResponse.json({ error: 'API key ausente' }, { status: 500 });
      }

      // Busca detalhes da série principal
      const seriesRes = await fetch(`${TMDB}/tv/${tmdbId}?api_key=${API_KEY}&language=pt-BR`);
      if (!seriesRes.ok) {
        return NextResponse.json({ error: 'Falha ao buscar série no TMDB' }, { status: 502 });
      }
      const seriesData = await seriesRes.json();

      const showName = seriesData.name ?? title.trim();
      const firstAirDate = seriesData.first_air_date;
      const lastAirDate = seriesData.last_air_date;
      const inProduction = seriesData.in_production ?? false;
      const seriesStatus = seriesData.status ?? '';
      const airingStatus = getAiringStatus(seriesStatus, firstAirDate, lastAirDate, inProduction);
      const formatType = getFormat(seriesData.networks ?? [], seriesData.production_companies ?? []);
      const popularity = seriesData.popularity ?? 0;
      const genres = (seriesData.genres ?? []).map((g: any) => g.name).join(', ');
      const studios = (seriesData.production_companies ?? [])[0]?.name ?? null;
      const rating = seriesData.vote_average ?? null;
      const bannerPath = seriesData.backdrop_path ?? null;

      // Processa cada temporada (apenas season_number > 0, opcionalmente especiais)
      const seasons: any[] = seriesData.seasons ?? [];
      const operations = seasons
        .filter((s: any) => s.season_number > 0) // exclui especiais (season 0)
        .map(async (season: any) => {
          const seasonTitle = buildSeasonTitle(showName, season.season_number);
          const seasonPoster = season.poster_path ?? seriesData.poster_path;

          // Busca detalhes da temporada para obter sua própria popularidade (ou herda da série)
          // A popularidade da temporada não é fornecida diretamente; usaremos a da série como proxy.
          // Mas podemos também buscar detalhes da temporada para ter sua própria data de lançamento.
          let seasonReleaseDate = season.air_date;
          let seasonPopularity = popularity; // fallback

          // Opcional: chamada extra para obter detalhes da temporada (incrementa requisições)
          if (season.id) {
            try {
              const seasonDetailRes = await fetch(
                `${TMDB}/tv/${tmdbId}/season/${season.season_number}?api_key=${API_KEY}&language=pt-BR`
              );
              if (seasonDetailRes.ok) {
                const seasonDetail = await seasonDetailRes.json();
                seasonReleaseDate = seasonDetail.air_date ?? seasonReleaseDate;
                // A API de temporada não tem campo popularity; mantemos o da série.
              }
            } catch (e) { /* ignora */ }
          }

          return prisma.entry.upsert({
            where: { tmdbId: season.id },
            update: {
              title: seasonTitle,
              imagePath: seasonPoster,
              totalEpisodes: season.episode_count ?? 0,
              seasonNumber: season.season_number,
              releaseDate: seasonReleaseDate ?? null,
              rating: popularity,
              genres,
              studio: studios,
              bannerPath,
              // status de exibição da série (pode ser refinado por temporada se disponível)
              // Como a temporada pode ter terminado antes da série, ideal seria ter status específico,
              // mas para simplificar, usamos o mesmo da série.
              // A lógica mais precisa exigiria comparar air_date da temporada com data atual.
            },
            create: {
              tmdbId: season.id,
              parentTmdbId: tmdbId,
              seasonNumber: season.season_number,
              title: seasonTitle,
              type: 'TV_SEASON',
              status: 'PLANNING',
              totalEpisodes: season.episode_count ?? 0,
              imagePath: seasonPoster,
              releaseDate: seasonReleaseDate ?? null,
              rating: popularity,
              genres,
              studio: studios,
              bannerPath,
            },
          });
        });

      await Promise.all(operations);
      return NextResponse.json({ success: true, seasons: operations.length, airingStatus, formatType });
    }

    // ─── TV_SEASON individual (adicionado pelo search/page.tsx) ──────────────
    if (type === 'TV_SEASON') {
      if (!parentTmdbId || typeof parentTmdbId !== 'number') {
        return NextResponse.json({ error: 'parentTmdbId obrigatório para TV_SEASON' }, { status: 400 });
      }

      // Buscar dados da série pai para enriquecer a temporada
      let extraData = {};
      try {
        const seriesRes = await fetch(`${TMDB}/tv/${parentTmdbId}?api_key=${API_KEY}&language=pt-BR`);
        if (seriesRes.ok) {
          const seriesData = await seriesRes.json();
          const genres = (seriesData.genres ?? []).map((g: any) => g.name).join(', ');
          const studios = (seriesData.production_companies ?? [])[0]?.name ?? null;
          const bannerPath = seriesData.backdrop_path ?? null;
          const popularity = seriesData.popularity ?? 0;
          const rating = seriesData.vote_average ?? null;
          const inProduction = seriesData.in_production ?? false;
          const firstAirDate = seriesData.first_air_date;
          const lastAirDate = seriesData.last_air_date;
          const seriesStatus = seriesData.status ?? '';
          const airingStatus = getAiringStatus(seriesStatus, firstAirDate, lastAirDate, inProduction);

          extraData = {
            genres,
            studio: studios,
            bannerPath,
            rating,
            popularity,
            // não salvamos airingStatus diretamente na entry; mas podemos adicionar um campo `airingStatus` no schema
            // Por ora, não armazenamos esse status no banco, apenas usamos no frontend.
          };
        }
      } catch (e) { /* ignora */ }

      // Tenta obter releaseDate da temporada específica
      let releaseDate = null;
      try {
        const seasonRes = await fetch(`${TMDB}/tv/${parentTmdbId}/season/${seasonNumber}?api_key=${API_KEY}&language=pt-BR`);
        if (seasonRes.ok) {
          const seasonData = await seasonRes.json();
          releaseDate = seasonData.air_date ?? null;
        }
      } catch (e) { /* ignora */ }

      await prisma.entry.upsert({
        where: { tmdbId },
        update: {
          title: title.trim(),
          imagePath: poster_path ?? null,
          totalEpisodes: totalEpisodes ?? 0,
          seasonNumber: seasonNumber ?? null,
          releaseDate: releaseDate ?? undefined,
          ...extraData,
        },
        create: {
          tmdbId,
          parentTmdbId,
          seasonNumber: seasonNumber ?? null,
          title: title.trim(),
          type: 'TV_SEASON',
          status: 'PLANNING',
          totalEpisodes: totalEpisodes ?? 0,
          imagePath: poster_path ?? null,
          releaseDate: releaseDate ?? null,
          ...extraData,
        },
      });

      return NextResponse.json({ success: true, saved: title.trim() });
    }

    // ─── MOVIE ──────────────────────────────────────────────────────────────
    if (type === 'MOVIE' || type === 'movie') {
      // Buscar dados enriquecidos do filme
      let extraData = {};
      let releaseDate = null;
      let genres = '';
      let studio = null;
      let bannerPath = null;
      let popularity = 0;
      let rating = null;
      let formatType = 'Movie'; // será salvo como 'MOVIE'

      try {
        const movieRes = await fetch(`${TMDB}/movie/${tmdbId}?api_key=${API_KEY}&language=pt-BR`);
        if (movieRes.ok) {
          const movieData = await movieRes.json();
          releaseDate = movieData.release_date ?? null;
          genres = (movieData.genres ?? []).map((g: any) => g.name).join(', ');
          studio = (movieData.production_companies ?? [])[0]?.name ?? null;
          bannerPath = movieData.backdrop_path ?? null;
          popularity = movieData.popularity ?? 0;
          rating = movieData.vote_average ?? null;

          // Determinar formato: se for lançado diretamente em streaming, considerar 'Streaming'
          const streamingKeywords = ['Netflix', 'Amazon', 'Prime Video', 'Hulu', 'Disney+', 'Apple TV+', 'Max', 'Paramount+', 'Crunchyroll'];
          const companies = movieData.production_companies ?? [];
          const isStreaming = companies.some((c: any) => streamingKeywords.some(kw => c.name?.toLowerCase().includes(kw.toLowerCase())));
          formatType = isStreaming ? 'Streaming' : 'Movie'; // mas o campo type já é MOVIE, então podemos armazenar um campo format separado
        }
      } catch (e) { /* ignora */ }

      await prisma.entry.upsert({
        where: { tmdbId },
        update: {
          title: title.trim(),
          imagePath: poster_path ?? null,
          totalEpisodes: 1,
          releaseDate: releaseDate ?? undefined,
          genres: genres || undefined,
          studio: studio,
          bannerPath: bannerPath ?? undefined,
          rating: rating ?? undefined,
          popularity,
          // Se quiser salvar o formato, crie um campo `format` no schema
        },
        create: {
          tmdbId,
          title: title.trim(),
          type: 'MOVIE',
          status: 'PLANNING',
          totalEpisodes: 1,
          imagePath: poster_path ?? null,
          releaseDate: releaseDate ?? null,
          genres: genres || null,
          studio: studio,
          bannerPath: bannerPath ?? null,
          rating: rating ?? null,
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