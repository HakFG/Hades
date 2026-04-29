import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * POST /api/activity/import
 * 
 * Importa log de atividades do backup.
 * IMPORTANTE: As entries já devem estar no banco antes de importar atividades.
 */
export async function POST(request: Request) {
  try {
    const activities = await request.json();
    if (!Array.isArray(activities)) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    let restored = 0;
    for (const a of activities) {
      try {
        // Valida se a entry existe
        const entryExists = await prisma.entry.findUnique({
          where: { id: a.entryId },
        });

        if (!entryExists) {
          console.warn(`[activity/import] Entry ${a.entryId} não encontrada, pulando atividade`);
          continue;
        }

        await prisma.activityLog.upsert({
          where: { id: a.id },
          update: {
            entryId: a.entryId,
            title: a.title,
            imagePath: a.imagePath ?? undefined,
            type: a.type,
            status: a.status,
            progressStart: a.progressStart ?? undefined,
            progressEnd: a.progressEnd ?? undefined,
            score: typeof a.score === 'number' ? a.score : 0,
            slug: a.slug,
          },
          create: {
            id: a.id,
            entryId: a.entryId,
            title: a.title,
            imagePath: a.imagePath ?? null,
            type: a.type,
            status: a.status,
            progressStart: a.progressStart ?? null,
            progressEnd: a.progressEnd ?? null,
            score: typeof a.score === 'number' ? a.score : 0,
            slug: a.slug,
            createdAt: parseDate(a.createdAt) ?? new Date(),
            lastUpdatedAt: parseDate(a.lastUpdatedAt) ?? new Date(),
          },
        });
        restored++;
      } catch (err) {
        console.warn(`[activity/import] Erro ao restaurar atividade ${a.id}:`, err);
        // Continua com a próxima
      }
    }

    return NextResponse.json({ restored });
  } catch (error) {
    console.error('[POST /api/activity/import] Erro:', error);
    return NextResponse.json({ error: 'Falha na importação de atividades' }, { status: 500 });
  }
}
