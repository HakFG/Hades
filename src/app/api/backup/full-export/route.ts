import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/backup/full-export
 * 
 * Exporta TUDO em um único JSON:
 * - Entries (com todos os campos)
 * - Relações entre entries
 * - Log de atividades
 * - Perfil do usuário
 * 
 * Ideal para backup completo do sistema.
 */
export async function GET() {
  try {
    const [entries, relations, activities, profile] = await Promise.all([
      prisma.entry.findMany({ orderBy: { updatedAt: 'desc' } }),
      prisma.relation.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.profile.findUnique({ where: { id: 'main' } }),
    ]);

    // Serializa todos os dados
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      entries: entries.map(e => ({
        ...e,
        startDate: e.startDate?.toISOString().split('T')[0] ?? null,
        finishDate: e.finishDate?.toISOString().split('T')[0] ?? null,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
      relations: relations.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      activities: activities.map(a => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        lastUpdatedAt: a.lastUpdatedAt.toISOString(),
      })),
      profile: profile ? {
        ...profile,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      } : null,
    };

    return NextResponse.json(backup);
  } catch (error) {
    console.error('[GET /api/backup/full-export] Erro:', error);
    return NextResponse.json(
      { error: 'Falha ao exportar backup completo' },
      { status: 500 }
    );
  }
}
