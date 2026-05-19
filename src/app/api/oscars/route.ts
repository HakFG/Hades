import { NextResponse } from 'next/server';
import { getOscarCategories, getOscarFilmsByYear, getOscarYears } from '@/lib/oscar-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const years = getOscarYears();
  const requestedYear = Number(searchParams.get('year') ?? years[0]);
  const year = years.includes(requestedYear) ? requestedYear : years[0];

  const [films, categories] = await Promise.all([
    getOscarFilmsByYear(year),
    getOscarCategories(year),
  ]);

  return NextResponse.json({
    year,
    years,
    categories,
    films,
    source: films.some((film) => film.source === 'curated') ? 'curated' : 'tmdb-pool',
  });
}
