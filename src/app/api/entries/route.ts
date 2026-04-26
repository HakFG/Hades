import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/entries - Buscar todas as entries do usuário
export async function GET() {
  try {
    const entries = await prisma.entry.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    // Garante que datas sejam strings ISO ou null
    const serialized = entries.map(entry => ({
      ...entry,
      startDate: entry.startDate?.toISOString().split('T')[0] ?? null,
      finishDate: entry.finishDate?.toISOString().split('T')[0] ?? null,
      updatedAt: entry.updatedAt.toISOString(),
    }));
    return NextResponse.json(serialized);
  } catch (error) {
    console.error('[GET /api/entries] Erro:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar entradas' },
      { status: 500 }
    );
  }
}

// POST /api/entries - Desabilitado (use /api/add-media ou /api/update-entry)
export async function POST() {
  return NextResponse.json(
    { error: 'Método não permitido. Use /api/add-media para criar novas entradas ou /api/entries/[id] com PATCH para atualizar.' },
    { status: 405 }
  );
}