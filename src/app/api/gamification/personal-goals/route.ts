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

// ─── GET /api/gamification/personal-goals ─────────────────────────────────────
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

// ─── POST /api/gamification/personal-goals ────────────────────────────────────
// Cria uma nova meta

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const rewardXPValue = body.rewardXP !== undefined && body.rewardXP !== null
      ? Number(body.rewardXP)
      : 0;

    const input: CreateGoalInput = {
      title: body.title?.trim(),
      type: body.type,
      target: Number(body.target),
      unit: body.unit ?? '',
      emoji: body.emoji ?? '🎯',
      deadline: body.deadline ?? null,
      rewardXP: Number.isFinite(rewardXPValue) ? rewardXPValue : 0,
      pinned: body.pinned ?? false,
    };

    if (!input.title) {
      return NextResponse.json({ error: 'O título da meta é obrigatório.' }, { status: 400 });
    }
    if (!input.type) {
      return NextResponse.json({ error: 'O tipo da meta é obrigatório.' }, { status: 400 });
    }
    const rewardXP = Number.isFinite(rewardXPValue) ? rewardXPValue : 0;

    if (!input.target || input.target <= 0) {
      return NextResponse.json({ error: 'O target deve ser maior que zero.' }, { status: 400 });
    }
    if (rewardXP < 0 || rewardXP > 2000) {
      return NextResponse.json({ error: 'XP de recompensa deve estar entre 0 e 2000.' }, { status: 400 });
    }
    if (input.deadline) {
      const d = new Date(input.deadline);
      if (isNaN(d.getTime()) || d < new Date()) {
        return NextResponse.json({ error: 'O prazo deve ser uma data futura válida.' }, { status: 400 });
      }
    }

    const goal = await createGoal(input, 'main');
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('[personal-goals POST] Error:', error);
    return NextResponse.json({ error: 'Falha ao criar meta.' }, { status: 500 });
  }
}

// ─── PATCH /api/gamification/personal-goals ───────────────────────────────────
// Ações suportadas:
//   { id, action: 'complete' }          → marca como concluída
//   { id, action: 'increment', by: N }  → incrementa current em N (default 1)
//   { id, ...campos }                   → atualiza campos livres

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da meta é obrigatório.' }, { status: 400 });
    }

    // ── Ação: completar ──
    if (action === 'complete') {
      const goal = await markGoalComplete(id);
      return NextResponse.json(goal);
    }

    // ── Ação: incrementar progresso manualmente ──
    if (action === 'increment') {
      const by = Number(rest.by ?? 1);
      if (isNaN(by) || by <= 0) {
        return NextResponse.json({ error: '"by" deve ser um número positivo.' }, { status: 400 });
      }
      // Busca o current atual e soma
      const { getGoals } = await import('@/lib/personal-goals');
      const goals = await getGoals('main');
      const current = goals.find(g => g.id === id);
      if (!current) {
        return NextResponse.json({ error: 'Meta não encontrada.' }, { status: 404 });
      }
      const newCurrent = Math.min(current.current + by, current.target);
      const updated = await updateGoal(id, { current: newCurrent });
      return NextResponse.json(updated);
    }

    // ── Atualização de campos ──
    const parsedRewardXP = rest.rewardXP !== undefined && rest.rewardXP !== null
      ? Number(rest.rewardXP)
      : undefined;

    if (parsedRewardXP !== undefined && !Number.isFinite(parsedRewardXP)) {
      return NextResponse.json({ error: 'XP de recompensa deve ser um número válido.' }, { status: 400 });
    }

    const input: UpdateGoalInput = {
      ...(rest.title !== undefined && { title: rest.title?.trim() }),
      ...(rest.target !== undefined && { target: Number(rest.target) }),
      ...(rest.unit !== undefined && { unit: rest.unit }),
      ...(rest.emoji !== undefined && { emoji: rest.emoji }),
      ...(rest.deadline !== undefined && { deadline: rest.deadline }),
      ...(rest.rewardXP !== undefined && { rewardXP: Number(rest.rewardXP) }),
      ...(rest.pinned !== undefined && { pinned: Boolean(rest.pinned) }),
      ...(rest.current !== undefined && { current: Number(rest.current) }),
    };

    if (input.target !== undefined && input.target <= 0) {
      return NextResponse.json({ error: 'O target deve ser maior que zero.' }, { status: 400 });
    }

    const goal = await updateGoal(id, input);
    return NextResponse.json(goal);
  } catch (error) {
    console.error('[personal-goals PATCH] Error:', error);
    return NextResponse.json({ error: 'Falha ao atualizar meta.' }, { status: 500 });
  }
}

// ─── DELETE /api/gamification/personal-goals?id=xxx ──────────────────────────

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da meta é obrigatório.' }, { status: 400 });
    }

    await deleteGoal(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[personal-goals DELETE] Error:', error);
    return NextResponse.json({ error: 'Falha ao remover meta.' }, { status: 500 });
  }
}