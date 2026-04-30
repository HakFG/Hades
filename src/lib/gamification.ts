import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  calculateXPForAction,
  getActionLabel,
  type XPAction,
  type XPCalculationMetadata,
} from '@/lib/xp-calculator';
import { getLevelFromXP, getLevelProgress, getLevelUpRange } from '@/lib/level-system';

export const DEFAULT_USER_ID = 'main';

export interface AwardXPInput {
  userId?: string;
  action: XPAction;
  metadata?: XPCalculationMetadata & Record<string, unknown>;
}

export interface AwardXPResult {
  xpGained: number;
  actionXP: number;
  streakBonusXP: number;
  newTotal: number;
  nextLevelAt: number | null;
  currentXP: number;
  xpToNext: number;
  xpPercent: number;
  leveledUp: boolean;
  gainedLevels: number;
  level: number;
  levelName: string;
  previousLevel: number;
  message: string;
  streak: {
    current: number;
    longest: number;
    milestoneReached: number | null;
  };
}

function toJsonObject(value: Record<string, unknown>): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(a: Date, b: Date): number {
  const dayA = startOfDay(a).getTime();
  const dayB = startOfDay(b).getTime();
  return Math.round((dayB - dayA) / 86_400_000);
}

function streakBonusAction(streak: number): XPAction | null {
  if (streak === 30) return 'streak_30_days';
  if (streak === 14) return 'streak_14_days';
  if (streak === 7) return 'streak_7_days';
  if (streak === 3) return 'streak_3_days';
  return null;
}

async function updateStreak(userId: string) {
  const now = new Date();
  const existing = await prisma.streakData.findUnique({ where: { userId } });

  if (!existing) {
    const streak = await prisma.streakData.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDay: now,
      },
    });
    return { streak, advanced: true };
  }

  if (!existing.lastActivityDay) {
    const streak = await prisma.streakData.update({
      where: { userId },
      data: {
        currentStreak: 1,
        longestStreak: Math.max(existing.longestStreak, 1),
        lastActivityDay: now,
      },
    });
    return { streak, advanced: true };
  }

  const diffDays = daysBetween(existing.lastActivityDay, now);
  const diffMs = now.getTime() - existing.lastActivityDay.getTime();

  if (diffDays <= 0) {
    return { streak: existing, advanced: false };
  }

  const nextStreak = diffMs <= 48 * 60 * 60 * 1000 ? existing.currentStreak + 1 : 1;

  const streak = await prisma.streakData.update({
    where: { userId },
    data: {
      currentStreak: nextStreak,
      longestStreak: Math.max(existing.longestStreak, nextStreak),
      lastActivityDay: now,
    },
  });
  return { streak, advanced: true };
}

export async function ensureUserGamification(userId = DEFAULT_USER_ID) {
  const existing = await prisma.userGamification.findUnique({ where: { userId } });
  if (existing) return existing;

  const progress = getLevelProgress(0);

  return prisma.userGamification.create({
    data: {
      userId,
      totalXP: 0,
      currentLevel: progress.currentLevel.level,
      currentXP: progress.currentXP,
      xpToNextLevel: progress.xpToNext,
    },
  });
}

export async function awardXP(input: AwardXPInput): Promise<AwardXPResult> {
  const userId = input.userId || DEFAULT_USER_ID;
  const current = await ensureUserGamification(userId);
  const currentLevel = getLevelFromXP(current.totalXP);
  const calculation = calculateXPForAction(input.action, {
    ...(input.metadata ?? {}),
    levelMultiplier: input.metadata?.levelMultiplier ?? currentLevel.xpMultiplier,
  });

  const streakUpdate = await updateStreak(userId);
  const streak = streakUpdate.streak;
  const milestoneAction = streakUpdate.advanced ? streakBonusAction(streak.currentStreak) : null;
  const streakBonus = milestoneAction
    ? calculateXPForAction(milestoneAction, { levelMultiplier: currentLevel.xpMultiplier })
    : null;

  const streakBonusXP = streakBonus?.xpGained ?? 0;
  const xpGained = calculation.xpGained + streakBonusXP;
  const previousTotal = current.totalXP;
  const newTotal = previousTotal + xpGained;
  const levelUp = getLevelUpRange(previousTotal, newTotal);
  const progress = getLevelProgress(newTotal);

  const metadata = toJsonObject({
    ...(input.metadata ?? {}),
    label: calculation.label,
    multiplier: calculation.multiplier,
    baseXP: calculation.baseXP,
    streakBonusXP,
    streakMilestone: milestoneAction ? streak.currentStreak : null,
  });

  await prisma.$transaction([
    prisma.gamificationActivityLog.create({
      data: {
        userId,
        action: input.action,
        xpGained: calculation.xpGained,
        metadata,
      },
    }),
    ...(streakBonus
      ? [
          prisma.gamificationActivityLog.create({
            data: {
              userId,
              action: milestoneAction as XPAction,
              xpGained: streakBonus.xpGained,
              metadata: toJsonObject({
                label: streakBonus.label,
                streak: streak.currentStreak,
                multiplier: streakBonus.multiplier,
              }),
            },
          }),
        ]
      : []),
    prisma.userGamification.update({
      where: { userId },
      data: {
        totalXP: newTotal,
        currentLevel: progress.currentLevel.level,
        currentXP: progress.currentXP,
        xpToNextLevel: progress.xpToNext,
        lastAwardedAt: new Date(),
      },
    }),
  ]);

  return {
    xpGained,
    actionXP: calculation.xpGained,
    streakBonusXP,
    newTotal,
    nextLevelAt: progress.nextLevel?.xpRequired ?? null,
    currentXP: progress.currentXP,
    xpToNext: progress.xpToNext,
    xpPercent: progress.xpPercent,
    leveledUp: levelUp.leveledUp,
    gainedLevels: levelUp.gainedLevels,
    level: progress.currentLevel.level,
    levelName: progress.currentLevel.title,
    previousLevel: levelUp.previousLevel.level,
    message: levelUp.leveledUp
      ? `Level up! Nivel ${progress.currentLevel.level} - ${progress.currentLevel.title}`
      : `+${xpGained} XP - ${getActionLabel(input.action)}`,
    streak: {
      current: streak.currentStreak,
      longest: streak.longestStreak,
      milestoneReached: milestoneAction ? streak.currentStreak : null,
    },
  };
}

export async function getGamificationStats(userId = DEFAULT_USER_ID) {
  const [game, streak, recentActivity] = await Promise.all([
    ensureUserGamification(userId),
    prisma.streakData.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        currentStreak: 0,
        longestStreak: 0,
      },
    }),
    prisma.gamificationActivityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
  ]);

  const progress = getLevelProgress(game.totalXP);

  return {
    userId,
    totalXP: game.totalXP,
    level: progress.currentLevel.level,
    levelName: progress.currentLevel.title,
    currentXP: progress.currentXP,
    xpToNext: progress.xpToNext,
    xpPercent: progress.xpPercent,
    xpRemaining: progress.xpRemaining,
    nextLevelAt: progress.nextLevel?.xpRequired ?? null,
    nextLevelName: progress.nextLevel?.title ?? null,
    multiplier: progress.currentLevel.xpMultiplier,
    reward: progress.currentLevel.reward,
    streak: {
      current: streak.currentStreak,
      longest: streak.longestStreak,
      lastActivityDay: streak.lastActivityDay?.toISOString() ?? null,
    },
    badges: game.badges,
    recentActivity: recentActivity.map((activity) => ({
      id: activity.id,
      action: activity.action,
      label: getActionLabel(activity.action as XPAction),
      xpGained: activity.xpGained,
      metadata: activity.metadata,
      createdAt: activity.createdAt.toISOString(),
    })),
  };
}
