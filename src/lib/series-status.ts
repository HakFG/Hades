/**
 * Sistema unificado de bolinhas baseado no status real da série/temporada.
 *
 * Regra principal:
 *  - "Finished" / "Ended" / "Released"   → sem bolinha (null)
 *  - "Airing"                             → verde pulsante  (#2ecc71)
 *  - "Not Yet Aired" / "Planned"          → laranja         (#f39c12)
 *  - "Returning Series" / "In Production" → azul            (#3db4f2)
 *  - "Canceled"                           → cinza           (#6b7280)
 *
 * Esse mapeamento é derivado do campo `seasonStatus` (Airing | Finished | Not Yet Aired)
 * e do `productionStatus` armazenado no banco (Returning Series, Ended, Canceled, …).
 */

export type SeriesAiringStatus =
  | 'Airing'
  | 'Not Yet Aired'
  | 'Finished'
  | 'Returning Series'
  | 'In Production'
  | 'Planned'
  | 'Canceled'
  | 'Ended'
  | 'Released'
  | string;

export interface StatusDotConfig {
  color: string;
  label: string;
  /** Se true, a bolinha pulsa (para Airing) */
  pulse: boolean;
}

/** Statuses que NÃO devem exibir bolinha */
const SILENT_STATUSES = new Set([
  'Finished',
  'Ended',
  'Released',
]);

/**
 * Dado um `seasonStatus` (Airing | Finished | Not Yet Aired) ou
 * um `productionStatus` (Returning Series, Ended, …), retorna a
 * configuração da bolinha, ou `null` se não deve ser exibida.
 */
export function resolveSeriesStatusDot(
  status?: string | null,
): StatusDotConfig | null {
  if (!status) return null;

  const s = status.trim();

  if (SILENT_STATUSES.has(s)) return null;

  if (s === 'Airing') {
    return { color: '#2ecc71', label: 'Airing', pulse: true };
  }

  if (s === 'Not Yet Aired' || s === 'Planned') {
    return { color: '#f39c12', label: 'Not Yet Aired', pulse: false };
  }

  if (s === 'Returning Series') {
    return { color: '#3db4f2', label: 'Returning Series', pulse: false };
  }

  if (s === 'In Production') {
    return { color: '#a855f7', label: 'In Production', pulse: false };
  }

  if (s === 'Canceled' || s === 'Cancelled') {
    return { color: '#6b7280', label: 'Canceled', pulse: false };
  }

  if (s === 'Pilot') {
    return { color: '#3b82f6', label: 'Pilot', pulse: false };
  }

  // Qualquer outro status desconhecido → sem bolinha
  return null;
}

/**
 * Helper: dado um productionStatus do banco (ex: "Returning Series", "Ended"),
 * determina o seasonStatus equivalente para fins de exibição de bolinha.
 *
 * Usado em EntryCard no Profile onde não temos seasonStatus direto,
 * apenas productionStatus.
 */
export function productionStatusToDisplayStatus(
  productionStatus?: string | null,
): string | null {
  if (!productionStatus) return null;
  const s = productionStatus.trim();

  // Statuses que mapeiam direto
  const directMap: Record<string, string> = {
    'Returning Series': 'Returning Series',
    'Ended':            'Finished',
    'Canceled':         'Canceled',
    'Cancelled':        'Canceled',
    'In Production':    'In Production',
    'Planned':          'Not Yet Aired',
    'Released':         'Finished',
    'Pilot':            'Pilot',
  };

  return directMap[s] ?? null;
}
