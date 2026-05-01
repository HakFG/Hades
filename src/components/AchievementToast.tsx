'use client';

import { useEffect, useState, useCallback } from 'react';
import { type Achievement, RARITY_COLOR } from '@/lib/achievements';

export const ACHIEVEMENT_EVENT = 'hades:achievement-unlocked';

export function emitAchievementNotification(achievements: Achievement[]) {
  if (typeof window === 'undefined' || !achievements.length) return;
  window.dispatchEvent(new CustomEvent(ACHIEVEMENT_EVENT, { detail: { achievements } }));
}

interface AchievementToastItem {
  id: string;
  achievement: Achievement;
}

export default function AchievementToast() {
  const [toasts, setToasts] = useState<AchievementToastItem[]>([]);

  const push = useCallback((ach: Achievement) => {
    const item: AchievementToastItem = {
      id: `${ach.id}-${Date.now()}`,
      achievement: ach,
    };
    setToasts((prev) => [item, ...prev].slice(0, 3));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== item.id));
    }, 5000);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const event = e as CustomEvent<{ achievements: Achievement[] }>;
      event.detail?.achievements?.forEach(push);
    };
    window.addEventListener(ACHIEVEMENT_EVENT, handler);
    return () => window.removeEventListener(ACHIEVEMENT_EVENT, handler);
  }, [push]);

  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => {
        const color = RARITY_COLOR[t.achievement.rarity];
        return (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: 'rgba(26, 23, 23, 0.97)',
              border: `1px solid ${color}55`,
              borderLeft: `3px solid ${color}`,
              borderRadius: '6px',
              padding: '12px 18px',
              minWidth: '280px',
              maxWidth: '340px',
              boxShadow: `0 4px 24px rgba(0,0,0,0.6), 0 0 12px ${color}22`,
              animation: 'achievementSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            <span style={{ fontSize: '28px', lineHeight: 1, flexShrink: 0 }}>{t.achievement.icon}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color,
                marginBottom: '2px',
                fontFamily: 'Overpass, sans-serif',
              }}>
                Achievement Desbloqueado
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#e8e2df',
                fontFamily: 'Cinzel, serif',
                letterSpacing: '0.03em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {t.achievement.icon} {t.achievement.name}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#a09898',
                fontFamily: 'Overpass, sans-serif',
                marginTop: '1px',
              }}>
                {t.achievement.description} · <span style={{ color: '#c9973a' }}>+{t.achievement.xpReward} XP</span>
              </div>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes achievementSlideIn {
          from { opacity: 0; transform: translateX(-24px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}