import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/profile/export
 * 
 * Exporta o perfil do usuário para backup.
 */
export async function GET() {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: 'main' },
    });

    if (!profile) {
      return NextResponse.json(null);
    }

    // Serializa datas corretamente
    return NextResponse.json({
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[GET /api/profile/export] Erro:', error);
    return NextResponse.json(
      { error: 'Falha ao exportar perfil' },
      { status: 500 }
    );
  }
}
