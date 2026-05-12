'use client';

interface SeasonSummary {
  id: string;
  seasonNumber: number;
  title: string;
  episodeCount: number;
  status: string;
}

interface SeasonSelectorProps {
  seasons: SeasonSummary[];
  selectedSeasonId?: string | null;
  onSeasonChange: (seasonId: string) => void;
}

export default function SeasonSelector({
  seasons,
  selectedSeasonId,
  onSeasonChange,
}: SeasonSelectorProps) {
  if (seasons.length === 0) return null;

  return (
    <div className="season-selector">
      {seasons.map((season) => (
        <button
          key={season.id}
          type="button"
          className={season.id === selectedSeasonId ? 'active' : ''}
          onClick={() => onSeasonChange(season.id)}
          title={`${season.title} - ${season.status}`}
        >
          <span>S{season.seasonNumber}</span>
          <small>{season.episodeCount} eps</small>
        </button>
      ))}

      <style jsx>{`
        .season-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        button {
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
        }

        button.active,
        button:hover {
          border-color: rgba(230, 125, 153, 0.45);
          background: rgba(230, 125, 153, 0.15);
          color: rgb(232, 226, 223);
        }

        span {
          font-size: 12px;
          font-weight: 800;
        }

        small {
          font-size: 10px;
          color: rgba(220, 210, 215, 0.48);
        }
      `}</style>
    </div>
  );
}

