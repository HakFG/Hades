const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function getNextEpisode(
  tmdbId: number
): Promise<{ date: string; episodeNumber: number; seasonNumber: number } | null> {
  if (!API_KEY) {
    console.warn('[tmdb-airing] NEXT_PUBLIC_TMDB_API_KEY não configurada');
    return null;
  }

  try {
    // Buscamos os detalhes da série para ver o "next_episode_to_air"
    const res = await fetch(`${BASE_URL}/tv/${tmdbId}?api_key=${API_KEY}&language=pt-BR`);
    if (!res.ok) return null;
    const data = await res.json();

    const next = data?.next_episode_to_air;
    if (next && typeof next.air_date === 'string') {
      return {
        date: next.air_date,
        episodeNumber: next.episode_number,
        seasonNumber: next.season_number,
      };
    }

    return null;
  } catch (error) {
    console.error('[tmdb-airing] fetch error', error);
    return null;
  }
}