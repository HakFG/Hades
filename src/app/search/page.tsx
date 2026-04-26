// app/search/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import ListEditor from '@/components/ListEditor';

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB = 'https://api.themoviedb.org/3';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface RawShow {
  id: number;
  name?: string;
  title?: string;
  poster_path: string | null;
  vote_average?: number;
  first_air_date?: string;
  release_date?: string;
  popularity?: number;
}

interface MediaCard {
  tmdbId: number;
  parentTmdbId?: number;
  title: string;
  poster_path: string | null;
  type: 'MOVIE' | 'TV_SEASON';
  episode_count?: number;
  season_number?: number;
  linkSlug: string;
  popularity?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrdinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

function buildSeasonTitle(showName: string, seasonNumber: number): string {
  if (seasonNumber === 0) return `${showName} Specials`;
  if (seasonNumber === 1) return showName;
  return `${showName} ${getOrdinal(seasonNumber)} Season`;
}

// Expande uma série em TODAS as suas temporadas (exceto Specials se não solicitado)
async function expandShow(show: RawShow, includeSpecials = false): Promise<MediaCard[]> {
  try {
    const res = await fetch(`${TMDB}/tv/${show.id}?api_key=${API_KEY}&language=pt-BR`);
    if (!res.ok) return [];
    const detail = await res.json();
    const seasons: any[] = detail.seasons ?? [];

    return seasons
      .filter(s => includeSpecials || s.season_number > 0)
      .map(s => ({
        tmdbId: s.id,
        parentTmdbId: show.id,
        title: buildSeasonTitle(detail.name, s.season_number),
        poster_path: s.poster_path || show.poster_path,
        type: 'TV_SEASON' as const,
        episode_count: s.episode_count,
        season_number: s.season_number,
        linkSlug: `tv-${show.id}-s${s.season_number}`,
        popularity: show.popularity,
      }));
  } catch {
    return [];
  }
}

function movieToCard(m: RawShow): MediaCard {
  return {
    tmdbId: m.id,
    title: m.title ?? m.name ?? 'Sem título',
    poster_path: m.poster_path,
    type: 'MOVIE' as const,
    linkSlug: `movie-${m.id}`,
    popularity: m.popularity,
  };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SearchPage() {
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('tv');
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);

  const [results, setResults] = useState<MediaCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false); // novo: indica se algum filtro está selecionado

  // Seções iniciais
  const [trending, setTrending] = useState<MediaCard[]>([]);
  const [popularNow, setPopularNow] = useState<MediaCard[]>([]);
  const [allTimePopular, setAllTimePopular] = useState<MediaCard[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);

  // Scroll infinito
  const [scrollPage, setScrollPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState<any>(null);

  // ─── Carregar gêneros ─────────────────────────────────────────────────────
  const loadGenres = useCallback(async () => {
    try {
      const res = await fetch(`${TMDB}/genre/${mediaType}/list?api_key=${API_KEY}&language=pt-BR`);
      const data = await res.json();
      setGenres(data.genres ?? []);
    } catch (err) { console.error(err); }
  }, [mediaType]);

  // ─── Carregar seções iniciais (apenas uma temporada por série) ────────────
  const loadInitialSections = useCallback(async () => {
    setLoadingSections(true);
    try {
      const [trendRes, popularNowRes, allTimeRes] = await Promise.all([
        fetch(`${TMDB}/trending/${mediaType}/week?api_key=${API_KEY}&language=pt-BR`),
        fetch(mediaType === 'tv'
          ? `${TMDB}/tv/on_the_air?api_key=${API_KEY}&language=pt-BR`
          : `${TMDB}/movie/now_playing?api_key=${API_KEY}&language=pt-BR`
        ),
        fetch(`${TMDB}/${mediaType}/popular?api_key=${API_KEY}&language=pt-BR`),
      ]);

      const trendData = await trendRes.json();
      const popularNowData = await popularNowRes.json();
      const allTimeData = await allTimeRes.json();

      // Ordenar por popularidade decrescente (segurança)
      const sortByPopularity = (a: MediaCard, b: MediaCard) => (b.popularity || 0) - (a.popularity || 0);

      if (mediaType === 'tv') {
        // Expande apenas a última temporada (mantém popularidade da série original)
        const expandLatest = async (shows: RawShow[]) => {
          const cards = await Promise.all(shows.map(async show => {
            const seasons = await expandShow(show, false);
            if (seasons.length === 0) return null;
            const latest = seasons.sort((a, b) => (b.season_number ?? 0) - (a.season_number ?? 0))[0];
            // preserva a popularidade da série original para ordenação
            return { ...latest, popularity: show.popularity };
          }));
          return cards.filter(Boolean) as MediaCard[];
        };
        setTrending((await expandLatest(trendData.results?.slice(0, 6) ?? [])).sort(sortByPopularity));
        setPopularNow((await expandLatest(popularNowData.results?.slice(0, 6) ?? [])).sort(sortByPopularity));
        setAllTimePopular((await expandLatest(allTimeData.results?.slice(0, 6) ?? [])).sort(sortByPopularity));
      } else {
        setTrending((trendData.results?.slice(0, 6) ?? []).map(movieToCard).sort(sortByPopularity));
        setPopularNow((popularNowData.results?.slice(0, 6) ?? []).map(movieToCard).sort(sortByPopularity));
        setAllTimePopular((allTimeData.results?.slice(0, 6) ?? []).map(movieToCard).sort(sortByPopularity));
      }
    } catch (err) {
      console.error('Erro ao carregar seções iniciais:', err);
    } finally {
      setLoadingSections(false);
    }
  }, [mediaType]);

  useEffect(() => {
    loadGenres();
    loadInitialSections();
  }, [loadGenres, loadInitialSections]);

  // ─── Função de busca (filtros) com expansão completa ──────────────────────
  const performSearch = useCallback(async (page: number, resetResults = true) => {
    if (mediaType === 'movie') {
      let url = `${TMDB}/discover/movie?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&page=${page}`;
      if (selectedGenre) url += `&with_genres=${selectedGenre}`;
      if (selectedYear) url += `&primary_release_year=${selectedYear}`;
      if (selectedFormat === 'MOVIE') url += `&with_watch_monetization_types=flatrate`; // placeholder
      const res = await fetch(url);
      const data = await res.json();
      const cards = data.results.map(movieToCard);
      if (resetResults) setResults(cards);
      else setResults(prev => [...prev, ...cards]);
      setHasMore(data.page < data.total_pages);
    } else {
      let url = `${TMDB}/discover/tv?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&page=${page}`;
      if (selectedGenre) url += `&with_genres=${selectedGenre}`;
      if (selectedYear) url += `&first_air_date_year=${selectedYear}`;
      if (selectedFormat === 'TV') url += `&with_type=0`;
      else if (selectedFormat === 'SPECIAL') url += `&with_type=3`;
      if (selectedStatus === 'airing') url += `&air_date.gte=${new Date().toISOString().split('T')[0]}&status=returning`;
      else if (selectedStatus === 'finished') url += `&status=ended`;
      else if (selectedStatus === 'not_yet_aired') url += `&air_date.gt=${new Date().toISOString().split('T')[0]}`;

      const res = await fetch(url);
      const data = await res.json();
      const shows: RawShow[] = data.results ?? [];
      const allSeasonCards = (await Promise.all(shows.map(show => expandShow(show, false)))).flat();
      if (resetResults) setResults(allSeasonCards);
      else setResults(prev => [...prev, ...allSeasonCards]);
      setHasMore(data.page < data.total_pages);
    }
  }, [mediaType, selectedGenre, selectedYear, selectedFormat, selectedStatus]);

  // Monitorar se há filtros ativos (além da busca textual)
  useEffect(() => {
    const hasFilters = !!(selectedGenre || selectedYear || selectedFormat || selectedStatus);
    setIsFilterActive(hasFilters);
    if (hasFilters && !query.trim()) {
      // Reset e busca na página 1
      setScrollPage(1);
      setHasMore(true);
      performSearch(1, true).catch(console.error);
    } else if (!hasFilters && !query.trim()) {
      // Sem filtros e sem busca: limpa resultados para mostrar seções
      setResults([]);
      setHasMore(false);
    }
  }, [selectedGenre, selectedYear, selectedFormat, selectedStatus, query, performSearch]);

  // Busca textual (sobrescreve os filtros)
  const handleTextSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      let url = `${TMDB}/search/${mediaType}?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query.trim())}`;
      const res = await fetch(url);
      const data = await res.json();
      if (mediaType === 'tv') {
        const expanded = await Promise.all(data.results.map((show: RawShow) => expandShow(show, false)));
        setResults(expanded.flat());
      } else {
        setResults(data.results.map(movieToCard));
      }
      setHasMore(false);
    } catch (err) { console.error(err); }
    finally { setSearching(false); }
  };

  // Scroll infinito (apenas quando há filtros e resultados)
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !searching && results.length > 0 && isFilterActive && !query.trim()) {
        setLoadingMore(true);
        const nextPage = scrollPage + 1;
        await performSearch(nextPage, false);
        setScrollPage(nextPage);
        setLoadingMore(false);
      }
    });
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, searching, results.length, isFilterActive, query, performSearch, scrollPage]);

  // ─── Componente de Card ────────────────────────────────────────────────────
  function MediaCardComponent({ item }: { item: MediaCard }) {
    const displayTitle = item.title || 'Sem título';

    const openEditor = () => {
      setEditorData({
        tmdbId: item.tmdbId,
        parentTmdbId: item.parentTmdbId ?? null,
        seasonNumber: item.season_number ?? null,
        type: item.type,
        title: item.title,
        poster_path: item.poster_path,
        totalEpisodes: item.episode_count ?? undefined,
      });
      setEditorOpen(true);
    };

    return (
      <div style={{ position: 'relative' }}>
        <Link href={`/titles/${item.linkSlug}`} style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            {item.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                style={{ width: '100%', display: 'block', transition: 'transform 0.3s ease' }}
                alt={displayTitle}
                onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            ) : (
              <div style={{ width: '100%', aspectRatio: '2/3', background: '#2a2727', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8ba2b9' }}>
                No image
              </div>
            )}
            <div
              className="edit-overlay"
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditor(); }}
            >
              <span style={{ background: '#e67d99', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#fff' }}>
                ✎
              </span>
            </div>
          </div>
          <p style={{
            fontSize: '12px', fontWeight: '600', marginTop: '8px', color: '#e67d99',
            lineHeight: '1.3', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {displayTitle}
          </p>
        </Link>
      </div>
    );
  }

  // ─── Grid de seção ───────────────────────────────────────────────────────
  function SectionGrid({ title, data }: { title: string; data: MediaCard[] }) {
    if (data.length === 0) return null;
    return (
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{
          fontSize: '18px', fontWeight: '700', color: '#e67d99', marginBottom: '16px',
          borderLeft: '3px solid #e67d99', paddingLeft: '12px',
        }}>
          {title}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '20px' }}>
          {data.map((item, idx) => <MediaCardComponent key={`${item.tmdbId}-${idx}`} item={item} />)}
        </div>
      </div>
    );
  }

  // ─── Renderização final ──────────────────────────────────────────────────
  const years = Array.from({ length: new Date().getFullYear() - 1874 + 7 }, (_, i) => 1874 + i).reverse();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', fontFamily: 'Overpass, sans-serif', background: '#292727', minHeight: '100vh', color: '#e0e4e8' }}>
      {/* Toggle TV / Movies */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '30px', borderBottom: '1px solid #3a3737', paddingBottom: '8px' }}>
        {(['tv', 'movie'] as const).map(type => (
          <button
            key={type}
            onClick={() => {
              setMediaType(type);
              setResults([]);
              setQuery('');
              setSelectedGenre('');
              setSelectedYear('');
              setSelectedFormat('');
              setSelectedStatus('');
              setIsFilterActive(false);
              setScrollPage(1);
              setHasMore(true);
              loadInitialSections(); // recarrega as seções para o novo tipo
            }}
            style={{
              background: 'none', border: 'none', color: mediaType === type ? '#e67d99' : '#8ba2b9',
              fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', paddingBottom: '6px',
              borderBottom: mediaType === type ? '2px solid #e67d99' : '2px solid transparent', transition: '0.2s',
            }}
          >
            {type === 'tv' ? 'TV Shows' : 'Movies'}
          </button>
        ))}
      </div>

      {/* Barra de filtros */}
      <div style={{ background: '#1f1c1c', borderRadius: '12px', padding: '20px', marginBottom: '40px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#e67d99', marginBottom: '6px' }}>Search</label>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTextSearch()}
              placeholder={mediaType === 'tv' ? 'Search series...' : 'Search movies...'}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #3a3737', background: '#2a2727', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <button onClick={handleTextSearch} style={{ padding: '10px 20px', background: '#e67d99', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer', height: '42px' }}>
            Search
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '20px', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '140px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#e67d99', marginBottom: '6px', display: 'block' }}>Genre</label>
            <select value={selectedGenre} onChange={e => { setSelectedGenre(e.target.value); setScrollPage(1); setHasMore(true); }} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#2a2727', color: '#fff', border: '1px solid #3a3737' }}>
              <option value="">Any Genre</option>
              {genres.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
            </select>
          </div>
          <div style={{ minWidth: '120px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#e67d99', marginBottom: '6px', display: 'block' }}>Year</label>
            <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setScrollPage(1); setHasMore(true); }} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#2a2727', color: '#fff', border: '1px solid #3a3737' }}>
              <option value="">Any Year</option>
              {years.map(y => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
          <div style={{ minWidth: '120px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#e67d99', marginBottom: '6px', display: 'block' }}>Format</label>
            <select value={selectedFormat} onChange={e => { setSelectedFormat(e.target.value); setScrollPage(1); setHasMore(true); }} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#2a2727', color: '#fff', border: '1px solid #3a3737' }}>
              <option value="">Any Format</option>
              <option value="TV">TV Series</option>
              <option value="MOVIE">Movie</option>
              <option value="SPECIAL">Special</option>
            </select>
          </div>
          {mediaType === 'tv' && (
            <div style={{ minWidth: '140px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#e67d99', marginBottom: '6px', display: 'block' }}>Status</label>
              <select value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value); setScrollPage(1); setHasMore(true); }} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#2a2727', color: '#fff', border: '1px solid #3a3737' }}>
                <option value="">Any</option>
                <option value="airing">Airing</option>
                <option value="finished">Finished</option>
                <option value="not_yet_aired">Not Yet Aired</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Resultados ou seções iniciais */}
      {searching ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#8ba2b9' }}>Loading...</div>
      ) : results.length > 0 ? (
        <>
          <div style={{ marginBottom: '48px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#e67d99', marginBottom: '16px', borderLeft: '3px solid #e67d99', paddingLeft: '12px' }}>
              Search Results ({results.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '20px' }}>
              {results.map((item, idx) => <MediaCardComponent key={`${item.tmdbId}-${idx}`} item={item} />)}
            </div>
          </div>
          {loadingMore && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #e67d99', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          <div ref={loadMoreRef} style={{ height: '1px' }} />
        </>
      ) : loadingSections ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#8ba2b9' }}>Loading sections...</div>
      ) : (
        <>
          <SectionGrid title="🔥 Trending" data={trending} />
          <SectionGrid title="📺 Popular Now" data={popularNow} />
          <SectionGrid title="🏆 All Time Popular" data={allTimePopular} />
        </>
      )}

      {/* Modal do ListEditor */}
      {editorOpen && (
        <ListEditor
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          tmdbId={editorData.tmdbId}
          parentTmdbId={editorData.parentTmdbId}
          seasonNumber={editorData.seasonNumber}
          type={editorData.type}
          title={editorData.title}
          poster_path={editorData.poster_path}
          totalEpisodes={editorData.totalEpisodes}
          existingData={undefined}
        />
      )}
    </div>
  );
}