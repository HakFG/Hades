import { NextResponse } from 'next/server';
import { DEFAULT_USER_ID } from '@/lib/gamification';
import {
  type ChallengeCategory,
  getChallengeDashboard,
  regenerateChallengesForUser,
} from '@/lib/challenge-generator';

const VALID_CATEGORIES = new Set<ChallengeCategory>(['daily', 'weekly', 'special']);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = typeof body.userId === 'string' ? body.userId : DEFAULT_USER_ID;
    const category = VALID_CATEGORIES.has(body.category) ? body.category : 'daily';

    await regenerateChallengesForUser(userId, category);
    const dashboard = await getChallengeDashboard(userId);

    return NextResponse.json({ success: true, category, ...dashboard });
  } catch (error) {
    console.error('[POST /api/gamification/reset-daily-challenges] Erro:', error);
    return NextResponse.json({ error: 'Falha ao regenerar desafios' }, { status: 500 });
  }
}
