import { NextResponse } from 'next/server';
import { DEFAULT_USER_ID } from '@/lib/gamification';
import { getChallengeDashboard } from '@/lib/challenge-generator';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || DEFAULT_USER_ID;
    const dashboard = await getChallengeDashboard(userId);

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('[GET /api/gamification/challenges] Erro:', error);
    return NextResponse.json({ error: 'Falha ao carregar desafios' }, { status: 500 });
  }
}
