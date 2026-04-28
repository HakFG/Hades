/**
 * Helpers especializados para fetching robusta de dados de títulos (filmes/séries)
 * com múltiplos layers de fallback e validação
 */

import {
  getDetailedMedia,
  getSeasonDetails,
  getMediaDescription,
  getSeasonDescription,
  getCollection,
} from './tmdb';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface TitleFetchResult {
  movie: any | null;
  show: any | null;
  seasonDetail: any | null;
  movieDescription: { overview?: string; videos?: any } | null;
  seasonDescription: string | null;
  collectionData: any | null;
  error: string | null;
}

/**
 * Busca todos os dados de um título (filme ou temporada de série)
 * com múltiplas estratégias de fallback para garantir sucesso.
 *
 * Estratégia:
 *   1. Requisições principais em inglês (nomes, imagens)
 *   2. Requisições secundárias em português (descrição, trailers)
 *   3. Fallback automático se alguma falhar
 *   4. Nunca retorna error se conseguir dados parciais
 */
export async function fetchTitleData(
  tmdbId: number,
  isTV: boolean,
  showId?: number | null,
  seasonNumber?: number | null,
): Promise<TitleFetchResult> {
  const result: TitleFetchResult = {
    movie: null,
    show: null,
    seasonDetail: null,
    movieDescription: null,
    seasonDescription: null,
    collectionData: null,
    error: null,
  };

  try {
    if (isTV && showId && seasonNumber) {
      // ─── TV Series: Fetch show principal + season details ───────────────────
      try {
        result.show = await getDetailedMedia(showId, 'tv');
      } catch (err) {
        console.warn('[fetchTitleData] Falha ao buscar show:', err);
      }

      try {
        result.seasonDetail = await getSeasonDetails(showId, seasonNumber);
      } catch (err) {
        console.warn('[fetchTitleData] Falha ao buscar season details:', err);
      }

      try {
        const desc = await getSeasonDescription(showId, seasonNumber);
        result.seasonDescription = desc;
      } catch (err) {
        console.warn('[fetchTitleData] Falha ao buscar season description:', err);
      }
    } else {
      // ─── Movie: Fetch movie + possível collection ──────────────────────────
      try {
        result.movie = await getDetailedMedia(tmdbId, 'movie');
      } catch (err) {
        console.warn('[fetchTitleData] Falha ao buscar movie:', err);
      }

      try {
        result.movieDescription = await getMediaDescription(tmdbId, 'movie');
      } catch (err) {
        console.warn('[fetchTitleData] Falha ao buscar movie description:', err);
      }

      // Se tem coleção, busca também
      if (result.movie?.belongs_to_collection?.id) {
        try {
          result.collectionData = await getCollection(
            result.movie.belongs_to_collection.id,
          );
        } catch (err) {
          console.warn('[fetchTitleData] Falha ao buscar collection:', err);
        }
      }
    }

    // Se conseguiu algum dado, não retorna error
    if (!result.movie && !result.show && !result.seasonDetail) {
      result.error = 'Nenhum dado encontrado no TMDB';
    }
  } catch (err) {
    console.error('[fetchTitleData] Erro geral:', err);
    result.error = 'Erro ao buscar dados';
  }

  return result;
}

/**
 * Busca relações automáticas do TMDB baseado em:
 *   1. Coleção (para filmes)
 *   2. Recomendações
 *   3. Relacionadas (TMDB)
 * Com prioridade ordenada.
 */
export interface AutoRelation {
  targetTmdbId: number;
  title: string;
  poster_path: string | null;
  kind: 'movie' | 'tv';
  year?: string;
  seasonNumber?: number;
  relationType: 'SEQUEL' | 'PREQUEL' | 'RELATED';
}

export async function getAutoRelations(
  tmdbId: number,
  isTV: boolean,
  fetchResult: TitleFetchResult,
): Promise<AutoRelation[]> {
  const relations: AutoRelation[] = [];

  if (!isTV && fetchResult.movie) {
    // ─── Para filmes: coloca coleção em primeiro (SEQUEL/PREQUEL/etc já sabemos) ───
    if (fetchResult.collectionData?.parts && fetchResult.collectionData.parts.length > 1) {
      const parts = fetchResult.collectionData.parts
        .filter((p: any) => p.id !== tmdbId) // Exclui o filme atual
        .slice(0, 8); // Limita a 8

      for (const part of parts) {
        relations.push({
          targetTmdbId: part.id,
          title: part.title,
          poster_path: part.poster_path,
          kind: 'movie',
          year: part.release_date?.split('-')[0],
          relationType: 'RELATED', // Genérico da coleção
        });
      }
    }

    // ─── Recomendações ────────────────────────────────────────────────────────
    if (fetchResult.movie.recommendations?.results) {
      const recs = fetchResult.movie.recommendations.results
        .slice(0, 6)
        .map((rec: any) => ({
          targetTmdbId: rec.id,
          title: rec.title,
          poster_path: rec.poster_path,
          kind: 'movie' as const,
          year: rec.release_date?.split('-')[0],
          relationType: 'RELATED' as const,
        }));
      relations.push(...recs);
    }
  }

  // ─── Para séries: temporadas próximas (se aplicável) ──────────────────
  if (isTV && fetchResult.show?.seasons) {
    // Nota: isso é mais complexo pois temos que buscar cada season
    // Por enquanto retorna vazio - pode ser expandido depois
  }

  return relations;
}

/**
 * Normaliza e valida URL de imagem
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/t/p/')) return `https://image.tmdb.org${url}`;
  if (url.startsWith('data:')) return url;
  return null;
}

/**
 * Busca capa customizada salva no banco
 */
export async function fetchCustomImage(entryId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/entries/${entryId}?fields=customImage`);
    if (res.ok) {
      const data = await res.json();
      return data.customImage || null;
    }
  } catch {
    // silently fail
  }
  return null;
}

/**
 * Salva capa customizada no banco
 */
export async function saveCustomImage(
  entryId: string,
  imageUrl: string,
): Promise<boolean> {
  try {
    const res = await fetch(`/api/update-entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryId,
        customImage: imageUrl,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
