import { NextResponse } from 'next/server';
import { DEFAULT_USER_ID } from '@/lib/gamification';
import { prisma } from '@/lib/prisma';
import { calculateXPForAction } from '@/lib/xp-calculator';
import { getLevelProgress } from '@/lib/level-system';
import { Prisma } from '@prisma/client';

// POST /api/gamification/bootstrap-xp
// Query param: ?force=true  → zera e recalcula mesmo que já tenha XP
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';
    const body = await req.json().catch(() => ({}));
    const userId = typeof body?.userId === 'string' ? body.userId : DEFAULT_USER_ID;

    const existing = await prisma.userGamification.findUnique({ where: { userId } });

    if (existing && existing.totalXP > 0 && !force) {
      const progress = getLevelProgress(existing.totalXP);
      return NextResponse.json({
        alreadyBootstrapped: true,
        totalXPGranted: existing.totalXP,
        level: progress.currentLevel.level,
        levelName: progress.currentLevel.title,
        breakdown: {},
        tip: 'Use ?force=true para forçar o recálculo.',
      });
    }

    // Busca todas as entries
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
        // TV Season
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
    const metadata = { bootstrap: true, breakdown, entriesProcessed: entries.length, forced: force } as unknown as Prisma.InputJsonObject;

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
          metadata,
        },
      }),
    ]);

    return NextResponse.json({
      alreadyBootstrapped: false,
      totalXPGranted: totalXP,
      level: progress.currentLevel.level,
      levelName: progress.currentLevel.title,
      entriesProcessed: entries.length,
      breakdown,
    });
  } catch (error) {
    console.error('[POST /api/gamification/bootstrap-xp] Erro:', error);
    return NextResponse.json({ error: 'Falha ao realizar bootstrap de XP' }, { status: 500 });
  }
}