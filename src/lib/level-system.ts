export interface LevelThreshold {
  level: number;
  xpRequired: number;
  title: string;
  reward: string;
  xpMultiplier: number;
}

const LEVEL_TITLES = [
  'Novato', 'Aprendiz', 'Entusiasta', 'Cinefilo', 'Critico',
  'Maratonista', 'Curador', 'Analista', 'Veterano', 'Guru',
  'Guardiao do Catalogo', 'Explorador de Generos', 'Mestre das Temporadas', 'Arquivista', 'Lorde da Watchlist',
  'Forjador de Rotina', 'Especialista em Sagas', 'Sentinela do Sofa', 'Estrategista de Series', 'Lenda Viva',
  'Colecionador de Finais', 'Visionario', 'Oraculo da Nota', 'Mestre do Replay', 'Campeao da Sessao',
  'Devoto da Tela', 'Soberano dos Creditos', 'Imortal da Maratona', 'Cronista', 'Herdeiro de Hades',
  'Mestre dos Classicos', 'Dominador do Backlog', 'Alquimista de Generos', 'Cacador de Obras-Primas', 'Ascendente',
  'Estrategista Supremo', 'Vigilante Noturno', 'Arquimago do Cinema', 'Imperador da Temporada', 'Tita da Tela',
  'Mestre dos Universos', 'Regente da Critica', 'Conquistador de Epicos', 'Guardiao do Streak', 'Comandante da Watchlist',
  'Lord das Estreias', 'Patrono das Sagas', 'Executor de Metas', 'Campeao Eterno', 'Deus do Cinema',
  'Avatar do Underworld', 'Senhor dos Rankings', 'Diamante Rosa', 'Cronometrista', 'Paladino do Play',
  'Mestre do Ritmo', 'Arconte dos Filmes', 'Estrategista de Episodios', 'General da Maratona', 'Fenix da Sessao',
  'Soberano dos Generos', 'Professor da Nota 10', 'Guardiao dos Finais', 'Visionario do Catalogo', 'Imortal do Replay',
  'Tita das Metas', 'Curador Supremo', 'Lorde dos Achievements', 'Campeao do Ano', 'Mestre Celestial',
  'Oraculo Supremo', 'Estrela do Streak', 'Dominador Absoluto', 'Senhor das Recompensas', 'Cavaleiro Platinum',
  'Imperador Neon', 'Vencedor de Temporadas', 'Mestre da Colecao', 'Guardiao de Ouro', 'Lenda Ascendida',
  'Soberano Eterno', 'Cronista Divino', 'Arquiteto da Watchlist', 'Grande Mestre', 'Mito da Tela',
  'Coroa de Hades', 'Tita Imortal', 'Luz do Submundo', 'Avatar Lendario', 'Divindade do Catalogo',
  'Guardiao Final', 'Estrela Infinita', 'Mestre do Olimpo', 'Forca Primordial', 'Eterno Cinefilo',
  'Cosmos da Sessao', 'Supremo Completista', 'Deus das Maratonas', 'Oraculo Infinito', 'Hades Absoluto',
];

function nextLevelDelta(level: number): number {
  if (level <= 2) return 1000;
  if (level === 3) return 1500;
  if (level === 4) return 2000;
  if (level === 5) return 2500;
  if (level <= 10) return 2500 + (level - 5) * 900;
  if (level <= 20) return 7000 + (level - 10) * 2400;
  if (level <= 50) return 32000 + (level - 20) * 7600;
  return 260000 + (level - 50) * 18000;
}

function rewardForLevel(level: number): string {
  if (level === 1) return 'Sistema XP liberado';
  if (level % 25 === 0) return 'Tema premium e moldura lendaria';
  if (level % 10 === 0) return 'Novo conjunto de desafios';
  if (level % 5 === 0) return 'Moldura de avatar e badge especial';
  return 'Progresso de cosmetic e bonus passivo';
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = LEVEL_TITLES.reduce<LevelThreshold[]>((levels, title, index) => {
  const level = index + 1;
  const previous = levels[index - 1];
  const xpRequired = level === 1 ? 0 : previous.xpRequired + nextLevelDelta(level);
  const xpMultiplier = level > 10 ? Number((1 + (level - 10) * 0.02).toFixed(2)) : 1;

  levels.push({
    level,
    xpRequired,
    title,
    reward: rewardForLevel(level),
    xpMultiplier,
  });

  return levels;
}, []);

export const MAX_LEVEL = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].level;

export function getLevelFromXP(totalXP: number): LevelThreshold {
  const normalizedXP = Math.max(0, Math.floor(totalXP));
  let current = LEVEL_THRESHOLDS[0];

  for (const threshold of LEVEL_THRESHOLDS) {
    if (normalizedXP >= threshold.xpRequired) {
      current = threshold;
    } else {
      break;
    }
  }

  return current;
}

export function getNextLevel(level: number): LevelThreshold | null {
  return LEVEL_THRESHOLDS.find((threshold) => threshold.level === level + 1) ?? null;
}

export function getLevelProgress(totalXP: number) {
  const currentLevel = getLevelFromXP(totalXP);
  const nextLevel = getNextLevel(currentLevel.level);

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      currentXP: 0,
      xpToNext: 0,
      xpPercent: 100,
      xpRemaining: 0,
    };
  }

  const currentXP = Math.max(0, totalXP - currentLevel.xpRequired);
  const xpToNext = nextLevel.xpRequired - currentLevel.xpRequired;
  const xpRemaining = Math.max(0, nextLevel.xpRequired - totalXP);

  return {
    currentLevel,
    nextLevel,
    currentXP,
    xpToNext,
    xpPercent: Math.min(100, Math.round((currentXP / xpToNext) * 100)),
    xpRemaining,
  };
}

export function getLevelUpRange(previousXP: number, nextXP: number) {
  const from = getLevelFromXP(previousXP);
  const to = getLevelFromXP(nextXP);

  return {
    leveledUp: to.level > from.level,
    previousLevel: from,
    currentLevel: to,
    gainedLevels: Math.max(0, to.level - from.level),
  };
}
