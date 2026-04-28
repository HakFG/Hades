import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─── Configurações ────────────────────────────────────────────────────────────
const VALID_RELATION_TYPES = [
  'SEQUEL', 'PREQUEL', 'SPIN_OFF', 'SIDE_STORY',
  'ADAPTATION', 'ALTERNATIVE', 'SUMMARY', 'OTHER',
];

const VALID_KINDS = ['movie', 'tv'];

/**
 * Valida um tipo de relação
 */
function isValidRelationType(type: unknown): type is string {
  return typeof type === 'string' && VALID_RELATION_TYPES.includes(type);
}

/**
 * Valida um tipo de mídia
 */
function isValidKind(kind: unknown): kind is string {
  return typeof kind === 'string' && VALID_KINDS.includes(kind);
}

/**
 * GET /api/relations?sourceId=xxx
 * 
 * Busca todas as relações salvaspara uma entrada de origem.
 * Ordena por campo `order` para manter a sequência customizada do usuário.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');

    if (!sourceId || typeof sourceId !== 'string' || !sourceId.trim()) {
      return NextResponse.json(
        { error: 'sourceId é obrigatório e deve ser uma string' },
        { status: 400 },
      );
    }

    // Valida que o sourceId existe no banco
    const sourceEntry = await prisma.entry.findUnique({
      where: { id: sourceId },
      select: { id: true },
    });

    if (!sourceEntry) {
      return NextResponse.json(
        { error: 'sourceId não encontrado' },
        { status: 404 },
      );
    }

    const relations = await prisma.relation.findMany({
      where: { sourceEntryId: sourceId },
      orderBy: { order: 'asc' },
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
    return NextResponse.json(
      { error: 'Erro ao buscar relações' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/relations
 * 
 * Cria ou atualiza uma relação entre dois títulos.
 * Estratégia robusta:
 *   1. Cria registro de relação no banco
 *   2. Tenta vincular ao targetEntry se ele existir
 *   3. Nunca falha se a vinculação falhar
 *   4. Suporta upsert para evitar duplicatas
 */
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
      targetTmdbId,
      targetParentTmdbId,
      targetSeasonNumber,
      targetType,
    } = body;

    // ─── Validações obrigatórias ──────────────────────────────────────────────
    if (!sourceEntryId || typeof sourceEntryId !== 'string' || !sourceEntryId.trim()) {
      return NextResponse.json(
        { error: 'sourceEntryId é obrigatório' },
        { status: 400 },
      );
    }

    if (!isValidRelationType(relationType)) {
      return NextResponse.json(
        { error: `relationType deve ser um de: ${VALID_RELATION_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'title é obrigatório' },
        { status: 400 },
      );
    }

    if (!isValidKind(kind)) {
      return NextResponse.json(
        { error: `kind deve ser um de: ${VALID_KINDS.join(', ')}` },
        { status: 400 },
      );
    }

    if (!targetTmdbId || typeof targetTmdbId !== 'number' || targetTmdbId <= 0) {
      return NextResponse.json(
        { error: 'targetTmdbId é obrigatório e deve ser um número > 0' },
        { status: 400 },
      );
    }

    // ─── Validações opcionais ──────────────────────────────────────────────
    if (seasonNumber !== undefined && seasonNumber !== null) {
      if (typeof seasonNumber !== 'number' || seasonNumber < 0) {
        return NextResponse.json(
          { error: 'seasonNumber deve ser um número >= 0' },
          { status: 400 },
        );
      }
    }

    if (order !== undefined && order !== null) {
      if (typeof order !== 'number' || order < 0) {
        return NextResponse.json(
          { error: 'order deve ser um número >= 0' },
          { status: 400 },
        );
      }
    }

    // ─── Verifica se sourceEntry existe ───────────────────────────────────────
    const sourceEntry = await prisma.entry.findUnique({
      where: { id: sourceEntryId },
      select: { id: true },
    });

    if (!sourceEntry) {
      return NextResponse.json(
        { error: 'sourceEntryId não encontrado no banco' },
        { status: 404 },
      );
    }

    // ─── Tenta vincular targetEntry se ele existir ──────────────────────────
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

      if (existing) {
        targetEntryId = existing.id;
      }
    } catch (err) {
      // Se a busca falhar, continua sem vincular
      console.warn('[POST /api/relations] Não conseguiu encontrar targetEntry:', err);
    }

    // ─── Upsert da relação ────────────────────────────────────────────────────
    const relation = await prisma.relation.upsert({
      where: {
        sourceEntryId_targetTmdbId: {
          sourceEntryId,
          targetTmdbId,
        },
      },
      update: {
        relationType,
        title: title.trim(),
        poster_path: poster_path ?? null,
        kind,
        year: year ?? null,
        seasonNumber: seasonNumber ?? null,
        order: order ?? 0,
        targetEntryId,
        targetParentTmdbId: targetParentTmdbId ?? null,
        targetSeasonNumber: targetSeasonNumber ?? null,
        targetType: targetType ?? null,
      },
      create: {
        sourceEntryId,
        targetEntryId,
        relationType,
        title: title.trim(),
        poster_path: poster_path ?? null,
        kind,
        year: year ?? null,
        seasonNumber: seasonNumber ?? null,
        order: order ?? 0,
        targetTmdbId,
        targetParentTmdbId: targetParentTmdbId ?? null,
        targetSeasonNumber: targetSeasonNumber ?? null,
        targetType: targetType ?? null,
      },
    });

    return NextResponse.json(relation);
  } catch (error) {
    console.error('[POST /api/relations]', error);
    return NextResponse.json(
      { error: 'Erro ao salvar relação' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/relations?sourceId=xxx&targetTmdbId=yyy
 * 
 * Atualiza campos específicos de uma relação sem criar.
 * Útil para reordenar ou alterar tipo sem passar todos os dados.
 */
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');
    const targetTmdbIdStr = searchParams.get('targetTmdbId');
    const body = await request.json();

    if (!sourceId || !targetTmdbIdStr) {
      return NextResponse.json(
        { error: 'sourceId e targetTmdbId são obrigatórios' },
        { status: 400 },
      );
    }

    const targetTmdbId = parseInt(targetTmdbIdStr);
    if (isNaN(targetTmdbId) || targetTmdbId <= 0) {
      return NextResponse.json(
        { error: 'targetTmdbId deve ser um número > 0' },
        { status: 400 },
      );
    }

    // Valida campos que podem ser atualizados
    const updateData: any = {};

    if (body.relationType !== undefined) {
      if (!isValidRelationType(body.relationType)) {
        return NextResponse.json(
          { error: `relationType inválido` },
          { status: 400 },
        );
      }
      updateData.relationType = body.relationType;
    }

    if (body.order !== undefined && body.order !== null) {
      if (typeof body.order !== 'number' || body.order < 0) {
        return NextResponse.json(
          { error: 'order deve ser um número >= 0' },
          { status: 400 },
        );
      }
      updateData.order = body.order;
    }

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
    return NextResponse.json(
      { error: 'Erro ao atualizar relação' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/relations?sourceId=xxx&targetTmdbId=yyy
 * 
 * Remove uma relação específica.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');
    const targetTmdbIdStr = searchParams.get('targetTmdbId');

    if (!sourceId || !targetTmdbIdStr) {
      return NextResponse.json(
        { error: 'sourceId e targetTmdbId são obrigatórios' },
        { status: 400 },
      );
    }

    const targetTmdbId = parseInt(targetTmdbIdStr);
    if (isNaN(targetTmdbId) || targetTmdbId <= 0) {
      return NextResponse.json(
        { error: 'targetTmdbId deve ser um número > 0' },
        { status: 400 },
      );
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
    return NextResponse.json(
      { error: 'Erro ao remover relação' },
      { status: 500 },
    );
  }
}