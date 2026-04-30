// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getNotifications } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  const notifications = await getNotifications();
  const readCookie = request.cookies.get('read_notif_ids')?.value ?? '';
  const readIds = new Set(readCookie ? readCookie.split(',') : []);

  const enriched = notifications.map(n => ({
    ...n,
    read: readIds.has(n.id),
  }));
  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id, markAll } = body;

  const readCookie = request.cookies.get('read_notif_ids')?.value ?? '';
  const readIds = new Set(readCookie ? readCookie.split(',') : []);

  if (markAll === true) {
    const notifications = await getNotifications();
    for (const n of notifications) readIds.add(n.id);
  } else if (id && typeof id === 'string') {
    readIds.add(id);
  } else {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('read_notif_ids', [...readIds].join(','), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: '/',
    sameSite: 'lax',
  });
  return response;
}