'use client';

import { Sparkles, Trophy } from 'lucide-react';
import { useXPNotification } from '@/hooks/useXPNotification';
import styles from './xp-progress.module.css';

export default function XPToastHost() {
  const { xpToasts } = useXPNotification();

  if (xpToasts.length === 0) return null;

  return (
    <div className={styles.toastViewport} aria-live="polite" aria-atomic="false">
      {xpToasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${toast.levelUp ? styles.toastLevelUp : ''}`}>
          <div className={styles.toastIcon}>
            {toast.levelUp ? <Trophy size={20} aria-hidden="true" /> : <Sparkles size={20} aria-hidden="true" />}
          </div>
          <div className={styles.toastBody}>
            <strong>{toast.title}</strong>
            <span>{toast.description}</span>
            {toast.streakBonusXP > 0 && (
              <small>Bonus de streak: +{toast.streakBonusXP.toLocaleString('pt-BR')} XP</small>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
