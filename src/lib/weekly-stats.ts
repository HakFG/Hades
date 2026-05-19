import { prisma } from './prisma';
// Bug #15: Removido import { Prisma } from '@prisma/client' — não estava sendo usado

// Bug #26: Interface tipada para metadata de atividade — elimina `any`
interface ActivityMetadata {
  episodeCount?: number;
  label?: string;
  multiplier?: number;
  baseXP?: number;
  streakBonusXP?: number;
  [key: string]: unknown;
}

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

// Fallback para quando o banco estiver indisponível
const EMPTY_STATS: WeeklyStats = {
  episodes: { current: 0, previous: 0, trend: 0 },
  movies:   { current: 0, previous: 0, trend: 0 },
  hours:    { current: 0, previous: 0, trend: 0 },
  xp:       { current: 0, previous: 0, trend: 0 },
};

function calculateTrend(current: number, previous: number): number {
  return current - previous;
}

export async function getWeeklyStats(userId: string = 'main'): Promise<WeeklyStats> {
  // Bug #8 (parcial): wrap em try-catch com fallback para evitar crash da home page
  try {
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

    // Bug #26: usa interface tipada em vez de `as any`
    const calculateMetrics = (logList: typeof logs) => {
      let episodes = 0;
      let movies = 0;
      let xp = 0;

      for (const log of logList) {
        xp += log.xpGained;

        if (log.action === 'complete_episode') {
          const meta = log.metadata as unknown as ActivityMetadata;
          const count = meta?.episodeCount ? Number(meta.episodeCount) : 1;
          episodes += count;
        } else if (log.action === 'complete_movie') {
          movies += 1;
        } else if (log.action === 'rewatch_episode') {
          const meta = log.metadata as unknown as ActivityMetadata;
          const count = meta?.episodeCount ? Number(meta.episodeCount) : 1;
          episodes += count;
        } else if (log.action === 'rewatch_title') {
          // Assume rewatch de filme para simplificar
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
  } catch (error) {
    console.error('[getWeeklyStats] Erro ao buscar estatísticas semanais:', error);
    // Bug #22 (parcial): retorna fallback em vez de propagar o erro
    return EMPTY_STATS;
  }
}
