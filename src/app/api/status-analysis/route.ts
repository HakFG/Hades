import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  MOVIE_PRODUCTION_STATUSES,
  TV_PRODUCTION_STATUSES,
} from '@/lib/production-status';
import {
  productionStatusToDisplayStatus,
  resolveSeriesStatusDot,
  entryStatusToBubbleStatus,
} from '@/lib/series-status';
import { getLiveBubbleStatusSnapshot } from '@/lib/tmdb-status';

const STATUS_SYSTEM_SOURCES = [
  {
    file: 'src/app/titles/[id]/page.tsx',
    role: 'Fonte visual do detalhe: calcula seasonStatus por episodios e renderiza StatusBubble no poster.',
  },
  {
    file: 'src/lib/tmdb-status.ts',
    role: 'Replica a regra do titles para APIs/cards e consulta TMDB sem cache.',
  },
  {
    file: 'src/lib/series-status.ts',
    role: 'Resolve nomenclatura de status para cor/label da bolinha.',
  },
  {
    file: 'src/lib/production-status.ts',
    role: 'Normaliza status oficiais do TMDB e lista filtros de producao para filmes/series.',
  },
  {
    file: 'src/app/search/page.tsx',
    role: 'Filtra busca por Airing/Finished/Not Yet Aired quando o usuario escolhe status.',
  },
  {
    file: 'src/lib/browser-filter.ts',
    role: 'Hidrata cards do browser e aplica filtros de productionStatus.',
  },
  {
    file: 'src/app/api/entries/route.ts',
    role: 'Alimenta profile e sincroniza status visual vivo com o banco.',
  },
];

function colorCoverage(status: string) {
  const displayStatus = productionStatusToDisplayStatus(status) ?? status;
  const dot = resolveSeriesStatusDot(displayStatus);
  const silent = displayStatus === 'Finished' || displayStatus === 'Ended' || displayStatus === 'Released';

  return {
    status,
    displayStatus,
    rendersBubble: Boolean(dot),
    silent,
    color: dot?.color ?? null,
    label: dot?.label ?? (silent ? 'No bubble' : null),
  };
}

function slugFor(entry: { type: string; tmdbId: number; parentTmdbId?: number | null; seasonNumber?: number | null }) {
  if (entry.type === 'MOVIE') return `movie-${entry.tmdbId}`;
  return `tv-${entry.parentTmdbId ?? entry.tmdbId}-s${entry.seasonNumber ?? 1}`;
}

export async function GET() {
  try {
    const entries = await prisma.entry.findMany({
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

    const entryAnalysis = await Promise.all(entries.map(async (entry) => {
      const profileStatus = entryStatusToBubbleStatus(entry);
      const live = await getLiveBubbleStatusSnapshot(entry).catch(() => ({
        bubbleStatus: profileStatus,
        productionStatus: entry.productionStatus,
      }));

      return {
        id: entry.id,
        title: entry.title,
        slug: slugFor(entry),
        type: entry.type,
        productionStatus: entry.productionStatus,
        profileBubbleStatus: profileStatus,
        liveBubbleStatus: live.bubbleStatus,
        liveProductionStatus: live.productionStatus ?? null,
        mismatch:
          profileStatus !== live.bubbleStatus ||
          (live.productionStatus != null && entry.productionStatus !== live.productionStatus),
      };
    }));

    return NextResponse.json({
      sources: STATUS_SYSTEM_SOURCES,
      colorCoverage: {
        movies: MOVIE_PRODUCTION_STATUSES.map(colorCoverage),
        tv: TV_PRODUCTION_STATUSES.map(colorCoverage),
        season: ['Airing', 'Finished', 'Not Yet Aired'].map(colorCoverage),
      },
      totals: {
        entries: entryAnalysis.length,
        mismatches: entryAnalysis.filter((entry) => entry.mismatch).length,
      },
      mismatches: entryAnalysis.filter((entry) => entry.mismatch),
      entries: entryAnalysis,
    });
  } catch (error) {
    console.error('[GET /api/status-analysis] Erro:', error);
    return NextResponse.json({ error: 'Falha ao analisar status' }, { status: 500 });
  }
}
