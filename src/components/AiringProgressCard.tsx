'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

interface AiringProgressEntry {
  id: string;
  title: string;
  tmdbId: number;
  parentTmdbId?: number | null;
  seasonNumber?: number | null;
  type: 'MOVIE' | 'TV_SEASON';
  status: string;
  progress?: number | null;
  totalEpisodes?: number | null;
  imagePath?: string | null;
  nextEpisode?: { episode_number: number; air_date: string } | null;
  inProduction?: boolean;
}

interface AiringProgressCardProps {
  entry: AiringProgressEntry;
}

export default function AiringProgressCard({ entry }: AiringProgressCardProps) {
  const [progress, setProgress] = useState(entry.progress ?? 0);
  const [isUpdating, setIsUpdating] = useState(false);

  const isSeries = entry.type === 'TV_SEASON';
  const totalEpisodes = entry.totalEpisodes ?? 0;
  const completed = isSeries ? totalEpisodes > 0 && progress >= totalEpisodes : entry.status === 'COMPLETED';
  const slug = isSeries
    ? `tv-${entry.parentTmdbId ?? entry.tmdbId}-s${entry.seasonNumber ?? 1}`
    : `movie-${entry.tmdbId}`;

  const progressLabel = isSeries
    ? `Ep ${progress}/${totalEpisodes || '?'}`
    : entry.status === 'COMPLETED'
      ? 'Completed'
      : 'Movie';

  const progressPercent = isSeries && totalEpisodes > 0
    ? Math.min(100, Math.round((progress / totalEpisodes) * 100))
    : 0;

  const nextInfo = entry.nextEpisode
    ? `Next Ep ${entry.nextEpisode.episode_number} • ${new Date(entry.nextEpisode.air_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
    : entry.inProduction
      ? 'In production'
      : 'Season ended';

  const actionLabel = isSeries ? '+' : '✓';
  const canUpdate = !completed && (isSeries ? totalEpisodes > 0 : entry.status !== 'COMPLETED');
  const statusBadge = isSeries ? '📺 Série' : '🎬 Filme';

  const buttonTitle = isSeries
    ? completed
      ? 'Completed'
      : 'Atualizar episódio'
    : entry.status === 'COMPLETED'
      ? 'Completed'
      : 'Marcar como visto';

  const updatedPercentage = useMemo(() => progressPercent, [progressPercent]);

  async function handleIncrement(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!canUpdate || isUpdating) return;

    const nextProgress = isSeries
      ? (totalEpisodes > 0 ? Math.min(progress + 1, totalEpisodes) : progress + 1)
      : 1;

    const nextStatus = !isSeries
      ? 'COMPLETED'
      : totalEpisodes > 0 && nextProgress >= totalEpisodes
        ? 'COMPLETED'
        : entry.status;

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: nextProgress, status: nextStatus }),
      });

      if (response.ok) {
        setProgress(nextProgress);
      }
    } catch (error) {
      console.error('Failed to update entry progress', error);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="airing-card" style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: '0' }}>
      <Link href={`/titles/${slug}`} style={{ display: 'block', overflow: 'hidden' }}>
        {entry.imagePath ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${entry.imagePath}`}
            alt={entry.title}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ aspectRatio: '2/3', background: 'rgb(62,58,58)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
            {isSeries ? '📺' : '🎬'}
          </div>
        )}
      </Link>

      <div className="airing-info" style={{ padding: '10px 10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="airing-title" style={{ fontSize: '11px', lineHeight: '1.3', whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {entry.title}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              <span className="progress-badge" style={{ fontSize: '8px', padding: '2px 6px' }}>{statusBadge}</span>
              {progressLabel && <span className="progress-ep" style={{ fontSize: '9px', color: 'rgba(220,210,215,0.6)' }}>{progressLabel}</span>}
            </div>
          </div>
          <button
            type="button"
            title={buttonTitle}
            disabled={!canUpdate || isUpdating}
            onClick={handleIncrement}
            style={{
              minWidth: '34px',
              height: '34px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.14)',
              background: canUpdate ? 'rgba(230,125,153,0.18)' : 'rgba(255,255,255,0.06)',
              color: canUpdate ? '#e8e2df' : 'rgba(220,210,215,0.45)',
              cursor: canUpdate ? 'pointer' : 'not-allowed',
              fontWeight: 800,
              fontSize: '16px',
              lineHeight: 1,
              transition: 'transform 0.2s ease, background 0.2s ease',
            }}
          >
            {isUpdating ? '…' : actionLabel}
          </button>
        </div>

        {entry.nextEpisode && (
          <p className="airing-ep" style={{ margin: '8px 0 0', fontSize: '10px', color: 'rgb(230,125,153)', lineHeight: 1.4 }}>
            <span className="live-dot" />{nextInfo}
          </p>
        )}

        {!entry.nextEpisode && (
          <p className="airing-prod" style={{ margin: '8px 0 0' }}>{nextInfo}</p>
        )}

        {isSeries && totalEpisodes > 0 && (
          <div style={{ marginTop: '10px', display: 'grid', gap: '6px' }}>
            <div className="progress-bar-track" style={{ height: '5px', borderRadius: '99px' }}>
              <div className="progress-bar-fill" style={{ width: `${updatedPercentage}%` }} />
            </div>
            <span style={{ fontSize: '9px', color: 'rgba(220,210,215,0.55)' }}>{updatedPercentage}% concluído</span>
          </div>
        )}
      </div>
    </div>
  );
}
