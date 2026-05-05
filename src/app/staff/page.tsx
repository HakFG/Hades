'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { posterUrl } from '@/lib/staff';
import styles from './staff.module.css';

interface SearchHit {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string | null;
  popularity: number;
}

export default function StaffBrowsePage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (query: string) => {
    const t = query.trim();
    if (t.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/search?q=${encodeURIComponent(t)}`);
      const j = await res.json();
      setResults(Array.isArray(j.results) ? j.results : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => runSearch(q), 320);
    return () => window.clearTimeout(t);
  }, [q, runSearch]);

  return (
    <div className={styles.staffPage}>
      <h1 className={styles.staffBrowseTitle}>Pessoas</h1>
      <p className={styles.staffBrowseHint}>
        Atores, diretores e equipe — dados do The Movie Database (TMDB). Busque pelo
        nome.
      </p>
      <input
        className={styles.staffSearchInput}
        type="search"
        placeholder="Ex.: Christopher Nolan, Zendaya…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoComplete="off"
        aria-label="Buscar pessoa"
      />
      {loading && <p className={styles.staffBrowseHint}>Buscando…</p>}
      <div className={styles.staffSearchGrid}>
        {results.map((p) => {
          const img = posterUrl(p.profile_path, 'w342');
          return (
            <Link
              key={p.id}
              href={`/staff/${p.id}`}
              className={styles.staffSearchCard}
              title={p.name}
            >
              <div className={styles.staffSearchPhoto}>
                {img ? (
                  <img src={img} alt="" />
                ) : (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    NO IMAGE
                  </div>
                )}
              </div>
              <div className={styles.staffSearchName}>{p.name}</div>
              {p.known_for_department && (
                <div className={styles.staffSearchDept}>{p.known_for_department}</div>
              )}
            </Link>
          );
        })}
      </div>
      {!loading && q.trim().length >= 2 && results.length === 0 && (
        <p className={styles.staffBrowseHint}>Nenhum resultado.</p>
      )}
    </div>
  );
}
