import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Valida se o status está dentro dos valores permitidos
const validStatuses = ['WATCHING', 'COMPLETED', 'PAUSED', 'DROPPED', 'PLANNING', 'REWATCHING', 'UPCOMING'];

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

    // Validações obrigatórias
    if (!tmdbId || typeof tmdbId !== 'number') {
      return NextResponse.json({ error: 'tmdbId é obrigatório e deve ser número' }, { status: 400 });
    }
    if (!type || (type !== 'MOVIE' && type !== 'TV_SEASON')) {
      return NextResponse.json({ error: 'type deve ser MOVIE ou TV_SEASON' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 });
    }

    // Valida status
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Status inválido: ${status}` }, { status: 400 });
    }

    // Valida score (deve ser inteiro entre 0 e 100)
    let scoreInt: number | undefined;
    if (score !== undefined) {
      if (typeof score !== 'number' || score < 0 || score > 100) {
        return NextResponse.json({ error: 'Score deve ser um número entre 0 e 100' }, { status: 400 });
      }
      scoreInt = Math.floor(score);
    }

    // Valida progress
    let progressInt: number | undefined;
    if (progress !== undefined) {
      if (typeof progress !== 'number' || progress < 0) {
        return NextResponse.json({ error: 'Progress deve ser um número >= 0' }, { status: 400 });
      }
      progressInt = Math.floor(progress);
    }

    // Converte datas
    const startDateObj = startDate ? new Date(startDate) : null;
    const finishDateObj = finishDate ? new Date(finishDate) : null;

    const entry = await prisma.entry.upsert({
      where: { tmdbId },
      update: {
        parentTmdbId: parentTmdbId ?? null,
        seasonNumber: seasonNumber ?? null,
        title: title.trim(),
        type,
        status: status ?? undefined,
        score: scoreInt,
        progress: progressInt,
        totalEpisodes: totalEpisodes ?? null,
        imagePath: imagePath ?? null,
        customImage: customImage ?? null,
        startDate: startDateObj,
        finishDate: finishDateObj,
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
        score: scoreInt ?? 0,
        progress: progressInt ?? 0,
        totalEpisodes: totalEpisodes ?? null,
        imagePath: imagePath ?? null,
        customImage: customImage ?? null,
        startDate: startDateObj,
        finishDate: finishDateObj,
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