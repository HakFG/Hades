import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/relations/export
 * 
 * Exporta TODAS as relações entre entries para backup.
 * As relações são essenciais para manter a estrutura de dados intacta.
 */
export async function GET() {
  try {
    const relations = await prisma.relation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Serializa datas corretamente
    const serialized = relations.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('[GET /api/relations/export] Erro:', error);
    return NextResponse.json(
      { error: 'Falha ao exportar relações' },
      { status: 500 }
    );
  }
}
