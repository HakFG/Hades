'use client';

import { SlidersHorizontal } from 'lucide-react';

export interface AdvancedFilters {
  minRating: number;
  maxRuntime: number;
  network: string;
  hiddenGems: boolean;
}

interface AdvancedFilterChipsProps {
  mediaType: 'movie' | 'tv';
  selectedFormat: string;
  selectedStatus: string;
  filters: AdvancedFilters;
  onFormatChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onFiltersChange: (filters: AdvancedFilters) => void;
}

const TV_FORMATS = [
  { value: 'scripted', label: 'TV Series' },
  { value: 'miniseries', label: 'Miniseries' },
  { value: 'special', label: 'Specials' },
  { value: 'reality', label: 'Reality' },
  { value: 'documentary', label: 'Documentary' },
];

const MOVIE_FORMATS = [
  { value: 'movie', label: 'Feature' },
  { value: 'short', label: 'Short' },
];

const TV_STATUSES = [
  { value: 'airing', label: 'Airing' },
  { value: 'finished', label: 'Finished' },
  { value: 'not_yet_aired', label: 'Not Yet Aired' },
];

const NETWORKS = [
  { value: '', label: 'Any Network' },
  { value: '213', label: 'Netflix' },
  { value: '49', label: 'HBO' },
  { value: '2552', label: 'Apple TV+' },
  { value: '2739', label: 'Disney+' },
  { value: '1024', label: 'Prime Video' },
];

export default function AdvancedFilterChips({
  mediaType,
  selectedFormat,
  selectedStatus,
  filters,
  onFormatChange,
  onStatusChange,
  onFiltersChange,
}: AdvancedFilterChipsProps) {
  const formats = mediaType === 'tv' ? TV_FORMATS : MOVIE_FORMATS;

  return (
    <div className="advanced-filters">
      <div className="filter-title">
        <SlidersHorizontal size={14} />
        <span>Smart filters</span>
      </div>

      <div className="chip-row">
        {formats.map((format) => (
          <button
            key={format.value}
            type="button"
            className={selectedFormat === format.value ? 'active' : ''}
            onClick={() => onFormatChange(selectedFormat === format.value ? '' : format.value)}
          >
            {format.label}
          </button>
        ))}
      </div>

      {mediaType === 'tv' && (
        <div className="chip-row">
          {TV_STATUSES.map((status) => (
            <button
              key={status.value}
              type="button"
              className={selectedStatus === status.value ? 'active' : ''}
              onClick={() => onStatusChange(selectedStatus === status.value ? '' : status.value)}
            >
              {status.label}
            </button>
          ))}
        </div>
      )}

      <div className="control-grid">
        <label>
          <span>TMDB score {'>='} {filters.minRating.toFixed(1)}</span>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={filters.minRating}
            onChange={(event) => onFiltersChange({ ...filters, minRating: Number(event.target.value) })}
          />
        </label>

        <label>
          <span>{mediaType === 'tv' ? 'Episode runtime' : 'Runtime'} {'<='} {filters.maxRuntime || 'any'} min</span>
          <input
            type="range"
            min="0"
            max="180"
            step="5"
            value={filters.maxRuntime}
            onChange={(event) => onFiltersChange({ ...filters, maxRuntime: Number(event.target.value) })}
          />
        </label>

        {mediaType === 'tv' && (
          <label>
            <span>Network</span>
            <select
              value={filters.network}
              onChange={(event) => onFiltersChange({ ...filters, network: event.target.value })}
            >
              {NETWORKS.map((network) => (
                <option key={network.value || 'any'} value={network.value}>
                  {network.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="toggle">
          <input
            type="checkbox"
            checked={filters.hiddenGems}
            onChange={(event) => onFiltersChange({ ...filters, hiddenGems: event.target.checked })}
          />
          <span>Hidden gems</span>
        </label>
      </div>

      <style jsx>{`
        @keyframes filterChipIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .advanced-filters {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 10px;
          padding: 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.055);
          animation: filterChipIn 0.22s ease both;
        }

        .filter-title,
        .chip-row,
        .toggle {
          display: flex;
          align-items: center;
        }

        .filter-title {
          gap: 8px;
          color: rgba(220, 210, 215, 0.42);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .chip-row {
          flex-wrap: wrap;
          gap: 8px;
        }

        button {
          min-height: 30px;
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(58, 55, 55, 0.72);
          color: rgba(220, 210, 215, 0.68);
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }

        button:hover,
        button.active {
          border-color: rgba(230, 125, 153, 0.46);
          background: rgba(230, 125, 153, 0.14);
          color: rgb(232, 226, 223);
          transform: translateY(-1px);
        }

        .control-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px 14px;
        }

        label {
          display: grid;
          gap: 6px;
          min-width: 0;
          color: rgba(220, 210, 215, 0.68);
          font-size: 11px;
          font-weight: 800;
        }

        input[type='range'] {
          width: 100%;
          accent-color: rgb(230, 125, 153);
          transition: filter 0.18s ease;
        }

        input[type='range']:hover {
          filter: brightness(1.18);
        }

        select {
          min-height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(58, 55, 55, 0.9);
          color: rgb(220, 210, 215);
          font: inherit;
          font-size: 12px;
          padding: 0 10px;
          transition: border-color 0.18s ease, background 0.18s ease;
        }

        select:hover {
          border-color: rgba(230, 125, 153, 0.28);
        }

        .toggle {
          grid-template-columns: 18px 1fr;
          align-content: center;
          align-items: center;
          gap: 8px;
          min-height: 52px;
        }

        .toggle input {
          width: 16px;
          height: 16px;
          accent-color: rgb(230, 125, 153);
        }

        @media (prefers-reduced-motion: reduce) {
          .advanced-filters,
          button,
          input,
          select {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
