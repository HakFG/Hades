// src/lib/achievements.ts

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  howToUnlock: string; // Como desbloquear — exibido no tooltip
  icon: string;
  rarity: AchievementRarity;
  xpReward: number;
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
    howToUnlock: 'Marque 1 episódio como assistido.',
    icon: '🎬',
    rarity: 'common',
    xpReward: 50,
    trigger: { type: 'total_episodes', target: 1 },
  },
  {
    id: 'episodes_10',
    name: 'Aquecendo os Motores',
    description: '10 episódios assistidos',
    howToUnlock: 'Marque 10 episódios como assistidos.',
    icon: '📡',
    rarity: 'common',
    xpReward: 80,
    trigger: { type: 'total_episodes', target: 10 },
  },
  {
    id: 'episodes_50',
    name: 'Maratonista',
    description: '50 episódios assistidos',
    howToUnlock: 'Marque 50 episódios como assistidos.',
    icon: '📺',
    rarity: 'common',
    xpReward: 150,
    trigger: { type: 'total_episodes', target: 50 },
  },
  {
    id: 'episodes_100',
    name: 'Centenário',
    description: '100 episódios assistidos',
    howToUnlock: 'Marque 100 episódios como assistidos.',
    icon: '💯',
    rarity: 'rare',
    xpReward: 300,
    trigger: { type: 'total_episodes', target: 100 },
  },
  {
    id: 'episodes_250',
    name: 'Adepto do Sofá',
    description: '250 episódios assistidos',
    howToUnlock: 'Marque 250 episódios como assistidos.',
    icon: '🌙',
    rarity: 'rare',
    xpReward: 450,
    trigger: { type: 'total_episodes', target: 250 },
  },
  {
    id: 'episodes_500',
    name: 'Veterano do Sofá',
    description: '500 episódios assistidos',
    howToUnlock: 'Marque 500 episódios como assistidos.',
    icon: '🛋️',
    rarity: 'rare',
    xpReward: 600,
    trigger: { type: 'total_episodes', target: 500 },
  },
  {
    id: 'episodes_1000',
    name: 'Mil e Uma Telas',
    description: '1.000 episódios assistidos',
    howToUnlock: 'Marque 1.000 episódios como assistidos.',
    icon: '⚡',
    rarity: 'epic',
    xpReward: 1000,
    trigger: { type: 'total_episodes', target: 1000 },
  },
  {
    id: 'episodes_2000',
    name: 'Filho de Hypnos',
    description: '2.000 episódios assistidos',
    howToUnlock: 'Marque 2.000 episódios como assistidos.',
    icon: '😴',
    rarity: 'epic',
    xpReward: 2000,
    trigger: { type: 'total_episodes', target: 2000 },
  },
  {
    id: 'episodes_3000',
    name: 'Lenda dos Episódios',
    description: '3.000 episódios assistidos',
    howToUnlock: 'Marque 3.000 episódios como assistidos.',
    icon: '🏛️',
    rarity: 'legendary',
    xpReward: 3000,
    trigger: { type: 'total_episodes', target: 3000 },
  },
  {
    id: 'episodes_5000',
    name: 'Imortal da Maratona',
    description: '5.000 episódios assistidos',
    howToUnlock: 'Marque 5.000 episódios como assistidos. Você é uma lenda.',
    icon: '👑',
    rarity: 'legendary',
    xpReward: 5000,
    trigger: { type: 'total_episodes', target: 5000 },
  },

  // ── Séries ─────────────────────────────────────────────────────
  {
    id: 'series_1',
    name: 'Ponto de Partida',
    description: 'Primeira série adicionada ao catálogo',
    howToUnlock: 'Adicione 1 série ao seu catálogo.',
    icon: '🌱',
    rarity: 'common',
    xpReward: 50,
    trigger: { type: 'total_series', target: 1 },
  },
  {
    id: 'series_10',
    name: 'Cinéfilo em Formação',
    description: '10 séries no catálogo',
    howToUnlock: 'Adicione 10 séries ao seu catálogo.',
    icon: '📚',
    rarity: 'common',
    xpReward: 100,
    trigger: { type: 'total_series', target: 10 },
  },
  {
    id: 'series_25',
    name: 'Construtor de Catálogo',
    description: '25 séries no catálogo',
    howToUnlock: 'Adicione 25 séries ao seu catálogo.',
    icon: '🗃️',
    rarity: 'common',
    xpReward: 200,
    trigger: { type: 'total_series', target: 25 },
  },
  {
    id: 'series_50',
    name: 'Curador',
    description: '50 séries no catálogo',
    howToUnlock: 'Adicione 50 séries ao seu catálogo.',
    icon: '🎭',
    rarity: 'rare',
    xpReward: 300,
    trigger: { type: 'total_series', target: 50 },
  },
  {
    id: 'series_100',
    name: 'Arquivista',
    description: '100 séries no catálogo',
    howToUnlock: 'Adicione 100 séries ao seu catálogo.',
    icon: '🗂️',
    rarity: 'rare',
    xpReward: 500,
    trigger: { type: 'total_series', target: 100 },
  },
  {
    id: 'series_250',
    name: 'Guardião do Catálogo',
    description: '250 séries no catálogo',
    howToUnlock: 'Adicione 250 séries ao seu catálogo.',
    icon: '🏰',
    rarity: 'epic',
    xpReward: 1000,
    trigger: { type: 'total_series', target: 250 },
  },
  {
    id: 'series_500',
    name: 'Dominador do Backlog',
    description: '500 séries no catálogo',
    howToUnlock: 'Adicione 500 séries ao seu catálogo. O backlog não te domina.',
    icon: '🌌',
    rarity: 'legendary',
    xpReward: 3000,
    trigger: { type: 'total_series', target: 500 },
  },

  // ── Séries Completas ───────────────────────────────────────────
  {
    id: 'completed_1',
    name: 'Do Início ao Fim',
    description: 'Completou sua primeira série',
    howToUnlock: 'Marque todos os episódios de 1 série como assistidos.',
    icon: '🎯',
    rarity: 'common',
    xpReward: 100,
    trigger: { type: 'completed_series_count', target: 1 },
  },
  {
    id: 'completed_5',
    name: 'Completista',
    description: 'Completou 5 séries',
    howToUnlock: 'Marque todos os episódios de 5 séries diferentes.',
    icon: '✅',
    rarity: 'common',
    xpReward: 200,
    trigger: { type: 'completed_series_count', target: 5 },
  },
  {
    id: 'completed_10',
    name: 'Caçador de Finais',
    description: 'Completou 10 séries',
    howToUnlock: 'Marque todos os episódios de 10 séries diferentes.',
    icon: '🏹',
    rarity: 'rare',
    xpReward: 500,
    trigger: { type: 'completed_series_count', target: 10 },
  },
  {
    id: 'completed_25',
    name: 'Mestre das Temporadas',
    description: 'Completou 25 séries',
    howToUnlock: 'Marque todos os episódios de 25 séries diferentes.',
    icon: '🏆',
    rarity: 'epic',
    xpReward: 1000,
    trigger: { type: 'completed_series_count', target: 25 },
  },
  {
    id: 'completed_50',
    name: 'Devorador de Séries',
    description: 'Completou 50 séries',
    howToUnlock: 'Marque todos os episódios de 50 séries. Herói dos finais.',
    icon: '🐉',
    rarity: 'epic',
    xpReward: 2500,
    trigger: { type: 'completed_series_count', target: 50 },
  },
  {
    id: 'completed_100',
    name: 'Lorde da Watchlist',
    description: 'Completou 100 séries',
    howToUnlock: 'Marque todos os episódios de 100 séries. Lenda absoluta.',
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
    howToUnlock: 'Marque 1 filme como assistido.',
    icon: '🎞️',
    rarity: 'common',
    xpReward: 75,
    trigger: { type: 'total_movies', target: 1 },
  },
  {
    id: 'movies_5',
    name: 'Noite de Cinema',
    description: '5 filmes assistidos',
    howToUnlock: 'Marque 5 filmes como assistidos.',
    icon: '🍿',
    rarity: 'common',
    xpReward: 150,
    trigger: { type: 'total_movies', target: 5 },
  },
  {
    id: 'movies_10',
    name: 'Cinéfilo',
    description: '10 filmes assistidos',
    howToUnlock: 'Marque 10 filmes como assistidos.',
    icon: '🎥',
    rarity: 'rare',
    xpReward: 300,
    trigger: { type: 'total_movies', target: 10 },
  },
  {
    id: 'movies_25',
    name: 'Frequentador da Sala Escura',
    description: '25 filmes assistidos',
    howToUnlock: 'Marque 25 filmes como assistidos.',
    icon: '🎦',
    rarity: 'rare',
    xpReward: 600,
    trigger: { type: 'total_movies', target: 25 },
  },
  {
    id: 'movies_50',
    name: 'Crítico de Cinema',
    description: '50 filmes assistidos',
    howToUnlock: 'Marque 50 filmes como assistidos.',
    icon: '🌟',
    rarity: 'epic',
    xpReward: 1000,
    trigger: { type: 'total_movies', target: 50 },
  },
  {
    id: 'movies_100',
    name: 'Pantheon do Cinema',
    description: '100 filmes assistidos',
    howToUnlock: 'Marque 100 filmes como assistidos. Digno dos deuses.',
    icon: '🏛️',
    rarity: 'legendary',
    xpReward: 3000,
    trigger: { type: 'total_movies', target: 100 },
  },

  // ── Streak ─────────────────────────────────────────────────────
  {
    id: 'streak_3',
    name: 'Três Dias de Fogo',
    description: 'Streak de 3 dias',
    howToUnlock: 'Assista algo por 3 dias consecutivos.',
    icon: '🕯️',
    rarity: 'common',
    xpReward: 100,
    trigger: { type: 'streak_days', target: 3 },
  },
  {
    id: 'streak_7',
    name: 'Semana Completa',
    description: 'Streak de 7 dias',
    howToUnlock: 'Assista algo por 7 dias consecutivos.',
    icon: '🔥',
    rarity: 'common',
    xpReward: 200,
    trigger: { type: 'streak_days', target: 7 },
  },
  {
    id: 'streak_14',
    name: 'Duas Semanas em Chamas',
    description: 'Streak de 14 dias',
    howToUnlock: 'Assista algo por 14 dias consecutivos.',
    icon: '🌊',
    rarity: 'rare',
    xpReward: 400,
    trigger: { type: 'streak_days', target: 14 },
  },
  {
    id: 'streak_30',
    name: 'Ferro Incandescente',
    description: 'Streak de 30 dias',
    howToUnlock: 'Assista algo por 30 dias consecutivos. Um mês inteiro!',
    icon: '🌋',
    rarity: 'epic',
    xpReward: 800,
    trigger: { type: 'streak_days', target: 30 },
  },
  {
    id: 'streak_60',
    name: 'Tocha de Prometeu',
    description: 'Streak de 60 dias',
    howToUnlock: 'Assista algo por 60 dias consecutivos. Fogo que nunca apaga.',
    icon: '🔆',
    rarity: 'epic',
    xpReward: 1500,
    trigger: { type: 'streak_days', target: 60 },
  },
  {
    id: 'streak_100',
    name: 'Chama Eterna',
    description: 'Streak de 100 dias',
    howToUnlock: 'Assista algo por 100 dias consecutivos. Digno de Zeus.',
    icon: '☀️',
    rarity: 'legendary',
    xpReward: 3000,
    trigger: { type: 'streak_days', target: 100 },
  },
  {
    id: 'streak_365',
    name: 'Guardião do Olimpo',
    description: 'Streak de 365 dias — um ano inteiro',
    howToUnlock: 'Assista algo por 365 dias consecutivos. Imortalidade alcançada.',
    icon: '⚡',
    rarity: 'legendary',
    xpReward: 10000,
    trigger: { type: 'streak_days', target: 365 },
  },

  // ── Notas 10 ───────────────────────────────────────────────────
  {
    id: 'score10_first',
    name: 'Obra-Prima',
    description: 'Primeiro 10/10',
    howToUnlock: 'Avalie um título com nota 10.',
    icon: '💫',
    rarity: 'rare',
    xpReward: 250,
    trigger: { type: 'score_10_count', target: 1 },
  },
  {
    id: 'score10_five',
    name: 'Catálogo de Ouro',
    description: '5 títulos com nota 10',
    howToUnlock: 'Avalie 5 títulos diferentes com nota 10.',
    icon: '✨',
    rarity: 'rare',
    xpReward: 500,
    trigger: { type: 'score_10_count', target: 5 },
  },
  {
    id: 'score10_ten',
    name: 'Crítico Perfeito',
    description: '10 títulos com nota 10',
    howToUnlock: 'Avalie 10 títulos diferentes com nota 10.',
    icon: '🌠',
    rarity: 'epic',
    xpReward: 750,
    trigger: { type: 'score_10_count', target: 10 },
  },
  {
    id: 'score10_twentyfive',
    name: 'Oráculo do Gosto',
    description: '25 títulos com nota 10 — padrões elevados',
    howToUnlock: 'Avalie 25 títulos com nota 10. Você tem padrões divinos.',
    icon: '🔮',
    rarity: 'legendary',
    xpReward: 2000,
    trigger: { type: 'score_10_count', target: 25 },
  },

  // ── Level ──────────────────────────────────────────────────────
  {
    id: 'level_5',
    name: 'Aprendiz dos Deuses',
    description: 'Atingiu o nível 5',
    howToUnlock: 'Suba ao nível 5 acumulando XP.',
    icon: '🌿',
    rarity: 'common',
    xpReward: 200,
    trigger: { type: 'level_reach', target: 5 },
  },
  {
    id: 'level_10',
    name: 'Veterano',
    description: 'Atingiu o nível 10',
    howToUnlock: 'Suba ao nível 10 acumulando XP.',
    icon: '⚔️',
    rarity: 'rare',
    xpReward: 500,
    trigger: { type: 'level_reach', target: 10 },
  },
  {
    id: 'level_15',
    name: 'Herói da Tela',
    description: 'Atingiu o nível 15',
    howToUnlock: 'Suba ao nível 15 acumulando XP.',
    icon: '🛡️',
    rarity: 'rare',
    xpReward: 800,
    trigger: { type: 'level_reach', target: 15 },
  },
  {
    id: 'level_25',
    name: 'Ascendente',
    description: 'Atingiu o nível 25',
    howToUnlock: 'Suba ao nível 25 acumulando XP.',
    icon: '🌙',
    rarity: 'epic',
    xpReward: 1500,
    trigger: { type: 'level_reach', target: 25 },
  },
  {
    id: 'level_35',
    name: 'Semideus',
    description: 'Atingiu o nível 35',
    howToUnlock: 'Suba ao nível 35 acumulando XP. Sangue divino corre em suas veias.',
    icon: '🌌',
    rarity: 'epic',
    xpReward: 3000,
    trigger: { type: 'level_reach', target: 35 },
  },
  {
    id: 'level_50',
    name: 'Herdeiro de Hades',
    description: 'Atingiu o nível 50 — nível máximo',
    howToUnlock: 'Suba ao nível máximo (50). O Olimpo inclina a cabeça.',
    icon: '💀',
    rarity: 'legendary',
    xpReward: 5000,
    trigger: { type: 'level_reach', target: 50 },
  },

  // ── XP Total ───────────────────────────────────────────────────
  {
    id: 'xp_1000',
    name: 'Centelha Inicial',
    description: '1.000 XP acumulados',
    howToUnlock: 'Acumule 1.000 XP no total.',
    icon: '⚡',
    rarity: 'common',
    xpReward: 50,
    trigger: { type: 'total_xp', target: 1000 },
  },
  {
    id: 'xp_10000',
    name: 'Torrente de Poder',
    description: '10.000 XP acumulados',
    howToUnlock: 'Acumule 10.000 XP no total.',
    icon: '💥',
    rarity: 'rare',
    xpReward: 300,
    trigger: { type: 'total_xp', target: 10000 },
  },
  {
    id: 'xp_50000',
    name: 'Relâmpago de Zeus',
    description: '50.000 XP acumulados',
    howToUnlock: 'Acumule 50.000 XP no total. Poder dos deuses.',
    icon: '🌩️',
    rarity: 'epic',
    xpReward: 1500,
    trigger: { type: 'total_xp', target: 50000 },
  },
  {
    id: 'xp_100000',
    name: 'Filho do Olimpo',
    description: '100.000 XP acumulados',
    howToUnlock: 'Acumule 100.000 XP no total.',
    icon: '🏺',
    rarity: 'legendary',
    xpReward: 5000,
    trigger: { type: 'total_xp', target: 100000 },
  },

  // ── Favoritos ──────────────────────────────────────────────────
  {
    id: 'favorites_1',
    name: 'Primeiro Amor',
    description: 'Primeiro título favoritado',
    howToUnlock: 'Adicione 1 título aos seus favoritos.',
    icon: '💝',
    rarity: 'common',
    xpReward: 50,
    trigger: { type: 'favorites_count', target: 1 },
  },
  {
    id: 'favorites_10',
    name: 'Colecionador',
    description: '10 títulos favoritados',
    howToUnlock: 'Adicione 10 títulos aos seus favoritos.',
    icon: '❤️',
    rarity: 'common',
    xpReward: 100,
    trigger: { type: 'favorites_count', target: 10 },
  },
  {
    id: 'favorites_25',
    name: 'Curador do Coração',
    description: '25 títulos favoritados',
    howToUnlock: 'Adicione 25 títulos aos seus favoritos.',
    icon: '💓',
    rarity: 'rare',
    xpReward: 250,
    trigger: { type: 'favorites_count', target: 25 },
  },
  {
    id: 'favorites_50',
    name: 'Devoto da Tela',
    description: '50 títulos favoritados',
    howToUnlock: 'Adicione 50 títulos aos seus favoritos.',
    icon: '💖',
    rarity: 'rare',
    xpReward: 400,
    trigger: { type: 'favorites_count', target: 50 },
  },
  {
    id: 'favorites_100',
    name: 'Santuário Pessoal',
    description: '100 títulos favoritados',
    howToUnlock: 'Adicione 100 títulos aos favoritos. Um templo de memórias.',
    icon: '🏛️',
    rarity: 'epic',
    xpReward: 1000,
    trigger: { type: 'favorites_count', target: 100 },
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
  totalXP: number;
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
    if (trigger.type === 'total_xp' && input.totalXP >= trigger.target) earned = true;

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