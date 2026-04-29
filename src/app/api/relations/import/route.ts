import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * POST /api/relations/import
 * 
 * Importa relações do backup.
 * IMPORTANTE: As entries já devem estar no banco antes de importar relações.
 */
export async function POST(request: Request) {
  try {
    const relations = await request.json();
    if (!Array.isArray(relations)) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    let restored = 0;
    for (const r of relations) {
      try {
        // Valida se ambas as entries existem
        const sourceExists = await prisma.entry.findUnique({
          where: { id: r.sourceEntryId },
        });

        if (!sourceExists) {
          console.warn(`[relations/import] Source entry ${r.sourceEntryId} não encontrada, pulando`);
          continue;
        }

        await prisma.relation.upsert({
          where: {
            // Unique constraint: (sourceEntryId, targetTmdbId)
            sourceEntryId_targetTmdbId: {
              sourceEntryId: r.sourceEntryId,
              targetTmdbId: r.targetTmdbId,
            },
          },
          update: {
            relationType: r.relationType,
            title: r.title,
            poster_path: r.poster_path ?? undefined,
            kind: r.kind,
            year: r.year ?? undefined,
            seasonNumber: r.seasonNumber ?? undefined,
            order: r.order ?? undefined,
            targetTmdbId: r.targetTmdbId,
            targetParentTmdbId: r.targetParentTmdbId ?? undefined,
            targetSeasonNumber: r.targetSeasonNumber ?? undefined,
            targetType: r.targetType ?? undefined,
            // targetEntryId pode ser null se o entry target não existe
            targetEntryId: r.targetEntryId ?? undefined,
          },
          create: {
            sourceEntryId: r.sourceEntryId,
            targetEntryId: r.targetEntryId ?? null,
            relationType: r.relationType,
            title: r.title,
            poster_path: r.poster_path ?? null,
            kind: r.kind,
            year: r.year ?? null,
            seasonNumber: r.seasonNumber ?? null,
            order: r.order ?? null,
            targetTmdbId: r.targetTmdbId,
            targetParentTmdbId: r.targetParentTmdbId ?? null,
            targetSeasonNumber: r.targetSeasonNumber ?? null,
            targetType: r.targetType ?? null,
            createdAt: parseDate(r.createdAt) ?? new Date(),
          },
        });
        restored++;
      } catch (err) {
        console.warn(`[relations/import] Erro ao restaurar relação ${r.id}:`, err);
        // Continua com a próxima
      }
    }

    return NextResponse.json({ restored });
  } catch (error) {
    console.error('[POST /api/relations/import] Erro:', error);
    return NextResponse.json({ error: 'Falha na importação de relações' }, { status: 500 });
  }
}
