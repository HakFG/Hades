'use client';

import Link from 'next/link';
import { memo } from 'react';
import { Check, Pencil, Plus } from 'lucide-react';
import StatusBubble from '@/components/StatusBubble';

export interface SearchMediaItem {
  tmdbId: number;
  parentTmdbId?: number;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  type: 'MOVIE' | 'TV_SEASON';
  episode_count?: number | null;
  season_number?: number | null;
  linkSlug: string;
  popularity?: number;
  airYear?: string;
  airDate?: string | null;
  seriesStatus?: string;
  productionStatus?: string;
  seasonStatus?: string | null;
  overview?: string | null;
  voteAverage?: number | null;
}

export interface SearchEntryStatus {
  id: string;
  tmdbId: number;
  status: string;
  score: number;
  progress: number;
  totalEpisodes?: number | null;
  slug: string;
}

interface SearchMediaCardProps {
  item: SearchMediaItem;
  entry?: SearchEntryStatus | null;
  priority?: boolean;
  onEdit: (item: SearchMediaItem, entry?: SearchEntryStatus | null) => void;
}

const STATUS_COLORS: Record<string, string> = {
  WATCHING: '#38bdf8',
  COMPLETED: '#22c55e',
  PAUSED: '#f59e0b',
  DROPPED: '#ef4444',
  PLANNING: '#a78bfa',
  REWATCHING: '#ec4899',
  UPCOMING: '#f97316',
};

function SearchMediaCard({ item, entry, priority = false, onEdit }: SearchMediaCardProps) {
  const poster = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : '';
  const statusColor = entry?.status ? STATUS_COLORS[entry.status] ?? '#8b949e' : null;

  return (
    <div className="card-wrap">
      <Link href={`/titles/${entry?.slug ?? item.linkSlug}`} className="card">
        <div className="poster">
          <StatusBubble status={item.seasonStatus ?? null} size="sm" position="tl" />
          {entry && (
            <span className="list-badge" style={{ background: statusColor ?? undefined }}>
              <Check size={12} />
              {entry.status.replace('_', ' ')}
            </span>
          )}
          {poster ? (
            <img src={poster} alt={item.title} loading={priority ? 'eager' : 'lazy'} />
          ) : (
            <div className="placeholder">{item.type === 'MOVIE' ? 'Movie' : 'TV'}</div>
          )}
          <div className="shade" />
          <button
            type="button"
            className="edit"
            title={entry ? 'Update status' : 'Add to list'}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onEdit(item, entry);
            }}
          >
            {entry ? <Pencil size={15} /> : <Plus size={16} />}
          </button>
          <div className="meta">
            <strong>{item.productionStatus ?? (item.type === 'MOVIE' ? 'Movie' : 'TV Season')}</strong>
            <span>{[item.airYear, item.voteAverage ? item.voteAverage.toFixed(1) : null].filter(Boolean).join(' · ')}</span>
          </div>
        </div>
        <p>{item.title}</p>
      </Link>

      <style jsx>{`
        @keyframes badgePop {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.92);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .card-wrap {
          min-width: 0;
          contain: layout paint;
        }

        .card {
          display: block;
          min-width: 0;
          color: rgb(220, 210, 215);
          text-decoration: none;
          outline: none;
        }

        .poster {
          position: relative;
          aspect-ratio: 2 / 3;
          overflow: hidden;
          border-radius: 8px;
          background: rgb(58, 55, 55);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          transform: translateZ(0);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .card:hover .poster,
        .card:focus-visible .poster {
          transform: translateY(-4px);
          border-color: rgba(230, 125, 153, 0.5);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.44);
        }

        img,
        .placeholder {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.24s ease;
        }

        .card:hover img,
        .card:focus-visible img {
          transform: scale(1.045);
        }

        .placeholder {
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgb(58, 55, 55), rgb(42, 39, 39));
          color: rgba(220, 210, 215, 0.42);
          font-size: 12px;
          font-weight: 900;
        }

        .shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(20, 18, 18, 0.9), rgba(20, 18, 18, 0.08) 62%, transparent);
          opacity: 0;
          transition: opacity 0.18s ease;
        }

        .card:hover .shade,
        .card:focus-visible .shade {
          opacity: 1;
        }

        .list-badge {
          position: absolute;
          z-index: 3;
          top: 8px;
          right: 8px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          max-width: calc(100% - 16px);
          min-height: 21px;
          padding: 3px 6px;
          border-radius: 6px;
          color: white;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          box-shadow: 0 5px 14px rgba(0, 0, 0, 0.32);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          animation: badgePop 0.22s ease both;
        }

        .edit {
          position: absolute;
          z-index: 4;
          right: 8px;
          bottom: 8px;
          display: grid;
          place-items: center;
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 8px;
          background: rgb(230, 125, 153);
          color: white;
          opacity: 0;
          transform: translateY(6px);
          cursor: pointer;
          transition: opacity 0.18s ease, transform 0.18s ease, background 0.18s ease;
        }

        .card:hover .edit,
        .card:focus-visible .edit,
        .edit:focus-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .edit:hover,
        .edit:focus-visible {
          background: rgb(242, 145, 171);
          outline: none;
          box-shadow: 0 0 0 3px rgba(230, 125, 153, 0.22);
        }

        .edit:active {
          transform: translateY(1px) scale(0.98);
        }

        .meta {
          position: absolute;
          right: 42px;
          bottom: 8px;
          left: 8px;
          display: grid;
          gap: 2px;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.18s ease, transform 0.18s ease;
        }

        .card:hover .meta,
        .card:focus-visible .meta {
          opacity: 1;
          transform: translateY(0);
        }

        strong {
          color: rgb(232, 226, 223);
          font-size: 10px;
          line-height: 1.2;
        }

        span {
          color: rgba(220, 210, 215, 0.64);
          font-size: 9px;
        }

        p {
          margin: 8px 0 0;
          color: rgba(220, 210, 215, 0.76);
          font-size: 11px;
          font-weight: 800;
          line-height: 1.28;
          text-align: center;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .card:hover p,
        .card:focus-visible p {
          color: rgb(230, 125, 153);
        }

        @media (prefers-reduced-motion: reduce) {
          .poster,
          img,
          .shade,
          .edit,
          .meta,
          .list-badge,
          p {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(SearchMediaCard, (prev, next) => {
  return (
    prev.item.tmdbId === next.item.tmdbId &&
    prev.item.title === next.item.title &&
    prev.entry?.status === next.entry?.status &&
    prev.entry?.progress === next.entry?.progress
  );
});
