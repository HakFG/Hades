import { extractTmdbPosterPath } from '@/lib/utils';

/** Capa personalizada (URL externa etc.): não sobrescrever com TMDB. */
export function isCustomNonTmdbPoster(imagePath?: string | null): boolean {
  if (!imagePath || typeof imagePath !== 'string') return false;
  const s = imagePath.trim();
  if (!s) return false;
  if (s.startsWith('data:image')) return true;
  if (s.includes('image.tmdb.org')) return false;
  if (extractTmdbPosterPath(s)) return false;
  if (s.startsWith('/')) return false;
  return /^https?:\/\//i.test(s);
}

/** Path TMDB canônico para comparação (ex. /abc.jpg). */
export function canonicalTmdbPosterRef(path?: string | null): string | null {
  if (!path) return null;
  const t = path.trim();
  if (!t) return null;
  return extractTmdbPosterPath(t) ?? (t.startsWith('/') ? t : null);
}

/**
 * Se o poster no TMDB mudou em relação ao banco, persiste em silêncio (sem UI).
 * Não altera capas customizadas (fora do TMDB).
 */
export async function silentPersistPosterIfChanged(args: {
  entryId: string;
  storedImagePath: string | null | undefined;
  tmdbPosterPath: string | null | undefined;
  onUpdated?: (imagePath: string | null) => void;
}): Promise<void> {
  const { entryId, storedImagePath, tmdbPosterPath, onUpdated } = args;
  if (!tmdbPosterPath || !tmdbPosterPath.trim()) return;
  if (isCustomNonTmdbPoster(storedImagePath)) return;

  const next = tmdbPosterPath.trim();
  const prev = canonicalTmdbPosterRef(storedImagePath);
  const nextCanon = canonicalTmdbPosterRef(next);
  if (prev === nextCanon) return;

  try {
    const res = await fetch(`/api/entries/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagePath: next }),
    });
    if (!res.ok) return;
    onUpdated?.(next);
  } catch {
    /* ignore — refresh silencioso */
  }
}
