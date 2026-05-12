// src/components/NextUpCard.tsx
'use client';

import Link from 'next/link';
import { NextUpItem } from '@/lib/next-up';
import StatusBubble from '@/components/StatusBubble';
import StatusDot from '@/components/StatusDot';
import TvSeasonNavClient from '@/components/TvSeasonNavClient';

interface NextUpCardProps {
  item: NextUpItem;
}

function getPriorityColor(urgency?: number): string {
  if (!urgency) return 'rgba(230, 125, 153, 0.15)';
  if (urgency >= 70) return 'rgba(255, 71, 87, 0.2)';
  if (urgency >= 40) return 'rgba(255, 193, 7, 0.2)';
  return 'rgba(76, 175, 80, 0.2)';
}

function getPriorityBorder(urgency?: number): string {
  if (!urgency) return 'rgba(230, 125, 153, 0.3)';
  if (urgency >= 70) return 'rgba(255, 71, 87, 0.5)';
  if (urgency >= 40) return 'rgba(255, 193, 7, 0.5)';
  return 'rgba(76, 175, 80, 0.5)';
}

function getUrgencyLabel(urgency?: number): string {
  if (!urgency) return '';
  if (urgency >= 70) return 'Urgent';
  if (urgency >= 40) return 'Soon';
  return 'Ready';
}

export default function NextUpCard({ item }: NextUpCardProps) {
  const isSeries = item.type === 'TV_SEASON';

  let badgeText = '';
  if (item.reason === 'next_episode') {
    badgeText = `Ep ${item.nextEpisodeNumber}`;
  } else if (item.reason === 'paused_resume') {
    badgeText = `Resume · Ep ${item.nextEpisodeNumber}`;
  } else if (item.reason === 'almost_finished') {
    badgeText = `Almost done · Ep ${item.nextEpisodeNumber}`;
  } else {
    badgeText = 'Watch now';
  }

  const progressPercent =
    isSeries &&
    item.currentProgress !== undefined &&
    item.currentProgress !== null &&
    item.totalEpisodes
      ? (item.currentProgress / item.totalEpisodes) * 100
      : null;

  const progressText =
    isSeries &&
    item.currentProgress !== undefined &&
    item.currentProgress !== null &&
    item.totalEpisodes
      ? `${item.currentProgress}/${item.totalEpisodes}`
      : null;

  const reasonLabel =
    item.reason === 'next_episode'
      ? 'Next episode'
      : item.reason === 'paused_resume'
        ? 'Resume'
        : item.reason === 'almost_finished'
          ? 'Almost there'
          : 'Quick movie';

  const priorityColor = getPriorityColor(item.urgencyScore);
  const priorityBorder = getPriorityBorder(item.urgencyScore);
  const urgencyLabel = getUrgencyLabel(item.urgencyScore);

  const poster = item.posterPath
    ? item.posterPath.startsWith('http')
      ? item.posterPath
      : `https://image.tmdb.org/t/p/w300${item.posterPath}`
    : '';

  const listStatus = item.listStatus ?? 'WATCHING';

  return (
    <div className="nextup-root">
      <Link href={`/titles/${item.slug}`} className="nextup-link">
        <div className="poster">
          <StatusBubble
            status={item.productionStatus}
            mediaType={item.type === 'MOVIE' ? 'movie' : 'tv'}
            size="md"
          />
          <StatusDot status={listStatus} size="md" position="br" />

          {poster ? (
            <img src={poster} alt={item.title} loading="lazy" decoding="async" />
          ) : (
            <div className="placeholder">{isSeries ? '📺' : '🎬'}</div>
          )}

          {item.urgencyScore !== undefined && item.urgencyScore > 0 && (
            <div className="urgency" style={{ background: priorityColor, borderColor: priorityBorder }}>
              <span>{urgencyLabel}</span>
            </div>
          )}

          {progressPercent !== null && (
            <div className="prog-track">
              <div className="prog-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          )}

          <div className="overlay">
            <strong>{item.productionStatus ?? '—'}</strong>
            <span>{reasonLabel}</span>
          </div>
        </div>
      </Link>

      <div className="info">
        <h4 className="title" title={item.title}>
          {item.title}
        </h4>

        <div
          className="chip"
          style={{
            background: priorityColor,
            borderColor: priorityBorder,
          }}
        >
          {badgeText}
        </div>

        {(item.urgencyScore ?? 0) > 0 && (
          <div className="meta">
            <span className="urg">{urgencyLabel}</span>
            <span className="sub">{reasonLabel}</span>
          </div>
        )}

        {progressText && <p className="prog-text">{progressText} eps</p>}

        {item.daysStalled !== undefined && item.daysStalled > 7 && (
          <p className="stalled">Paused {Math.ceil(item.daysStalled / 7)}w ago</p>
        )}

        {isSeries && item.parentTmdbId ? (
          <TvSeasonNavClient
            showTmdbId={item.parentTmdbId}
            currentSeason={item.seasonNumber ?? 1}
            compact
          />
        ) : null}
      </div>

      <style jsx>{`
        .nextup-root {
          display: grid;
          gap: 8px;
          min-width: 0;
          background: rgb(52, 49, 49);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .nextup-root:hover {
          border-color: rgba(230, 125, 153, 0.4);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.38);
          transform: translateY(-4px);
        }

        .nextup-link {
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
          background: linear-gradient(135deg, rgb(62, 58, 58), rgb(48, 45, 45));
        }

        .nextup-root:hover img {
          transform: scale(1.04);
        }

        .urgency {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 5px 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(4px);
        }

        .urgency span {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgb(232, 226, 223);
        }

        .prog-track {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(0, 0, 0, 0.35);
        }

        .prog-fill {
          height: 100%;
          background: linear-gradient(90deg, rgb(76, 175, 80), rgb(75, 192, 192));
          transition: width 0.25s ease;
        }

        .overlay {
          position: absolute;
          inset: auto 0 0;
          display: grid;
          gap: 3px;
          padding: 28px 8px 10px;
          background: linear-gradient(transparent, rgba(20, 18, 18, 0.92));
          opacity: 0;
          transition: opacity 0.18s ease;
        }

        .nextup-root:hover .overlay {
          opacity: 1;
        }

        .overlay strong {
          font-size: 10px;
          color: rgb(232, 226, 223);
        }

        .overlay span {
          font-size: 9px;
          color: rgba(220, 210, 215, 0.65);
        }

        .info {
          padding: 0 10px 10px;
          display: grid;
          gap: 8px;
        }

        .title {
          margin: 0;
          font-size: 12px;
          font-weight: 800;
          color: rgb(220, 210, 215);
          line-height: 1.25;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border: 1px solid;
          border-radius: 12px;
          padding: 3px 8px;
          color: rgb(232, 226, 223);
        }

        .meta {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: center;
        }

        .urg {
          color: #e8e2df;
          font-size: 10px;
          font-weight: 800;
        }

        .sub {
          color: rgba(220, 210, 215, 0.5);
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 700;
        }

        .prog-text {
          margin: 0;
          font-size: 10px;
          color: rgba(220, 210, 215, 0.72);
          font-weight: 600;
        }

        .stalled {
          margin: 0;
          font-size: 9px;
          color: rgba(230, 125, 153, 0.75);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
