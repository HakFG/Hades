export type MediaKind = 'movie' | 'tv';

export type ProductionStatus =
  | 'Rumored'
  | 'Planned'
  | 'In Production'
  | 'Post Production'
  | 'Released'
  | 'Canceled'
  | 'Returning Series'
  | 'Ended'
  | 'Pilot';

export const MOVIE_PRODUCTION_STATUSES: ProductionStatus[] = [
  'Rumored',
  'Planned',
  'In Production',
  'Post Production',
  'Released',
  'Canceled',
];

export const TV_PRODUCTION_STATUSES: ProductionStatus[] = [
  'Planned',
  'In Production',
  'Returning Series',
  'Pilot',
  'Ended',
  'Canceled',
];

export const PRODUCTION_STATUS_COLORS: Record<ProductionStatus, string> = {
  Rumored: '#ef4444',
  Planned: '#f97316',
  'In Production': '#eab308',
  'Post Production': '#a855f7',
  Released: '#22c55e',
  Canceled: '#6b7280',
  'Returning Series': '#22c55e',
  Ended: '#6b7280',
  Pilot: '#3b82f6',
};

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  Rumored: 'Rumored',
  Planned: 'Planned',
  'In Production': 'In Production',
  'Post Production': 'Post Production',
  Released: 'Released',
  Canceled: 'Canceled',
  'Returning Series': 'Returning Series',
  Ended: 'Ended',
  Pilot: 'Pilot',
};

export function normalizeProductionStatus(
  rawStatus: unknown,
  mediaKind: MediaKind,
  inProduction?: boolean | null,
): ProductionStatus {
  const status = typeof rawStatus === 'string' ? rawStatus.trim() : '';

  if (mediaKind === 'tv') {
    if (status === 'Returning Series') return 'Returning Series';
    if (status === 'Ended') return 'Ended';
    if (status === 'Canceled' || status === 'Cancelled') return 'Canceled';
    if (status === 'Pilot') return 'Pilot';
    if (status === 'Planned') return 'Planned';
    if (status === 'In Production' || inProduction) return 'In Production';
    return 'Ended';
  }

  if (status === 'Rumored') return 'Rumored';
  if (status === 'Planned') return 'Planned';
  if (status === 'In Production') return 'In Production';
  if (status === 'Post Production') return 'Post Production';
  if (status === 'Canceled' || status === 'Cancelled') return 'Canceled';
  return 'Released';
}

export function productionStatusesFor(mediaKind: MediaKind): ProductionStatus[] {
  return mediaKind === 'tv' ? TV_PRODUCTION_STATUSES : MOVIE_PRODUCTION_STATUSES;
}

export function isProductionStatus(value: unknown): value is ProductionStatus {
  return (
    typeof value === 'string' &&
    [...MOVIE_PRODUCTION_STATUSES, ...TV_PRODUCTION_STATUSES].includes(value as ProductionStatus)
  );
}

