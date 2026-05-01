'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Achievement } from '@/lib/achievements';

export interface XPNotificationAward {
  xpGained: number;
  actionXP?: number;
  streakBonusXP?: number;
  level: number;
  levelName: string;
  leveledUp: boolean;
  gainedLevels?: number;
  message: string;
  newAchievements?: Achievement[];
  streak?: {
    current: number;
    longest: number;
    milestoneReached: number | null;
  };
}

export interface XPToast {
  id: string;
  xp: number;
  title: string;
  description: string;
  levelUp: boolean;
  streakBonusXP: number;
}

export const XP_AWARDED_EVENT = 'hades:xp-awarded';
export const ACHIEVEMENT_EVENT = 'hades:achievement-unlocked';

export function emitXPNotification(awards: XPNotificationAward[] | XPNotificationAward | undefined | null) {
  if (typeof window === 'undefined' || !awards) return;
  const normalized = Array.isArray(awards) ? awards : [awards];
  if (normalized.length === 0) return;

  window.dispatchEvent(new CustomEvent(XP_AWARDED_EVENT, { detail: { awards: normalized } }));

  // Emite achievements novos encontrados nos awards
  const allNew = normalized.flatMap((a) => a.newAchievements ?? []);
  if (allNew.length > 0) {
    window.dispatchEvent(new CustomEvent(ACHIEVEMENT_EVENT, { detail: { achievements: allNew } }));
  }
}

export function useXPNotification() {
  const [xpToasts, setXpToasts] = useState<XPToast[]>([]);

  const triggerXP = useCallback((awards: XPNotificationAward[] | XPNotificationAward) => {
    const normalized = Array.isArray(awards) ? awards : [awards];
    const xp = normalized.reduce((sum, award) => sum + award.xpGained, 0);
    const streakBonusXP = normalized.reduce((sum, award) => sum + (award.streakBonusXP ?? 0), 0);
    const levelAward = normalized.find((award) => award.leveledUp);
    const lastAward = normalized[normalized.length - 1];

    const toast: XPToast = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      xp,
      title: levelAward
        ? `Level ${levelAward.level}: ${levelAward.levelName}`
        : `+${xp.toLocaleString('pt-BR')} XP`,
      description: levelAward?.message ?? lastAward?.message ?? 'XP recebido',
      levelUp: Boolean(levelAward),
      streakBonusXP,
    };

    setXpToasts((current) => [toast, ...current].slice(0, 4));
    window.setTimeout(() => {
      setXpToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 3800);
  }, []);

  useEffect(() => {
    const handleAwarded = (event: Event) => {
      const customEvent = event as CustomEvent<{ awards?: XPNotificationAward[] }>;
      if (customEvent.detail?.awards?.length) {
        triggerXP(customEvent.detail.awards);
      }
    };

    window.addEventListener(XP_AWARDED_EVENT, handleAwarded);
    return () => window.removeEventListener(XP_AWARDED_EVENT, handleAwarded);
  }, [triggerXP]);

  return { xpToasts, triggerXP };
}