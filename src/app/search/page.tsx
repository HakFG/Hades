'use client';

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/static-components, @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Film, Search, Tv, Users, X } from 'lucide-react';
import AdvancedFilterChips, { type AdvancedFilters } from '@/components/AdvancedFilterChips';
import GenreGrid from '@/components/GenreGrid';
import ListEditor from '@/components/ListEditor';
import OscarSection from '@/components/OscarSection';
import SearchMediaCard, {
  type SearchEntryStatus,
  type SearchMediaItem,
} from '@/components/SearchMediaCard';
import { emitXPNotification } from '@/hooks/useXPNotification';

type MediaType = 'tv' | 'movie' | 'people';

interface PersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string | null;
  popularity: number;
}

interface EditorEntry {
  id: string;
  tmdbId: number;
  parentTmdbId?: number | null;
  seasonNumber?: number | null;
  title: string;
  type: 'MOVIE' | 'TV_SEASON';
  status: 'WATCHING' | 'COMPLETED' | 'PAUSED' | 'DROPPED' | 'PLANNING' | 'REWATCHING' | 'UPCOMING';
  score: number;
  progress: number;
  totalEpisodes?: number | null;
  imagePath?: string | null;
  poster_path?: string | null;
  isFavorite: boolean;
  startDate?: string | null;
  finishDate?: string | null;
  rewatchCount: number;
  notes?: string | null;
  hidden: boolean;
  updatedAt: string;
}

type AddMediaPayload = Partial<EditorEntry> & {
  gamification?: Parameters<typeof emitXPNotification>[0][];
};

const EMPTY_ADVANCED: AdvancedFilters = {
  minRating: 0,
  maxRuntime: 0,
  network: '',
  hiddenGems: false,
};

function isAdvancedActive(filters: AdvancedFilters) {
  return Boolean(filters.minRating || filters.maxRuntime || filters.network || filters.hiddenGems);
}

function searchMediaUrl(
  mode: 'genres' | 'sections' | 'discover' | 'text',
  mediaType: Exclude<MediaType, 'people'>,
  options: {
    page?: number;
    query?: string;
    selectedGenre?: string;
    selectedYear?: string;
    selectedFormat?: string;
    selectedStatus?: string;
    advancedFilters?: AdvancedFilters;
  } = {},
) {
  const params = new URLSearchParams({ mode, type: mediaType });
  if (options.page) params.set('page', String(options.page));
  if (options.query) params.set('q', options.query);
  if (options.selectedGenre) params.set('genre', options.selectedGenre);
  if (options.selectedYear) params.set('year', options.selectedYear);
  if (options.selectedFormat) params.set('format', options.selectedFormat);
  if (options.selectedStatus) params.set('status', options.selectedStatus);
  const filters = options.advancedFilters;
  if (filters?.minRating) params.set('rating', String(filters.minRating));
  if (filters?.maxRuntime) params.set('runtime', String(filters.maxRuntime));
  if (filters?.network) params.set('network', filters.network);
  if (filters?.hiddenGems) params.set('hidden', '1');
  return `/api/search/media?${params.toString()}`;
}

function normalizeEditorEntry(entry: Partial<EditorEntry>, item: SearchMediaItem): EditorEntry {
  return {
    id: entry.id ?? '',
    tmdbId: entry.tmdbId ?? item.tmdbId,
    parentTmdbId: entry.parentTmdbId ?? item.parentTmdbId ?? null,
    seasonNumber: entry.seasonNumber ?? item.season_number ?? null,
    title: entry.title ?? item.title,
    type: entry.type ?? item.type,
    status: entry.status ?? 'PLANNING',
    score: entry.score ?? 0,
    progress: entry.progress ?? 0,
    totalEpisodes: entry.totalEpisodes ?? item.episode_count ?? (item.type === 'MOVIE' ? 1 : null),
    imagePath: entry.imagePath ?? item.poster_path ?? null,
    poster_path: entry.poster_path ?? item.poster_path ?? null,
    isFavorite: entry.isFavorite ?? false,
    startDate: entry.startDate ?? null,
    finishDate: entry.finishDate ?? null,
    rewatchCount: entry.rewatchCount ?? 0,
    notes: entry.notes ?? null,
    hidden: entry.hidden ?? false,
    updatedAt: entry.updatedAt ?? new Date().toISOString(),
  };
}

export default function SearchPage() {
  const [mediaType, setMediaType] = useState<MediaType>('tv');
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(EMPTY_ADVANCED);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);

  const [results, setResults] = useState<SearchMediaItem[]>([]);
  const [peopleResults, setPeopleResults] = useState<PersonResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchMediaItem[]>([]);
  const [trending, setTrending] = useState<SearchMediaItem[]>([]);
  const [popularNow, setPopularNow] = useState<SearchMediaItem[]>([]);
  const [allTimePopular, setAllTimePopular] = useState<SearchMediaItem[]>([]);

  const [statusMap, setStatusMap] = useState<Record<number, SearchEntryStatus>>({});
  const [activeSections, setActiveSections] = useState<Record<string, boolean>>({
    suggestions: true,
    trending: true,
    popularNow: true,
    allTime: true,
  });
  const [loadingSections, setLoadingSections] = useState(true);
  const [searching, setSearching] = useState(false);
  const [scrollPage, setScrollPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editorData, setEditorData] = useState<EditorEntry | null>(null);
  const [urlReady, setUrlReady] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const years = useMemo(
    () => Array.from({ length: new Date().getFullYear() - 1874 + 7 }, (_, i) => 1874 + i).reverse(),
    [],
  );

  const hasFilters = Boolean(
    selectedGenre || selectedYear || selectedFormat || selectedStatus || isAdvancedActive(advancedFilters),
  );
  const activeFilterCount = [
    selectedGenre,
    selectedYear,
    selectedFormat,
    selectedStatus,
    advancedFilters.minRating ? 'rating' : '',
    advancedFilters.maxRuntime ? 'runtime' : '',
    advancedFilters.network,
    advancedFilters.hiddenGems ? 'hidden' : '',
  ].filter(Boolean).length;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type === 'movie' || type === 'tv' || type === 'people') setMediaType(type);
    setQuery(params.get('q') ?? '');
    setSelectedGenre(params.get('genre') ?? '');
    setSelectedYear(params.get('year') ?? '');
    setSelectedFormat(params.get('format') ?? '');
    setSelectedStatus(params.get('status') ?? '');
    setAdvancedFilters({
      minRating: Number(params.get('rating') ?? 0),
      maxRuntime: Number(params.get('runtime') ?? 0),
      network: params.get('network') ?? '',
      hiddenGems: params.get('hidden') === '1',
    });
    setUrlReady(true);
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    const params = new URLSearchParams();
    if (mediaType !== 'tv') params.set('type', mediaType);
    if (query) params.set('q', query);
    if (selectedGenre && mediaType !== 'people') params.set('genre', selectedGenre);
    if (selectedYear && mediaType !== 'people') params.set('year', selectedYear);
    if (selectedFormat && mediaType !== 'people') params.set('format', selectedFormat);
    if (selectedStatus && mediaType === 'tv') params.set('status', selectedStatus);
    if (advancedFilters.minRating) params.set('rating', String(advancedFilters.minRating));
    if (advancedFilters.maxRuntime) params.set('runtime', String(advancedFilters.maxRuntime));
    if (advancedFilters.network && mediaType === 'tv') params.set('network', advancedFilters.network);
    if (advancedFilters.hiddenGems) params.set('hidden', '1');
    window.history.replaceState(null, '', params.size ? `?${params.toString()}` : window.location.pathname);
  }, [advancedFilters, mediaType, query, selectedFormat, selectedGenre, selectedStatus, selectedYear, urlReady]);

  const loadGenres = useCallback(async () => {
    if (mediaType === 'people') {
      setGenres([]);
      return;
    }
    try {
      const response = await fetch(searchMediaUrl('genres', mediaType));
      if (!response.ok) return;
      const data = await response.json();
      setGenres(data.genres ?? []);
    } catch (error) {
      console.error(error);
    }
  }, [mediaType]);

  const loadInitialSections = useCallback(async () => {
    if (mediaType === 'people') {
      setLoadingSections(false);
      return;
    }

    setLoadingSections(true);
    try {
      const response = await fetch(searchMediaUrl('sections', mediaType));
      if (!response.ok) throw new Error(`Search sections HTTP ${response.status}`);
      const data = await response.json();
      setTrending(data.trending ?? []);
      setPopularNow(data.popularNow ?? []);
      setAllTimePopular(data.allTimePopular ?? []);
    } catch (error) {
      console.error('Failed to load search sections:', error);
      setTrending([]);
      setPopularNow([]);
      setAllTimePopular([]);
    } finally {
      setLoadingSections(false);
    }
  }, [mediaType]);

  const loadSuggestions = useCallback(async () => {
    if (mediaType === 'people') {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`/api/search/suggestions?type=${mediaType}`);
      if (!response.ok) return;
      const data = await response.json();
      setSuggestions(data.suggestions ?? []);
    } catch (error) {
      console.error(error);
    }
  }, [mediaType]);

  useEffect(() => {
    loadGenres();
    loadInitialSections();
    loadSuggestions();
  }, [loadGenres, loadInitialSections, loadSuggestions]);

  const performSearch = useCallback(
    async (page: number, resetResults = true) => {
      if (mediaType === 'people') return;

      try {
        const response = await fetch(
          searchMediaUrl('discover', mediaType, {
            page,
            selectedGenre,
            selectedYear,
            selectedFormat,
            selectedStatus,
            advancedFilters,
          }),
        );
        if (!response.ok) throw new Error(`Search discover HTTP ${response.status}`);
        const data = await response.json();
        const cards = data.items ?? [];
        setResults((prev) => (resetResults ? cards : [...prev, ...cards]));
        setHasMore(Boolean(data.hasMore));
      } catch (error) {
        console.error(error);
        if (resetResults) setResults([]);
        setHasMore(false);
      }
    },
    [advancedFilters, mediaType, selectedFormat, selectedGenre, selectedStatus, selectedYear],
  );

  useEffect(() => {
    if (!urlReady || mediaType === 'people') return;
    if (hasFilters && !query.trim()) {
      setScrollPage(1);
      performSearch(1, true).catch(console.error);
    } else if (!hasFilters && !query.trim()) {
      setResults([]);
      setHasMore(false);
    }
  }, [hasFilters, mediaType, performSearch, query, urlReady]);

  const handleTextSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearching(true);
    setResults([]);
    setPeopleResults([]);
    try {
      if (mediaType === 'people') {
        const response = await fetch(`/api/staff/search?q=${encodeURIComponent(trimmed)}`);
        const data = await response.json();
        setPeopleResults(data.results ?? []);
        setHasMore(false);
        return;
      }

      const response = await fetch(
        searchMediaUrl('text', mediaType, {
          query: trimmed,
          selectedYear,
          advancedFilters,
        }),
      );
      if (!response.ok) throw new Error(`Search text HTTP ${response.status}`);
      const data = await response.json();
      setResults(data.items ?? []);
      setHasMore(Boolean(data.hasMore));
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  }, [advancedFilters, mediaType, query, selectedYear]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !searching && results.length > 0 && hasFilters && !query.trim()) {
        setLoadingMore(true);
        const nextPage = scrollPage + 1;
        await performSearch(nextPage, false);
        setScrollPage(nextPage);
        setLoadingMore(false);
      }
    });
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasFilters, hasMore, loadingMore, performSearch, query, results.length, scrollPage, searching]);

  const visibleIds = useMemo(() => {
    const ids = [...results, ...trending, ...popularNow, ...allTimePopular, ...suggestions].map((item) => item.tmdbId);
    return Array.from(new Set(ids)).filter(Boolean);
  }, [allTimePopular, popularNow, results, suggestions, trending]);

  useEffect(() => {
    if (!visibleIds.length) {
      setStatusMap({});
      return;
    }
    const controller = new AbortController();
    fetch(`/api/search/status?ids=${visibleIds.join(',')}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setStatusMap(data?.entries ?? {}))
      .catch((error) => {
        if (error?.name !== 'AbortError') console.error(error);
      });
    return () => controller.abort();
  }, [visibleIds]);

  const openEditor = useCallback(async (item: SearchMediaItem, entry?: SearchEntryStatus | null) => {
    let fullEntry: AddMediaPayload | null = null;
    try {
      const response = await fetch(`/api/entry/${entry?.slug ?? item.linkSlug}`);
      if (response.ok) fullEntry = await response.json();
    } catch {
      fullEntry = null;
    }

    if (!fullEntry) {
      const response = await fetch('/api/add-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: item.tmdbId,
          parentTmdbId: item.parentTmdbId ?? null,
          seasonNumber: item.season_number ?? null,
          type: item.type,
          title: item.title,
          poster_path: item.poster_path,
          totalEpisodes: item.episode_count ?? null,
          status: 'PLANNING',
          score: 0,
          progress: 0,
        }),
      });
      if (!response.ok) {
        alert('Erro ao preparar entrada. Tente novamente.');
        return;
      }
      fullEntry = (await response.json()) as AddMediaPayload;
      if (Array.isArray(fullEntry?.gamification)) {
        fullEntry.gamification.forEach(emitXPNotification);
      }
    }

    if (!fullEntry) return;
    setEditorData(normalizeEditorEntry(fullEntry, item));
  }, []);

  const resetForType = (type: MediaType) => {
    setMediaType(type);
    setQuery('');
    setResults([]);
    setPeopleResults([]);
    setSelectedGenre('');
    setSelectedYear('');
    setSelectedFormat('');
    setSelectedStatus('');
    setAdvancedFilters(EMPTY_ADVANCED);
    setScrollPage(1);
    setHasMore(false);
    setActiveSections({ suggestions: true, trending: true, popularNow: true, allTime: true });
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedGenre('');
    setSelectedYear('');
    setSelectedFormat('');
    setSelectedStatus('');
    setAdvancedFilters(EMPTY_ADVANCED);
    setResults([]);
    setPeopleResults([]);
    setHasMore(false);
  };

  const renderGrid = (items: SearchMediaItem[], priority = false) => (
    <div className="media-grid">
      {items.map((item, index) => (
        <SearchMediaCard
          key={`${item.tmdbId}-${index}`}
          item={item}
          entry={statusMap[item.tmdbId] ?? null}
          priority={priority && index < 4}
          onEdit={openEditor}
        />
      ))}
    </div>
  );

  const sectionData = {
    suggestions,
    trending,
    popularNow,
    allTime: allTimePopular,
  };

  const sectionMeta = {
    suggestions: {
      label: 'Not in your list',
      desc: 'Ranked with your history, trending titles and stronger ratings',
    },
    trending: { label: 'Trending', desc: 'This week' },
    popularNow: { label: 'Popular Now', desc: mediaType === 'tv' ? 'On the air' : 'Now playing' },
    allTime: { label: 'All Time Popular', desc: 'Most voted ever' },
  };

  function SectionBlock({ sectionKey }: { sectionKey: keyof typeof sectionData }) {
    const data = sectionData[sectionKey];
    const meta = sectionMeta[sectionKey];
    const isOpen = activeSections[sectionKey] ?? true;

    return (
      <section className="section-block">
        <button
          type="button"
          className={`section-toggle ${isOpen ? 'open' : ''}`}
          onClick={() => setActiveSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
        >
          <span>{meta.label}</span>
          <small>{meta.desc} · {data.length} titles</small>
        </button>
        {isOpen && (
          <div className="section-content">
            {data.length ? (
              renderGrid(data, sectionKey === 'suggestions')
            ) : (
              <div className="empty">{loadingSections ? 'Loading...' : 'No titles found.'}</div>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <main className="search-page">
      <style jsx global>{`
        body {
          background: rgb(42, 39, 39);
        }
      `}</style>
      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes softPulse {
          0%,
          100% {
            box-shadow: 0 2px 12px rgba(230, 125, 153, 0.26);
          }
          50% {
            box-shadow: 0 4px 20px rgba(230, 125, 153, 0.42);
          }
        }

        @keyframes panelIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardCascade {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes drawerIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .search-page {
          max-width: 1200px;
          min-height: 100vh;
          margin: 0 auto;
          padding: 32px 24px 80px;
          color: rgb(220, 210, 215);
          font-family: 'Overpass', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .search-page .search-type-tabs {
          display: flex;
          width: fit-content;
          max-width: 100%;
          gap: 4px;
          margin-bottom: 22px;
          padding: 4px;
          border-radius: 10px;
          background: rgb(50, 47, 47);
          border: 1px solid rgba(255, 255, 255, 0.05);
          overflow-x: auto;
          animation: panelIn 0.28s ease both;
        }

        .search-page .search-type-tabs button,
        .search-page .search-button,
        .search-page .clear-button {
          font: inherit;
          cursor: pointer;
        }

        .search-page .search-type-tabs button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 36px;
          padding: 8px 16px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: rgba(220, 210, 215, 0.55);
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
          transition: color 0.18s ease, background 0.18s ease, transform 0.18s ease;
        }

        .search-page .search-type-tabs button:hover,
        .search-page .search-type-tabs button:focus-visible {
          transform: translateY(-1px);
          color: rgb(232, 226, 223);
          outline: none;
          box-shadow: 0 0 0 3px rgba(230, 125, 153, 0.12);
        }

        .search-page .search-type-tabs button.active {
          color: white;
          background: linear-gradient(135deg, rgb(230, 125, 153), rgb(200, 90, 120));
          box-shadow: 0 2px 12px rgba(230, 125, 153, 0.35);
          animation: softPulse 3.8s ease-in-out infinite;
        }

        .search-page .toolbar {
          display: grid;
          gap: 12px;
          margin-bottom: 26px;
          padding: 16px;
          border-radius: 8px;
          background: linear-gradient(180deg, rgb(48, 45, 45), rgb(43, 40, 40));
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.24);
          animation: panelIn 0.34s ease both;
        }

        .search-page .search-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          gap: 10px;
        }

        .search-page .input-wrap {
          position: relative;
          min-width: 0;
        }

        .search-page .input-wrap svg {
          position: absolute;
          top: 50%;
          left: 13px;
          transform: translateY(-50%);
          color: rgba(220, 210, 215, 0.4);
          pointer-events: none;
        }

        .search-page input[type='text'] {
          width: 100%;
          min-height: 42px;
          padding: 11px 14px 11px 38px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgb(58, 55, 55);
          color: rgb(220, 210, 215);
          font: inherit;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }

        .search-page input[type='text']:focus {
          border-color: rgba(230, 125, 153, 0.5);
          background: rgb(61, 57, 57);
          box-shadow: 0 0 0 3px rgba(230, 125, 153, 0.08);
        }

        .search-page .search-button,
        .search-page .clear-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 900;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .search-page .search-button {
          padding: 0 18px;
          border: 0;
          color: white;
          background: linear-gradient(135deg, rgb(230, 125, 153), rgb(200, 90, 120));
          box-shadow: 0 4px 14px rgba(230, 125, 153, 0.35);
        }

        .search-page .search-button:hover,
        .search-page .clear-button:hover,
        .search-page .search-button:focus-visible,
        .search-page .clear-button:focus-visible {
          transform: translateY(-1px);
          outline: none;
          box-shadow: 0 8px 22px rgba(230, 125, 153, 0.22);
        }

        .search-page .search-button:active,
        .search-page .clear-button:active,
        .search-page .search-type-tabs button:active,
        .search-page .section-toggle:active {
          transform: translateY(0);
        }

        .search-page .clear-button {
          width: 42px;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: rgba(220, 210, 215, 0.55);
        }

        .search-page .filter-drawer {
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(32, 29, 29, 0.38);
          overflow: hidden;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .search-page .filter-drawer[open] {
          border-color: rgba(230, 125, 153, 0.18);
          background: rgba(32, 29, 29, 0.5);
        }

        .search-page .filter-drawer summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 40px;
          padding: 0 12px;
          cursor: pointer;
          list-style: none;
          color: rgba(232, 226, 223, 0.86);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          transition: color 0.18s ease, background 0.18s ease;
        }

        .search-page .filter-drawer summary:hover {
          color: rgb(232, 226, 223);
          background: rgba(255, 255, 255, 0.025);
        }

        .search-page .filter-drawer summary::-webkit-details-marker {
          display: none;
        }

        .search-page .filter-drawer summary small {
          color: rgba(220, 210, 215, 0.4);
          font-size: 11px;
          font-weight: 800;
          text-transform: none;
        }

        .search-page .filter-body {
          display: grid;
          gap: 12px;
          padding: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          animation: drawerIn 0.22s ease both;
        }

        .search-page .basic-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .search-page .basic-filters span {
          color: rgba(220, 210, 215, 0.38);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .search-page select {
          min-height: 34px;
          padding: 0 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgb(58, 55, 55);
          color: rgba(220, 210, 215, 0.72);
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
        }

        .search-page select:hover {
          border-color: rgba(230, 125, 153, 0.24);
          transform: translateY(-1px);
        }

        .search-page .content {
          animation: fadeUp 0.28s ease;
        }

        .search-page .result-head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .search-page .result-head h2 {
          margin: 0;
          color: rgb(230, 125, 153);
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .search-page .result-head span {
          color: rgba(220, 210, 215, 0.38);
          font-size: 11px;
          font-weight: 800;
        }

        .search-page .result-head::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, rgba(230, 125, 153, 0.25), transparent);
        }

        .search-page .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(104px, 118px));
          justify-content: start;
          gap: 16px;
        }

        .search-page .media-grid > * {
          animation: cardCascade 0.32s ease both;
        }

        .search-page .media-grid > *:nth-child(1) { animation-delay: 0ms; }
        .search-page .media-grid > *:nth-child(2) { animation-delay: 22ms; }
        .search-page .media-grid > *:nth-child(3) { animation-delay: 44ms; }
        .search-page .media-grid > *:nth-child(4) { animation-delay: 66ms; }
        .search-page .media-grid > *:nth-child(5) { animation-delay: 88ms; }
        .search-page .media-grid > *:nth-child(6) { animation-delay: 110ms; }
        .search-page .media-grid > *:nth-child(7) { animation-delay: 132ms; }
        .search-page .media-grid > *:nth-child(8) { animation-delay: 154ms; }
        .search-page .media-grid > *:nth-child(n + 9) { animation-delay: 176ms; }

        .search-page .section-block {
          margin-bottom: 14px;
        }

        .search-page .section-toggle {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 4px;
          width: 100%;
          padding: 14px 16px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgb(50, 47, 47);
          color: rgb(220, 210, 215);
          text-align: left;
          cursor: pointer;
          font: inherit;
          transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
        }

        .search-page .section-toggle:hover,
        .search-page .section-toggle:focus-visible {
          transform: translateY(-1px);
          border-color: rgba(230, 125, 153, 0.28);
          outline: none;
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.18);
        }

        .search-page .section-toggle.open {
          border-color: rgba(230, 125, 153, 0.34);
          background: rgba(230, 125, 153, 0.08);
        }

        .search-page .section-toggle span {
          color: rgb(232, 226, 223);
          font-size: 14px;
          font-weight: 900;
        }

        .search-page .section-toggle small {
          color: rgba(220, 210, 215, 0.44);
          font-size: 11px;
          font-weight: 700;
        }

        .search-page .section-content {
          padding: 14px;
          border: 1px solid rgba(230, 125, 153, 0.24);
          border-top: 0;
          border-radius: 0 0 8px 8px;
          background: rgb(46, 43, 43);
          animation: drawerIn 0.24s ease both;
        }

        .search-page .empty,
        .search-page .loader,
        .search-page .people-empty {
          color: rgba(220, 210, 215, 0.42);
          text-align: center;
          font-size: 13px;
        }

        .search-page .loader {
          padding: 76px 20px;
        }

        .search-page .spinner {
          display: inline-block;
          width: 34px;
          height: 34px;
          margin-bottom: 12px;
          border-radius: 50%;
          border: 3px solid rgba(230, 125, 153, 0.2);
          border-top-color: rgb(230, 125, 153);
          animation: spin 0.8s linear infinite;
        }

        .search-page .people-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 18px;
        }

        .search-page .person-card {
          display: grid;
          gap: 10px;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgb(48, 45, 45);
          color: rgb(220, 210, 215);
          text-decoration: none;
          min-width: 0;
          transform: translateY(0);
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }

        .search-page .person-card img,
        .search-page .person-placeholder {
          width: 100%;
          aspect-ratio: 2 / 3;
          object-fit: cover;
          border-radius: 8px;
          background: rgb(58, 55, 55);
          transition: transform 0.24s ease, filter 0.24s ease;
        }

        .search-page .person-placeholder {
          display: grid;
          place-items: center;
          color: rgba(220, 210, 215, 0.45);
          font-weight: 900;
        }

        .search-page .person-card h3 {
          margin: 0;
          font-size: 14px;
          line-height: 1.25;
        }

        .search-page .person-card p {
          margin: 0;
          color: rgba(220, 210, 215, 0.5);
          font-size: 12px;
          font-weight: 700;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .search-page .person-card:hover,
        .search-page .person-card:focus-visible {
          transform: translateY(-3px);
          border-color: rgba(230, 125, 153, 0.32);
          background: rgb(52, 48, 48);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
          outline: none;
        }

        .search-page .person-card:hover img,
        .search-page .person-card:focus-visible img {
          transform: scale(1.035);
          filter: saturate(1.08);
        }

        @media (max-width: 640px) {
          .search-page {
            padding: 22px 14px 64px;
          }

          .search-page .search-row {
            grid-template-columns: minmax(0, 1fr);
          }

          .search-page .search-button,
          .search-page .clear-button {
            width: 100%;
          }

          .search-page .media-grid {
            grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
            gap: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .search-page *,
          .search-page *::before,
          .search-page *::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="search-type-tabs" role="tablist" aria-label="Search type">
        {[
          { key: 'tv' as const, label: 'TV Shows', icon: Tv },
          { key: 'movie' as const, label: 'Movies', icon: Film },
          { key: 'people' as const, label: 'People', icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" className={mediaType === key ? 'active' : ''} onClick={() => resetForType(key)}>
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-row">
          <div className="input-wrap">
            <Search size={16} />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleTextSearch();
              }}
              placeholder={
                mediaType === 'people'
                  ? 'Search actors, directors, writers...'
                  : mediaType === 'tv'
                    ? 'Search series, seasons...'
                    : 'Search movies...'
              }
            />
          </div>
          <button type="button" className="search-button" onClick={handleTextSearch}>
            <Search size={15} />
            Search
          </button>
          {(query || hasFilters || peopleResults.length > 0 || results.length > 0) && (
            <button type="button" className="clear-button" onClick={clearSearch} title="Clear">
              <X size={16} />
            </button>
          )}
        </div>

        {mediaType !== 'people' && (
          <details className="filter-drawer" open={hasFilters || undefined}>
            <summary>
              <span>Filters</span>
              <small>{activeFilterCount ? `${activeFilterCount} active` : 'Genre, year and advanced controls'}</small>
            </summary>
            <div className="filter-body">
              <div className="basic-filters">
                <span>Core</span>
                <select value={selectedGenre} onChange={(event) => setSelectedGenre(event.target.value)}>
                  <option value="">Genre</option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
                <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
                  <option value="">Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <GenreGrid genres={genres} selectedGenre={selectedGenre} onGenreSelect={setSelectedGenre} />
              <AdvancedFilterChips
                mediaType={mediaType}
                selectedFormat={selectedFormat}
                selectedStatus={selectedStatus}
                filters={advancedFilters}
                onFormatChange={setSelectedFormat}
                onStatusChange={setSelectedStatus}
                onFiltersChange={setAdvancedFilters}
              />
            </div>
          </details>
        )}
      </div>

      {searching ? (
        <div className="loader">
          <div className="spinner" />
          <div>Searching...</div>
        </div>
      ) : mediaType === 'people' ? (
        <div className="content">
          {peopleResults.length > 0 ? (
            <>
              <div className="result-head">
                <h2>People</h2>
                <span>{peopleResults.length}</span>
              </div>
              <div className="people-grid">
                {peopleResults.map((person) => {
                  const profile = person.profile_path ? `https://image.tmdb.org/t/p/w300${person.profile_path}` : '';
                  return (
                    <Link key={person.id} href={`/staff/${person.id}`} className="person-card">
                      {profile ? <img src={profile} alt={person.name} loading="lazy" /> : <div className="person-placeholder">No Photo</div>}
                      <div>
                        <h3>{person.name}</h3>
                        <p>{person.known_for_department ?? 'Known for'} · {person.popularity.toFixed(1)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="people-empty">Search for a person to open their filmography.</div>
          )}
        </div>
      ) : results.length > 0 ? (
        <div className="content">
          <div className="result-head">
            <h2>Results</h2>
            <span>{results.length}</span>
          </div>
          {renderGrid(results, true)}
          {loadingMore && (
            <div className="loader">
              <div className="spinner" />
            </div>
          )}
          <div ref={loadMoreRef} style={{ height: 1 }} />
        </div>
      ) : loadingSections ? (
        <div className="loader">
          <div className="spinner" />
          <div>Loading discoveries...</div>
        </div>
      ) : (
        <div className="content">
          <SectionBlock sectionKey="suggestions" />
          <SectionBlock sectionKey="trending" />
          <SectionBlock sectionKey="popularNow" />
          <SectionBlock sectionKey="allTime" />
          <OscarSection />
        </div>
      )}

      {editorData && (
        <ListEditor
          entry={editorData}
          onClose={() => setEditorData(null)}
          onSave={(updatedEntry) => {
            setStatusMap((prev) => ({
              ...prev,
              [updatedEntry.tmdbId]: {
                id: updatedEntry.id,
                tmdbId: updatedEntry.tmdbId,
                status: updatedEntry.status,
                score: updatedEntry.score,
                progress: updatedEntry.progress,
                totalEpisodes: updatedEntry.totalEpisodes,
                slug:
                  updatedEntry.type === 'MOVIE'
                    ? `movie-${updatedEntry.tmdbId}`
                    : `tv-${updatedEntry.parentTmdbId}-s${updatedEntry.seasonNumber}`,
              },
            }));
            setEditorData(null);
          }}
          onDelete={() => {
            setStatusMap((prev) => {
              const next = { ...prev };
              delete next[editorData.tmdbId];
              return next;
            });
            setEditorData(null);
          }}
        />
      )}
    </main>
  );
}
