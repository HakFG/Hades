import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/relations?sourceId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');

    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId é obrigatório' }, { status: 400 });
    }

    const relations = await prisma.relation.findMany({
      where: { sourceEntryId: sourceId },
      orderBy: { order: 'asc' },
      include: {
        targetEntry: {
          select: { tmdbId: true, parentTmdbId: true, seasonNumber: true, type: true },
        },
      },
    });

    return NextResponse.json(relations);
  } catch (error) {
    console.error('[GET /api/relations]', error);
    return NextResponse.json({ error: 'Erro ao buscar relações' }, { status: 500 });
  }
}

// POST /api/relations
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sourceEntryId, relationType, title, poster_path, kind, year, seasonNumber, order,
      targetTmdbId, targetParentTmdbId, targetSeasonNumber, targetType,
    } = body;

    if (!sourceEntryId || !relationType || !title || !targetTmdbId) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Tenta vincular ao targetEntryId se a entry já existir na lista do usuário
    // Mas NÃO cria — apenas vincula se já existir
    let targetEntryId: string | undefined = undefined;
    try {
      const existing = await prisma.entry.findFirst({
        where: targetType === 'MOVIE'
          ? { tmdbId: targetTmdbId }
          : { parentTmdbId: targetParentTmdbId ?? targetTmdbId, seasonNumber: targetSeasonNumber ?? 1 },
        select: { id: true },
      });
      if (existing) targetEntryId = existing.id;
    } catch {}

    const relation = await prisma.relation.upsert({
      where: {
        sourceEntryId_targetTmdbId: {
          sourceEntryId,
          targetTmdbId,
        },
      },
      update: {
        relationType,
        poster_path,
        kind,
        year,
        seasonNumber,
        order,
        targetEntryId,
        targetParentTmdbId,
        targetSeasonNumber,
        targetType,
      },
      create: {
        sourceEntryId,
        targetEntryId,
        relationType,
        title,
        poster_path,
        kind,
        year,
        seasonNumber,
        order: order ?? 0,
        targetTmdbId,
        targetParentTmdbId,
        targetSeasonNumber,
        targetType,
      },
    });

    return NextResponse.json(relation);
  } catch (error) {
    console.error('[POST /api/relations]', error);
    return NextResponse.json({ error: 'Erro ao salvar relação' }, { status: 500 });
  }
}

// DELETE /api/relations?sourceId=xxx&targetTmdbId=yyy
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');
    const targetTmdbId = searchParams.get('targetTmdbId');

    if (!sourceId || !targetTmdbId) {
      return NextResponse.json({ error: 'sourceId e targetTmdbId são obrigatórios' }, { status: 400 });
    }

    await prisma.relation.delete({
      where: {
        sourceEntryId_targetTmdbId: {
          sourceEntryId: sourceId,
          targetTmdbId: parseInt(targetTmdbId),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/relations]', error);
    return NextResponse.json({ error: 'Erro ao remover relação' }, { status: 500 });
  }
}