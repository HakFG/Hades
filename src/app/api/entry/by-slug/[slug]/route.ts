import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise< { slug: string } > }
) {
  const { slug } = await params;

  const movieMatch = slug.match(/^movie-(\d+)$/);
  const tvMatch = slug.match(/^tv-(\d+)-s(\d+)$/);

  let where: any = {};

  if (movieMatch) {
    const tmdbId = parseInt(movieMatch[1]);
    where = { tmdbId };
  } else if (tvMatch) {
    const parentTmdbId = parseInt(tvMatch[1]);
    const seasonNumber = parseInt(tvMatch[2]);
    where = { parentTmdbId, seasonNumber };
  } else {
    return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
  }

  try {
    const entry = await prisma.entry.findFirst({ where });
    if (!entry) {
      return NextResponse.json({ error: 'Entry não encontrada' }, { status: 404 });
    }
    return NextResponse.json(entry);
  } catch (error) {
    console.error('[GET /api/entry/[slug]]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}