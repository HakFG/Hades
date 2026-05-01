// src/lib/gamification.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  calculateXPForAction,
  getActionLabel,
  type XPAction,
  type XPCalculationMetadata,
} from '@/lib/xp-calculator';
import { getLevelFromXP, getLevelProgress, getLevelUpRange } from '@/lib/level-system';
import { checkAchievements, ACHIEVEMENTS, type Achievement } from '@/lib/achievements';
import {
  getGamificationAfterChallengeRewards,
  trackChallengesForAction,
  type ChallengeProgressResult,
} from '@/lib/challenge-tracker';

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
  skipped?: boolean;
  skipReason?: string;
  newAchievements: Achievement[];
  challengeProgress: ChallengeProgressResult[];
  completedChallenges: ChallengeProgressResult[];
  streak: {
    current: number;
    longest: number;
    milestoneReached: number | null;
  };
}

// ── Limites diários de XP por ação ────────────────────────────────────────────
const DAILY_LIMITS: Partial<Record<XPAction, number>> = {
  add_entry: 20,
  add_movie: 10,
  add_tv_season: 15,
  complete_episode: 30,
  complete_movie: 5,
  complete_season: 5,
  complete_series: 3,
  rate_title: 15,
  write_notes: 10,
  favorite_title: 10,
  planning_cleanup: 10,
  score_9_plus: 10,
  score_10: 5,
  rewatch_episode: 10,
  rewatch_title: 3,
  long_episode: 10,
  genre_explorer: 3,
  hidden_gem: 5,
  classic_title: 5,
  weekend_session: 5,
  movie_marathon: 2,
  refresh_library: 3,
  import_collection: 1,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Anti-farm ─────────────────────────────────────────────────────────────────
async function hasReachedDailyLimit(userId: string, action: XPAction): Promise<boolean> {
  const limit = DAILY_LIMITS[action];
  if (limit === undefined) return false;

  const todayStart = startOfDay(new Date());
  const count = await prisma.gamificationActivityLog.count({
    where: { userId, action, createdAt: { gte: todayStart } },
  });
  return count >= limit;
}

// ── Streak ────────────────────────────────────────────────────────────────────
async function updateStreak(userId: string) {
  const now = new Date();
  const existing = await prisma.streakData.findUnique({ where: { userId } });

  if (!existing) {
    const streak = await prisma.streakData.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastActivityDay: now },
    });
    return { streak, advanced: true };
  }

  if (!existing.lastActivityDay) {
    const streak = await prisma.streakData.update({
      where: { userId },
      data: { currentStreak: 1, longestStreak: Math.max(existing.longestStreak, 1), lastActivityDay: now },
    });
    return { streak, advanced: true };
  }

  const diffDays = daysBetween(existing.lastActivityDay, now);
  const diffMs = now.getTime() - existing.lastActivityDay.getTime();

  if (diffDays <= 0) return { streak: existing, advanced: false };

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

// ── Detectar achievements a partir do estado do banco ─────────────────────────
async function detectNewAchievements(
  userId: string,
  currentLevel: number,
  longestStreak: number,
): Promise<Achievement[]> {
  // Busca dados do banco para checar os triggers
  const [entries, gamification] = await Promise.all([
    prisma.entry.findMany({ select: { type: true, status: true, score: true, progress: true, isFavorite: true } }),
    prisma.userGamification.findUnique({ where: { userId }, select: { badges: true, totalXP: true } }),
  ]);

  const totalEpisodes = entries
    .filter((e) => e.type === 'TV_SEASON')
    .reduce((sum, e) => sum + (e.progress ?? 0), 0);

  const totalSeries = entries.filter((e) => e.type === 'TV_SEASON').length;
  const totalMovies = entries.filter((e) => e.type === 'MOVIE' && e.status === 'COMPLETED').length;
  const score10Count = entries.filter((e) => e.score >= 10).length;
  const favoritesCount = entries.filter((e) => e.isFavorite).length;
  const completedSeriesCount = entries.filter(
    (e) => e.type === 'TV_SEASON' && e.status === 'COMPLETED',
  ).length;

  const alreadyUnlocked: string[] = gamification?.badges ?? [];

  return checkAchievements(
    {
      totalEpisodes,
      totalSeries,
      totalMovies,
      totalXP: gamification?.totalXP ?? 0,
      longestStreak,
      currentLevel,
      score10Count,
      favoritesCount,
      completedSeriesCount,
    },
    alreadyUnlocked,
  );
}

// ── ensureUserGamification ────────────────────────────────────────────────────
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

// ── awardXP ───────────────────────────────────────────────────────────────────
export async function awardXP(input: AwardXPInput): Promise<AwardXPResult> {
  const userId = input.userId || DEFAULT_USER_ID;
  const current = await ensureUserGamification(userId);

  // Anti-farm
  const limited = await hasReachedDailyLimit(userId, input.action);
  if (limited) {
    const progress = getLevelProgress(current.totalXP);
    const levelInfo = getLevelFromXP(current.totalXP);
    const streak = await prisma.streakData.findUnique({ where: { userId } });
    return {
      xpGained: 0,
      actionXP: 0,
      streakBonusXP: 0,
      newTotal: current.totalXP,
      nextLevelAt: progress.nextLevel?.xpRequired ?? null,
      currentXP: progress.currentXP,
      xpToNext: progress.xpToNext,
      xpPercent: progress.xpPercent,
      leveledUp: false,
      gainedLevels: 0,
      level: levelInfo.level,
      levelName: levelInfo.title,
      previousLevel: levelInfo.level,
      message: `Limite diário atingido para: ${getActionLabel(input.action)}`,
      skipped: true,
      skipReason: 'daily_limit',
      newAchievements: [],
      challengeProgress: [],
      completedChallenges: [],
      streak: {
        current: streak?.currentStreak ?? 0,
        longest: streak?.longestStreak ?? 0,
        milestoneReached: null,
      },
    };
  }

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

  // Detectar achievements ANTES de salvar (usa nível já atualizado)
  const newAchievements = await detectNewAchievements(
    userId,
    progress.currentLevel.level,
    streak.longestStreak,
  );

  const achievementXP = newAchievements.reduce((sum, a) => sum + a.xpReward, 0);
  const finalTotal = newTotal + achievementXP;
  const finalProgress = achievementXP > 0 ? getLevelProgress(finalTotal) : progress;

  const newBadgeIds = newAchievements.map((a) => a.id);

  await prisma.$transaction([
    prisma.gamificationActivityLog.create({
      data: { userId, action: input.action, xpGained: calculation.xpGained, metadata },
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
        totalXP: finalTotal,
        currentLevel: finalProgress.currentLevel.level,
        currentXP: finalProgress.currentXP,
        xpToNextLevel: finalProgress.xpToNext,
        lastAwardedAt: new Date(),
        ...(newBadgeIds.length > 0
          ? { badges: { push: newBadgeIds } }
          : {}),
      },
    }),
  ]);

  const challengeProgress = await trackChallengesForAction({
    userId,
    action: input.action,
    metadata: input.metadata ?? {},
    currentStreak: streak.currentStreak,
  });
  const completedChallenges = challengeProgress.filter((challenge) => challenge.completed);
  const challengeRewardXP = completedChallenges.reduce((sum, challenge) => sum + challenge.rewardXP, 0);
  const afterChallengeRewards = challengeRewardXP > 0
    ? await getGamificationAfterChallengeRewards(userId)
    : null;
  const reportedTotal = afterChallengeRewards?.totalXP ?? finalTotal;
  const reportedLevel = afterChallengeRewards?.level ?? finalProgress.currentLevel.level;
  const reportedLevelName = afterChallengeRewards?.levelName ?? finalProgress.currentLevel.title;
  const reportedCurrentXP = afterChallengeRewards?.currentXP ?? finalProgress.currentXP;
  const reportedXPToNext = afterChallengeRewards?.xpToNext ?? finalProgress.xpToNext;
  const reportedXPPercent = afterChallengeRewards?.xpPercent ?? finalProgress.xpPercent;
  const reportedNextLevelAt = afterChallengeRewards?.nextLevelAt ?? finalProgress.nextLevel?.xpRequired ?? null;
  const previousLevelNumber = levelUp.previousLevel.level;
  const reportedLeveledUp = reportedLevel > previousLevelNumber;

  return {
    xpGained: xpGained + achievementXP + challengeRewardXP,
    actionXP: calculation.xpGained,
    streakBonusXP,
    newTotal: reportedTotal,
    nextLevelAt: reportedNextLevelAt,
    currentXP: reportedCurrentXP,
    xpToNext: reportedXPToNext,
    xpPercent: reportedXPPercent,
    leveledUp: reportedLeveledUp,
    gainedLevels: reportedLevel - previousLevelNumber,
    level: reportedLevel,
    levelName: reportedLevelName,
    previousLevel: previousLevelNumber,
    message: reportedLeveledUp
      ? `Level up! Nivel ${reportedLevel} - ${reportedLevelName}`
      : `+${xpGained} XP - ${getActionLabel(input.action)}`,
    newAchievements,
    challengeProgress,
    completedChallenges,
    streak: {
      current: streak.currentStreak,
      longest: streak.longestStreak,
      milestoneReached: milestoneAction ? streak.currentStreak : null,
    },
  };
}

// ── getGamificationStats ──────────────────────────────────────────────────────
export async function getGamificationStats(userId = DEFAULT_USER_ID) {
  const [game, streak, recentActivity] = await Promise.all([
    ensureUserGamification(userId),
    prisma.streakData.upsert({
      where: { userId },
      update: {},
      create: { userId, currentStreak: 0, longestStreak: 0 },
    }),
    prisma.gamificationActivityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
  ]);

  const progress = getLevelProgress(game.totalXP);

  // Monta objetos de achievement completos a partir dos IDs salvos nos badges
  const unlockedIds: string[] = game.badges ?? [];
  const unlockedAchievements = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id));

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
    badges: unlockedIds,
    achievements: unlockedAchievements,
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

// ── bootstrapXPFromLibrary ────────────────────────────────────────────────────
export interface BootstrapResult {
  alreadyBootstrapped: boolean;
  totalXPGranted: number;
  level: number;
  levelName: string;
  breakdown: Record<string, number>;
}

export async function bootstrapXPFromLibrary(userId = DEFAULT_USER_ID): Promise<BootstrapResult> {
  const existing = await prisma.userGamification.findUnique({ where: { userId } });
  if (existing && existing.totalXP > 0) {
    const progress = getLevelProgress(existing.totalXP);
    return {
      alreadyBootstrapped: true,
      totalXPGranted: existing.totalXP,
      level: progress.currentLevel.level,
      levelName: progress.currentLevel.title,
      breakdown: {},
    };
  }

  const entries = await prisma.entry.findMany();
  let totalXP = 0;
  const breakdown: Record<string, number> = {};

  function addXP(label: string, xp: number) {
    breakdown[label] = (breakdown[label] ?? 0) + xp;
    totalXP += xp;
  }

  for (const entry of entries) {
    const isMovie = entry.type === 'MOVIE';
    const isCompleted = entry.status === 'COMPLETED' || entry.status === 'REWATCHING';
    const score = entry.score ?? 0;

    if (isMovie) {
      addXP('add_movie', 60);
      if (isCompleted) {
        const result = calculateXPForAction('complete_movie', { score });
        addXP('complete_movie', result.xpGained);
        if (score >= 10) addXP('score_10', 200);
        else if (score >= 9) addXP('score_9_plus', 100);
      }
      if (score > 0) addXP('rate_title', 25);
      if (entry.notes) addXP('write_notes', 35);
      if (entry.isFavorite) addXP('favorite_title', 40);
    } else {
      addXP('add_tv_season', 50);
      const progress = entry.progress ?? 0;
      if (progress > 0) {
        const result = calculateXPForAction('complete_episode', { score, episodeCount: progress });
        addXP('complete_episode', result.xpGained);
      }
      if (isCompleted) {
        addXP('complete_season', 300);
        if (score >= 10) addXP('score_10', 200);
        else if (score >= 9) addXP('score_9_plus', 100);
      }
      if (score > 0) addXP('rate_title', 25);
      if (entry.notes) addXP('write_notes', 35);
      if (entry.isFavorite) addXP('favorite_title', 40);
    }

    if ((entry.rewatchCount ?? 0) > 0) {
      addXP('rewatch_title', 120 * entry.rewatchCount);
    }
  }

  if (entries.length > 0) addXP('first_entry', 150);

  const progress = getLevelProgress(totalXP);
  const metadataObj = { bootstrap: true, breakdown, entriesProcessed: entries.length } as unknown as Prisma.InputJsonObject;

  await prisma.$transaction([
    prisma.userGamification.upsert({
      where: { userId },
      create: {
        userId,
        totalXP,
        currentLevel: progress.currentLevel.level,
        currentXP: progress.currentXP,
        xpToNextLevel: progress.xpToNext,
        lastAwardedAt: new Date(),
      },
      update: {
        totalXP,
        currentLevel: progress.currentLevel.level,
        currentXP: progress.currentXP,
        xpToNextLevel: progress.xpToNext,
        lastAwardedAt: new Date(),
      },
    }),
    prisma.gamificationActivityLog.create({
      data: {
        userId,
        action: 'import_collection',
        xpGained: totalXP,
        metadata: metadataObj,
      },
    }),
  ]);

  return {
    alreadyBootstrapped: false,
    totalXPGranted: totalXP,
    level: progress.currentLevel.level,
    levelName: progress.currentLevel.title,
    breakdown,
  };
}
