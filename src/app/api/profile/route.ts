import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/profile - Buscar ou criar perfil padrão
export async function GET() {
  try {
    let profile = await prisma.profile.findUnique({
      where: { id: 'main' },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: 'main',
          username: 'My Profile',
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('[profile GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PATCH /api/profile - Atualizar perfil
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { username, bio, avatarUrl, bannerUrl, avatarColor } = body;

    const profile = await prisma.profile.upsert({
      where: { id: 'main' },
      update: {
        username: username ?? undefined,
        bio: bio ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        bannerUrl: bannerUrl ?? undefined,
        avatarColor: avatarColor ?? undefined,
      },
      create: {
        id: 'main',
        username: username || 'My Profile',
        bio: bio || null,
        avatarUrl: avatarUrl || null,
        bannerUrl: bannerUrl || null,
        avatarColor: avatarColor || '#3db4f2',
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('[profile PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}