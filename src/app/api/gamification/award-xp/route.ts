import { NextResponse } from 'next/server';
import { awardXP, DEFAULT_USER_ID } from '@/lib/gamification';
import { XP_ACTION_RULES, type XPAction } from '@/lib/xp-calculator';

const VALID_ACTIONS = new Set(XP_ACTION_RULES.map((rule) => rule.action));

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body?.action as XPAction | undefined;

    if (!action || !VALID_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: 'Acao de XP invalida', validActions: XP_ACTION_RULES.map((rule) => rule.action) },
        { status: 400 },
      );
    }

    const result = await awardXP({
      userId: typeof body.userId === 'string' ? body.userId : DEFAULT_USER_ID,
      action,
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[POST /api/gamification/award-xp] Erro:', error);
    return NextResponse.json({ error: 'Falha ao atribuir XP' }, { status: 500 });
  }
}
