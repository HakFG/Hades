const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export async function getDetailedMedia(tmdbId: number, type: 'movie' | 'tv') {
  // O parâmetro append_to_response é o segredo para pegar TUDO de uma vez (elenco, staff, imagens)
  const url = `${BASE_URL}/${type}/${tmdbId}?api_key=${API_KEY}&append_to_response=credits,images,videos,recommendations`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao buscar dados no TMDB');
  return res.json();
}

export async function getSeasonDetails(tvId: number, seasonNumber: number) {
  const url = `${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}&append_to_response=credits,images`;
  const res = await fetch(url);
  return res.json();
}

// src/lib/utils.ts
export function formatAniListTitle(baseTitle: string, seasonNumber: number) {
  if (seasonNumber === 0) return `${baseTitle} Specials`;
  if (seasonNumber === 1) return baseTitle;
  
  const suffixes: { [key: number]: string } = { 1: '', 2: 'nd', 3: 'rd' };
  const suffix = suffixes[seasonNumber] || 'th';
  
  return `${baseTitle} ${seasonNumber}${suffix} Season`;
}