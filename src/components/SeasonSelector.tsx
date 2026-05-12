'use client';

import Link from 'next/link';

export interface SeasonSummary {
  id: string;
  seasonNumber: number;
  title: string;
  episodeCount: number;
  status: string;
  /** Quando definido, navega para a página da temporada (integração TMDB / site). */
  href?: string;
}

interface SeasonSelectorProps {
  seasons: SeasonSummary[];
  selectedSeasonId?: string | null;
  onSeasonChange?: (seasonId: string) => void;
  compact?: boolean;
}

export default function SeasonSelector({
  seasons,
  selectedSeasonId,
  onSeasonChange,
  compact = false,
}: SeasonSelectorProps) {
  if (seasons.length === 0) return null;

  return (
    <div className="season-selector" data-compact={compact ? '1' : '0'}>
      {seasons.map((season) => {
        const active = season.id === selectedSeasonId;
        const cls = `pill ${active ? 'active' : ''}`;
        const title = `${season.title} — ${season.status}`;

        if (season.href) {
          return (
            <Link key={season.id} href={season.href} className={cls} title={title} scroll>
              <span>S{season.seasonNumber}</span>
              <small>{season.episodeCount} eps</small>
            </Link>
          );
        }

        return (
          <button
            key={season.id}
            type="button"
            className={cls}
            title={title}
            onClick={() => onSeasonChange?.(season.id)}
          >
            <span>S{season.seasonNumber}</span>
            <small>{season.episodeCount} eps</small>
          </button>
        );
      })}

      <style jsx>{`
        .season-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .season-selector[data-compact='1'] {
          gap: 6px;
        }

        .pill,
        a.pill {
          min-width: 62px;
          display: grid;
          gap: 1px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgb(52, 49, 49);
          color: rgba(220, 210, 215, 0.7);
          cursor: pointer;
          font: inherit;
          line-height: 1.15;
          text-decoration: none;
          box-sizing: border-box;
          text-align: center;
        }
        .season-selector[data-compact='1'] .pill,
        .season-selector[data-compact='1'] a.pill {
          min-width: 52px;
          padding: 5px 7px;
          border-radius: 6px;
        }

        .pill.active,
        a.pill.active,
        .pill:hover,
        a.pill:hover {
          border-color: rgba(230, 125, 153, 0.45);
          background: rgba(230, 125, 153, 0.15);
          color: rgb(232, 226, 223);
        }

        .pill span,
        a.pill span {
          font-size: 12px;
          font-weight: 800;
        }
        .season-selector[data-compact='1'] .pill span,
        .season-selector[data-compact='1'] a.pill span {
          font-size: 11px;
        }

        .pill small,
        a.pill small {
          font-size: 10px;
          color: rgba(220, 210, 215, 0.48);
        }
        .season-selector[data-compact='1'] .pill small,
        .season-selector[data-compact='1'] a.pill small {
          font-size: 9px;
        }
      `}</style>
    </div>
  );
}
