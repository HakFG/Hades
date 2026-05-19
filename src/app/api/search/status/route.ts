import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { entrySlug } from '@/lib/utils';

function parseIds(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = parseIds(searchParams.get('ids'));

  if (!ids.length) {
    return NextResponse.json({ entries: {}, existingIds: [] });
  }

  const entries = await prisma.entry.findMany({
    where: { tmdbId: { in: ids } },
    select: {
      id: true,
      tmdbId: true,
      parentTmdbId: true,
      seasonNumber: true,
      title: true,
      type: true,
      status: true,
      score: true,
      progress: true,
      totalEpisodes: true,
      imagePath: true,
    },
  });

  return NextResponse.json({
    entries: Object.fromEntries(
      entries.map((entry) => [
        entry.tmdbId,
        {
          ...entry,
          slug: entrySlug(entry),
        },
      ]),
    ),
    existingIds: entries.map((entry) => entry.tmdbId),
  });
}
