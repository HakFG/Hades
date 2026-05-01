import { prisma } from '@/lib/prisma';

export type GoalType =
  | 'episodes'
  | 'series_completed'
  | 'movies_completed'
  | 'paused_cleared'
  | 'streak_days'
  | 'score_avg'
  | 'titles_genre'
  | 'custom';

export interface PersonalGoal {
  id: string;
  userId: string;
  title: string;
  type: GoalType;
  target: number;
  current: number;
  unit: string;
  emoji: string;
  deadline?: Date | null;
  rewardXP: number;
  pinned: boolean;
  completed: boolean;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGoalInput {
  title: string;
  type: GoalType;
  target: number;
  unit?: string;
  emoji?: string;
  deadline?: string | null;
  rewardXP?: number;
  pinned?: boolean;
}

export interface UpdateGoalInput {
  title?: string;
  target?: number;
  unit?: string;
  emoji?: string;
  deadline?: string | null;
  rewardXP?: number;
  pinned?: boolean;
  current?: number;
}

// ─── Templates pré-definidos para o assistente de IA ──────────────────────────

export const GOAL_TEMPLATES: Array<{
  label: string;
  type: GoalType;
  emoji: string;
  unit: string;
  suggestedTargets: number[];
  description: string;
}> = [
  {
    label: 'Assistir episódios',
    type: 'episodes',
    emoji: '📺',
    unit: 'eps',
    suggestedTargets: [50, 100, 200, 500],
    description: 'Meta de episódios assistidos no total',
  },
  {
    label: 'Completar séries',
    type: 'series_completed',
    emoji: '✅',
    unit: 'séries',
    suggestedTargets: [3, 5, 10, 20],
    description: 'Número de séries zeradas',
  },
  {
    label: 'Completar filmes',
    type: 'movies_completed',
    emoji: '🎬',
    unit: 'filmes',
    suggestedTargets: [10, 25, 50, 100],
    description: 'Número de filmes assistidos',
  },
  {
    label: 'Zerar pausados',
    type: 'paused_cleared',
    emoji: '⏯️',
    unit: 'pausados',
    suggestedTargets: [1, 3, 5, 10],
    description: 'Tirar itens da lista de Paused',
  },
  {
    label: 'Manter streak',
    type: 'streak_days',
    emoji: '🔥',
    unit: 'dias',
    suggestedTargets: [7, 14, 30, 60, 100],
    description: 'Dias consecutivos de atividade',
  },
  {
    label: 'Score médio',
    type: 'score_avg',
    emoji: '⭐',
    unit: 'pts',
    suggestedTargets: [7, 7.5, 8, 8.5, 9],
    description: 'Média de notas em títulos avaliados',
  },
  {
    label: 'Gênero específico',
    type: 'titles_genre',
    emoji: '🎭',
    unit: 'títulos',
    suggestedTargets: [5, 10, 15, 20],
    description: 'Completar títulos de um gênero',
  },
  {
    label: 'Meta personalizada',
    type: 'custom',
    emoji: '🎯',
    unit: '',
    suggestedTargets: [],
    description: 'Define você mesmo',
  },
];

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getGoals(userId = 'main'): Promise<PersonalGoal[]> {
  const goals = await prisma.personalGoal.findMany({
    where: { userId },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
  });
  return goals as PersonalGoal[];
}

export async function createGoal(
  input: CreateGoalInput,
  userId = 'main'
): Promise<PersonalGoal> {
  const goal = await prisma.personalGoal.create({
    data: {
      userId,
      title: input.title,
      type: input.type,
      target: input.target,
      unit: input.unit ?? '',
      emoji: input.emoji ?? '🎯',
      deadline: input.deadline ? new Date(input.deadline) : null,
      rewardXP: input.rewardXP ?? 0,
      pinned: input.pinned ?? false,
    },
  });
  return goal as PersonalGoal;
}

export async function updateGoal(
  id: string,
  input: UpdateGoalInput
): Promise<PersonalGoal> {
  const goal = await prisma.personalGoal.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.target !== undefined && { target: input.target }),
      ...(input.unit !== undefined && { unit: input.unit }),
      ...(input.emoji !== undefined && { emoji: input.emoji }),
      ...(input.rewardXP !== undefined && { rewardXP: input.rewardXP }),
      ...(input.pinned !== undefined && { pinned: input.pinned }),
      ...(input.current !== undefined && { current: input.current }),
      ...(input.deadline !== undefined && {
        deadline: input.deadline ? new Date(input.deadline) : null,
      }),
    },
  });
  return goal as PersonalGoal;
}

export async function deleteGoal(id: string): Promise<void> {
  await prisma.personalGoal.delete({ where: { id } });
}

export async function markGoalComplete(id: string): Promise<PersonalGoal> {
  const goal = await prisma.personalGoal.update({
    where: { id },
    data: { completed: true, completedAt: new Date() },
  });
  return goal as PersonalGoal;
}

// ─── Auto-sync: calcula o `current` com base nos dados reais do banco ─────────

export async function syncGoalProgress(userId = 'main'): Promise<void> {
  const goals = await prisma.personalGoal.findMany({
    where: { userId, completed: false },
  });

  for (const goal of goals) {
    let current = goal.current;

    try {
      if (goal.type === 'episodes') {
        const result = await prisma.entry.aggregate({
          _sum: { progress: true },
          where: { type: 'TV_SEASON' },
        });
        current = result._sum.progress ?? 0;
      } else if (goal.type === 'series_completed') {
        current = await prisma.entry.count({
          where: { type: 'TV_SEASON', status: 'COMPLETED' },
        });
      } else if (goal.type === 'movies_completed') {
        current = await prisma.entry.count({
          where: { type: 'MOVIE', status: 'COMPLETED' },
        });
      } else if (goal.type === 'paused_cleared') {
        // Mede quantos saíram do PAUSED (total de não-paused no seu histórico)
        // Como não temos histórico de status, medimos como inversão: target - paused_count_atual
        const pausedCount = await prisma.entry.count({ where: { status: 'PAUSED' } });
        // current = quantos já foram tirados do paused desde criação da meta
        // Guardamos o baseline no `unit` field se necessário; por ora deixamos manual
        current = goal.current;
      } else if (goal.type === 'score_avg') {
        const result = await prisma.entry.aggregate({
          _avg: { score: true },
          where: { score: { gt: 0 } },
        });
        current = Math.round((result._avg.score ?? 0) * 10) / 10;
      } else if (goal.type === 'streak_days') {
        const streak = await prisma.streakData.findUnique({
          where: { userId: 'main' },
        });
        current = streak?.currentStreak ?? 0;
      }
      // Para 'titles_genre' e 'custom', o usuário atualiza manualmente

      // Verifica se completou
      const completed = current >= goal.target;

      await prisma.personalGoal.update({
        where: { id: goal.id },
        data: {
          current,
          ...(completed && !goal.completed
            ? { completed: true, completedAt: new Date() }
            : {}),
        },
      });
    } catch (err) {
      console.error(`[syncGoalProgress] Error syncing goal ${goal.id}:`, err);
    }
  }
}

// ─── Helpers de apresentação ──────────────────────────────────────────────────

export function goalProgressPercent(goal: PersonalGoal): number {
  if (goal.target <= 0) return 0;
  return Math.min(Math.round((goal.current / goal.target) * 100), 100);
}

export function goalDaysLeft(goal: PersonalGoal): number | null {
  if (!goal.deadline) return null;
  const diff = new Date(goal.deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}