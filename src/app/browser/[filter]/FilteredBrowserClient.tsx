'use client';

import { useEffect, useMemo, useState } from 'react';
import MediaCard from '@/components/MediaCard';
import ProductionFilterBar from '@/components/ProductionFilterBar';
import {
  getFilteredEntriesByBrowser,
  type BrowserMediaItem,
} from '@/lib/browser-filter';

interface FilteredBrowserClientProps {
  filter: string;
  type: 'movie' | 'tv';
  initialFilters: string[];
  initialResults: BrowserMediaItem[];
}

export default function FilteredBrowserClient({
  filter,
  type,
  initialFilters,
  initialResults,
}: FilteredBrowserClientProps) {
  const [selectedFilters, setSelectedFilters] = useState(initialFilters);
  const [results, setResults] = useState(initialResults);
  const [loading, setLoading] = useState(false);
  const title = useMemo(() => filter.replace(/-/g, ' '), [filter]);

  useEffect(() => {
    let cancelled = false;
    getFilteredEntriesByBrowser(type, filter, selectedFilters)
      .then((items) => {
        if (!cancelled) setResults(items);
      })
      .catch((error) => console.error('[browser-filter]', error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter, selectedFilters, type]);

  const handleFilterChange = (filters: string[]) => {
    setLoading(true);
    setSelectedFilters(filters);
  };

  return (
    <main className="filtered-browser-page">
      <header>
        <div>
          <h1>{title}</h1>
          <p>{results.length} results</p>
        </div>
        <ProductionFilterBar
          mediaType={type}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
        />
      </header>

      {loading ? (
        <div className="loader">Loading...</div>
      ) : (
        <div className="media-grid">
          {results.map((item) => (
            <MediaCard key={item.id} item={item} showStatus />
          ))}
        </div>
      )}

      <style jsx>{`
        .filtered-browser-page {
          max-width: 1320px;
          min-height: 100vh;
          margin: 0 auto;
          padding: 32px 24px 72px;
          color: rgb(220, 210, 215);
          background: rgb(42, 39, 39);
          font-family: 'Overpass', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        header {
          display: grid;
          gap: 18px;
          margin-bottom: 26px;
        }

        h1 {
          margin: 0 0 4px;
          color: rgb(232, 226, 223);
          font-size: 28px;
          letter-spacing: 0;
          text-transform: capitalize;
        }

        p {
          margin: 0;
          color: rgba(220, 210, 215, 0.52);
          font-size: 13px;
        }

        .loader {
          padding: 72px 0;
          text-align: center;
          color: rgba(220, 210, 215, 0.52);
        }

        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(138px, 1fr));
          gap: 18px;
        }

        @media (max-width: 720px) {
          .filtered-browser-page {
            padding: 24px 16px 56px;
          }

          .media-grid {
            grid-template-columns: repeat(auto-fill, minmax(116px, 1fr));
            gap: 14px;
          }
        }
      `}</style>
    </main>
  );
}
