import { NextResponse } from 'next/server';
import { fetchTmdbJson } from '@/lib/staff';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const data = await fetchTmdbJson(
      `/search/person?query=${encodeURIComponent(q)}`,
      'pt-BR',
    );
    const results = (data.results ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      profile_path: r.profile_path ?? null,
      known_for_department: r.known_for_department ?? null,
      popularity: r.popularity ?? 0,
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Falha na busca' }, { status: 500 });
  }
}
