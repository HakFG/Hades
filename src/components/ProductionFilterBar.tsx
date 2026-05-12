'use client';

import {
  PRODUCTION_STATUS_COLORS,
  productionStatusesFor,
  type MediaKind,
  type ProductionStatus,
} from '@/lib/production-status';

interface ProductionFilterBarProps {
  mediaType: MediaKind;
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
}

export default function ProductionFilterBar({
  mediaType,
  selectedFilters,
  onFilterChange,
}: ProductionFilterBarProps) {
  const statuses = productionStatusesFor(mediaType);
  const allSelected = selectedFilters.length === 0 || selectedFilters.includes('All');

  const toggle = (status: ProductionStatus) => {
    if (allSelected) {
      onFilterChange([status]);
      return;
    }

    const next = selectedFilters.includes(status)
      ? selectedFilters.filter((item) => item !== status)
      : [...selectedFilters, status];

    onFilterChange(next.length ? next : ['All']);
  };

  return (
    <div className="production-filter-bar" role="group" aria-label="Production status filters">
      <button
        type="button"
        className={allSelected ? 'active' : ''}
        onClick={() => onFilterChange(['All'])}
      >
        All
      </button>
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          className={!allSelected && selectedFilters.includes(status) ? 'active' : ''}
          onClick={() => toggle(status)}
        >
          <span style={{ background: PRODUCTION_STATUS_COLORS[status] }} />
          {status}
        </button>
      ))}

      <style jsx>{`
        .production-filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 32px;
          padding: 6px 11px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgb(52, 49, 49);
          color: rgba(220, 210, 215, 0.72);
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
        }

        button:hover,
        button.active {
          border-color: rgba(230, 125, 153, 0.42);
          background: rgba(230, 125, 153, 0.14);
          color: rgb(232, 226, 223);
        }

        span {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18);
        }
      `}</style>
    </div>
  );
}
