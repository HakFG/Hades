import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * POST /api/backup/full-import
 * 
 * Importa um backup COMPLETO gerado por /api/backup/full-export.
 * Restaura em ordem: Profile → Entries → Relações → Atividades
 */
export async function POST(request: Request) {
  try {
    const backup = await request.json();

    if (!backup || typeof backup !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const stats = {
      entriesRestored: 0,
      relationsRestored: 0,
      activitiesRestored: 0,
      profileRestored: false,
      errors: [] as string[],
    };

    // ───────────────────────────────────────────────────────────────────────
    // PASSO 1: Restaurar Profile (se existir)
    // ───────────────────────────────────────────────────────────────────────
    if (backup.profile) {
      try {
        await prisma.profile.upsert({
          where: { id: 'main' },
          update: {
            username: backup.profile.username ?? undefined,
            bio: backup.profile.bio ?? undefined,
            avatarUrl: backup.profile.avatarUrl ?? undefined,
            bannerUrl: backup.profile.bannerUrl ?? undefined,
            avatarColor: backup.profile.avatarColor ?? undefined,
          },
          create: {
            id: 'main',
            username: backup.profile.username ?? 'My Profile',
            bio: backup.profile.bio ?? null,
            avatarUrl: backup.profile.avatarUrl ?? null,
            bannerUrl: backup.profile.bannerUrl ?? null,
            avatarColor: backup.profile.avatarColor ?? '#3db4f2',
            createdAt: parseDate(backup.profile.createdAt) ?? new Date(),
          },
        });
        stats.profileRestored = true;
      } catch (err) {
        stats.errors.push(`Erro ao restaurar perfil: ${err}`);
      }
    }

    // ───────────────────────────────────────────────────────────────────────
    // PASSO 2: Restaurar Entries (ANTES de relações e atividades)
    // ───────────────────────────────────────────────────────────────────────
    if (Array.isArray(backup.entries)) {
      for (const e of backup.entries) {
        try {
          await prisma.entry.upsert({
            where: { id: e.id },
            update: {
              // ─── Dados principais ───
              status: e.status,
              score: typeof e.score === 'number' ? e.score : 0,
              progress: typeof e.progress === 'number' ? e.progress : 0,
              rewatchCount: typeof e.rewatchCount === 'number' ? e.rewatchCount : 0,

              // ─── Datas ───
              startDate: parseDate(e.startDate),
              finishDate: parseDate(e.finishDate),
              releaseDate: e.releaseDate ?? undefined,
              endDate: e.endDate ?? undefined,

              // ─── Metadados TMDB ───
              rating: typeof e.rating === 'number' ? e.rating : undefined,
              popularity: typeof e.popularity === 'number' ? e.popularity : undefined,
              genres: e.genres ?? undefined,
              studio: e.studio ?? undefined,

              // ─── Imagens ───
              imagePath: e.imagePath ?? undefined,
              bannerPath: e.bannerPath ?? undefined,
              customImage: e.customImage ?? undefined,

              // ─── Conteúdo ───
              notes: e.notes ?? undefined,
              synopsis: e.synopsis ?? undefined,
              format: e.format ?? undefined,

              // ─── Flags ───
              hidden: e.hidden ?? false,
              isFavorite: e.isFavorite ?? false,
              private: e.private ?? false,
              favoriteRank: e.favoriteRank ?? undefined,

              // ─── JSON ───
              staff: e.staff ?? undefined,
            },
            create: {
              // ─── IDs ───
              id: e.id,
              tmdbId: e.tmdbId,
              parentTmdbId: e.parentTmdbId ?? null,
              seasonNumber: e.seasonNumber ?? null,

              // ─── Dados principais ───
              title: e.title,
              type: e.type,
              status: e.status,
              score: typeof e.score === 'number' ? e.score : 0,
              progress: typeof e.progress === 'number' ? e.progress : 0,
              totalEpisodes: typeof e.totalEpisodes === 'number' ? e.totalEpisodes : null,
              rewatchCount: typeof e.rewatchCount === 'number' ? e.rewatchCount : 0,

              // ─── Datas ───
              startDate: parseDate(e.startDate),
              finishDate: parseDate(e.finishDate),
              releaseDate: e.releaseDate ?? null,
              endDate: e.endDate ?? null,
              createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),

              // ─── Metadados TMDB ───
              rating: typeof e.rating === 'number' ? e.rating : null,
              popularity: typeof e.popularity === 'number' ? e.popularity : 0,
              genres: e.genres ?? null,
              studio: e.studio ?? null,

              // ─── Imagens ───
              imagePath: e.imagePath ?? null,
              bannerPath: e.bannerPath ?? null,
              customImage: e.customImage ?? null,

              // ─── Conteúdo ───
              notes: e.notes ?? null,
              synopsis: e.synopsis ?? null,
              format: e.format ?? null,

              // ─── Flags ───
              hidden: e.hidden ?? false,
              isFavorite: e.isFavorite ?? false,
              private: e.private ?? false,
              favoriteRank: e.favoriteRank ?? null,

              // ─── JSON ───
              staff: e.staff ?? null,
            },
          });
          stats.entriesRestored++;
        } catch (err) {
          stats.errors.push(`Erro ao restaurar entry ${e.id}: ${err}`);
        }
      }
    }

    // ───────────────────────────────────────────────────────────────────────
    // PASSO 3: Restaurar Relações (DEPOIS das entries)
    // ───────────────────────────────────────────────────────────────────────
    if (Array.isArray(backup.relations)) {
      for (const r of backup.relations) {
        try {
          // Valida se source entry existe
          const sourceExists = await prisma.entry.findUnique({
            where: { id: r.sourceEntryId },
          });

          if (!sourceExists) {
            continue;
          }

          await prisma.relation.upsert({
            where: {
              sourceEntryId_targetTmdbId: {
                sourceEntryId: r.sourceEntryId,
                targetTmdbId: r.targetTmdbId,
              },
            },
            update: {
              relationType: r.relationType,
              title: r.title,
              poster_path: r.poster_path ?? undefined,
              kind: r.kind,
              year: r.year ?? undefined,
              seasonNumber: r.seasonNumber ?? undefined,
              order: r.order ?? undefined,
              targetTmdbId: r.targetTmdbId,
              targetParentTmdbId: r.targetParentTmdbId ?? undefined,
              targetSeasonNumber: r.targetSeasonNumber ?? undefined,
              targetType: r.targetType ?? undefined,
              targetEntryId: r.targetEntryId ?? undefined,
            },
            create: {
              sourceEntryId: r.sourceEntryId,
              targetEntryId: r.targetEntryId ?? null,
              relationType: r.relationType,
              title: r.title,
              poster_path: r.poster_path ?? null,
              kind: r.kind,
              year: r.year ?? null,
              seasonNumber: r.seasonNumber ?? null,
              order: r.order ?? null,
              targetTmdbId: r.targetTmdbId,
              targetParentTmdbId: r.targetParentTmdbId ?? null,
              targetSeasonNumber: r.targetSeasonNumber ?? null,
              targetType: r.targetType ?? null,
              createdAt: parseDate(r.createdAt) ?? new Date(),
            },
          });
          stats.relationsRestored++;
        } catch (err) {
          stats.errors.push(`Erro ao restaurar relação ${r.id}: ${err}`);
        }
      }
    }

    // ───────────────────────────────────────────────────────────────────────
    // PASSO 4: Restaurar Atividades (DEPOIS das entries)
    // ───────────────────────────────────────────────────────────────────────
    if (Array.isArray(backup.activities)) {
      for (const a of backup.activities) {
        try {
          // Valida se a entry existe
          const entryExists = await prisma.entry.findUnique({
            where: { id: a.entryId },
          });

          if (!entryExists) {
            continue;
          }

          await prisma.activityLog.upsert({
            where: { id: a.id },
            update: {
              entryId: a.entryId,
              title: a.title,
              imagePath: a.imagePath ?? undefined,
              type: a.type,
              status: a.status,
              progressStart: a.progressStart ?? undefined,
              progressEnd: a.progressEnd ?? undefined,
              score: typeof a.score === 'number' ? a.score : 0,
              slug: a.slug,
            },
            create: {
              id: a.id,
              entryId: a.entryId,
              title: a.title,
              imagePath: a.imagePath ?? null,
              type: a.type,
              status: a.status,
              progressStart: a.progressStart ?? null,
              progressEnd: a.progressEnd ?? null,
              score: typeof a.score === 'number' ? a.score : 0,
              slug: a.slug,
              createdAt: parseDate(a.createdAt) ?? new Date(),
              lastUpdatedAt: parseDate(a.lastUpdatedAt) ?? new Date(),
            },
          });
          stats.activitiesRestored++;
        } catch (err) {
          stats.errors.push(`Erro ao restaurar atividade ${a.id}: ${err}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Backup restaurado com sucesso!',
      ...stats,
    });
  } catch (error) {
    console.error('[POST /api/backup/full-import] Erro:', error);
    return NextResponse.json(
      { error: 'Falha na importação completa do backup' },
      { status: 500 }
    );
  }
}
