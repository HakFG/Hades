/**
 * Staff / pessoas (TMDB) — tipos e normalização para UI estilo AniList.
 * Dados vêm de /person/{id} e /person/{id}/combined_credits.
 */

import { buildSeasonTitle } from './utils';

const BASE =
  process.env.NEXT_PUBLIC_TMDB_BASE_URL ?? 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export const TMDB_IMG = 'https://image.tmdb.org/t/p';

export type StaffMediaKind = 'movie' | 'tv';

export interface TmdbPersonRaw {
  id: number;
  name: string;
  also_known_as?: string[];
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  gender?: number;
  place_of_birth?: string | null;
  profile_path?: string | null;
  known_for_department?: string;
  popularity?: number;
}

export interface TmdbCombinedCreditItem {
  id: number;
  media_type: StaffMediaKind;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path?: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
  character?: string | null;
  job?: string | null;
  department?: string | null;
  episode_count?: number;
  season_number?: number;
}

export interface StaffRoleCard {
  key: string;
  tmdbId: number;
  mediaType: StaffMediaKind;
  title: string;
  posterPath: string | null;
  roles: string[];
  /** true = verde (lançado / em catálogo), false = laranja (TBA / sem data) */
  isReleased: boolean;
  titleSlug: string;
  /** ISO date ou vazio para ordenar créditos */
  sortDate: string;
  /** Número da temporada (para séries) */
  seasonNumber?: number;
}

export interface StaffPersonPayload {
  id: number;
  name: string;
  alternateName: string | null;
  profilePath: string | null;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  age: number | null;
  genderLabel: string | null;
  placeOfBirth: string | null;
  yearsActive: string | null;
  knownForDepartment: string | null;
}

function assertKey() {
  if (!API_KEY) throw new Error('NEXT_PUBLIC_TMDB_API_KEY ausente');
}

export async function fetchTmdbJson(
  endpoint: string,
  language?: string,
): Promise<any> {
  assertKey();
  const sep = endpoint.includes('?') ? '&' : '?';
  let url = `${BASE}${endpoint}${sep}api_key=${API_KEY}`;
  if (language) url += `&language=${encodeURIComponent(language)}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const err = new Error(`TMDB ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  return res.json();
}

export function personProfileUrl(path: string | null | undefined, size = 'h632'): string | null {
  if (!path) return null;
  return `${TMDB_IMG}/${size}${path}`;
}

export function posterUrl(path: string | null | undefined, size = 'w342'): string | null {
  if (!path) return null;
  return `${TMDB_IMG}/${size}${path}`;
}

export function genderToLabel(gender?: number): string | null {
  if (gender === undefined || gender === null || gender === 0) return null;
  if (gender === 1) return 'Female';
  if (gender === 2) return 'Male';
  if (gender === 3) return 'Non-binary';
  return null;
}

export function computeAge(birthday?: string | null, deathday?: string | null): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  if (Number.isNaN(birth.getTime())) return null;
  const end = deathday ? new Date(deathday) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

export function stripBioHtml(bio: string): string {
  return bio.replace(/<[^>]*>/g, '').trim();
}

function creditAirDate(c: TmdbCombinedCreditItem): string | null {
  if (c.media_type === 'movie') return c.release_date || null;
  return c.first_air_date || null;
}

export function isCreditReleased(c: TmdbCombinedCreditItem): boolean {
  const d = creditAirDate(c);
  if (!d) return false;
  const today = new Date().toISOString().split('T')[0];
  return d <= today;
}

export function buildTitleSlug(mediaType: StaffMediaKind, tmdbId: number, seasonNumber?: number): string {
  if (mediaType === 'movie') return `movie-${tmdbId}`;
  return `tv-${tmdbId}-s${seasonNumber || 1}`;
}

function displayTitle(c: TmdbCombinedCreditItem): string {
  if (c.media_type === 'movie') {
    return c.title || c.original_title || 'Sem título';
  }
  const showName = c.name || c.original_name || 'Sem título';
  if (c.season_number && c.season_number > 1) {
    return buildSeasonTitle(showName, c.season_number);
  }
  return showName;
}

function roleFromCredit(c: TmdbCombinedCreditItem): string {
  if (c.character && c.character.trim()) return c.character.trim();
  if (c.job && c.job.trim()) return c.job.trim();
  if (c.department) return c.department;
  return '—';
}

export function normalizePerson(raw: TmdbPersonRaw): StaffPersonPayload {
  const aka = raw.also_known_as?.filter(Boolean) ?? [];
  const alternate =
    aka.find(n => n !== raw.name && n.trim().length > 0) ?? null;

  return {
    id: raw.id,
    name: raw.name,
    alternateName: alternate,
    profilePath: raw.profile_path ?? null,
    biography: raw.biography ? stripBioHtml(raw.biography) : '',
    birthday: raw.birthday ?? null,
    deathday: raw.deathday ?? null,
    age: computeAge(raw.birthday, raw.deathday),
    genderLabel: genderToLabel(raw.gender),
    placeOfBirth: raw.place_of_birth ?? null,
    yearsActive: null,
    knownForDepartment: raw.known_for_department ?? null,
  };
}

function yearFromDate(d: string | null | undefined): number | null {
  if (!d || d.length < 4) return null;
  const y = parseInt(d.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

export function formatYearsActive(
  cast: TmdbCombinedCreditItem[],
  crew: TmdbCombinedCreditItem[],
  deathday?: string | null,
): string | null {
  const years: number[] = [];
  for (const c of [...cast, ...crew]) {
    const y = yearFromDate(creditAirDate(c));
    if (y !== null) years.push(y);
  }
  if (years.length === 0) return null;
  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  if (deathday) {
    const endY = yearFromDate(deathday);
    if (endY !== null && endY >= minY) return `${minY}–${endY}`;
    return `${minY}–${maxY}`;
  }
  if (minY === maxY) return `${minY}`;
  return `${minY}–Present`;
}

export function combinedToRoleCards(
  cast: TmdbCombinedCreditItem[],
  crew: TmdbCombinedCreditItem[],
  filter: StaffMediaKind,
): StaffRoleCard[] {
  const map = new Map<string, { roles: Set<string>; card: Omit<StaffRoleCard, 'roles'> }>();

  const push = (c: TmdbCombinedCreditItem) => {
    if (!c.media_type || c.media_type !== filter) return;
    const title = displayTitle(c);
    const role = roleFromCredit(c);
    const seasonNumber = c.season_number;
    const slug = buildTitleSlug(c.media_type, c.id, seasonNumber);
    const mapKey = `${c.media_type}-${c.id}${seasonNumber ? `-s${seasonNumber}` : ''}`;
    
    if (!map.has(mapKey)) {
      const sd = creditAirDate(c) || '';
      map.set(mapKey, {
        roles: new Set<string>(),
        card: {
          key: mapKey,
          tmdbId: c.id,
          mediaType: c.media_type,
          title,
          posterPath: c.poster_path ?? null,
          isReleased: isCreditReleased(c),
          titleSlug: slug,
          sortDate: sd,
          ...(seasonNumber && { seasonNumber }),
        },
      });
    }
    
    const entry = map.get(mapKey);
    if (entry) {
      entry.roles.add(role);
    }
  };

  for (const c of cast) push(c);
  for (const c of crew) push(c);

  const list: StaffRoleCard[] = [...map.values()].map(({ roles, card }) => ({
    ...card,
    roles: Array.from(roles).sort(),
  }));
  
  list.sort((a, b) => (b.sortDate > a.sortDate ? 1 : b.sortDate < a.sortDate ? -1 : a.title.localeCompare(b.title)));
  return list;
}
