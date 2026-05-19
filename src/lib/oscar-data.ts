import oscars from '@/data/oscars.json';

const TMDB = process.env.NEXT_PUBLIC_TMDB_BASE_URL ?? 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export type OscarResult = 'winner' | 'nominated';

export interface OscarFilmSeed {
  id: string;
  tmdbId?: number;
  title: string;
  categories: string[];
  result: OscarResult;
}

export interface OscarFilm extends Omit<OscarFilmSeed, 'tmdbId'> {
  year: number;
  tmdbId: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
  source: 'curated' | 'tmdb-pool';
}

type OscarData = Record<string, OscarFilmSeed[]>;

async function tmdbJson(endpoint: string) {
  if (!API_KEY) return null;
  const glue = endpoint.includes('?') ? '&' : '?';
  const response = await fetch(`${TMDB}${endpoint}${glue}api_key=${API_KEY}&language=en-US`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!response.ok) return null;
  return response.json();
}

async function hydrateFilm(seed: OscarFilmSeed, year: number): Promise<OscarFilm> {
  const detail = seed.tmdbId
    ? await tmdbJson(`/movie/${seed.tmdbId}`)
    : null;

  const search = !detail
    ? await tmdbJson(`/search/movie?query=${encodeURIComponent(seed.title)}&year=${year - 1}`)
    : null;
  const match = detail ?? search?.results?.[0] ?? null;

  return {
    ...seed,
    year,
    tmdbId: typeof match?.id === 'number' ? match.id : seed.tmdbId ?? null,
    posterPath: match?.poster_path ?? null,
    backdropPath: match?.backdrop_path ?? null,
    overview: match?.overview ?? null,
    releaseDate: match?.release_date ?? null,
    voteAverage: typeof match?.vote_average === 'number' ? match.vote_average : null,
    source: 'curated',
  };
}

async function getTmdbAwardPool(year: number): Promise<OscarFilm[]> {
  const releaseYear = Math.max(1888, year - 1);
  const data = await tmdbJson(
    `/discover/movie?primary_release_year=${releaseYear}&sort_by=vote_count.desc&vote_count.gte=180&include_adult=false&page=1`,
  );

  return ((data?.results ?? []) as Array<{
    id: number;
    title?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    overview?: string | null;
    release_date?: string | null;
    vote_average?: number | null;
  }>)
    .slice(0, 24)
    .map((movie, index) => ({
      id: `${year}-tmdb-award-pool-${movie.id}`,
      title: movie.title ?? 'Untitled',
      year,
      tmdbId: movie.id,
      posterPath: movie.poster_path ?? null,
      backdropPath: movie.backdrop_path ?? null,
      overview: movie.overview ?? null,
      releaseDate: movie.release_date ?? null,
      voteAverage: typeof movie.vote_average === 'number' ? movie.vote_average : null,
      categories: index < 10 ? ['Best Picture Pool'] : ['Oscar Watchlist'],
      result: 'nominated',
      source: 'tmdb-pool',
    }));
}

export function getOscarYears(): number[] {
  const currentYear = new Date().getFullYear();
  const academyFirstYear = 1929;
  return Array.from({ length: currentYear - academyFirstYear + 1 }, (_, index) => currentYear - index);
}

export async function getOscarFilmsByYear(year: number): Promise<OscarFilm[]> {
  const data = oscars as OscarData;
  const films = data[String(year)] ?? [];
  if (films.length) return Promise.all(films.map((film) => hydrateFilm(film, year)));
  return getTmdbAwardPool(year);
}

export async function getOscarCategories(year: number): Promise<string[]> {
  const films = await getOscarFilmsByYear(year);
  return Array.from(new Set(films.flatMap((film) => film.categories))).sort();
}
