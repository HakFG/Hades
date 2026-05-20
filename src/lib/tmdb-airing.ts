import { fetchTmdbJson, hasTmdbKey } from '@/lib/tmdb-json';

export async function getNextEpisode(
  tmdbId: number
): Promise<{ date: string; episodeNumber: number; seasonNumber: number } | null> {
  if (!hasTmdbKey()) {
    console.warn('[tmdb-airing] NEXT_PUBLIC_TMDB_API_KEY não configurada');
    return null;
  }

  try {
    const data = await fetchTmdbJson<any>(`/tv/${tmdbId}`, { language: 'pt-BR', cache: 'no-store' });
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
    console.error('[tmdb-airing] fetch/parse error:', error);
    return null;
  }
}
