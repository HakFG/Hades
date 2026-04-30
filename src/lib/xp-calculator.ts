export type XPAction =
  | 'add_entry'
  | 'add_movie'
  | 'add_tv_season'
  | 'complete_episode'
  | 'complete_season'
  | 'complete_series'
  | 'complete_movie'
  | 'rate_title'
  | 'score_9_plus'
  | 'score_10'
  | 'write_notes'
  | 'favorite_title'
  | 'rewatch_episode'
  | 'rewatch_title'
  | 'long_episode'
  | 'movie_marathon'
  | 'weekend_session'
  | 'genre_explorer'
  | 'classic_title'
  | 'hidden_gem'
  | 'first_entry'
  | 'planning_cleanup'
  | 'streak_3_days'
  | 'streak_7_days'
  | 'streak_14_days'
  | 'streak_30_days'
  | 'comeback_session'
  | 'import_collection'
  | 'refresh_library'
  | 'manual_bonus';

export interface XPRule {
  action: XPAction;
  label: string;
  baseXP: number;
  multiplier: string;
  description: string;
}

export interface XPCalculationMetadata {
  score?: number;
  episodeCount?: number;
  minutesWatched?: number;
  isWeekend?: boolean;
  isClassic?: boolean;
  popularity?: number;
  levelMultiplier?: number;
  bonusXP?: number;
}

export interface XPCalculationResult {
  action: XPAction;
  baseXP: number;
  multiplier: number;
  bonusXP: number;
  xpGained: number;
  label: string;
  description: string;
}

export const XP_ACTION_RULES: XPRule[] = [
  { action: 'add_entry', baseXP: 50, label: 'Adicionar titulo', multiplier: '1x', description: 'Base para qualquer item novo na lista.' },
  { action: 'add_movie', baseXP: 60, label: 'Adicionar filme', multiplier: '1x', description: 'Filmes recebem um pequeno bonus por serem unidade fechada.' },
  { action: 'add_tv_season', baseXP: 50, label: 'Adicionar temporada', multiplier: '1x', description: 'Organiza uma temporada nova no catalogo.' },
  { action: 'complete_episode', baseXP: 100, label: 'Completar episodio', multiplier: '1x a 1.5x por score', description: 'Score acima de 5 aumenta o ganho: 8.5 vira 1.35x.' },
  { action: 'complete_season', baseXP: 300, label: 'Completar temporada', multiplier: '1x', description: 'Marco de conclusao de uma temporada inteira.' },
  { action: 'complete_series', baseXP: 500, label: 'Completar serie inteira', multiplier: '1x', description: 'Bonus para fechar a serie como obra completa.' },
  { action: 'complete_movie', baseXP: 150, label: 'Completar filme', multiplier: '1x a 1.5x por score', description: 'Filme concluido com bonus de nota quando houver score.' },
  { action: 'rate_title', baseXP: 25, label: 'Avaliar titulo', multiplier: '1x', description: 'Incentiva manter a lista organizada com notas.' },
  { action: 'score_9_plus', baseXP: 100, label: 'Score 9+', multiplier: 'Bonus', description: 'Quando uma obra entra no patamar excelente.' },
  { action: 'score_10', baseXP: 200, label: 'Score 10/10', multiplier: 'Bonus', description: 'Recompensa especial para favoritos absolutos.' },
  { action: 'write_notes', baseXP: 35, label: 'Escrever notas', multiplier: '1x', description: 'Valoriza comentarios, resenhas e memoria pessoal.' },
  { action: 'favorite_title', baseXP: 40, label: 'Favoritar titulo', multiplier: '1x', description: 'Destaque para curadoria pessoal.' },
  { action: 'rewatch_episode', baseXP: 60, label: 'Reassistir episodio', multiplier: '1x', description: 'Menos XP que episodio novo, mas ainda conta rotina.' },
  { action: 'rewatch_title', baseXP: 120, label: 'Reassistir titulo', multiplier: '1x', description: 'Bonus para rever uma obra completa.' },
  { action: 'long_episode', baseXP: 40, label: 'Episodio longo', multiplier: 'Bonus', description: 'Extra para episodios acima de 60 minutos.' },
  { action: 'movie_marathon', baseXP: 250, label: 'Maratona de filmes', multiplier: 'Bonus', description: 'Dois ou mais filmes completos no mesmo dia.' },
  { action: 'weekend_session', baseXP: 30, label: 'Sessao de fim de semana', multiplier: 'Bonus', description: 'Pequeno incentivo para sessoes de sabado/domingo.' },
  { action: 'genre_explorer', baseXP: 80, label: 'Explorar genero novo', multiplier: 'Bonus', description: 'Premia variedade no catalogo.' },
  { action: 'classic_title', baseXP: 75, label: 'Classico', multiplier: 'Bonus', description: 'Obras antigas ou historicas ganham destaque.' },
  { action: 'hidden_gem', baseXP: 90, label: 'Hidden gem', multiplier: 'Bonus', description: 'Titulos pouco populares rendem XP extra.' },
  { action: 'first_entry', baseXP: 150, label: 'Primeiro titulo', multiplier: 'Bonus unico', description: 'Boas-vindas ao sistema de gamificacao.' },
  { action: 'planning_cleanup', baseXP: 45, label: 'Limpar backlog', multiplier: '1x', description: 'Mover item de planning para watching/completed.' },
  { action: 'streak_3_days', baseXP: 120, label: 'Streak 3 dias', multiplier: 'Bonus', description: 'Primeiro marco de habito.' },
  { action: 'streak_7_days', baseXP: 300, label: 'Streak 7 dias', multiplier: 'Bonus semanal', description: 'Consistencia semanal.' },
  { action: 'streak_14_days', baseXP: 650, label: 'Streak 14 dias', multiplier: 'Bonus', description: 'Duas semanas de rotina.' },
  { action: 'streak_30_days', baseXP: 1000, label: 'Streak 30 dias', multiplier: 'Bonus mensal', description: 'Marco mensal de compromisso.' },
  { action: 'comeback_session', baseXP: 90, label: 'Voltou a assistir', multiplier: 'Bonus', description: 'Retorno depois de varios dias parado.' },
  { action: 'import_collection', baseXP: 200, label: 'Importar colecao', multiplier: 'Bonus', description: 'Premia organizar o catalogo em lote.' },
  { action: 'refresh_library', baseXP: 20, label: 'Sincronizar biblioteca', multiplier: '1x', description: 'Manutencao leve do acervo.' },
  { action: 'manual_bonus', baseXP: 0, label: 'Bonus manual', multiplier: 'Custom', description: 'Usado para ajustes administrativos.' },
];

const XP_RULE_MAP = XP_ACTION_RULES.reduce<Record<XPAction, XPRule>>((map, rule) => {
  map[rule.action] = rule;
  return map;
}, {} as Record<XPAction, XPRule>);

export function getXPRule(action: XPAction): XPRule {
  return XP_RULE_MAP[action] ?? XP_RULE_MAP.manual_bonus;
}

export function getScoreMultiplier(score?: number): number {
  if (typeof score !== 'number' || Number.isNaN(score) || score <= 5) return 1;
  return Number(Math.min(1.5, 1 + (Math.min(score, 10) - 5) / 10).toFixed(2));
}

export function calculateXPForAction(action: XPAction, metadata: XPCalculationMetadata = {}): XPCalculationResult {
  const rule = getXPRule(action);
  const scoreAwareActions: XPAction[] = ['complete_episode', 'complete_movie'];
  const countAwareActions: XPAction[] = ['complete_episode', 'rewatch_episode'];

  const actionMultiplier = scoreAwareActions.includes(action) ? getScoreMultiplier(metadata.score) : 1;
  const levelMultiplier = metadata.levelMultiplier && metadata.levelMultiplier > 1 ? metadata.levelMultiplier : 1;
  const episodeCount = countAwareActions.includes(action) ? Math.max(1, Math.floor(metadata.episodeCount ?? 1)) : 1;
  const bonusXP = Math.max(0, Math.floor(metadata.bonusXP ?? 0));
  const multiplier = Number((actionMultiplier * levelMultiplier).toFixed(2));
  const xpGained = Math.max(0, Math.round(rule.baseXP * episodeCount * multiplier + bonusXP));

  return {
    action,
    baseXP: rule.baseXP,
    multiplier,
    bonusXP,
    xpGained,
    label: rule.label,
    description: rule.description,
  };
}

export function getActionLabel(action: XPAction): string {
  return getXPRule(action).label;
}
