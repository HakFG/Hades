import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/activity — busca os logs mais recentes
export async function GET() {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('[api/activity] GET — erro ao buscar logs:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar logs de atividade' }, { status: 500 });
  }
}

// POST /api/activity — cria um novo log
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const log = await prisma.activityLog.create({ data: body });
    return NextResponse.json(log);
  } catch (error) {
    console.error('[api/activity] POST — erro ao criar log:', error);
    return NextResponse.json({ error: 'Erro interno ao registrar atividade' }, { status: 500 });
  }
}