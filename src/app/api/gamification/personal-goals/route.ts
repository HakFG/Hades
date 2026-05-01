import { NextResponse } from 'next/server';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  markGoalComplete,
  syncGoalProgress,
  type CreateGoalInput,
  type UpdateGoalInput,
} from '@/lib/personal-goals';

// GET /api/gamification/personal-goals
// Retorna todas as metas + sincroniza progresso automático
export async function GET() {
  try {
    await syncGoalProgress('main');
    const goals = await getGoals('main');
    return NextResponse.json(goals);
  } catch (error) {
    console.error('[personal-goals GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

// POST /api/gamification/personal-goals
// Cria uma nova meta
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input: CreateGoalInput = {
      title: body.title,
      type: body.type,
      target: Number(body.target),
      unit: body.unit,
      emoji: body.emoji,
      deadline: body.deadline ?? null,
      rewardXP: body.rewardXP ? Number(body.rewardXP) : 0,
      pinned: body.pinned ?? false,
    };

    if (!input.title || !input.type || !input.target) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const goal = await createGoal(input, 'main');
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('[personal-goals POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

// PATCH /api/gamification/personal-goals
// Atualiza ou completa uma meta — passa { id, ...campos } ou { id, action: 'complete' }
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing goal id' }, { status: 400 });
    }

    if (action === 'complete') {
      const goal = await markGoalComplete(id);
      return NextResponse.json(goal);
    }

    const input: UpdateGoalInput = {
      ...(rest.title !== undefined && { title: rest.title }),
      ...(rest.target !== undefined && { target: Number(rest.target) }),
      ...(rest.unit !== undefined && { unit: rest.unit }),
      ...(rest.emoji !== undefined && { emoji: rest.emoji }),
      ...(rest.deadline !== undefined && { deadline: rest.deadline }),
      ...(rest.rewardXP !== undefined && { rewardXP: Number(rest.rewardXP) }),
      ...(rest.pinned !== undefined && { pinned: rest.pinned }),
      ...(rest.current !== undefined && { current: Number(rest.current) }),
    };

    const goal = await updateGoal(id, input);
    return NextResponse.json(goal);
  } catch (error) {
    console.error('[personal-goals PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

// DELETE /api/gamification/personal-goals?id=xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing goal id' }, { status: 400 });
    }

    await deleteGoal(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[personal-goals DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}