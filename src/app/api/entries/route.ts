import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { entryStatusToBubbleStatus } from '@/lib/series-status';
import { syncAllEntriesWithTmdb } from '@/lib/tmdb-sync';

// GET /api/entries - Buscar todas as entries do usuário
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const production = searchParams.get('productionStatus');
    const refresh = searchParams.get('refresh');
    const tmdbId = Number(searchParams.get('tmdbId'));
    const statuses = production
      ?.split(',')
      .map((item) => item.trim())
      .filter((item) => item && item !== 'All');

    if (refresh === 'tmdb') {
      await syncAllEntriesWithTmdb();
    }

    if (Number.isInteger(tmdbId) && tmdbId > 0) {
      const entry = await prisma.entry.findUnique({ where: { tmdbId } });
      if (!entry) return NextResponse.json(null);
      return NextResponse.json({
        ...entry,
        startDate: entry.startDate?.toISOString().split('T')[0] ?? null,
        finishDate: entry.finishDate?.toISOString().split('T')[0] ?? null,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      });
    }

    const entries = await prisma.entry.findMany({
      where: {
        ...(type === 'MOVIE' || type === 'TV_SEASON' ? { type } : {}),
        ...(statuses?.length ? { productionStatus: { in: statuses } } : {}),
      },
      include: {
        seasons: {
          select: {
            status: true,
            airDate: true,
            seasonNumber: true,
            episodes: {
              select: { airDate: true },
              orderBy: { episodeNumber: 'asc' },
            },
          },
          orderBy: { seasonNumber: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    // Garante que datas sejam strings ISO ou null.
    // Importante: por padrao esta rota nao chama TMDB. O profile precisa abrir rapido.
    const serialized = entries.map(entry => ({
      ...entry,
      seasonStatus: entryStatusToBubbleStatus(entry),
      startDate: entry.startDate?.toISOString().split('T')[0] ?? null,
      finishDate: entry.finishDate?.toISOString().split('T')[0] ?? null,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    }));
    return NextResponse.json(serialized);
  } catch (error) {
    console.error('[GET /api/entries] Erro:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar entradas' },
      { status: 500 }
    );
  }
}

// POST /api/entries - Desabilitado (use /api/add-media ou /api/update-entry)
export async function POST() {
  return NextResponse.json(
    { error: 'Método não permitido. Use /api/add-media para criar novas entradas ou /api/entries/[id] com PATCH para atualizar.' },
    { status: 405 }
  );
}
