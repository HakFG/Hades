import FilteredBrowserClient from './FilteredBrowserClient';
import { getFilteredEntriesByBrowser } from '@/lib/browser-filter';

export const revalidate = 1800;

interface PageProps {
  params: Promise<{ filter: string }>;
  searchParams: Promise<{ type?: string; filter?: string }>;
}

export default async function FilteredBrowserPage({ params, searchParams }: PageProps) {
  const [{ filter }, query] = await Promise.all([params, searchParams]);
  const type = query.type === 'movie' ? 'movie' : 'tv';
  const initialFilters = query.filter ? query.filter.split(',').filter(Boolean) : ['All'];
  const initialResults = await getFilteredEntriesByBrowser(type, filter, initialFilters);

  return (
    <FilteredBrowserClient
      filter={filter}
      type={type}
      initialFilters={initialFilters}
      initialResults={initialResults}
    />
  );
}
