import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const {
      tmdbId,
      parentTmdbId,
      seasonNumber,
      type,
      title,
      status,
      score,
      progress,
      totalEpisodes,
      imagePath,
      customImage,
      startDate,
      finishDate,
      rewatchCount,
      notes,
      private: isPrivate,
      hidden,
      isFavorite,
      favoriteRank,
    } = body;

    if (!tmdbId) {
      return NextResponse.json({ error: 'tmdbId é obrigatório' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'type é obrigatório' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 });
    }

    // CORREÇÃO: Usar "upsert" com dados diretamente
    const entry = await prisma.entry.upsert({
      where: { tmdbId },
      update: {
        parentTmdbId: parentTmdbId ?? null,
        seasonNumber: seasonNumber ?? null,
        title: title.trim(),
        type,
        status: status ?? 'PLANNING',
        score: score ?? 0,
        progress: progress ?? 0,
        totalEpisodes: totalEpisodes ?? null,
        imagePath: imagePath ?? null,
        customImage: customImage ?? null,
        startDate: startDate ? new Date(startDate) : null,
        finishDate: finishDate ? new Date(finishDate) : null,
        rewatchCount: rewatchCount ?? 0,
        notes: notes ?? null,
        private: isPrivate ?? false,
        hidden: hidden ?? false,
        isFavorite: isFavorite ?? false,
        favoriteRank: favoriteRank ?? null,
      },
      create: {
        tmdbId,
        parentTmdbId: parentTmdbId ?? null,
        seasonNumber: seasonNumber ?? null,
        title: title.trim(),
        type,
        status: status ?? 'PLANNING',
        score: score ?? 0,
        progress: progress ?? 0,
        totalEpisodes: totalEpisodes ?? null,
        imagePath: imagePath ?? null,
        customImage: customImage ?? null,
        startDate: startDate ? new Date(startDate) : null,
        finishDate: finishDate ? new Date(finishDate) : null,
        rewatchCount: rewatchCount ?? 0,
        notes: notes ?? null,
        private: isPrivate ?? false,
        hidden: hidden ?? false,
        isFavorite: isFavorite ?? false,
        favoriteRank: favoriteRank ?? null,
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('[update-entry] Erro:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tmdbId = searchParams.get('tmdbId');

    if (!tmdbId) {
      return NextResponse.json({ error: 'tmdbId é obrigatório' }, { status: 400 });
    }

    await prisma.entry.delete({
      where: { tmdbId: parseInt(tmdbId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[delete-entry] Erro:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}