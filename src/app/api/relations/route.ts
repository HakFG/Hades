import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_RELATION_TYPES = [
  'SEQUEL',
  'PREQUEL',
  'SPIN_OFF',
  'SIDE_STORY',
  'ADAPTATION',
  'ALTERNATIVE',
  'SUMMARY',
  'OTHER',
];

const VALID_KINDS = ['movie', 'tv'];

function isValidRelationType(type: unknown): type is string {
  return typeof type === 'string' && VALID_RELATION_TYPES.includes(type);
}

function isValidKind(kind: unknown): kind is 'movie' | 'tv' {
  return typeof kind === 'string' && VALID_KINDS.includes(kind);
}

function optionalNonNegativeNumber(value: unknown, field: string) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || value < 0) {
    return `${field} deve ser um numero >= 0`;
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');

    if (!sourceId?.trim()) {
      return NextResponse.json({ error: 'sourceId e obrigatorio' }, { status: 400 });
    }

    const sourceEntry = await prisma.entry.findUnique({
      where: { id: sourceId },
      select: { id: true },
    });

    if (!sourceEntry) {
      return NextResponse.json({ error: 'sourceId nao encontrado' }, { status: 404 });
    }

    const relations = await prisma.relation.findMany({
      where: { sourceEntryId: sourceId },
      orderBy: [{ order: 'asc' }, { sequenceOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        targetEntry: {
          select: {
            id: true,
            tmdbId: true,
            parentTmdbId: true,
            seasonNumber: true,
            type: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(relations);
  } catch (error) {
    console.error('[GET /api/relations]', error);
    return NextResponse.json({ error: 'Erro ao buscar relacoes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sourceEntryId,
      relationType,
      title,
      poster_path,
      kind,
      year,
      seasonNumber,
      order,
      isAutomatic,
      sequenceOrder,
      spinoffMetadata,
      targetTmdbId,
      targetParentTmdbId,
      targetSeasonNumber,
      targetType,
    } = body;

    if (!sourceEntryId?.trim()) {
      return NextResponse.json({ error: 'sourceEntryId e obrigatorio' }, { status: 400 });
    }

    if (!isValidRelationType(relationType)) {
      return NextResponse.json(
        { error: `relationType deve ser um de: ${VALID_RELATION_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title e obrigatorio' }, { status: 400 });
    }

    if (!isValidKind(kind)) {
      return NextResponse.json({ error: `kind deve ser um de: ${VALID_KINDS.join(', ')}` }, { status: 400 });
    }

    if (!targetTmdbId || typeof targetTmdbId !== 'number' || targetTmdbId <= 0) {
      return NextResponse.json({ error: 'targetTmdbId e obrigatorio e deve ser > 0' }, { status: 400 });
    }

    const numericError =
      optionalNonNegativeNumber(seasonNumber, 'seasonNumber') ??
      optionalNonNegativeNumber(order, 'order') ??
      optionalNonNegativeNumber(sequenceOrder, 'sequenceOrder');
    if (numericError) {
      return NextResponse.json({ error: numericError }, { status: 400 });
    }

    const sourceEntry = await prisma.entry.findUnique({
      where: { id: sourceEntryId },
      select: { id: true },
    });

    if (!sourceEntry) {
      return NextResponse.json({ error: 'sourceEntryId nao encontrado no banco' }, { status: 404 });
    }

    let targetEntryId: string | null = null;
    try {
      const existing = await prisma.entry.findFirst({
        where:
          kind === 'movie'
            ? { tmdbId: targetTmdbId }
            : {
                parentTmdbId: targetParentTmdbId ?? targetTmdbId,
                seasonNumber: targetSeasonNumber ?? 1,
              },
        select: { id: true },
      });
      targetEntryId = existing?.id ?? null;
    } catch (err) {
      console.warn('[POST /api/relations] Could not link targetEntry:', err);
    }

    const relationData = {
      relationType,
      title: title.trim(),
      poster_path: poster_path ?? null,
      kind,
      year: year ?? null,
      seasonNumber: seasonNumber ?? null,
      order: order ?? 0,
      isAutomatic: Boolean(isAutomatic),
      sequenceOrder: sequenceOrder ?? null,
      spinoffMetadata: spinoffMetadata ?? undefined,
      targetEntryId,
      targetParentTmdbId: targetParentTmdbId ?? null,
      targetSeasonNumber: targetSeasonNumber ?? null,
      targetType: targetType ?? null,
    };

    const relation = await prisma.relation.upsert({
      where: {
        sourceEntryId_targetTmdbId: {
          sourceEntryId,
          targetTmdbId,
        },
      },
      update: relationData,
      create: {
        sourceEntryId,
        targetTmdbId,
        ...relationData,
      },
    });

    return NextResponse.json(relation);
  } catch (error) {
    console.error('[POST /api/relations]', error);
    return NextResponse.json({ error: 'Erro ao salvar relacao' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');
    const targetTmdbIdStr = searchParams.get('targetTmdbId');
    const body = await request.json();

    if (!sourceId || !targetTmdbIdStr) {
      return NextResponse.json({ error: 'sourceId e targetTmdbId sao obrigatorios' }, { status: 400 });
    }

    const targetTmdbId = parseInt(targetTmdbIdStr);
    if (Number.isNaN(targetTmdbId) || targetTmdbId <= 0) {
      return NextResponse.json({ error: 'targetTmdbId deve ser > 0' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.relationType !== undefined) {
      if (!isValidRelationType(body.relationType)) {
        return NextResponse.json({ error: 'relationType invalido' }, { status: 400 });
      }
      updateData.relationType = body.relationType;
    }

    const numericError =
      optionalNonNegativeNumber(body.order, 'order') ??
      optionalNonNegativeNumber(body.sequenceOrder, 'sequenceOrder');
    if (numericError) {
      return NextResponse.json({ error: numericError }, { status: 400 });
    }

    if (body.order !== undefined) updateData.order = body.order;
    if (body.sequenceOrder !== undefined) updateData.sequenceOrder = body.sequenceOrder;
    if (body.spinoffMetadata !== undefined) updateData.spinoffMetadata = body.spinoffMetadata;

    const relation = await prisma.relation.update({
      where: {
        sourceEntryId_targetTmdbId: {
          sourceEntryId: sourceId,
          targetTmdbId,
        },
      },
      data: updateData,
    });

    return NextResponse.json(relation);
  } catch (error) {
    console.error('[PATCH /api/relations]', error);
    return NextResponse.json({ error: 'Erro ao atualizar relacao' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');
    const targetTmdbIdStr = searchParams.get('targetTmdbId');

    if (!sourceId || !targetTmdbIdStr) {
      return NextResponse.json({ error: 'sourceId e targetTmdbId sao obrigatorios' }, { status: 400 });
    }

    const targetTmdbId = parseInt(targetTmdbIdStr);
    if (Number.isNaN(targetTmdbId) || targetTmdbId <= 0) {
      return NextResponse.json({ error: 'targetTmdbId deve ser > 0' }, { status: 400 });
    }

    await prisma.relation.delete({
      where: {
        sourceEntryId_targetTmdbId: {
          sourceEntryId: sourceId,
          targetTmdbId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/relations]', error);
    return NextResponse.json({ error: 'Erro ao remover relacao' }, { status: 500 });
  }
}
