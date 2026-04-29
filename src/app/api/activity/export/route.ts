import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/activity/export
 * 
 * Exporta TODA a atividade do usuário para backup.
 * Inclui todas as mudanças de status, scores, progresso, etc.
 */
export async function GET() {
  try {
    const activities = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Serializa datas corretamente
    const serialized = activities.map(a => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      lastUpdatedAt: a.lastUpdatedAt.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('[GET /api/activity/export] Erro:', error);
    return NextResponse.json(
      { error: 'Falha ao exportar atividades' },
      { status: 500 }
    );
  }
}
