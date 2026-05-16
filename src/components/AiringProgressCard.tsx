'use client';

import { useState } from 'react';
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
  productionStatus?: string | null;
  seasonStatus?: string | null;
  nextEpisode?: { episode_number: number; air_date: string } | null;
  inProduction?: boolean;
}

interface AiringProgressCardProps {
  entry: AiringProgressEntry;
  /** Lado para onde o painel de hover abre. 'right' (padrão) ou 'left' */
  panelSide?: 'right' | 'left';
}

export default function AiringProgressCard({ entry, panelSide = 'right' }: AiringProgressCardProps) {
  const [progress, setProgress] = useState(entry.progress ?? 0);
  const [isUpdating, setIsUpdating] = useState(false);

  const isSeries = entry.type === 'TV_SEASON';
  const totalEpisodes = entry.totalEpisodes ?? 0;
  const completed = isSeries
    ? totalEpisodes > 0 && progress >= totalEpisodes
    : entry.status === 'COMPLETED';

  const slug = isSeries
    ? `tv-${entry.parentTmdbId ?? entry.tmdbId}-s${entry.seasonNumber ?? 1}`
    : `movie-${entry.tmdbId}`;

  const poster = entry.imagePath
    ? entry.imagePath.startsWith('http')
      ? entry.imagePath
      : `https://image.tmdb.org/t/p/w300${entry.imagePath}`
    : '';

  const remaining = isSeries
    ? totalEpisodes > 0 ? totalEpisodes - progress : '?'
    : completed ? 0 : 1;

  const remainingLabel = isSeries
    ? remaining === '?' ? '? ep. restante'
      : remaining === 0 ? 'Concluído'
      : `${remaining} ep. restante${Number(remaining) > 1 ? 's' : ''}`
    : completed ? 'Concluído' : '1 ep. restante';

  const barPercent = isSeries
    ? totalEpisodes > 0 ? Math.min((progress / totalEpisodes) * 100, 100) : 0
    : completed ? 100 : 0;

  const progressLabel = isSeries
    ? `${progress}/${totalEpisodes > 0 ? totalEpisodes : '?'}`
    : completed ? '1/1' : '0/1';

  const canUpdate = !completed && !isUpdating && (isSeries ? true : entry.status !== 'COMPLETED');

  async function handleIncrement(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!canUpdate) return;

    const nextProgress = isSeries
      ? totalEpisodes > 0 ? Math.min(progress + 1, totalEpisodes) : progress + 1
      : 1;
    const nextStatus = !isSeries
      ? 'COMPLETED'
      : totalEpisodes > 0 && nextProgress >= totalEpisodes ? 'COMPLETED' : entry.status;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: nextProgress, status: nextStatus }),
      });
      if (res.ok) setProgress(nextProgress);
    } catch (err) {
      console.error('Failed to update entry progress', err);
    } finally {
      setIsUpdating(false);
    }
  }

  const isLeft = panelSide === 'left';

  return (
    <div className="apc-shell">
      <style jsx>{`
        .apc-shell {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
          position: relative;
        }

        .apc-poster-wrap {
          position: relative;
          aspect-ratio: 2 / 3;
        }

        .apc-poster-inner {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          z-index: 1;
          background: #3a3535;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;
        }

        .apc-shell:hover .apc-poster-inner {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 8px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(230,125,153,0.3);
        }

        .apc-poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.25s ease;
        }

        .apc-shell:hover .apc-poster-img {
          transform: scale(1.06);
        }

        .apc-poster-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          background: linear-gradient(135deg, #3a3535, #262323);
        }

        .apc-poster-inner::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(20,18,18,0.65) 0%, transparent 50%);
          pointer-events: none;
          border-radius: inherit;
        }

        /* ── Painel hover ── */
        .apc-hover-panel {
          position: absolute;
          top: 0;
          width: 152px;
          background: rgba(20,18,18,0.97);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(230,125,153,0.22);
          border-radius: 7px;
          padding: 11px 12px 13px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 30;
          pointer-events: none;
          opacity: 0;
          box-shadow: 0 10px 36px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03);
          transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .apc-shell:hover .apc-hover-panel {
          opacity: 1;
          transform: translateX(0) !important;
          pointer-events: auto;
        }

        .apc-panel-remaining {
          font-size: 11px;
          font-weight: 700;
          color: #e67d99;
          line-height: 1.2;
        }

        .apc-panel-title {
          font-size: 10px;
          color: rgba(232,224,216,0.72);
          line-height: 1.35;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          font-weight: 500;
        }

        .apc-bar-track {
          height: 3px;
          background: rgba(255,255,255,0.1);
          border-radius: 99px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .apc-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #e67d99, #c9965a);
          border-radius: 99px;
          transition: width 0.35s ease;
        }

        .apc-bar-label {
          font-size: 9px;
          color: rgba(232,224,216,0.4);
          letter-spacing: 0.03em;
          font-weight: 600;
        }

        .apc-inc-btn {
          width: 100%;
          padding: 5px 8px;
          background: rgba(230,125,153,0.12);
          border: 1px solid rgba(230,125,153,0.26);
          border-radius: 4px;
          color: #e67d99;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.12s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .apc-inc-btn:hover:not(:disabled) {
          background: rgba(230,125,153,0.26);
          border-color: rgba(230,125,153,0.5);
          transform: translateY(-1px);
        }

        .apc-inc-btn:active:not(:disabled) { transform: translateY(0); }
        .apc-inc-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .apc-completed-badge {
          font-size: 9px;
          text-align: center;
          color: rgba(46,204,113,0.85);
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        /* ── Título ── */
        .apc-title {
          font-size: 7px;
          font-weight: 600;
          color: rgba(232,224,216,0.62);
          line-height: 1.35;
          text-align: center;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          text-decoration: none;
          padding: 0 1px;
          transition: color 0.2s ease;
        }

        .apc-shell:hover .apc-title { color: #e67d99; }
      `}</style>

      <div className="apc-poster-wrap">
        <Link href={`/titles/${slug}`} className="apc-poster-inner">
          {poster ? (
            <img src={poster} alt={entry.title} className="apc-poster-img" loading="lazy" decoding="async" />
          ) : (
            <div className="apc-poster-placeholder">{isSeries ? '📺' : '🎬'}</div>
          )}
        </Link>

        {/* Painel hover — abre para a direita ou esquerda via prop */}
        <div
          className="apc-hover-panel"
          style={{
            ...(isLeft
              ? { right: 'calc(100% + 8px)', left: 'auto', transform: 'translateX(6px)' }
              : { left: 'calc(100% + 8px)', right: 'auto', transform: 'translateX(-6px)' }
            ),
          }}
        >
          {/* Seta */}
          <span style={{
            position: 'absolute',
            top: '14px',
            width: '8px',
            height: '8px',
            background: 'rgba(20,18,18,0.97)',
            ...(isLeft
              ? {
                  right: '-5px',
                  borderRight: '1px solid rgba(230,125,153,0.22)',
                  borderTop: '1px solid rgba(230,125,153,0.22)',
                  transform: 'rotate(45deg)',
                }
              : {
                  left: '-5px',
                  borderLeft: '1px solid rgba(230,125,153,0.22)',
                  borderBottom: '1px solid rgba(230,125,153,0.22)',
                  transform: 'rotate(45deg)',
                }
            ),
          }} />

          <div className="apc-panel-remaining">{remainingLabel}</div>
          <div className="apc-panel-title">{entry.title}</div>

          <div>
            <div className="apc-bar-track">
              <div className="apc-bar-fill" style={{ width: `${barPercent}%` }} />
            </div>
            <div className="apc-bar-label">Progress: {progressLabel}</div>
          </div>

          {completed ? (
            <div className="apc-completed-badge">✓ CONCLUÍDO</div>
          ) : (
            <button className="apc-inc-btn" onClick={handleIncrement} disabled={!canUpdate}>
              {isUpdating ? '...' : '+ 1 ep'}
            </button>
          )}
        </div>
      </div>

      <Link href={`/titles/${slug}`} className="apc-title" title={entry.title}>
        {entry.title}
      </Link>
    </div>
  );
}