// src/lib/achievements.ts

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  xpReward: number;
  // O que dispara a conquista
  trigger:
    | { type: 'total_episodes'; target: number }
    | { type: 'total_series'; target: number }
    | { type: 'total_movies'; target: number }
    | { type: 'streak_days'; target: number }
    | { type: 'level_reach'; target: number }
    | { type: 'score_10_count'; target: number }
    | { type: 'total_xp'; target: number }
    | { type: 'favorites_count'; target: number }
    | { type: 'completed_series_count'; target: number };
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Episódios ──────────────────────────────────────────────────
  {
    id: 'first_episode',
    name: 'Primeira Sessão',
    description: 'Assistiu ao primeiro episódio',
    icon: '🎬',
    rarity: 'common',
    xpReward: 50,
    trigger: { type: 'total_episodes', target: 1 },
  },
  {
    id: 'episodes_50',
    name: 'Maratonista',
    description: '50 episódios assistidos',
    icon: '📺',
    rarity: 'common',
    xpReward: 150,
    trigger: { type: 'total_episodes', target: 50 },
  },
  {
    id: 'episodes_100',
    name: 'Centenário',
    description: '100 episódios assistidos',
    icon: '💯',
    rarity: 'rare',
    xpReward: 300,
    trigger: { type: 'total_episodes', target: 100 },
  },
  {
    id: 'episodes_500',
    name: 'Veterano do Sofá',
    description: '500 episódios assistidos',
    icon: '🛋️',
    rarity: 'rare',
    xpReward: 600,
    trigger: { type: 'total_episodes', target: 500 },
  },
  {
    id: 'episodes_1000',
    name: 'Mil e Uma Telas',
    description: '1.000 episódios assistidos',
    icon: '⚡',
    rarity: 'epic',
    xpReward: 1000,
    trigger: { type: 'total_episodes', target: 1000 },
  },
  {
    id: 'episodes_3000',
    name: 'Lenda dos Episódios',
    description: '3.000 episódios assistidos',
    icon: '🏛️',
    rarity: 'legendary',
    xpReward: 3000,
    trigger: { type: 'total_episodes', target: 3000 },
  },
  {
    id: 'episodes_5000',
    name: 'Imortal da Maratona',
    description: '5.000 episódios assistidos',
    icon: '👑',
    rarity: 'legendary',
    xpReward: 5000,
    trigger: { type: 'total_episodes', target: 5000 },
  },

  // ── Séries ─────────────────────────────────────────────────────
  {
    id: 'series_10',
    name: 'Cinéfilo em Formação',
    description: '10 séries no catálogo',
    icon: '📚',
    rarity: 'common',
    xpReward: 100,
    trigger: { type: 'total_series', target: 10 },
  },
  {
    id: 'series_50',
    name: 'Curador',
    description: '50 séries no catálogo',
    icon: '🎭',
    rarity: 'rare',
    xpReward: 300,
    trigger: { type: 'total_series', target: 50 },
  },
  {
    id: 'series_100',
    name: 'Arquivista',
    description: '100 séries no catálogo',
    icon: '🗂️',
    rarity: 'rare',
    xpReward: 500,
    trigger: { type: 'total_series', target: 100 },
  },
  {
    id: 'series_250',
    name: 'Guardião do Catálogo',
    description: '250 séries no catálogo',
    icon: '🏰',
    rarity: 'epic',
    xpReward: 1000,
    trigger: { type: 'total_series', target: 250 },
  },
  {
    id: 'series_500',
    name: 'Dominador do Backlog',
    description: '500 séries no catálogo',
    icon: '🌌',
    rarity: 'legendary',
    xpReward: 3000,
    trigger: { type: 'total_series', target: 500 },
  },

  // ── Séries Completas ───────────────────────────────────────────
  {
    id: 'completed_5',
    name: 'Completista',
    description: 'Completou 5 séries',
    icon: '✅',
    rarity: 'common',
    xpReward: 200,
    trigger: { type: 'completed_series_count', target: 5 },
  },
  {
    id: 'completed_25',
    name: 'Mestre das Temporadas',
    description: 'Completou 25 séries',
    icon: '🏆',
    rarity: 'epic',
    xpReward: 1000,
    trigger: { type: 'completed_series_count', target: 25 },
  },
  {
    id: 'completed_100',
    name: 'Lorde da Watchlist',
    description: 'Completou 100 séries',
    icon: '💎',
    rarity: 'legendary',
    xpReward: 5000,
    trigger: { type: 'completed_series_count', target: 100 },
  },

  // ── Filmes ─────────────────────────────────────────────────────
  {
    id: 'first_movie',
    name: 'Primeiro Frame',
    description: 'Assistiu ao primeiro filme',
    icon: '🎞️',
    rarity: 'common',
    xpReward: 75,
    trigger: { type: 'total_movies', target: 1 },
  },
  {
    id: 'movies_10',
    name: 'Cinéfilo',
    description: '10 filmes assistidos',
    icon: '🎥',
    rarity: 'rare',
    xpReward: 300,
    trigger: { type: 'total_movies', target: 10 },
  },
  {
    id: 'movies_50',
    name: 'Crítico de Cinema',
    description: '50 filmes assistidos',
    icon: '🌟',
    rarity: 'epic',
    xpReward: 1000,
    trigger: { type: 'total_movies', target: 50 },
  },

  // ── Streak ─────────────────────────────────────────────────────
  {
    id: 'streak_7',
    name: 'Semana Completa',
    description: 'Streak de 7 dias',
    icon: '🔥',
    rarity: 'common',
    xpReward: 200,
    trigger: { type: 'streak_days', target: 7 },
  },
  {
    id: 'streak_30',
    name: 'Ferro Incandescente',
    description: 'Streak de 30 dias',
    icon: '🌋',
    rarity: 'epic',
    xpReward: 800,
    trigger: { type: 'streak_days', target: 30 },
  },
  {
    id: 'streak_100',
    name: 'Chama Eterna',
    description: 'Streak de 100 dias',
    icon: '☀️',
    rarity: 'legendary',
    xpReward: 3000,
    trigger: { type: 'streak_days', target: 100 },
  },

  // ── Notas 10 ───────────────────────────────────────────────────
  {
    id: 'score10_first',
    name: 'Obra-Prima',
    description: 'Primeiro 10/10',
    icon: '💫',
    rarity: 'rare',
    xpReward: 250,
    trigger: { type: 'score_10_count', target: 1 },
  },
  {
    id: 'score10_ten',
    name: 'Crítico Perfeito',
    description: '10 títulos com nota 10',
    icon: '🌠',
    rarity: 'epic',
    xpReward: 750,
    trigger: { type: 'score_10_count', target: 10 },
  },

  // ── Level ──────────────────────────────────────────────────────
  {
    id: 'level_10',
    name: 'Veterano',
    description: 'Atingiu o nível 10',
    icon: '⚔️',
    rarity: 'rare',
    xpReward: 500,
    trigger: { type: 'level_reach', target: 10 },
  },
  {
    id: 'level_25',
    name: 'Ascendente',
    description: 'Atingiu o nível 25',
    icon: '🌙',
    rarity: 'epic',
    xpReward: 1500,
    trigger: { type: 'level_reach', target: 25 },
  },
  {
    id: 'level_50',
    name: 'Herdeiro de Hades',
    description: 'Atingiu o nível 50',
    icon: '💀',
    rarity: 'legendary',
    xpReward: 5000,
    trigger: { type: 'level_reach', target: 50 },
  },

  // ── Favoritos ──────────────────────────────────────────────────
  {
    id: 'favorites_10',
    name: 'Colecionador',
    description: '10 títulos favoritados',
    icon: '❤️',
    rarity: 'common',
    xpReward: 100,
    trigger: { type: 'favorites_count', target: 10 },
  },
  {
    id: 'favorites_50',
    name: 'Devoto da Tela',
    description: '50 títulos favoritados',
    icon: '💖',
    rarity: 'rare',
    xpReward: 400,
    trigger: { type: 'favorites_count', target: 50 },
  },
];

// ── Checagem de quais achievements foram desbloqueados ─────────────────────────

export interface AchievementCheckInput {
  totalEpisodes: number;
  totalSeries: number;
  totalMovies: number;
  longestStreak: number;
  currentLevel: number;
  score10Count: number;
  favoritesCount: number;
  completedSeriesCount: number;
}

export function checkAchievements(
  input: AchievementCheckInput,
  alreadyUnlocked: string[],
): Achievement[] {
  const unlocked = new Set(alreadyUnlocked);
  const newOnes: Achievement[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (unlocked.has(ach.id)) continue;

    let earned = false;
    const { trigger } = ach;

    if (trigger.type === 'total_episodes' && input.totalEpisodes >= trigger.target) earned = true;
    if (trigger.type === 'total_series' && input.totalSeries >= trigger.target) earned = true;
    if (trigger.type === 'total_movies' && input.totalMovies >= trigger.target) earned = true;
    if (trigger.type === 'streak_days' && input.longestStreak >= trigger.target) earned = true;
    if (trigger.type === 'level_reach' && input.currentLevel >= trigger.target) earned = true;
    if (trigger.type === 'score_10_count' && input.score10Count >= trigger.target) earned = true;
    if (trigger.type === 'favorites_count' && input.favoritesCount >= trigger.target) earned = true;
    if (trigger.type === 'completed_series_count' && input.completedSeriesCount >= trigger.target) earned = true;
    if (trigger.type === 'total_xp' && (input as any).totalXP >= trigger.target) earned = true;

    if (earned) newOnes.push(ach);
  }

  return newOnes;
}

export const RARITY_COLOR: Record<AchievementRarity, string> = {
  common: '#a09898',
  rare: '#3db4f2',
  epic: '#9b59b6',
  legendary: '#c9973a',
};

export const RARITY_LABEL: Record<AchievementRarity, string> = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};