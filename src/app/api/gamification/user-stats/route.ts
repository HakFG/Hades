import { NextResponse } from 'next/server';
import { DEFAULT_USER_ID, getGamificationStats } from '@/lib/gamification';
import { LEVEL_THRESHOLDS } from '@/lib/level-system';
import { XP_ACTION_RULES } from '@/lib/xp-calculator';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || DEFAULT_USER_ID;
    const stats = await getGamificationStats(userId);

    return NextResponse.json({
      ...stats,
      levelTable: LEVEL_THRESHOLDS,
      xpActionTable: XP_ACTION_RULES,
    });
  } catch (error) {
    console.error('[GET /api/gamification/user-stats] Erro:', error);
    return NextResponse.json({ error: 'Falha ao carregar gamificacao' }, { status: 500 });
  }
}
