import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const DEFAULT_CHALLENGE_USER_ID = 'main';

export type ChallengeCategory = 'daily' | 'weekly' | 'special';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';
export type ChallengeType =
  | 'watch_episodes'
  | 'rate_titles'
  | 'complete_series'
  | 'complete_movies'
  | 'genre_focused'
  | 'mixed_genres'
  | 'streak_days'
  | 'classic_titles'
  | 'notes_written'
  | 'favorite_titles';

export interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  goal: number;
  type: ChallengeType;
  reward: { xp: number; badge?: string };
  difficulty: ChallengeDifficulty;
  category: ChallengeCategory;
  metadata?: {
    genre?: string;
    genres?: string[];
    scoreRange?: [number, number];
    releaseBeforeYear?: number;
  };
}

export interface ChallengeWindow {
  category: ChallengeCategory;
  periodKey: string;
  startsAt: Date;
  expiresAt: Date;
}

export const DAILY_CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'daily_watcher',
    title: 'Assistidor Diario',
    description: 'Assista 2 episodios hoje.',
    goal: 2,
    type: 'watch_episodes',
    reward: { xp: 150 },
    difficulty: 'easy',
    category: 'daily',
  },
  {
    id: 'critic_day',
    title: 'Dia do Critico',
    description: 'Avalie 5 titulos com score 7 ou maior.',
    goal: 5,
    type: 'rate_titles',
    reward: { xp: 250 },
    difficulty: 'medium',
    category: 'daily',
    metadata: { scoreRange: [7, 10] },
  },
  {
    id: 'action_junkie',
    title: 'Viciado em Acao',
    description: 'Assista 3 episodios de series de acao.',
    goal: 3,
    type: 'genre_focused',
    reward: { xp: 220, badge: 'challenge_badge_action_enthusiast' },
    difficulty: 'medium',
    category: 'daily',
    metadata: { genre: 'Action' },
  },
  {
    id: 'drama_focus',
    title: 'Turno Dramatico',
    description: 'Assista 2 episodios ou filmes de drama.',
    goal: 2,
    type: 'genre_focused',
    reward: { xp: 200 },
    difficulty: 'easy',
    category: 'daily',
    metadata: { genre: 'Drama' },
  },
  {
    id: 'comedy_break',
    title: 'Pausa de Comedia',
    description: 'Assista 2 titulos de comedia.',
    goal: 2,
    type: 'genre_focused',
    reward: { xp: 180 },
    difficulty: 'easy',
    category: 'daily',
    metadata: { genre: 'Comedy' },
  },
  {
    id: 'score_polish',
    title: 'Notas em Dia',
    description: 'Avalie 3 titulos novos.',
    goal: 3,
    type: 'rate_titles',
    reward: { xp: 120 },
    difficulty: 'easy',
    category: 'daily',
  },
  {
    id: 'movie_night',
    title: 'Noite de Filme',
    description: 'Complete 1 filme.',
    goal: 1,
    type: 'complete_movies',
    reward: { xp: 180 },
    difficulty: 'medium',
    category: 'daily',
  },
  {
    id: 'high_score_hunter',
    title: 'Cacador de Notas Altas',
    description: 'Avalie 2 titulos com score 9 ou maior.',
    goal: 2,
    type: 'rate_titles',
    reward: { xp: 220 },
    difficulty: 'hard',
    category: 'daily',
    metadata: { scoreRange: [9, 10] },
  },
  {
    id: 'note_keeper',
    title: 'Memoria de Sessao',
    description: 'Escreva notas em 2 titulos.',
    goal: 2,
    type: 'notes_written',
    reward: { xp: 140 },
    difficulty: 'easy',
    category: 'daily',
  },
  {
    id: 'favorite_signal',
    title: 'Curadoria Rapida',
    description: 'Favorite 1 titulo que merece destaque.',
    goal: 1,
    type: 'favorite_titles',
    reward: { xp: 100 },
    difficulty: 'easy',
    category: 'daily',
  },
  {
    id: 'classic_watch',
    title: 'Classico do Dia',
    description: 'Complete 1 filme lancado antes de 2000.',
    goal: 1,
    type: 'classic_titles',
    reward: { xp: 260, badge: 'challenge_badge_classic_scout' },
    difficulty: 'hard',
    category: 'daily',
    metadata: { releaseBeforeYear: 2000 },
  },
  {
    id: 'three_episode_push',
    title: 'Empurrao de Temporada',
    description: 'Assista 3 episodios da sua lista.',
    goal: 3,
    type: 'watch_episodes',
    reward: { xp: 240 },
    difficulty: 'medium',
    category: 'daily',
  },
  {
    id: 'genre_streak',
    title: 'Streak de Generos',
    description: 'Assista 2 episodios de generos diferentes.',
    goal: 2,
    type: 'genre_focused',
    reward: { xp: 210 },
    difficulty: 'medium',
    category: 'daily',
    metadata: { genres: ['Action', 'Comedy', 'Drama'] },
  },
  {
    id: 'deep_dive_notes',
    title: 'Diario de Notas',
    description: 'Escreva notas em 3 titulos hoje.',
    goal: 3,
    type: 'notes_written',
    reward: { xp: 200 },
    difficulty: 'easy',
    category: 'daily',
  },
  {
    id: 'late_night_binge',
    title: 'Maratona Noturna',
    description: 'Assista 4 episodios durante hoje.',
    goal: 4,
    type: 'watch_episodes',
    reward: { xp: 280 },
    difficulty: 'hard',
    category: 'daily',
  },
  {
    id: 'quick_favorite',
    title: 'Favorito Instantaneo',
    description: 'Favoritar 2 titulos que merecem lugar.',
    goal: 2,
    type: 'favorite_titles',
    reward: { xp: 130 },
    difficulty: 'easy',
    category: 'daily',
  },
  {
    id: 'score_sharpener',
    title: 'Avaliacoes Afiadas',
    description: 'Avalie 3 titulos com nota 8 ou superior.',
    goal: 3,
    type: 'rate_titles',
    reward: { xp: 230 },
    difficulty: 'medium',
    category: 'daily',
    metadata: { scoreRange: [8, 10] },
  },
];

export const WEEKLY_CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'weekly_complete_series',
    title: 'Fechar Temporada',
    description: 'Complete uma temporada ou serie durante a semana.',
    goal: 1,
    type: 'complete_series',
    reward: { xp: 650, badge: 'challenge_badge_weekly_closer' },
    difficulty: 'hard',
    category: 'weekly',
  },
  {
    id: 'weekly_critic_run',
    title: 'Semana do Critico',
    description: 'Avalie 10 titulos com score medio forte.',
    goal: 10,
    type: 'rate_titles',
    reward: { xp: 500 },
    difficulty: 'medium',
    category: 'weekly',
    metadata: { scoreRange: [8, 10] },
  },
  {
    id: 'weekly_streak_guardian',
    title: 'Guardiao da Chama',
    description: 'Mantenha streak de 7 dias.',
    goal: 7,
    type: 'streak_days',
    reward: { xp: 700, badge: 'challenge_badge_streak_guardian' },
    difficulty: 'hard',
    category: 'weekly',
  },
  {
    id: 'weekly_genre_mixer',
    title: 'Mistura de Generos',
    description: 'Assista titulos de 3 generos diferentes.',
    goal: 3,
    type: 'mixed_genres',
    reward: { xp: 520 },
    difficulty: 'medium',
    category: 'weekly',
  },
  {
    id: 'weekly_movie_double',
    title: 'Sessao Dupla',
    description: 'Complete 2 filmes nesta semana.',
    goal: 2,
    type: 'complete_movies',
    reward: { xp: 480 },
    difficulty: 'medium',
    category: 'weekly',
  },
  {
    id: 'weekend_marathon',
    title: 'Maratona de Final de Semana',
    description: 'Assista 6 episodios ate domingo.',
    goal: 6,
    type: 'watch_episodes',
    reward: { xp: 620 },
    difficulty: 'hard',
    category: 'weekly',
  },
  {
    id: 'genre_explorer',
    title: 'Explorador de Generos',
    description: 'Assista titulos de 4 generos diferentes.',
    goal: 4,
    type: 'mixed_genres',
    reward: { xp: 520 },
    difficulty: 'hard',
    category: 'weekly',
  },
  {
    id: 'completion_sprint',
    title: 'Sprint de Conclusao',
    description: 'Complete 2 titulos antes da semana acabar.',
    goal: 2,
    type: 'complete_series',
    reward: { xp: 640 },
    difficulty: 'hard',
    category: 'weekly',
  },
  {
    id: 'score_mentor',
    title: 'Mentor de Notas',
    description: 'Avalie 15 titulos com nota media elevada.',
    goal: 15,
    type: 'rate_titles',
    reward: { xp: 550 },
    difficulty: 'legendary',
    category: 'weekly',
    metadata: { scoreRange: [8, 10] },
  },
];

export const SPECIAL_CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'summer_marathon',
    title: 'Maratona de Verao',
    description: 'Assista 100 episodios em 30 dias.',
    goal: 100,
    type: 'watch_episodes',
    reward: { xp: 3000, badge: 'challenge_badge_summer_marathon' },
    difficulty: 'legendary',
    category: 'special',
  },
  {
    id: 'genre_collector',
    title: 'Colecione Generos',
    description: 'Assista 8 generos diferentes no mes.',
    goal: 8,
    type: 'mixed_genres',
    reward: { xp: 2200, badge: 'challenge_badge_genre_collector' },
    difficulty: 'legendary',
    category: 'special',
  },
  {
    id: 'classic_festival',
    title: 'Festival de Classicos',
    description: 'Complete 5 filmes lancados antes de 2000.',
    goal: 5,
    type: 'classic_titles',
    reward: { xp: 1600, badge: 'challenge_badge_classic_festival' },
    difficulty: 'hard',
    category: 'special',
    metadata: { releaseBeforeYear: 2000 },
  },
  {
    id: 'monthly_closer',
    title: 'Mes de Conclusoes',
    description: 'Complete 4 filmes ou temporadas no mes.',
    goal: 4,
    type: 'complete_series',
    reward: { xp: 1800 },
    difficulty: 'hard',
    category: 'special',
  },
  {
    id: 'platinum_collector',
    title: 'Colecionador Platinum',
    description: 'Assista 20 episodios em 30 dias.',
    goal: 20,
    type: 'watch_episodes',
    reward: { xp: 3200, badge: 'challenge_badge_platinum_collector' },
    difficulty: 'legendary',
    category: 'special',
  },
  {
    id: 'genre_master',
    title: 'Mestre de Generos',
    description: 'Complete titulos em 10 generos diferentes.',
    goal: 10,
    type: 'mixed_genres',
    reward: { xp: 2800, badge: 'challenge_badge_genre_master' },
    difficulty: 'legendary',
    category: 'special',
  },
  {
    id: 'score_perfectionist',
    title: 'Perfeccionista de Notas',
    description: 'Avalie 15 titulos com nota 8 ou mais.',
    goal: 15,
    type: 'rate_titles',
    reward: { xp: 2450 },
    difficulty: 'hard',
    category: 'special',
    metadata: { scoreRange: [8, 10] },
  },
  {
    id: 'movie_marathon',
    title: 'Maratona Cinematografica',
    description: 'Complete 8 filmes neste mes.',
    goal: 8,
    type: 'complete_movies',
    reward: { xp: 2800 },
    difficulty: 'hard',
    category: 'special',
  },
];

export const CHALLENGE_POOLS: Record<ChallengeCategory, ChallengeDefinition[]> = {
  daily: DAILY_CHALLENGES,
  weekly: WEEKLY_CHALLENGES,
  special: SPECIAL_CHALLENGES,
};

const ACTIVE_COUNTS: Record<ChallengeCategory, number> = {
  daily: 4,
  weekly: 3,
  special: 2,
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function dateKey(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function hash(input: string) {
  let value = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function deterministicPick(pool: ChallengeDefinition[], seed: string, count: number, excluded = new Set<string>()) {
  return [...pool]
    .filter((challenge) => !excluded.has(challenge.id))
    .sort((a, b) => hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`))
    .slice(0, count);
}

export function getChallengeWindow(category: ChallengeCategory, now = new Date()): ChallengeWindow {
  if (category === 'daily') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 3, 0, 0, 0));
    if (now < start) start.setUTCDate(start.getUTCDate() - 1);
    return {
      category,
      periodKey: `daily:${dateKey(start)}`,
      startsAt: start,
      expiresAt: addDays(start, 1),
    };
  }

  if (category === 'weekly') {
    const day = now.getUTCDay() || 7;
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 3, 0, 0, 0));
    start.setUTCDate(start.getUTCDate() - (day - 1));
    if (now < start) start.setUTCDate(start.getUTCDate() - 7);
    return {
      category,
      periodKey: `weekly:${dateKey(start)}`,
      startsAt: start,
      expiresAt: addDays(start, 7),
    };
  }

  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 3, 0, 0, 0));
  if (now < start) start.setUTCMonth(start.getUTCMonth() - 1);
  const expiresAt = new Date(start);
  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 1);
  return {
    category,
    periodKey: `special:${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}`,
    startsAt: start,
    expiresAt,
  };
}

function challengeCreateData(userId: string, challenge: ChallengeDefinition, window: ChallengeWindow) {
  return {
    userId,
    challengeId: challenge.id,
    periodKey: window.periodKey,
    category: challenge.category,
    title: challenge.title,
    description: challenge.description,
    type: challenge.type,
    difficulty: challenge.difficulty,
    goal: challenge.goal,
    rewardXP: challenge.reward.xp,
    rewardBadge: challenge.reward.badge ?? null,
    metadata: (challenge.metadata ?? {}) as Prisma.InputJsonObject,
    progressData: {} as Prisma.InputJsonObject,
    startsAt: window.startsAt,
    expiresAt: window.expiresAt,
  };
}

export async function ensureChallengesForUser(userId = DEFAULT_CHALLENGE_USER_ID, now = new Date()) {
  await Promise.all(
    (['daily', 'weekly', 'special'] as ChallengeCategory[]).map(async (category) => {
      const window = getChallengeWindow(category, now);
      const existing = await prisma.userChallenge.findMany({
        where: { userId, category, periodKey: window.periodKey },
        select: { challengeId: true },
      });

      const missing = Math.max(0, ACTIVE_COUNTS[category] - existing.length);
      if (missing === 0) return;

      const excluded = new Set(existing.map((item) => item.challengeId));
      const selected = deterministicPick(CHALLENGE_POOLS[category], window.periodKey, missing, excluded);
      if (selected.length === 0) return;

      await prisma.userChallenge.createMany({
        data: selected.map((challenge) => challengeCreateData(userId, challenge, window)),
        skipDuplicates: true,
      });
    }),
  );
}

export async function regenerateChallengesForUser(
  userId = DEFAULT_CHALLENGE_USER_ID,
  category: ChallengeCategory = 'daily',
  now = new Date(),
) {
  const window = getChallengeWindow(category, now);

  await prisma.userChallenge.deleteMany({
    where: {
      userId,
      category,
      periodKey: window.periodKey,
      completedAt: null,
    },
  });

  const completed = await prisma.challengeCompletion.findMany({
    where: { userId, category, periodKey: window.periodKey },
    select: { challengeId: true },
  });
  const selected = deterministicPick(
    CHALLENGE_POOLS[category],
    `${window.periodKey}:manual-reset`,
    ACTIVE_COUNTS[category],
    new Set(completed.map((item) => item.challengeId)),
  );

  await prisma.userChallenge.createMany({
    data: selected.map((challenge) => challengeCreateData(userId, challenge, window)),
    skipDuplicates: true,
  });
}

export function serializeChallenge(challenge: {
  id: string;
  challengeId: string;
  periodKey: string;
  category: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  goal: number;
  current: number;
  rewardXP: number;
  rewardBadge: string | null;
  metadata: Prisma.JsonValue;
  progressData: Prisma.JsonValue;
  startsAt: Date;
  expiresAt: Date;
  completedAt: Date | null;
  claimedAt: Date | null;
}) {
  const current = Math.min(challenge.current, challenge.goal);
  return {
    ...challenge,
    current,
    progressPercent: challenge.goal > 0 ? Math.round((current / challenge.goal) * 100) : 0,
    completed: Boolean(challenge.completedAt),
    startsAt: challenge.startsAt.toISOString(),
    expiresAt: challenge.expiresAt.toISOString(),
    completedAt: challenge.completedAt?.toISOString() ?? null,
    claimedAt: challenge.claimedAt?.toISOString() ?? null,
  };
}

export async function getChallengeDashboard(userId = DEFAULT_CHALLENGE_USER_ID) {
  await ensureChallengesForUser(userId);

  const now = new Date();
  const active = await prisma.userChallenge.findMany({
    where: { userId, expiresAt: { gt: now } },
    orderBy: [{ category: 'asc' }, { completedAt: 'asc' }, { rewardXP: 'desc' }],
  });

  const recentCompletions = await prisma.challengeCompletion.findMany({
    where: { userId },
    orderBy: { completedAt: 'desc' },
    take: 12,
  });

  return {
    generatedAt: now.toISOString(),
    pools: {
      daily: DAILY_CHALLENGES.length,
      weekly: WEEKLY_CHALLENGES.length,
      special: SPECIAL_CHALLENGES.length,
    },
    windows: {
      daily: getChallengeWindow('daily', now),
      weekly: getChallengeWindow('weekly', now),
      special: getChallengeWindow('special', now),
    },
    active: active.map(serializeChallenge),
    recentCompletions: recentCompletions.map((completion) => ({
      ...completion,
      completedAt: completion.completedAt.toISOString(),
    })),
  };
}
