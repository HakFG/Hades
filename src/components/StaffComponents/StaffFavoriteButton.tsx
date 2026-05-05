'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from '@/app/staff/staff.module.css';

const STORAGE_KEY = 'hades_staff_favorites';

function readIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'number') : [];
  } catch {
    return [];
  }
}

export function StaffFavoriteButton({ personId }: { personId: number }) {
  const [fav, setFav] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setFav(readIds().includes(personId));
  }, [personId]);

  const toggle = useCallback(() => {
    setPulse(true);
    window.setTimeout(() => setPulse(false), 240);
    const arr = readIds();
    let next: number[];
    if (arr.includes(personId)) {
      next = arr.filter((id) => id !== personId);
      setFav(false);
    } else {
      next = [...arr, personId];
      setFav(true);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [personId]);

  return (
    <button
      type="button"
      className={`${styles.staffFavoriteBtn} ${fav ? styles.staffFavOn : styles.staffFavOff} ${pulse ? styles.staffFavPulse : ''}`}
      onClick={toggle}
      aria-pressed={fav}
    >
      <span aria-hidden>{fav ? '♥' : '♡'}</span>
      <span>{fav ? 'Saved' : 'Favorite'}</span>
    </button>
  );
}