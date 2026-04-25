import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/entries - Buscar todas as entries do usuário
export async function GET() {
  try {
    const entries = await prisma.entry.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

// POST /api/entries - Criar uma nova entry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tmdbId, parentTmdbId, seasonNumber, type, title, imagePath, totalEpisodes } = body;

    // Verificar se já existe
    const existing = await prisma.entry.findUnique({
      where: { tmdbId: tmdbId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Entry already exists' }, { status: 409 });
    }

    const entry = await prisma.entry.create({
      data: {
        tmdbId,
        parentTmdbId: parentTmdbId || null,
        seasonNumber: seasonNumber || null,
        title,
        type,
        status: body.status || 'PLANNING',
        score: body.score || 0,
        progress: body.progress || 0,
        totalEpisodes: totalEpisodes || null,
        imagePath: imagePath || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        finishDate: body.finishDate ? new Date(body.finishDate) : null,
        rewatchCount: body.rewatchCount || 0,
        notes: body.notes || null,
        hidden: body.hidden || false,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}