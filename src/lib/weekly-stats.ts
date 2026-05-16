import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export interface WeeklyStats {
  episodes: {
    current: number;
    previous: number;
    trend: number;
  };
  movies: {
    current: number;
    previous: number;
    trend: number;
  };
  hours: {
    current: number;
    previous: number;
    trend: number;
  };
  xp: {
    current: number;
    previous: number;
    trend: number;
  };
}

function calculateTrend(current: number, previous: number): number {
  return current - previous;
}

export async function getWeeklyStats(userId: string = 'main'): Promise<WeeklyStats> {
  const now = new Date();
  
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - 7);
  
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(currentWeekStart.getDate() - 7);

  const logs = await prisma.gamificationActivityLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: previousWeekStart
      }
    }
  });

  const currentLogs = logs.filter(log => log.createdAt >= currentWeekStart);
  const previousLogs = logs.filter(log => log.createdAt < currentWeekStart);

  const calculateMetrics = (logList: typeof logs) => {
    let episodes = 0;
    let movies = 0;
    let xp = 0;

    for (const log of logList) {
      xp += log.xpGained;

      if (log.action === 'complete_episode') {
        const meta = log.metadata as any;
        const count = meta?.episodeCount ? Number(meta.episodeCount) : 1;
        episodes += count;
      } else if (log.action === 'complete_movie') {
        movies += 1;
      } else if (log.action === 'rewatch_episode') {
        const meta = log.metadata as any;
        const count = meta?.episodeCount ? Number(meta.episodeCount) : 1;
        episodes += count;
      } else if (log.action === 'rewatch_title') {
        // We assume it's a movie rewatch for simplicity, or we can't be sure
        movies += 1;
      }
    }

    // Estima horas: 45 min por episódio, 120 min por filme
    const hours = Math.round((episodes * 45 + movies * 120) / 60);

    return { episodes, movies, hours, xp };
  };

  const currentMetrics = calculateMetrics(currentLogs);
  const previousMetrics = calculateMetrics(previousLogs);

  return {
    episodes: {
      current: currentMetrics.episodes,
      previous: previousMetrics.episodes,
      trend: calculateTrend(currentMetrics.episodes, previousMetrics.episodes)
    },
    movies: {
      current: currentMetrics.movies,
      previous: previousMetrics.movies,
      trend: calculateTrend(currentMetrics.movies, previousMetrics.movies)
    },
    hours: {
      current: currentMetrics.hours,
      previous: previousMetrics.hours,
      trend: calculateTrend(currentMetrics.hours, previousMetrics.hours)
    },
    xp: {
      current: currentMetrics.xp,
      previous: previousMetrics.xp,
      trend: calculateTrend(currentMetrics.xp, previousMetrics.xp)
    }
  };
}
