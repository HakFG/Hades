import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  fetchTmdbJson,
  normalizePerson,
  formatYearsActive,
  type TmdbCombinedCreditItem,
  type TmdbPersonRaw,
} from '@/lib/staff';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Card enriquecido com campos extras para ordenação client-side */
export type RichRoleCard = {
  key:        string;
  titleSlug:  string;
  title:      string;
  posterPath: string | null;
  roles:      string[];
  mediaKind:  'movie' | 'tv';
  // campos para sort
  releaseDate: string | null; // "YYYY-MM-DD" ou null
  // integração com lista local
  inList:      boolean;
  listTmdbId:  number | null; // tmdbId do entry no DB (para link direto)
  seasonNumber?: number; // Número da temporada (para séries)
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSlug(item: TmdbCombinedCreditItem): string {
  if (item.media_type === 'movie') return `movie-${item.id}`;
  // Para TV usa o id da série com seasonNumber se disponível
  return `tv-${item.id}-s${item.season_number || 1}`;
}

/**
 * Converte créditos combinados do TMDB em RichRoleCard[], em inglês,
 * deduplicando por id+media_type e agregando todos os papéis.
 */
function toRichCards(
  cast: TmdbCombinedCreditItem[],
  crew: TmdbCombinedCreditItem[],
  kind: 'movie' | 'tv',
  inListIds: Set<number>,
  tmdbIdToDbTmdbId: Map<number, number>,
): RichRoleCard[] {
  const all = [...cast, ...crew].filter(
    (c) => c.media_type === kind && (c.id ?? 0) > 0,
  );

  // Agrupa por id, acumulando papéis
  const map = new Map<number, RichRoleCard>();
  for (const item of all) {
    const id = item.id!;
    const role =
      item.character?.trim() ||
      item.job?.trim() ||
      item.department?.trim() ||
      '';

    if (map.has(id)) {
      const existing = map.get(id)!;
      if (role && !existing.roles.includes(role)) {
        existing.roles.push(role);
      }
    } else {
      // título em inglês: original_title (movies) ou original_name (tv)
      const title =
        (kind === 'movie'
          ? item.original_title || item.title
          : item.original_name || item.name) ?? '';

      // poster em inglês: poster_path do TMDB (já é neutro, mas o título é o original)
      const posterPath = item.poster_path ?? null;

      const releaseRaw =
        kind === 'movie'
          ? item.release_date ?? null
          : item.first_air_date ?? null;

      const releaseDate =
        releaseRaw && /^\d{4}-\d{2}-\d{2}$/.test(releaseRaw)
          ? releaseRaw
          : null;

      map.set(id, {
        key:         `${kind}-${id}${item.season_number ? `-s${item.season_number}` : ''}`,
        titleSlug:   buildSlug(item),
        title,
        posterPath,
        roles:       role ? [role] : [],
        mediaKind:   kind,
        releaseDate,
        inList:      inListIds.has(id),
        listTmdbId:  tmdbIdToDbTmdbId.get(id) ?? null,
        ...(item.season_number && { seasonNumber: item.season_number }),
      });
    }
  }

  // Ordena por data de lançamento (mais recente primeiro), depois por título
  return Array.from(map.values()).sort((a, b) => {
    if (a.releaseDate && b.releaseDate) {
      return b.releaseDate.localeCompare(a.releaseDate);
    }
    if (a.releaseDate) return -1;
    if (b.releaseDate) return 1;
    return a.title.localeCompare(b.title);
  });
}

// ─── GET /api/staff/[id] ──────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: raw } = await params;
  const id = parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    // ── 1. Dados da pessoa — sempre em inglês ────────────────────────────────
    const person = (await fetchTmdbJson(`/person/${id}`, 'en-US')) as TmdbPersonRaw;

    // Biografia: tenta inglês primeiro, fallback pt-BR se vazia
    if (!person?.biography?.trim()) {
      try {
        const pt = (await fetchTmdbJson(`/person/${id}`, 'pt-BR')) as TmdbPersonRaw;
        if (pt?.biography?.trim()) person.biography = pt.biography;
      } catch { /* mantém inglês vazio */ }
    }

    // ── 2. Créditos em inglês (original_title / original_name) ──────────────
    const combined = await fetchTmdbJson(
      `/person/${id}/combined_credits`,
      'en-US',
    );
    const cast = (combined.cast ?? []) as TmdbCombinedCreditItem[];
    const crew = (combined.crew ?? []) as TmdbCombinedCreditItem[];

    // ── 3. Checa quais títulos já estão na lista local ───────────────────────
    const allTmdbIds = [...cast, ...crew]
      .map((c) => c.id)
      .filter((id): id is number => typeof id === 'number' && id > 0);

    const uniqueTmdbIds = [...new Set(allTmdbIds)];

    // Busca entries que batem pelo tmdbId direto (filmes) ou parentTmdbId (séries TV)
    const dbEntries = await prisma.entry.findMany({
      where: {
        OR: [
          { tmdbId:       { in: uniqueTmdbIds } },
          { parentTmdbId: { in: uniqueTmdbIds } },
        ],
      },
      select: {
        tmdbId:       true,
        parentTmdbId: true,
        seasonNumber: true,
        type:         true,
      },
    });

    // Set de tmdbIds que estão na lista (filmes: tmdbId direto; TV: parentTmdbId)
    const inListIds        = new Set<number>();
    const tmdbIdToDbTmdbId = new Map<number, number>();

    for (const e of dbEntries) {
      if (e.type === 'MOVIE') {
        inListIds.add(e.tmdbId);
        tmdbIdToDbTmdbId.set(e.tmdbId, e.tmdbId);
      } else if (e.type === 'TV_SEASON' && e.parentTmdbId) {
        inListIds.add(e.parentTmdbId);
        // Aponta para o tmdbId da 1ª temporada encontrada (para slug)
        if (!tmdbIdToDbTmdbId.has(e.parentTmdbId)) {
          tmdbIdToDbTmdbId.set(e.parentTmdbId, e.tmdbId);
        }
      }
    }

    // ── 4. Normaliza pessoa e calcula anos ativos ────────────────────────────
    const base = normalizePerson(person);
    base.yearsActive = formatYearsActive(cast, crew, person.deathday);

    // ── 5. Monta cards ───────────────────────────────────────────────────────
    return NextResponse.json({
      person: base,
      movies: toRichCards(cast, crew, 'movie', inListIds, tmdbIdToDbTmdbId),
      tv:     toRichCards(cast, crew, 'tv',    inListIds, tmdbIdToDbTmdbId),
    });

  } catch (e: any) {
    const status = e?.status === 404 ? 404 : 500;
    return NextResponse.json(
      {
        error:
          status === 404
            ? 'Person not found'
            : 'Failed to fetch data',
      },
      { status },
    );
  }
}