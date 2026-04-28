import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─── Configurações de validação ───────────────────────────────────────────────
const VALID_STATUSES = ['WATCHING', 'COMPLETED', 'PAUSED', 'DROPPED', 'PLANNING', 'REWATCHING', 'UPCOMING'];
const VALID_TYPES = ['MOVIE', 'TV_SEASON'];
const MAX_URL_LENGTH = 2048;
const MAX_TEXT_LENGTH = 10000;

/**
 * Valida URL de imagem/capa
 * Aceita:
 *   - URLs HTTPS do TMDB (com ou sem prefix)
 *   - URLs HTTPS genéricas
 *   - Caminhos relativos do TMDB
 *   - URLs base64 (data:image/*)
 */
function isValidImageUrl(url: unknown): url is string {
  if (!url || typeof url !== 'string') return false;
  if (url.length === 0) return true; // Permite vazio (remove customImage)
  if (url.length > MAX_URL_LENGTH) return false;
  
  try {
    // Aceita data:image
    if (url.startsWith('data:image/')) return true;
    
    // Aceita caminhos TMDB (/t/p/...)
    if (url.startsWith('/t/p/')) return true;
    
    // Aceita URLs HTTPS
    if (url.startsWith('https://')) {
      new URL(url); // Valida URL
      return true;
    }
    
    // Aceita http:// (alguns TMDB antigos podem ser http)
    if (url.startsWith('http://')) {
      new URL(url);
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Normaliza URL de imagem para formato completo HTTPS
 */
function normalizeImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:')) return url;
  if (url.startsWith('/t/p/')) return `https://image.tmdb.org${url}`;
  return url;
}

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

    // ─── Validações obrigatórias ──────────────────────────────────────────────
    if (!tmdbId || typeof tmdbId !== 'number' || tmdbId <= 0) {
      return NextResponse.json({ error: 'tmdbId é obrigatório e deve ser número > 0' }, { status: 400 });
    }
    
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: `type deve ser um de: ${VALID_TYPES.join(', ')}` }, { status: 400 });
    }
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'title é obrigatório e não pode estar vazio' }, { status: 400 });
    }

    // ─── Validações opcionais ────────────────────────────────────────────────
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Status inválido: ${status}` }, { status: 400 });
    }

    // Valida e converte score
    let scoreInt: number | undefined;
    if (score !== undefined && score !== null) {
      if (typeof score !== 'number' || score < 0 || score > 100) {
        return NextResponse.json({ error: 'Score deve ser um número entre 0 e 100' }, { status: 400 });
      }
      scoreInt = Math.floor(score);
    }

    // Valida e converte progress
    let progressInt: number | undefined;
    if (progress !== undefined && progress !== null) {
      if (typeof progress !== 'number' || progress < 0) {
        return NextResponse.json({ error: 'Progress deve ser um número >= 0' }, { status: 400 });
      }
      progressInt = Math.floor(progress);
    }

    // Valida totalEpisodes
    let totalEpisInt: number | undefined;
    if (totalEpisodes !== undefined && totalEpisodes !== null) {
      if (typeof totalEpisodes !== 'number' || totalEpisodes < 0) {
        return NextResponse.json({ error: 'totalEpisodes deve ser um número >= 0' }, { status: 400 });
      }
      totalEpisInt = Math.floor(totalEpisodes);
    }

    // Valida rewatchCount
    let rewatchInt: number | undefined;
    if (rewatchCount !== undefined && rewatchCount !== null) {
      if (typeof rewatchCount !== 'number' || rewatchCount < 0) {
        return NextResponse.json({ error: 'rewatchCount deve ser um número >= 0' }, { status: 400 });
      }
      rewatchInt = Math.floor(rewatchCount);
    }

    // Valida e normaliza customImage (capa customizada)
    let customImageStr: string | null = null;
    if (customImage !== undefined && customImage !== null) {
      if (!isValidImageUrl(customImage)) {
        return NextResponse.json({ error: 'customImage deve ser uma URL HTTPS válida ou vazia' }, { status: 400 });
      }
      customImageStr = customImage ? normalizeImageUrl(customImage) : null;
    }

    // Valida imagePath
    let imagePathStr: string | null = null;
    if (imagePath !== undefined && imagePath !== null) {
      if (!isValidImageUrl(imagePath)) {
        return NextResponse.json({ error: 'imagePath deve ser uma URL válida' }, { status: 400 });
      }
      imagePathStr = imagePath ? normalizeImageUrl(imagePath) : null;
    }

    // Valida notes
    let notesStr: string | null = null;
    if (notes !== undefined && notes !== null) {
      if (typeof notes !== 'string') {
        return NextResponse.json({ error: 'notes deve ser uma string' }, { status: 400 });
      }
      notesStr = notes.trim() ? notes.trim() : null;
      if (notesStr && notesStr.length > MAX_TEXT_LENGTH) {
        return NextResponse.json({ error: `notes não pode exceder ${MAX_TEXT_LENGTH} caracteres` }, { status: 400 });
      }
    }

    // Converte datas
    let startDateObj: Date | null = null;
    if (startDate) {
      const parsed = new Date(startDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'startDate deve ser uma data válida' }, { status: 400 });
      }
      startDateObj = parsed;
    }

    let finishDateObj: Date | null = null;
    if (finishDate) {
      const parsed = new Date(finishDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'finishDate deve ser uma data válida' }, { status: 400 });
      }
      finishDateObj = parsed;
    }

    // Valida isFavorite e favoriteRank
    let favoriteRankInt: number | null = null;
    if (favoriteRank !== undefined && favoriteRank !== null) {
      if (typeof favoriteRank !== 'number' || favoriteRank < 1) {
        return NextResponse.json({ error: 'favoriteRank deve ser um número >= 1' }, { status: 400 });
      }
      favoriteRankInt = Math.floor(favoriteRank);
    }

    // ─── Upsert no banco de dados ──────────────────────────────────────────────
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
        totalEpisodes: totalEpisInt,
        imagePath: imagePathStr,
        customImage: customImageStr,
        startDate: startDateObj,
        finishDate: finishDateObj,
        rewatchCount: rewatchInt ?? 0,
        notes: notesStr,
        private: isPrivate ?? false,
        hidden: hidden ?? false,
        isFavorite: isFavorite ?? false,
        favoriteRank: favoriteRankInt,
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
        totalEpisodes: totalEpisInt,
        imagePath: imagePathStr,
        customImage: customImageStr,
        startDate: startDateObj,
        finishDate: finishDateObj,
        rewatchCount: rewatchInt ?? 0,
        notes: notesStr,
        private: isPrivate ?? false,
        hidden: hidden ?? false,
        isFavorite: isFavorite ?? false,
        favoriteRank: favoriteRankInt,
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('[update-entry] Erro:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}