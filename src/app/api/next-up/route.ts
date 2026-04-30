// src/app/api/next-up/route.ts
import { NextResponse } from 'next/server';
import { getNextUpItems } from '@/lib/next-up';

export async function GET() {
  try {
    const items = await getNextUpItems(6);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Erro ao buscar Next Up:', error);
    return NextResponse.json({ error: 'Failed to fetch next up items' }, { status: 500 });
  }
}