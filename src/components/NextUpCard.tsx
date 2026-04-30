// src/components/NextUpCard.tsx
'use client';

import Link from 'next/link';
import { NextUpItem } from '@/lib/next-up';

interface NextUpCardProps {
  item: NextUpItem;
}

/**
 * Gera uma cor de prioridade baseada no score de urgência
 */
function getPriorityColor(urgency?: number): string {
  if (!urgency) return 'rgba(230, 125, 153, 0.15)';
  if (urgency >= 70) return 'rgba(255, 71, 87, 0.2)'; // Red - muito urgente
  if (urgency >= 40) return 'rgba(255, 193, 7, 0.2)'; // Amber - urgente
  return 'rgba(76, 175, 80, 0.2)'; // Green - normal
}

function getPriorityBorder(urgency?: number): string {
  if (!urgency) return 'rgba(230, 125, 153, 0.3)';
  if (urgency >= 70) return 'rgba(255, 71, 87, 0.5)';
  if (urgency >= 40) return 'rgba(255, 193, 7, 0.5)';
  return 'rgba(76, 175, 80, 0.5)';
}

function getUrgencyLabel(urgency?: number): string {
  if (!urgency) return '';
  if (urgency >= 70) return '🔥 Urgent';
  if (urgency >= 40) return '⚡ Soon';
  return '✓ Ready';
}

export default function NextUpCard({ item }: NextUpCardProps) {
  const isSeries = item.type === 'TV_SEASON';

  let badgeEmoji = '';
  let badgeText = '';

  if (item.reason === 'next_episode') {
    badgeEmoji = '📺';
    badgeText = `Ep ${item.nextEpisodeNumber}`;
  } else if (item.reason === 'paused_resume') {
    badgeEmoji = '⏸️';
    badgeText = `Resume • Ep ${item.nextEpisodeNumber}`;
  } else if (item.reason === 'almost_finished') {
    badgeEmoji = '🏁';
    badgeText = `Nearly Done • Ep ${item.nextEpisodeNumber}`;
  } else {
    badgeEmoji = '🎬';
    badgeText = 'Watch Now';
  }

  const progressPercent = isSeries && item.currentProgress && item.totalEpisodes
    ? (item.currentProgress / item.totalEpisodes) * 100
    : null;

  const progressText = isSeries && item.currentProgress !== undefined && item.totalEpisodes
    ? `${item.currentProgress}/${item.totalEpisodes}`
    : null;

  const priorityColor = getPriorityColor(item.urgencyScore);
  const priorityBorder = getPriorityBorder(item.urgencyScore);
  const urgencyLabel = getUrgencyLabel(item.urgencyScore);

  return (
    <Link href={`/titles/${item.slug}`} className="nextup-card-wrapper">
      <div className="nextup-card">
        {/* Poster Image */}
        <div className="nextup-image-wrapper">
          {item.posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w300${item.posterPath}`}
              alt={item.title}
              loading="lazy"
              className="nextup-image"
            />
          ) : (
            <div className="nextup-placeholder">
              {isSeries ? '📺' : '🎬'}
            </div>
          )}

          {/* Urgency Indicator */}
          {item.urgencyScore !== undefined && item.urgencyScore > 0 && (
            <div className="urgency-indicator" style={{ background: priorityColor }}>
              <span className="urgency-text">{urgencyLabel}</span>
            </div>
          )}

          {/* Progress Bar (for series) */}
          {progressPercent !== null && (
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="nextup-info">
          <h4 className="nextup-title" title={item.title}>
            {item.title}
          </h4>

          {/* Badge */}
          <div
            className="nextup-badge"
            style={{
              background: priorityColor,
              borderColor: priorityBorder,
            }}
          >
            <span className="badge-emoji">{badgeEmoji}</span>
            <span className="badge-text">{badgeText}</span>
          </div>

          {/* Progress Text */}
          {progressText && (
            <p className="nextup-progress">
              {progressText} episodes
            </p>
          )}

          {/* Days Stalled Info */}
          {item.daysStalled !== undefined && item.daysStalled > 7 && (
            <p className="nextup-meta">
              Paused {Math.ceil(item.daysStalled / 7)}w ago
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        .nextup-card-wrapper {
          display: block;
          text-decoration: none;
          outline: none;
        }

        .nextup-card {
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, rgb(52, 49, 49) 0%, rgb(45, 42, 42) 100%);
          border: 1px solid rgba(230, 125, 153, 0.12);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          cursor: pointer;
        }

        .nextup-card-wrapper:hover .nextup-card {
          transform: translateY(-8px);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.4),
                      0 0 0 1px rgba(230, 125, 153, 0.3);
          border-color: rgba(230, 125, 153, 0.4);
        }

        .nextup-image-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 2/3;
          overflow: hidden;
          background: linear-gradient(135deg, rgb(62, 58, 58) 0%, rgb(52, 49, 49) 100%);
        }

        .nextup-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .nextup-card-wrapper:hover .nextup-image {
          transform: scale(1.05);
        }

        .nextup-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          background: linear-gradient(135deg, rgb(58, 55, 55) 0%, rgb(48, 45, 45) 100%);
        }

        /* Urgency Indicator */
        .urgency-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 6px 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          backdrop-filter: blur(4px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .urgency-text {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          color: rgb(220, 210, 215);
        }

        /* Progress Bar */
        .progress-bar-container {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, rgb(76, 175, 80) 0%, rgb(75, 192, 192) 100%);
          transition: width 0.3s ease;
        }

        /* Info Section */
        .nextup-info {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-grow: 1;
          background: linear-gradient(180deg, rgb(52, 49, 49) 0%, rgb(42, 39, 39) 100%);
        }

        .nextup-title {
          font-size: 13px;
          font-weight: 700;
          color: rgb(220, 210, 215);
          margin: 0;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        /* Badge */
        .nextup-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          border: 1px solid;
          border-radius: 16px;
          padding: 4px 10px;
          width: fit-content;
          transition: all 0.2s ease;
        }

        .nextup-card-wrapper:hover .nextup-badge {
          transform: scale(1.05);
        }

        .badge-emoji {
          font-size: 11px;
          line-height: 1;
        }

        .badge-text {
          color: rgb(220, 210, 215);
          display: block;
        }

        /* Progress Text */
        .nextup-progress {
          font-size: 9px;
          color: rgba(220, 210, 215, 0.6);
          margin: 0;
          font-weight: 500;
        }

        /* Meta Info */
        .nextup-meta {
          font-size: 8px;
          color: rgba(230, 125, 153, 0.7);
          margin: 0;
          font-weight: 600;
          margin-top: 2px;
        }

        @media (max-width: 640px) {
          .nextup-title {
            font-size: 12px;
          }

          .nextup-badge {
            font-size: 8px;
            padding: 3px 8px;
          }
        }
      `}</style>
    </Link>
  );
}