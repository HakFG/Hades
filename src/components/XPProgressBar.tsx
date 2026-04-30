'use client';

import { useEffect, useState } from 'react';
import { Flame, Trophy, Zap } from 'lucide-react';
import styles from './xp-progress.module.css';
import { XP_AWARDED_EVENT } from '@/hooks/useXPNotification';

interface GameStats {
  totalXP: number;
  level: number;
  levelName: string;
  currentXP: number;
  xpToNext: number;
  xpPercent: number;
  xpRemaining: number;
  multiplier: number;
  streak: {
    current: number;
    longest: number;
    lastActivityDay: string | null;
  };
}

function formatCompact(value: number) {
  return Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export default function XPProgressBar() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelPulse, setLevelPulse] = useState(false);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/gamification/user-stats', { cache: 'no-store' });
      if (!res.ok) return;
      setStats(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    const handleAwarded = (event: Event) => {
      const customEvent = event as CustomEvent<{ awards?: Array<{ leveledUp?: boolean }> }>;
      if (customEvent.detail?.awards?.some((award) => award.leveledUp)) {
        setLevelPulse(true);
        window.setTimeout(() => setLevelPulse(false), 900);
      }
      window.setTimeout(loadStats, 160);
    };

    window.addEventListener(XP_AWARDED_EVENT, handleAwarded);
    return () => window.removeEventListener(XP_AWARDED_EVENT, handleAwarded);
  }, []);

  if (loading && !stats) {
    return (
      <div className={`${styles.container} ${styles.loading}`} aria-label="Carregando XP">
        <div className={styles.skeletonTop} />
        <div className={styles.skeletonBar} />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={`${styles.container} ${levelPulse ? styles.levelUp : ''}`} title={`${stats.totalXP.toLocaleString('pt-BR')} XP total`}>
      <div className={styles.header}>
        <div className={styles.levelCluster}>
          <span className={styles.levelBadge}>
            <Trophy size={13} aria-hidden="true" />
            {stats.level}
          </span>
          <span className={styles.levelName}>{stats.levelName}</span>
        </div>
        <span className={styles.streakBadge} title={`Maior streak: ${stats.streak.longest} dias`}>
          <Flame size={13} aria-hidden="true" />
          {stats.streak.current}
        </span>
      </div>

      <div className={styles.barShell} aria-label={`Progresso do nivel ${stats.level}: ${stats.xpPercent}%`}>
        <div className={styles.barTrack}>
          <div className={styles.barFill} style={{ width: `${stats.xpPercent}%` }} />
        </div>
      </div>

      <div className={styles.footer}>
        <span>{formatCompact(stats.currentXP)} / {formatCompact(stats.xpToNext)} XP</span>
        <span className={styles.multiplier}>
          <Zap size={12} aria-hidden="true" />
          {stats.multiplier.toFixed(2)}x
        </span>
      </div>
    </div>
  );
}
