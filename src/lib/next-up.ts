// src/lib/next-up.ts
import { prisma } from './prisma';

export interface NextUpItem {
  id: string;
  title: string;
  slug: string;
  type: 'MOVIE' | 'TV_SEASON';
  posterPath: string | null;
  nextEpisodeNumber?: number;
  totalEpisodes?: number;
  currentProgress?: number;
  reason: 'next_episode' | 'quick_movie' | 'almost_finished' | 'paused_resume';
  priority: 1 | 2 | 3; // 1 = alta, 2 = média, 3 = baixa
  score?: number;
  daysStalled?: number;
  urgencyScore?: number; // 0-100, quanto mais urgente maior
}

export interface NextUpFilters {
  type?: 'MOVIE' | 'TV_SEASON' | 'ALL';
  reason?: 'next_episode' | 'quick_movie' | 'almost_finished' | 'paused_resume' | 'ALL';
  minPriority?: 1 | 2 | 3; // mostrar prioridades >= deste valor
  sortBy?: 'urgency' | 'priority' | 'recent' | 'progress';
}

/**
 * Calcula um score de urgência baseado em:
 * - Tempo desde última atualização
 * - Progresso (quanto mais perto de terminar, mais urgente)
 * - Status (paused é mais urgente que watching)
 */
function calculateUrgency(item: any, daysStalled: number): number {
  let score = 0;

  // Paused = +30 (muito urgente retomar)
  if (item.status === 'PAUSED') {
    score += 30;
  }

  // Dias parado (cada 7 dias = +10, máximo 40)
  score += Math.min(40, Math.floor(daysStalled / 7) * 10);

  // Progresso (quase terminando = +20)
  if (item.type === 'TV_SEASON' && item.totalEpisodes) {
    const percent = (item.progress / item.totalEpisodes) * 100;
    if (percent > 80) score += 20;
    else if (percent > 50) score += 10;
  }

  // Score = +10
  if (item.score && item.score >= 8) score += 10;

  return Math.min(100, score);
}

export async function getNextUpItems(
  limit: number = 4,
  filters: NextUpFilters = {}
): Promise<NextUpItem[]> {
  const now = new Date();
  const items: NextUpItem[] = [];

  // 1. Séries WATCHING com progresso incompleto (próximo episódio)
  const watchingSeries = await prisma.entry.findMany({
    where: {
      status: 'WATCHING',
      type: 'TV_SEASON',
      totalEpisodes: { not: null },
    },
    orderBy: { updatedAt: 'asc' },
  });

  for (const series of watchingSeries) {
    if (items.length >= limit * 3) break;

    const currentProgress = series.progress ?? 0;
    const total = series.totalEpisodes ?? 0;

    if (currentProgress < total) {
      const progressPercent = (currentProgress / total) * 100;
      const daysStalled = Math.floor(
        (now.getTime() - series.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const urgency = calculateUrgency(series, daysStalled);

      items.push({
        id: series.id,
        title: series.title,
        slug: `tv-${series.parentTmdbId ?? series.tmdbId}-s${series.seasonNumber ?? 1}`,
        type: 'TV_SEASON',
        posterPath: series.imagePath,
        nextEpisodeNumber: currentProgress + 1,
        totalEpisodes: total,
        currentProgress,
        reason: progressPercent > 80 ? 'almost_finished' : 'next_episode',
        priority: progressPercent > 80 ? 1 : progressPercent > 50 ? 2 : 3,
        score: series.score ?? undefined,
        daysStalled,
        urgencyScore: urgency,
      });
    }
  }

  // 2. Séries PAUSED (retomar) - MUITO URGENTE
  const pausedSeries = await prisma.entry.findMany({
    where: {
      status: 'PAUSED',
      type: 'TV_SEASON',
      totalEpisodes: { not: null },
      progress: { gt: 0 },
    },
    orderBy: { updatedAt: 'asc' },
  });

  for (const series of pausedSeries) {
    if (items.length >= limit * 3) break;

    const currentProgress = series.progress ?? 0;
    const total = series.totalEpisodes ?? 0;

    if (currentProgress < total) {
      const daysStalled = Math.floor(
        (now.getTime() - series.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const urgency = calculateUrgency(series, daysStalled);

      items.push({
        id: series.id,
        title: series.title,
        slug: `tv-${series.parentTmdbId ?? series.tmdbId}-s${series.seasonNumber ?? 1}`,
        type: 'TV_SEASON',
        posterPath: series.imagePath,
        nextEpisodeNumber: currentProgress + 1,
        totalEpisodes: total,
        currentProgress,
        reason: 'paused_resume',
        priority: 1, // sempre alta prioridade
        score: series.score ?? undefined,
        daysStalled,
        urgencyScore: urgency,
      });
    }
  }

  // 3. Filmes em PLANNING (mais antigos primeiro)
  const movies = await prisma.entry.findMany({
    where: {
      status: 'PLANNING',
      type: 'MOVIE',
    },
    orderBy: { createdAt: 'asc' },
  });

  for (const movie of movies) {
    if (items.length >= limit * 3) break;

    const daysStalled = Math.floor(
      (now.getTime() - movie.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const urgency = calculateUrgency(movie, daysStalled);

    items.push({
      id: movie.id,
      title: movie.title,
      slug: `movie-${movie.tmdbId}`,
      type: 'MOVIE',
      posterPath: movie.imagePath,
      reason: 'quick_movie',
      priority: 3,
      score: movie.score ?? undefined,
      daysStalled,
      urgencyScore: urgency,
    });
  }

  // 4. Filmes WATCHING
  const watchingMovies = await prisma.entry.findMany({
    where: {
      status: 'WATCHING',
      type: 'MOVIE',
    },
    orderBy: { updatedAt: 'asc' },
  });

  for (const movie of watchingMovies) {
    if (items.length >= limit * 3) break;

    const daysStalled = Math.floor(
      (now.getTime() - movie.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const urgency = calculateUrgency(movie, daysStalled);

    items.push({
      id: movie.id,
      title: movie.title,
      slug: `movie-${movie.tmdbId}`,
      type: 'MOVIE',
      posterPath: movie.imagePath,
      reason: 'quick_movie',
      priority: 2,
      score: movie.score ?? undefined,
      daysStalled,
      urgencyScore: urgency,
    });
  }

  // Aplicar filtros
  let filtered = items;

  if (filters.type && filters.type !== 'ALL') {
    filtered = filtered.filter(item => item.type === filters.type);
  }

  if (filters.reason && filters.reason !== 'ALL') {
    filtered = filtered.filter(item => item.reason === filters.reason);
  }

  if (filters.minPriority) {
    filtered = filtered.filter(item => item.priority <= filters.minPriority!);
  }

  // Ordenar conforme filtro ou por padrão
  const sortBy = filters.sortBy || 'urgency';

  if (sortBy === 'urgency') {
    filtered.sort((a, b) => (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0));
  } else if (sortBy === 'priority') {
    filtered.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0);
    });
  } else if (sortBy === 'recent') {
    filtered.sort((a, b) => (a.daysStalled ?? 0) - (b.daysStalled ?? 0));
  } else if (sortBy === 'progress') {
    filtered.sort((a, b) => {
      const aProgress = a.currentProgress ?? 0;
      const bProgress = b.currentProgress ?? 0;
      const aTotal = a.totalEpisodes ?? 1;
      const bTotal = b.totalEpisodes ?? 1;
      return (bProgress / bTotal) - (aProgress / aTotal);
    });
  }

  // Retorna apenas o limite, tentando diversificar: máximo 2 da mesma categoria
  const finalItems: NextUpItem[] = [];
  const reasonCount = new Map<string, number>();

  for (const item of filtered) {
    const count = reasonCount.get(item.reason) || 0;
    if (count < 2) {
      finalItems.push(item);
      reasonCount.set(item.reason, count + 1);
    }
    if (finalItems.length >= limit) break;
  }

  return finalItems;
}