import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncAllEntriesWithTmdb, syncEntryWithTmdb } from '@/lib/tmdb-sync';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const entryId = typeof body.entryId === 'string' ? body.entryId : null;

    if (entryId) {
      const result = await syncEntryWithTmdb(entryId);
      return NextResponse.json({
        success: true,
        mode: 'single',
        entry: result.entry,
        changedFields: result.changedFields,
      });
    }

    const result = await syncAllEntriesWithTmdb();
    return NextResponse.json({ success: true, mode: 'all', ...result });
  } catch (error) {
    console.error('[POST /api/sync/manual] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao sincronizar' },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const logs = await prisma.syncLog.findMany({
      orderBy: { syncedAt: 'desc' },
      take: 50,
      include: {
        entry: {
          select: {
            id: true,
            title: true,
            type: true,
            productionStatus: true,
            lastSyncedAt: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('[GET /api/sync/manual] Erro:', error);
    return NextResponse.json({ error: 'Falha ao buscar logs de sync' }, { status: 500 });
  }
}

