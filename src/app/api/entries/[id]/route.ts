import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/entries/[id] - Atualizar uma entry existente
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    
    if (body.status !== undefined) updateData.status = body.status;
    if (body.score !== undefined) updateData.score = body.score;
    if (body.progress !== undefined) updateData.progress = body.progress;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.finishDate !== undefined) updateData.finishDate = body.finishDate ? new Date(body.finishDate) : null;
    if (body.rewatchCount !== undefined) updateData.rewatchCount = body.rewatchCount;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.hidden !== undefined) updateData.hidden = body.hidden;
    if (body.isFavorite !== undefined) updateData.isFavorite = body.isFavorite;

    const entry = await prisma.entry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

// DELETE /api/entries/[id] - Remover uma entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.entry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}