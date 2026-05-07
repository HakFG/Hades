import { prisma } from '@/lib/prisma';

// ─── Tipos de meta com mitologia grega como inspiração ───────────────────────
// Cada tipo tem um "epitheto" grego associado para a UI

export type GoalType =
  | 'episodes'         // Maratona — Hermes (mensageiro veloz)
  | 'series_completed' // Conquista — Ares (vitória em batalha)
  | 'movies_completed' // Jornada — Odisseu (aventuras épicas)
  | 'paused_cleared'   // Purgatório — Caronte (atravessar o Estige)
  | 'streak_days'      // Perseverança — Sísifo (continuidade)
  | 'score_avg'        // Sabedoria — Atena (julgamento)
  | 'titles_genre'     // Especialista — Apolo (domínio de arte)
  | 'watchlist_cleared'// Destino — Moiras (o que foi tecido deve ser visto)
  | 'custom';          // Oráculo — Delfos (revelar o desconhecido)

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
  // Campos opcionais novos (podem não existir no schema antigo — use optional chaining)
  notes?: string | null;
  difficulty?: 'mortal' | 'heroi' | 'titan' | 'deus' | null;
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
  notes?: string | null;
  difficulty?: PersonalGoal['difficulty'];
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
  notes?: string | null;
  difficulty?: PersonalGoal['difficulty'];
}

// ─── Metadados míticos para cada tipo de meta ────────────────────────────────

export const GOAL_TYPE_MYTHS: Record<GoalType, {
  deity: string;
  epithet: string;
  flavorText: string;
  realm: string;
}> = {
  episodes: {
    deity: 'Hermes',
    epithet: 'Psicopompo',
    flavorText: 'Como Hermes guiando almas, cada episódio é uma travessia.',
    realm: 'Elísio',
  },
  series_completed: {
    deity: 'Ares',
    epithet: 'Enialio',
    flavorText: 'Na batalha do binge, apenas os que completam colhem glória.',
    realm: 'Campos dos Asfódelos',
  },
  movies_completed: {
    deity: 'Odisseu',
    epithet: 'Polimetis',
    flavorText: 'Como o herói de Ítaca, cada filme é uma odisseia completa.',
    realm: 'Elísio',
  },
  paused_cleared: {
    deity: 'Caronte',
    epithet: 'Barqueiro do Estige',
    flavorText: 'O que foi pausado aguarda na margem. Pague a travessia.',
    realm: 'Estige',
  },
  streak_days: {
    deity: 'Sísifo',
    epithet: 'Authos',
    flavorText: 'Diferente de Sísifo, você pode vencer — um dia de cada vez.',
    realm: 'Tártaro',
  },
  score_avg: {
    deity: 'Atena',
    epithet: 'Glaukopis',
    flavorText: 'A sabedoria de julgar eleva a média como Atena eleva Atenas.',
    realm: 'Olimpo',
  },
  titles_genre: {
    deity: 'Apolo',
    epithet: 'Musageta',
    flavorText: 'Apolo regia as Musas. Domine seu gênero como ele domina as artes.',
    realm: 'Delfos',
  },
  watchlist_cleared: {
    deity: 'Moiras',
    epithet: 'Tecedeiras do Destino',
    flavorText: 'Átropos cortou o fio — você deve assistir ao que foi destinado.',
    realm: 'Nix',
  },
  custom: {
    deity: 'Oráculo de Delfos',
    epithet: 'Pythia',
    flavorText: 'Gnôthi Seautón — conhece-te a ti mesmo e define teu próprio destino.',
    realm: 'Delfos',
  },
};

// ─── Dificuldades míticas com XP sugerido ────────────────────────────────────

export const DIFFICULTY_CONFIG = {
  mortal:  { label: 'Mortal',  emoji: '⚗️',  xpRange: [25, 100],   color: 'rgba(255,255,255,0.5)',   description: 'Alcançável em dias' },
  heroi:   { label: 'Herói',   emoji: '⚔️',  xpRange: [100, 250],  color: '#e8c46a',                 description: 'Digno de uma saga' },
  titan:   { label: 'Titã',    emoji: '🏛️',  xpRange: [250, 500],  color: '#e87848',                 description: 'Apenas os mais dedicados' },
  deus:    { label: 'Deus',    emoji: '⚡',  xpRange: [500, 1000], color: 'rgb(232,105,144)',        description: 'Feito dos lendários' },
} as const;

// ─── Templates pré-definidos ──────────────────────────────────────────────────

export const GOAL_TEMPLATES: Array<{
  label: string;
  type: GoalType;
  emoji: string;
  unit: string;
  suggestedTargets: number[];
  description: string;
  difficulty: PersonalGoal['difficulty'];
}> = [
  {
    label: 'Maratona de Episódios',
    type: 'episodes',
    emoji: '📺',
    unit: 'eps',
    suggestedTargets: [50, 100, 200, 500],
    description: 'Total de episódios assistidos',
    difficulty: 'heroi',
  },
  {
    label: 'Completar Séries',
    type: 'series_completed',
    emoji: '✅',
    unit: 'séries',
    suggestedTargets: [3, 5, 10, 20],
    description: 'Séries zeradas do início ao fim',
    difficulty: 'heroi',
  },
  {
    label: 'Maratona de Filmes',
    type: 'movies_completed',
    emoji: '🎬',
    unit: 'filmes',
    suggestedTargets: [10, 25, 50, 100],
    description: 'Filmes assistidos até o fim',
    difficulty: 'mortal',
  },
  {
    label: 'Zerar Pausados',
    type: 'paused_cleared',
    emoji: '⏯️',
    unit: 'pausados',
    suggestedTargets: [1, 3, 5, 10],
    description: 'Tirar títulos da lista Paused',
    difficulty: 'heroi',
  },
  {
    label: 'Manter Streak',
    type: 'streak_days',
    emoji: '🔥',
    unit: 'dias',
    suggestedTargets: [7, 14, 30, 60, 100],
    description: 'Dias consecutivos de atividade',
    difficulty: 'titan',
  },
  {
    label: 'Elevar Score Médio',
    type: 'score_avg',
    emoji: '⭐',
    unit: 'pts',
    suggestedTargets: [7, 7.5, 8, 8.5, 9],
    description: 'Média de notas em avaliações',
    difficulty: 'mortal',
  },
  {
    label: 'Dominar um Gênero',
    type: 'titles_genre',
    emoji: '🎭',
    unit: 'títulos',
    suggestedTargets: [5, 10, 15, 20],
    description: 'Completar títulos de um gênero específico',
    difficulty: 'heroi',
  },
  {
    label: 'Zerar Watchlist',
    type: 'watchlist_cleared',
    emoji: '📜',
    unit: 'títulos',
    suggestedTargets: [5, 10, 20, 50],
    description: 'Ver todos os títulos na lista de Planning',
    difficulty: 'titan',
  },
  {
    label: 'Meta Personalizada',
    type: 'custom',
    emoji: '🎯',
    unit: '',
    suggestedTargets: [],
    description: 'Defina seus próprios critérios',
    difficulty: 'mortal',
  },
];

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getGoals(userId = 'main'): Promise<PersonalGoal[]> {
  const goals = await prisma.personalGoal.findMany({
    where: { userId },
    orderBy: [{ pinned: 'desc' }, { completed: 'asc' }, { createdAt: 'desc' }],
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

// ─── Auto-sync: calcula `current` com base nos dados reais ───────────────────
// ⚠️ IMPORTANTE: Apenas SINCRONIZA o progresso, NÃO marca como completo automaticamente.
// Completion é APENAS por ação explícita do usuário (botão "Concluir").

export async function syncGoalProgress(userId = 'main'): Promise<void> {
  const goals = await prisma.personalGoal.findMany({
    where: { userId, completed: false },
  });

  for (const goal of goals) {
    let current = goal.current;

    try {
      switch (goal.type) {
        case 'episodes': {
          const result = await prisma.entry.aggregate({
            _sum: { progress: true },
            where: { type: 'TV_SEASON' },
          });
          current = result._sum.progress ?? 0;
          break;
        }
        case 'series_completed': {
          current = await prisma.entry.count({
            where: { type: 'TV_SEASON', status: 'COMPLETED' },
          });
          break;
        }
        case 'movies_completed': {
          current = await prisma.entry.count({
            where: { type: 'MOVIE', status: 'COMPLETED' },
          });
          break;
        }
        case 'watchlist_cleared': {
          // Conta quantos saíram de PLANNING (estão em outro status)
          const totalNonPlanning = await prisma.entry.count({
            where: { status: { not: 'PLANNING' } },
          });
          // Usamos como referência o target definido na meta vs o total já avançado
          current = Math.min(totalNonPlanning, goal.target);
          break;
        }
        case 'score_avg': {
          const result = await prisma.entry.aggregate({
            _avg: { score: true },
            where: { score: { gt: 0 } },
          });
          current = Math.round((result._avg.score ?? 0) * 10) / 10;
          break;
        }
        case 'streak_days': {
          const streak = await prisma.streakData.findUnique({
            where: { userId: 'main' },
          });
          current = streak?.currentStreak ?? 0;
          break;
        }
        case 'paused_cleared':
        case 'titles_genre':
        case 'custom':
        default:
          // Atualização manual pelo usuário
          break;
      }

      // ⚠️ Apenas atualiza `current`, NUNCA marca como completo automaticamente
      if (current !== goal.current) {
        await prisma.personalGoal.update({
          where: { id: goal.id },
          data: { current },
        });
      }
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

export function goalUrgencyLevel(goal: PersonalGoal): 'critical' | 'warning' | 'normal' | null {
  const days = goalDaysLeft(goal);
  if (days === null) return null;
  if (days === 0) return 'critical';
  if (days <= 3) return 'critical';
  if (days <= 7) return 'warning';
  return 'normal';
}

export function goalMythData(goal: PersonalGoal) {
  return GOAL_TYPE_MYTHS[goal.type] ?? GOAL_TYPE_MYTHS.custom;
}

// Retorna uma mensagem motivacional baseada no progresso
export function goalMotivationalMessage(pct: number): string {
  if (pct === 0) return 'A jornada começa com um único passo.';
  if (pct < 25) return 'Os deuses observam sua determinação.';
  if (pct < 50) return 'O Elísio está ao alcance dos persistentes.';
  if (pct < 75) return 'Hermes já anuncia sua chegada.';
  if (pct < 100) return 'As Moiras teceram seu destino glorioso!';
  return 'Glória eterna nos Campos Elíseos!';
}

// Calcula XP sugerido baseado na dificuldade e no tipo
export function suggestXPForGoal(
  type: GoalType,
  target: number,
  difficulty: PersonalGoal['difficulty'] = 'mortal'
): number {
  const base: Record<GoalType, number> = {
    episodes: 1,
    series_completed: 20,
    movies_completed: 10,
    paused_cleared: 25,
    streak_days: 5,
    score_avg: 50,
    titles_genre: 15,
    watchlist_cleared: 12,
    custom: 10,
  };
  const multipliers: Record<NonNullable<PersonalGoal['difficulty']>, number> = {
    mortal: 1,
    heroi: 2,
    titan: 4,
    deus: 8,
  };
  const mult = multipliers[difficulty ?? 'mortal'];
  const raw = Math.round(base[type] * target * mult);
  // Arredonda para o múltiplo de 25 mais próximo
  return Math.max(25, Math.round(raw / 25) * 25);
}