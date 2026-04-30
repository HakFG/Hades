import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { awardXP, type AwardXPResult } from '@/lib/gamification';

// Helper para converter string de data para Date ou null
function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

// PATCH /api/entries/[id] - Atualizar uma entry existente
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const previousEntry = await prisma.entry.findUnique({ where: { id } });

    if (!previousEntry) {
      return NextResponse.json(
        { error: 'Entrada nao encontrada' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Status
    if (body.status !== undefined) updateData.status = body.status;

    // Score: garantir que seja número decimal (float) entre 0 e 10
    if (body.score !== undefined) {
      let scoreNum = typeof body.score === 'number' ? body.score : parseFloat(body.score);
      if (isNaN(scoreNum)) scoreNum = 0;
      scoreNum = Math.min(10, Math.max(0, scoreNum));
      // Mantém uma casa decimal (ex: 8.4), mas sem arredondamento forçado
      updateData.score = scoreNum;
    }

    // Progresso
    if (body.progress !== undefined) {
      let prog = typeof body.progress === 'number' ? body.progress : parseInt(body.progress);
      if (isNaN(prog)) prog = 0;
      updateData.progress = Math.max(0, prog);
    }

    // Datas
    if (body.startDate !== undefined) updateData.startDate = parseDate(body.startDate);
    if (body.finishDate !== undefined) updateData.finishDate = parseDate(body.finishDate);

    // Rewatch Count
    if (body.rewatchCount !== undefined) {
      let rc = typeof body.rewatchCount === 'number' ? body.rewatchCount : parseInt(body.rewatchCount);
      if (isNaN(rc)) rc = 0;
      updateData.rewatchCount = Math.max(0, rc);
    }

    // Notes
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;

    // Hidden e Favorite
    if (body.hidden !== undefined) updateData.hidden = Boolean(body.hidden);
    if (body.isFavorite !== undefined) updateData.isFavorite = Boolean(body.isFavorite);

    // Executa update
    const entry = await prisma.entry.update({
      where: { id },
      data: updateData,
    });

    const gamification: AwardXPResult[] = [];
    const pushAward = async (award: Promise<AwardXPResult>) => {
      const result = await award;
      if (result.xpGained > 0) gamification.push(result);
    };

    const progressDelta = entry.progress - previousEntry.progress;
    if (entry.type === 'TV_SEASON' && progressDelta > 0) {
      await pushAward(awardXP({
        action: 'complete_episode',
        metadata: {
          entryId: entry.id,
          title: entry.title,
          score: entry.score,
          episodeCount: progressDelta,
          progressStart: previousEntry.progress,
          progressEnd: entry.progress,
        },
      }));
    }

    if (previousEntry.status !== 'COMPLETED' && entry.status === 'COMPLETED') {
      await pushAward(awardXP({
        action: entry.type === 'MOVIE' ? 'complete_movie' : 'complete_season',
        metadata: {
          entryId: entry.id,
          title: entry.title,
          score: entry.score,
          totalEpisodes: entry.totalEpisodes,
        },
      }));
    }

    if (previousEntry.status === 'PLANNING' && entry.status !== 'PLANNING') {
      await pushAward(awardXP({
        action: 'planning_cleanup',
        metadata: {
          entryId: entry.id,
          title: entry.title,
          fromStatus: previousEntry.status,
          toStatus: entry.status,
        },
      }));
    }

    if (entry.score > 0 && entry.score !== previousEntry.score) {
      await pushAward(awardXP({
        action: 'rate_title',
        metadata: {
          entryId: entry.id,
          title: entry.title,
          previousScore: previousEntry.score,
          score: entry.score,
        },
      }));
    }

    if (previousEntry.score < 9 && entry.score >= 9) {
      await pushAward(awardXP({
        action: 'score_9_plus',
        metadata: {
          entryId: entry.id,
          title: entry.title,
          score: entry.score,
        },
      }));
    }

    if (previousEntry.score < 10 && entry.score === 10) {
      await pushAward(awardXP({
        action: 'score_10',
        metadata: {
          entryId: entry.id,
          title: entry.title,
          score: entry.score,
        },
      }));
    }

    if (!previousEntry.notes && entry.notes) {
      await pushAward(awardXP({
        action: 'write_notes',
        metadata: {
          entryId: entry.id,
          title: entry.title,
        },
      }));
    }

    if (!previousEntry.isFavorite && entry.isFavorite) {
      await pushAward(awardXP({
        action: 'favorite_title',
        metadata: {
          entryId: entry.id,
          title: entry.title,
        },
      }));
    }

    // Normaliza datas para YYYY-MM-DD antes de retornar ao front-end
    const formatted = {
      ...entry,
      startDate: entry.startDate
        ? (entry.startDate as Date).toISOString().split('T')[0]
        : null,
      finishDate: entry.finishDate
        ? (entry.finishDate as Date).toISOString().split('T')[0]
        : null,
      gamification,
    };
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[PATCH /api/entries/:id] Erro:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar entrada' },
      { status: 500 }
    );
  }
}

// DELETE /api/entries/[id] - Remover uma entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

// targetEntry usa SetNull (não Cascade), então limpa manualmente
await prisma.relation.updateMany({
  where: { targetEntryId: id },
  data: { targetEntryId: null },
});

// sourceEntry tem onDelete: Cascade — as relações são deletadas automaticamente
await prisma.entry.delete({ where: { id } });

return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/entries/:id] Erro:', error);
    return NextResponse.json(
      { error: 'Falha ao deletar entrada' },
      { status: 500 }
    );
  }
}
