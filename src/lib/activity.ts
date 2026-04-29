// src/lib/activity.ts
import { entrySlug } from '@/lib/utils';

export interface ActivityPayload {
  entryId: string;
  title: string;
  imagePath: string | null;
  type: 'MOVIE' | 'TV_SEASON';
  status: string;
  progressStart?: number;
  progressEnd?: number;
  score: number;
  slug: string;
}

export async function recordActivity(entry: {
  id: string;
  title: string;
  imagePath?: string | null;
  type: 'MOVIE' | 'TV_SEASON';
  status: string;
  progress: number;
  score: number;
  parentTmdbId?: number | null;
  seasonNumber?: number | null;
  tmdbId: number;
}) {
  const payload: ActivityPayload = {
    entryId: entry.id,
    title: entry.title,
    imagePath: entry.imagePath ?? null,
    type: entry.type,
    status: entry.status,
    progressStart: entry.progress,
    progressEnd: entry.progress,
    score: entry.score,
    slug: entrySlug(entry),
  };

  const res = await fetch('/api/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error('Failed to record activity:', await res.text());
  }
}