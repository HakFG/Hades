import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/activity — busca os logs mais recentes
export async function GET() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json(logs);
}

// POST /api/activity — cria um novo log
export async function POST(req: Request) {
  const body = await req.json();
  const log = await prisma.activityLog.create({ data: body });
  return NextResponse.json(log);
}