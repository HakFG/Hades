// Shared small helpers used across the app
export function getOrdinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

export function buildSeasonTitle(showName: string, seasonNumber: number): string {
  if (seasonNumber === 0) return `${showName} Specials`;
  if (seasonNumber === 1) return showName;
  return `${showName} ${getOrdinal(seasonNumber)} Season`;
}

export function formatScore(score: number): string {
  // Keep behaviour compatible with existing UI: show '-' for 0
  if (score === 0) return '-';
  return score % 1 === 0 ? score.toString() : score.toFixed(1);
}

export function scoreColor(s: number): string {
  if (!s) return '#c9d0d8';
  if (s >= 9) return '#2ecc71';
  if (s >= 7) return '#3db4f2';
  if (s >= 5) return '#f39c12';
  return '#e74c3c';
}
