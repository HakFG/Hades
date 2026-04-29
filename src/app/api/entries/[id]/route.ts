import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Retorna o objeto atualizado com os campos que o front-end espera
    return NextResponse.json(entry);
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