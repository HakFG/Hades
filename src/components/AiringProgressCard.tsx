'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import StatusBubble from '@/components/StatusBubble';
import StatusDot from '@/components/StatusDot';
import TvSeasonNavClient from '@/components/TvSeasonNavClient';

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
  productionStatus?: string | null;
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
  const statusBadge = isSeries ? 'Série' : 'Filme';

  const buttonTitle = isSeries
    ? completed
      ? 'Completed'
      : 'Atualizar episódio'
    : entry.status === 'COMPLETED'
      ? 'Completed'
      : 'Marcar como visto';

  const updatedPercentage = useMemo(() => progressPercent, [progressPercent]);

  const poster = entry.imagePath
    ? entry.imagePath.startsWith('http')
      ? entry.imagePath
      : `https://image.tmdb.org/t/p/w300${entry.imagePath}`
    : '';

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
    <div className="airing-root">
      <Link href={`/titles/${slug}`} className="poster-link">
        <div className="poster">
          <StatusBubble
            status={entry.productionStatus}
            mediaType={entry.type === 'MOVIE' ? 'movie' : 'tv'}
            size="md"
          />
          <StatusDot status={entry.status} size="md" position="br" />
          {poster ? (
            <img src={poster} alt={entry.title} loading="lazy" decoding="async" />
          ) : (
            <div className="placeholder">{isSeries ? '📺' : '🎬'}</div>
          )}
          <div className="overlay">
            <strong>{entry.productionStatus ?? '—'}</strong>
            {nextInfo && <span>{nextInfo}</span>}
          </div>
        </div>
      </Link>

      <div className="body">
        <div className="row-top">
          <p className="title">{entry.title}</p>
          <button
            type="button"
            title={buttonTitle}
            disabled={!canUpdate || isUpdating}
            className="inc"
            onClick={handleIncrement}
          >
            {isUpdating ? '…' : actionLabel}
          </button>
        </div>

        <div className="meta-row">
          <span className="badge">{statusBadge}</span>
          <span className="ep">{progressLabel}</span>
        </div>

        {isSeries && totalEpisodes > 0 && (
          <div className="bar-block">
            <div className="track">
              <div className="fill" style={{ width: `${updatedPercentage}%` }} />
            </div>
            <span className="pct">{updatedPercentage}%</span>
          </div>
        )}

        {isSeries && entry.parentTmdbId ? (
          <TvSeasonNavClient
            showTmdbId={entry.parentTmdbId}
            currentSeason={entry.seasonNumber ?? 1}
            compact
          />
        ) : null}
      </div>

      <style jsx>{`
        .airing-root {
          display: grid;
          gap: 8px;
          min-width: 0;
          text-align: left;
          background: rgb(52, 49, 49);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .airing-root:hover {
          border-color: rgba(230, 125, 153, 0.35);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
          transform: translateY(-3px);
        }

        .poster-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }

        .poster {
          position: relative;
          aspect-ratio: 2 / 3;
          overflow: hidden;
          background: rgb(58, 55, 55);
        }

        img,
        .placeholder {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.22s ease;
        }

        .placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          background: linear-gradient(135deg, rgb(58, 55, 55), rgb(42, 39, 39));
        }

        .airing-root:hover img {
          transform: scale(1.04);
        }

        .overlay {
          position: absolute;
          inset: auto 0 0;
          display: grid;
          gap: 4px;
          padding: 28px 8px 8px;
          background: linear-gradient(transparent, rgba(20, 18, 18, 0.92));
          opacity: 0;
          transition: opacity 0.18s ease;
        }

        .airing-root:hover .overlay {
          opacity: 1;
        }

        .overlay strong {
          font-size: 10px;
          color: rgb(232, 226, 223);
          line-height: 1.25;
        }

        .overlay span {
          font-size: 9px;
          color: rgba(230, 125, 153, 0.95);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .body {
          padding: 0 10px 10px;
          display: grid;
          gap: 6px;
        }

        .row-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .title {
          margin: 0;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.25;
          color: rgb(232, 226, 223);
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          min-width: 0;
          flex: 1;
        }

        .inc {
          flex-shrink: 0;
          min-width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(230, 125, 153, 0.18);
          color: #e8e2df;
          cursor: pointer;
          font-weight: 800;
          font-size: 15px;
          line-height: 1;
          transition: transform 0.15s ease, background 0.15s ease;
        }

        .inc:disabled {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(220, 210, 215, 0.45);
          cursor: not-allowed;
        }

        .inc:not(:disabled):hover {
          transform: scale(1.04);
        }

        .meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }

        .badge {
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(230, 125, 153, 0.12);
          color: rgba(230, 125, 153, 0.95);
          border: 1px solid rgba(230, 125, 153, 0.22);
        }

        .ep {
          font-size: 9px;
          color: rgba(220, 210, 215, 0.55);
        }

        .bar-block {
          display: grid;
          gap: 4px;
        }

        .track {
          height: 5px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, rgb(230, 125, 153), rgb(245, 90, 130));
          transition: width 0.2s ease;
        }

        .pct {
          font-size: 9px;
          color: rgba(220, 210, 215, 0.5);
        }
      `}</style>
    </div>
  );
}
