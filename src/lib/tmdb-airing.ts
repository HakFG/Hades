const API_KEY = "process.env.NEXT_PUBLIC_TMDB_API_KEY";
const BASE_URL = "https://api.themoviedb.org/3";

export async function getNextEpisode(tmdbId: number) {
  try {
    // Buscamos os detalhes da série para ver o "next_episode_to_air"
    const res = await fetch(`${BASE_URL}/tv/${tmdbId}?api_key=${API_KEY}`);
    const data = await res.json();
    
    if (data.next_episode_to_air) {
      return {
        date: data.next_episode_to_air.air_date,
        episodeNumber: data.next_episode_to_air.episode_number,
        seasonNumber: data.next_episode_to_air.season_number
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}