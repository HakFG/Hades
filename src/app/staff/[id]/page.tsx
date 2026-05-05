'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { StaffHeader }       from '@/components/StaffComponents/StaffHeader';
import { StaffRolesSection } from '@/components/StaffComponents/StaffRolesSection';
import type { StaffPersonPayload } from '@/lib/staff';
import type { RichRoleCard }       from '@/app/api/staff/[id]/route';
import styles from '../staff.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiPayload = {
  person: StaffPersonPayload;
  movies: RichRoleCard[];
  tv:     RichRoleCard[];
};

export type SortKey =
  | 'newest'
  | 'oldest'
  | 'title';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'title',  label: 'Title'  },
];

// ─── Sort helper ──────────────────────────────────────────────────────────────

function sortCards(cards: RichRoleCard[], key: SortKey): RichRoleCard[] {
  const copy = [...cards];
  switch (key) {
    case 'newest':
      return copy.sort((a, b) => {
        if (!a.releaseDate && !b.releaseDate) return 0;
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return b.releaseDate.localeCompare(a.releaseDate);
      });
    case 'oldest':
      return copy.sort((a, b) => {
        if (!a.releaseDate && !b.releaseDate) return 0;
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return a.releaseDate.localeCompare(b.releaseDate);
      });
    case 'title':
      return copy.sort((a, b) =>
        a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }),
      );
    default:
      return copy;
  }
}

// ─── Sort Dropdown ────────────────────────────────────────────────────────────

function SortDropdown({
  value,
  onChange,
}: {
  value:    SortKey;
  onChange: (k: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.key === value)!;

  return (
    <div className={styles.sortWrapper}>
      <button
        type="button"
        className={styles.sortTrigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          style={{ flexShrink: 0 }}
        >
          <path
            d="M1 3h10M3 6h6M5 9h2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span>{current.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden
          style={{
            flexShrink: 0,
            transition: 'transform 0.18s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path
            d="M2 3.5l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop para fechar */}
          <div
            className={styles.sortBackdrop}
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className={styles.sortDropdown}
          >
            {SORT_OPTIONS.map((opt) => (
              <li
                key={opt.key}
                role="option"
                aria-selected={opt.key === value}
                className={`${styles.sortOption} ${opt.key === value ? styles.sortOptionActive : ''}`}
                onClick={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
              >
                {opt.key === value && (
                  <span className={styles.sortOptionCheck} aria-hidden>✓</span>
                )}
                {opt.label}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [data,    setData]    = useState<ApiPayload | null>(null);
  const [err,     setErr]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort,    setSort]    = useState<SortKey>('newest');

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/staff/${id}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `HTTP ${res.status}`);
        }
        const json = (await res.json()) as ApiPayload;
        if (!cancel) setData(json);
      } catch (e: any) {
        if (!cancel) setErr(e?.message ?? 'Failed to load');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [id]);

  // Ordena client-side sempre que sort ou data mudam
  const sortedMovies = useMemo(
    () => (data ? sortCards(data.movies, sort) : []),
    [data, sort],
  );
  const sortedTv = useMemo(
    () => (data ? sortCards(data.tv, sort) : []),
    [data, sort],
  );

  const hasCredits = sortedMovies.length > 0 || sortedTv.length > 0;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.staffPage}>
        <div className={styles.staffLoading}>Loading…</div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (err || !data) {
    return (
      <div className={styles.staffPage}>
        <div className={styles.staffError}>{err ?? 'Not found.'}</div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.staffPage}>
      <StaffHeader person={data.person} />

      {hasCredits && (
        <div className={styles.sortBar}>
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      )}

      <StaffRolesSection title="Movie Credits" cards={sortedMovies} />
      <StaffRolesSection title="TV Credits"    cards={sortedTv}     />

      {!hasCredits && (
        <p className={styles.staffBrowseHint} style={{ marginTop: 24 }}>
          No credits listed on TMDB for this person.
        </p>
      )}
    </div>
  );
}