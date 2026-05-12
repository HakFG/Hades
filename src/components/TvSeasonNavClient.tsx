'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type TmdbSeasonRow = { season_number: number; episode_count: number; name: string };

const cache = new Map<number, TmdbSeasonRow[]>();

interface TvSeasonNavClientProps {
  showTmdbId: number | null | undefined;
  currentSeason: number | null | undefined;
  compact?: boolean;
}

export default function TvSeasonNavClient({
  showTmdbId,
  currentSeason,
  compact = true,
}: TvSeasonNavClientProps) {
  const [seasons, setSeasons] = useState<TmdbSeasonRow[]>([]);
  const [err, setErr] = useState(false);

  const current = currentSeason ?? 1;

  useEffect(() => {
    if (!showTmdbId) return;
    let cancelled = false;

    const run = async () => {
      if (cache.has(showTmdbId)) {
        if (!cancelled) setSeasons(cache.get(showTmdbId)!);
        return;
      }
      const key = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      if (!key) {
        setErr(true);
        return;
      }
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/tv/${showTmdbId}?api_key=${key}&language=en-US`,
        );
        if (!res.ok) throw new Error('tmdb');
        const data = await res.json();
        const list: TmdbSeasonRow[] = (Array.isArray(data.seasons) ? data.seasons : [])
          .filter((s: { season_number?: number }) => (s.season_number ?? 0) > 0)
          .map((s: { season_number: number; episode_count?: number; name?: string }) => ({
            season_number: s.season_number,
            episode_count: s.episode_count ?? 0,
            name: s.name || `Season ${s.season_number}`,
          }))
          .sort((a: TmdbSeasonRow, b: TmdbSeasonRow) => a.season_number - b.season_number);
        cache.set(showTmdbId, list);
        if (!cancelled) setSeasons(list);
      } catch {
        if (!cancelled) setErr(true);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [showTmdbId]);

  const rows = useMemo(() => seasons, [seasons]);

  if (!showTmdbId || err || rows.length <= 1) return null;

  return (
    <div className="tv-season-nav" data-compact={compact ? '1' : '0'}>
      <span className="label">Seasons</span>
      <div className="scroll">
        {rows.map((s) => {
          const href = `/titles/tv-${showTmdbId}-s${s.season_number}`;
          const active = s.season_number === current;
          return (
            <Link
              key={s.season_number}
              href={href}
              className={active ? 'pill active' : 'pill'}
              title={s.name}
            >
              S{s.season_number}
            </Link>
          );
        })}
      </div>
      <style jsx>{`
        .tv-season-nav {
          display: grid;
          gap: 6px;
          margin-top: 8px;
          width: 100%;
          min-width: 0;
        }
        .label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(220, 210, 215, 0.45);
        }
        .scroll {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-height: ${compact ? '52px' : 'none'};
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 2px;
          scrollbar-width: thin;
        }
        .pill {
          flex: 0 0 auto;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgb(48, 45, 45);
          color: rgba(220, 210, 215, 0.72);
          font-size: 10px;
          font-weight: 800;
          text-decoration: none;
          line-height: 1.2;
        }
        .pill:hover {
          border-color: rgba(230, 125, 153, 0.45);
          color: rgb(232, 226, 223);
        }
        .pill.active {
          border-color: rgba(230, 125, 153, 0.65);
          background: rgba(230, 125, 153, 0.2);
          color: rgb(248, 240, 236);
        }
      `}</style>
    </div>
  );
}
