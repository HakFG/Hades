import { NextResponse } from 'next/server';
import { getEntrySeasons, syncEntrySeasonEpisodes } from '@/lib/seasons';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    const { entryId } = await params;
    const seasons = await getEntrySeasons(entryId);
    return NextResponse.json(seasons);
  } catch (error) {
    console.error('[GET /api/seasons/:entryId] Erro:', error);
    return NextResponse.json({ error: 'Falha ao buscar temporadas' }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    const { entryId } = await params;
    const result = await syncEntrySeasonEpisodes(entryId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[POST /api/seasons/:entryId] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao sincronizar temporadas' },
      { status: 500 },
    );
  }
}
