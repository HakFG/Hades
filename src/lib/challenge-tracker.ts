import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getLevelFromXP, getLevelProgress } from '@/lib/level-system';
import type { XPAction } from '@/lib/xp-calculator';
import { ensureChallengesForUser } from '@/lib/challenge-generator';

interface ChallengeMetadata {
  genre?: string;
  genres?: string[];
  scoreRange?: [number, number];
  releaseBeforeYear?: number;
}

interface ProgressData {
  genres?: string[];
}

interface EntryContext {
  id?: string;
  title?: string;
  genres?: string | null;
  releaseDate?: string | null;
  type?: 'MOVIE' | 'TV_SEASON';
}

export interface ChallengeProgressResult {
  challengeId: string;
  title: string;
  category: string;
  previous: number;
  current: number;
  goal: number;
  progressPercent: number;
  completed: boolean;
  rewardXP: number;
  badge?: string;
  message: string;
}

export interface TrackChallengesInput {
  userId: string;
  action: XPAction;
  metadata?: Record<string, unknown>;
  currentStreak?: number;
}

function toJsonObject(value: Record<string, unknown>): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
}

function metadataObject(value: Prisma.JsonValue): ChallengeMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as ChallengeMetadata;
}

function progressObject(value: Prisma.JsonValue): ProgressData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as ProgressData;
}

function normalizedGenres(entry: EntryContext | null, metadata?: Record<string, unknown>) {
  const raw = [
    ...(typeof metadata?.genre === 'string' ? [metadata.genre] : []),
    ...(Array.isArray(metadata?.genres) ? metadata.genres.filter((item): item is string => typeof item === 'string') : []),
    ...(entry?.genres ? entry.genres.split(',') : []),
  ];

  return Array.from(
    new Set(
      raw
        .map((genre) => genre.trim())
        .filter(Boolean)
        .map((genre) => genre.toLowerCase()),
    ),
  );
}

function scoreMatches(score: unknown, range?: [number, number]) {
  if (!range) return true;
  if (typeof score !== 'number' || Number.isNaN(score)) return false;
  return score >= range[0] && score <= range[1];
}

function releaseYear(entry: EntryContext | null, metadata?: Record<string, unknown>) {
  const raw = typeof metadata?.releaseDate === 'string' ? metadata.releaseDate : entry?.releaseDate;
  if (!raw || raw.length < 4) return null;
  const year = Number(raw.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

async function loadEntry(metadata?: Record<string, unknown>): Promise<EntryContext | null> {
  const entryId = typeof metadata?.entryId === 'string' ? metadata.entryId : null;
  if (!entryId) return null;

  return prisma.entry.findUnique({
    where: { id: entryId },
    select: { id: true, title: true, genres: true, releaseDate: true, type: true },
  });
}

function incrementForChallenge(params: {
  challenge: {
    challengeId: string;
    type: string;
    current: number;
    goal: number;
    metadata: Prisma.JsonValue;
    progressData: Prisma.JsonValue;
  };
  action: XPAction;
  metadata?: Record<string, unknown>;
  entry: EntryContext | null;
  currentStreak?: number;
}): { current: number; progressData: ProgressData; changed: boolean } {
  const { challenge, action, metadata, entry, currentStreak } = params;
  const config = metadataObject(challenge.metadata);
  const progressData = progressObject(challenge.progressData);
  const episodeCount = Math.max(1, Math.floor(Number(metadata?.episodeCount ?? 1)));
  const genres = normalizedGenres(entry, metadata);
  const previous = Math.min(challenge.current, challenge.goal);

  if (challenge.type === 'watch_episodes') {
    if (action !== 'complete_episode') return { current: previous, progressData, changed: false };
    return { current: previous + episodeCount, progressData, changed: true };
  }

  if (challenge.type === 'rate_titles') {
    if (action !== 'rate_title' || !scoreMatches(metadata?.score, config.scoreRange)) {
      return { current: previous, progressData, changed: false };
    }
    return { current: previous + 1, progressData, changed: true };
  }

  if (challenge.type === 'complete_series') {
    const allowsMovie = challenge.challengeId === 'monthly_closer';
    const matches = action === 'complete_season' || action === 'complete_series' || (allowsMovie && action === 'complete_movie');
    if (!matches) return { current: previous, progressData, changed: false };
    return { current: previous + 1, progressData, changed: true };
  }

  if (challenge.type === 'complete_movies') {
    if (action !== 'complete_movie') return { current: previous, progressData, changed: false };
    return { current: previous + 1, progressData, changed: true };
  }

  if (challenge.type === 'genre_focused') {
    const wanted = config.genre?.toLowerCase();
    if (!wanted || !genres.some((genre) => genre.includes(wanted) || wanted.includes(genre))) {
      return { current: previous, progressData, changed: false };
    }
    if (action !== 'complete_episode' && action !== 'complete_movie') {
      return { current: previous, progressData, changed: false };
    }
    return {
      current: previous + (action === 'complete_episode' ? episodeCount : 1),
      progressData,
      changed: true,
    };
  }

  if (challenge.type === 'mixed_genres') {
    if ((action !== 'complete_episode' && action !== 'complete_movie') || genres.length === 0) {
      return { current: previous, progressData, changed: false };
    }
    const nextGenres = Array.from(new Set([...(progressData.genres ?? []), ...genres]));
    return {
      current: nextGenres.length,
      progressData: { ...progressData, genres: nextGenres },
      changed: nextGenres.length !== (progressData.genres ?? []).length,
    };
  }

  if (challenge.type === 'streak_days') {
    const nextStreak = Math.max(previous, currentStreak ?? 0);
    return { current: nextStreak, progressData, changed: nextStreak !== previous };
  }

  if (challenge.type === 'classic_titles') {
    if (action !== 'complete_movie') return { current: previous, progressData, changed: false };
    const year = releaseYear(entry, metadata);
    if (!year || !config.releaseBeforeYear || year >= config.releaseBeforeYear) {
      return { current: previous, progressData, changed: false };
    }
    return { current: previous + 1, progressData, changed: true };
  }

  if (challenge.type === 'notes_written') {
    if (action !== 'write_notes') return { current: previous, progressData, changed: false };
    return { current: previous + 1, progressData, changed: true };
  }

  if (challenge.type === 'favorite_titles') {
    if (action !== 'favorite_title') return { current: previous, progressData, changed: false };
    return { current: previous + 1, progressData, changed: true };
  }

  return { current: previous, progressData, changed: false };
}

async function grantChallengeReward(challenge: {
  id: string;
  userId: string;
  challengeId: string;
  periodKey: string;
  category: string;
  title: string;
  rewardXP: number;
  rewardBadge: string | null;
}) {
  const existingCompletion = await prisma.challengeCompletion.findUnique({
    where: {
      userId_challengeId_periodKey: {
        userId: challenge.userId,
        challengeId: challenge.challengeId,
        periodKey: challenge.periodKey,
      },
    },
  });
  if (existingCompletion) return false;

  const current = await prisma.userGamification.upsert({
    where: { userId: challenge.userId },
    update: {},
    create: {
      userId: challenge.userId,
      totalXP: 0,
      currentLevel: 1,
      currentXP: 0,
      xpToNextLevel: 1000,
    },
  });

  const nextTotal = current.totalXP + challenge.rewardXP;
  const progress = getLevelProgress(nextTotal);
  const badges = challenge.rewardBadge
    ? Array.from(new Set([...(current.badges ?? []), challenge.rewardBadge]))
    : current.badges;

  try {
    await prisma.$transaction([
      prisma.challengeCompletion.create({
        data: {
          userId: challenge.userId,
          challengeId: challenge.challengeId,
          periodKey: challenge.periodKey,
          category: challenge.category,
          title: challenge.title,
          xpAwarded: challenge.rewardXP,
          badge: challenge.rewardBadge,
        },
      }),
      prisma.userGamification.update({
        where: { userId: challenge.userId },
        data: {
          totalXP: nextTotal,
          currentLevel: progress.currentLevel.level,
          currentXP: progress.currentXP,
          xpToNextLevel: progress.xpToNext,
          badges,
          lastAwardedAt: new Date(),
        },
      }),
      prisma.gamificationActivityLog.create({
        data: {
          userId: challenge.userId,
          action: 'manual_bonus',
          xpGained: challenge.rewardXP,
          metadata: toJsonObject({
            label: 'Recompensa de desafio',
            challengeId: challenge.challengeId,
            title: challenge.title,
            periodKey: challenge.periodKey,
            category: challenge.category,
            badge: challenge.rewardBadge,
          }),
        },
      }),
    ]);
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return false;
    throw error;
  }
}

export async function trackChallengesForAction(input: TrackChallengesInput): Promise<ChallengeProgressResult[]> {
  if (input.action === 'manual_bonus') return [];

  await ensureChallengesForUser(input.userId);

  const [entry, challenges] = await Promise.all([
    loadEntry(input.metadata),
    prisma.userChallenge.findMany({
      where: {
        userId: input.userId,
        expiresAt: { gt: new Date() },
        completedAt: null,
      },
      orderBy: { expiresAt: 'asc' },
    }),
  ]);

  const results: ChallengeProgressResult[] = [];

  for (const challenge of challenges) {
    const previous = Math.min(challenge.current, challenge.goal);
    const next = incrementForChallenge({
      challenge,
      action: input.action,
      metadata: input.metadata,
      entry,
      currentStreak: input.currentStreak,
    });

    if (!next.changed) continue;

    const current = Math.min(next.current, challenge.goal);
    const completed = current >= challenge.goal;
    await prisma.userChallenge.update({
      where: { id: challenge.id },
      data: {
        current,
        progressData: next.progressData as Prisma.InputJsonObject,
        ...(completed ? { completedAt: new Date(), claimedAt: new Date() } : {}),
      },
    });

    let rewarded = false;
    if (completed) {
      rewarded = await grantChallengeReward(challenge);
    }

    results.push({
      challengeId: challenge.challengeId,
      title: challenge.title,
      category: challenge.category,
      previous,
      current,
      goal: challenge.goal,
      progressPercent: challenge.goal > 0 ? Math.round((current / challenge.goal) * 100) : 0,
      completed,
      rewardXP: completed && rewarded ? challenge.rewardXP : 0,
      badge: challenge.rewardBadge ?? undefined,
      message: completed
        ? `Desafio completo: ${challenge.title}`
        : `${challenge.title}: ${current}/${challenge.goal}`,
    });
  }

  return results;
}

export async function getGamificationAfterChallengeRewards(userId: string) {
  const game = await prisma.userGamification.findUnique({ where: { userId } });
  if (!game) return null;
  const progress = getLevelProgress(game.totalXP);
  const level = getLevelFromXP(game.totalXP);
  return {
    totalXP: game.totalXP,
    level: level.level,
    levelName: level.title,
    currentXP: progress.currentXP,
    xpToNext: progress.xpToNext,
    xpPercent: progress.xpPercent,
    nextLevelAt: progress.nextLevel?.xpRequired ?? null,
  };
}
