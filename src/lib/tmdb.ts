const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL ?? 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

// ─── Configurações de requisição robusta ───────────────────────────────────────
const FETCH_TIMEOUT = 8000; // 8 segundos
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 segundo

/**
 * Wrapper para requisições com retry automático e timeout
 * Tenta até RETRY_ATTEMPTS vezes com backoff exponencial
 */
async function fetchWithRetry(
  url: string,
  options: { timeout?: number; retries?: number } = {},
): Promise<Response> {
  const { timeout = FETCH_TIMEOUT, retries = RETRY_ATTEMPTS } = options;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) return res;
      if (res.status >= 500 || res.status === 429) {
        // Retry em erros de servidor ou rate limit
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt)));
          continue;
        }
      }
      return res;
    } catch (error) {
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt)));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error(`Falha após ${retries} tentativas`);
}

/**
 * Faz requisição para TMDB com language fallback
 * Primeira tentativa com o idioma especificado, segunda sem o parâmetro language
 */
async function fetchTmdbWithLanguage(
  endpoint: string,
  language: 'en-US' | 'pt-BR' = 'pt-BR',
): Promise<any> {
  const url = `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=${language}`;
  
  try {
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      // Se falhou com language específica, tenta sem language
      if (language !== 'en-US') {
        const fallbackUrl = `${BASE_URL}${endpoint}?api_key=${API_KEY}`;
        const fallbackRes = await fetchWithRetry(fallbackUrl);
        if (!fallbackRes.ok) throw new Error(`HTTP ${fallbackRes.status}`);
        return fallbackRes.json();
      }
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.error(`[TMDB] Erro ao buscar ${endpoint} (language=${language}):`, error);
    throw error;
  }
}

/**
 * Busca dados detalhados de um filme com informações em inglês
 * Estratégia multi-camada:
 *   1. Requisição principal em inglês com append_to_response
 *   2. Fallback: requisição sem language
 *   3. Dados incompletos melhor que erro
 */
export async function getDetailedMedia(
  tmdbId: number,
  type: 'movie' | 'tv',
  opts: { skipFallback?: boolean } = {},
): Promise<any> {
  const append = 'credits,images,videos,recommendations,external_ids';
  
  try {
    // Primeira: tenta em inglês (para nomes, capas e banners em original)
    const data = await fetchTmdbWithLanguage(
      `/${type}/${tmdbId}?append_to_response=${append}`,
      'en-US',
    );
    return data;
  } catch (error) {
    if (opts.skipFallback) throw error;
    
    // Fallback: tenta sem language
    try {
      const fallbackUrl = `${BASE_URL}/${type}/${tmdbId}?api_key=${API_KEY}&append_to_response=${append}`;
      const res = await fetchWithRetry(fallbackUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch {
      console.error(`[TMDB] Falha completa ao buscar ${type}/${tmdbId}`);
      throw error;
    }
  }
}

/**
 * Busca descrição e trailers do TMDB em português
 * Usado para sinopse (overview) e vídeos
 */
export async function getMediaDescription(
  tmdbId: number,
  type: 'movie' | 'tv',
): Promise<{ overview?: string; videos?: any }> {
  try {
    const data = await fetchTmdbWithLanguage(
      `/${type}/${tmdbId}?append_to_response=videos`,
      'pt-BR',
    );
    return {
      overview: data.overview,
      videos: data.videos,
    };
  } catch (error) {
    console.error(`[TMDB] Erro ao buscar descrição de ${type}/${tmdbId}`);
    return {};
  }
}

/**
 * Busca detalhes de uma temporada com informações em inglês
 */
export async function getSeasonDetails(
  tvId: number,
  seasonNumber: number,
): Promise<any> {
  try {
    const data = await fetchTmdbWithLanguage(
      `/tv/${tvId}/season/${seasonNumber}?append_to_response=credits,images,videos`,
      'en-US',
    );
    return data;
  } catch (error) {
    console.error(`[TMDB] Erro ao buscar Season ${tvId}/${seasonNumber}`);
    throw error;
  }
}

/**
 * Busca a sinopse em português de uma temporada
 */
export async function getSeasonDescription(
  tvId: number,
  seasonNumber: number,
): Promise<string> {
  try {
    const data = await fetchTmdbWithLanguage(
      `/tv/${tvId}/season/${seasonNumber}`,
      'pt-BR',
    );
    return data.overview || '';
  } catch (error) {
    console.error(`[TMDB] Erro ao buscar descrição Season ${tvId}/${seasonNumber}`);
    return '';
  }
}

/**
 * Busca recomendações/relacionadas em português com prioridade em idioma
 */
export async function getRecommendations(
  tmdbId: number,
  type: 'movie' | 'tv',
): Promise<any[]> {
  try {
    const data = await fetchTmdbWithLanguage(
      `/${type}/${tmdbId}/recommendations`,
      'pt-BR',
    );
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Busca coleção (collection) de um filme em inglês
 */
export async function getCollection(collectionId: number): Promise<any> {
  try {
    return await fetchTmdbWithLanguage(`/collection/${collectionId}`, 'en-US');
  } catch {
    return null;
  }
}

// src/lib/utils.ts
export function formatAniListTitle(baseTitle: string, seasonNumber: number) {
  if (seasonNumber === 0) return `${baseTitle} Specials`;
  if (seasonNumber === 1) return baseTitle;
  
  const suffixes: { [key: number]: string } = { 1: '', 2: 'nd', 3: 'rd' };
  const suffix = suffixes[seasonNumber] || 'th';
  
  return `${baseTitle} ${seasonNumber}${suffix} Season`;
}