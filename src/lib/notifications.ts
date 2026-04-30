// src/lib/notifications.ts
import { prisma } from './prisma';
import { unstable_cache } from 'next/cache';

export interface Notification {
  id: string;
  type: 'NEW_EPISODE' | 'PREMIERE' | 'RELATED_ADDED';
  title: string;
  message: string;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  createdAt: string;
  read: boolean;
  slug: string;
}

async function generateNotifications(): Promise<Notification[]> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) return [];

  const allNotifications: Notification[] = [];

  const entries = await prisma.entry.findMany();

  const buildSlug = (entry: any) => {
    if (entry.type === 'MOVIE') return `movie-${entry.tmdbId}`;
    return `tv-${entry.parentTmdbId ?? entry.tmdbId}-s${entry.seasonNumber ?? 1}`;
  };

  // 1. NEW_EPISODE
  const watchingTv = entries.filter(e => e.status === 'WATCHING' && e.type === 'TV_SEASON');
  for (const entry of watchingTv) {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${entry.parentTmdbId ?? entry.tmdbId}?api_key=${apiKey}`,
        { next: { revalidate: 3600 } }
      );
      const data = await res.json();
      const nextEp = data?.next_episode_to_air;
      if (nextEp && nextEp.air_date) {
        const airDate = new Date(nextEp.air_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (airDate <= today) {
          allNotifications.push({
            id: `ep-${entry.id}-${nextEp.episode_number}`,
            type: 'NEW_EPISODE',
            title: entry.title,
            message: `Episódio ${nextEp.episode_number} "${nextEp.name || ''}" já está disponível!`,
            tmdbId: entry.tmdbId,
            mediaType: 'tv',
            createdAt: airDate.toISOString(),
            read: false,
            slug: buildSlug(entry),
          });
        }
      }
    } catch (error) {
      console.error(`Erro ao buscar next_episode para ${entry.title}:`, error);
    }
  }

  // 2. PREMIERE
  const planningEntries = entries.filter(e => e.status === 'PLANNING');
  const todayStr = new Date().toISOString().slice(0, 10);
  for (const entry of planningEntries) {
    let releaseDate: string | null = null;
    if (entry.type === 'MOVIE') {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${entry.tmdbId}?api_key=${apiKey}`,
          { next: { revalidate: 7200 } }
        );
        const data = await res.json();
        releaseDate = data.release_date;
      } catch {}
    } else {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/tv/${entry.parentTmdbId ?? entry.tmdbId}?api_key=${apiKey}`,
          { next: { revalidate: 7200 } }
        );
        const data = await res.json();
        releaseDate = data.first_air_date;
      } catch {}
    }
    if (releaseDate === todayStr) {
      allNotifications.push({
        id: `premiere-${entry.id}`,
        type: 'PREMIERE',
        title: entry.title,
        message: `Estreou hoje!`,
        tmdbId: entry.tmdbId,
        mediaType: entry.type === 'MOVIE' ? 'movie' : 'tv',
        createdAt: new Date().toISOString(),
        read: false,
        slug: buildSlug(entry),
      });
    }
  }

  // 3. RELATED_ADDED (otimizado)
  const userGenreIds = new Set<number>();
  for (const entry of entries) {
    if (entry.genres) {
      try {
        const parsed = JSON.parse(entry.genres);
        parsed.forEach((g: number) => userGenreIds.add(g));
      } catch {}
    }
  }

  if (userGenreIds.size > 0) {
    const [movieChanges, tvChanges] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/changes?api_key=${apiKey}&page=1`, { next: { revalidate: 7200 } })
        .then(r => r.json()).catch(() => ({ results: [] })),
      fetch(`https://api.themoviedb.org/3/tv/changes?api_key=${apiKey}&page=1`, { next: { revalidate: 7200 } })
        .then(r => r.json()).catch(() => ({ results: [] })),
    ]);

    const userTmdbIds = new Set(entries.map(e => e.tmdbId));
    const changedIds = [
      ...(movieChanges.results || []).map((c: any) => ({ id: c.id, type: 'movie' as const })),
      ...(tvChanges.results || []).map((c: any) => ({ id: c.id, type: 'tv' as const }))
    ].filter(c => !userTmdbIds.has(c.id)).slice(0, 5);

    for (const changed of changedIds) {
      try {
        const detailsUrl = changed.type === 'movie'
          ? `https://api.themoviedb.org/3/movie/${changed.id}?api_key=${apiKey}`
          : `https://api.themoviedb.org/3/tv/${changed.id}?api_key=${apiKey}`;
        const details = await fetch(detailsUrl, { next: { revalidate: 86400 } }).then(r => r.json());
        if (!details || details.status_code) continue;

        const detailsGenres = (details.genres || []).map((g: any) => g.id);
        const hasCommonGenre = detailsGenres.some((g: number) => userGenreIds.has(g));

        if (hasCommonGenre) {
          const title = details.title || details.name;
          const slug = changed.type === 'movie' ? `movie-${changed.id}` : `tv-${changed.id}-s1`;
          allNotifications.push({
            id: `related-${changed.type}-${changed.id}`,
            type: 'RELATED_ADDED',
            title: title,
            message: `Título relacionado recém-adicionado ao catálogo!`,
            tmdbId: changed.id,
            mediaType: changed.type,
            createdAt: new Date().toISOString(),
            read: false,
            slug,
          });
        }
      } catch {}
    }
  }

  const unique = Array.from(new Map(allNotifications.map(n => [n.id, n])).values());
  unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return unique.slice(0, 50);
}

// Cache nativo do Next.js - 30 minutos
export const getNotifications = unstable_cache(
  async () => generateNotifications(),
  ['notifications'],
  { revalidate: 1800 }
);