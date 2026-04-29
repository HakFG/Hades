import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/activity/[id] — atualiza um log existente (agrupamento de episódios)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const log = await prisma.activityLog.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(log);
}

// DELETE /api/activity/[id] — deleta um log
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.activityLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}