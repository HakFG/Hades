import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * POST /api/profile/import
 * 
 * Importa dados de perfil do backup.
 */
export async function POST(request: Request) {
  try {
    const profile = await request.json();
    
    if (!profile || typeof profile !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const restored = await prisma.profile.upsert({
      where: { id: 'main' },
      update: {
        username: profile.username ?? undefined,
        bio: profile.bio ?? undefined,
        avatarUrl: profile.avatarUrl ?? undefined,
        bannerUrl: profile.bannerUrl ?? undefined,
        avatarColor: profile.avatarColor ?? undefined,
      },
      create: {
        id: 'main',
        username: profile.username ?? 'My Profile',
        bio: profile.bio ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        bannerUrl: profile.bannerUrl ?? null,
        avatarColor: profile.avatarColor ?? '#3db4f2',
        createdAt: parseDate(profile.createdAt) ?? new Date(),
      },
    });

    return NextResponse.json({ success: true, profile: restored });
  } catch (error) {
    console.error('[POST /api/profile/import] Erro:', error);
    return NextResponse.json({ error: 'Falha na importação de perfil' }, { status: 500 });
  }
}
