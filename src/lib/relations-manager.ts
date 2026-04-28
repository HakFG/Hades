/**
 * Sistema robusto de Relations
 * Gerencia relações customizadas do usuário com múltiplos fallbacks
 */

export interface SavedRelation {
  id: string;
  sourceEntryId: string;
  relationType: string;
  title: string;
  poster_path: string | null;
  kind: 'movie' | 'tv';
  year?: string;
  seasonNumber?: number;
  targetTmdbId: number;
  targetParentTmdbId?: number;
  targetSeasonNumber?: number;
  targetType?: string;
  order?: number;
  targetEntry?: {
    id: string;
    tmdbId: number;
    parentTmdbId?: number;
    seasonNumber?: number;
    type: string;
  };
}

/**
 * Busca todas as relações salvas para um título
 */
export async function fetchSavedRelations(
  sourceEntryId: string,
): Promise<SavedRelation[]> {
  try {
    const res = await fetch(
      `/api/relations?sourceId=${encodeURIComponent(sourceEntryId)}`,
    );
    if (!res.ok) {
      console.warn('[fetchSavedRelations] Erro:', res.statusText);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[fetchSavedRelations] Falha:', error);
    return [];
  }
}

/**
 * Salva uma relação no banco
 * Estratégia robusta: tenta múltiplas vezes, com retry automático
 */
export async function saveRelation(
  relation: Omit<SavedRelation, 'id'>,
  retries = 3,
): Promise<SavedRelation | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch('/api/relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relation),
      });

      if (res.ok) {
        return await res.json();
      }

      if (res.status === 404 || res.status === 400) {
        // Erros fatais, não retry
        const error = await res.json();
        console.error('[saveRelation] Erro fatal:', error);
        return null;
      }

      // Para erros 5xx ou timeout, tenta novamente
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    } catch (error) {
      console.warn(`[saveRelation] Tentativa ${attempt + 1}/${retries} falhou:`, error);
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  console.error('[saveRelation] Falha após', retries, 'tentativas');
  return null;
}

/**
 * Remove uma relação
 */
export async function removeRelation(
  sourceEntryId: string,
  targetTmdbId: number,
): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/relations?sourceId=${encodeURIComponent(sourceEntryId)}&targetTmdbId=${targetTmdbId}`,
      { method: 'DELETE' },
    );
    return res.ok;
  } catch (error) {
    console.error('[removeRelation] Falha:', error);
    return false;
  }
}

/**
 * Atualiza a ordem de uma relação
 */
export async function updateRelationOrder(
  sourceEntryId: string,
  targetTmdbId: number,
  newOrder: number,
): Promise<SavedRelation | null> {
  try {
    const res = await fetch(
      `/api/relations?sourceId=${encodeURIComponent(sourceEntryId)}&targetTmdbId=${targetTmdbId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      },
    );

    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error('[updateRelationOrder] Falha:', error);
  }

  return null;
}

/**
 * Combina relações salvas + auto-relações do TMDB
 * Com prioridade para as salvas
 */
export interface CombinedRelations {
  saved: SavedRelation[];
  auto: any[];
  all: (SavedRelation | any)[];
}

export async function getCombinedRelations(
  sourceEntryId: string,
  autoRelations: any[] = [],
): Promise<CombinedRelations> {
  const saved = await fetchSavedRelations(sourceEntryId);

  // Filtra auto-relações que já foram customizadas pelo usuário
  const savedTmdbIds = new Set(saved.map(r => r.targetTmdbId));
  const filteredAuto = autoRelations.filter(
    r => !savedTmdbIds.has(r.targetTmdbId),
  );

  // Combina: salvas primeiro (ordenadas), depois auto
  const all = [
    ...saved.sort((a, b) => (a.order || 0) - (b.order || 0)),
    ...filteredAuto,
  ];

  return { saved, auto: filteredAuto, all };
}

/**
 * Converte uma relação para formato de slug para URL
 */
export function relationToSlug(rel: SavedRelation): string {
  if (rel.kind === 'movie') {
    return `movie-${rel.targetTmdbId}`;
  }
  const sn = rel.targetSeasonNumber || rel.seasonNumber || 1;
  return `tv-${rel.targetParentTmdbId || rel.targetTmdbId}-s${sn}`;
}

/**
 * Valida se uma relação é válida
 */
export function isValidRelation(rel: any): rel is SavedRelation {
  return (
    rel &&
    typeof rel.sourceEntryId === 'string' &&
    typeof rel.relationType === 'string' &&
    typeof rel.title === 'string' &&
    typeof rel.kind === 'string' &&
    (rel.kind === 'movie' || rel.kind === 'tv') &&
    typeof rel.targetTmdbId === 'number'
  );
}
