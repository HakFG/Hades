// app/search/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import ListEditor from '@/components/ListEditor';
import { getOrdinal, buildSeasonTitle } from '@/lib/utils';

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB = 'https://api.themoviedb.org/3';

// ─── Tipos ─────────────────────────────────────────────────────────────────────

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
  airYear?: string;
  airDate?: string;      
  seriesStatus?: string; 
  seasonStatus?: 'Airing' | 'Finished' | 'Not Yet Aired';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────



// ─── FIX FORMATO: Mapeamento correto de with_type do TMDB ─────────────────────
// TMDB with_type values:
//   0 = Documentary
//   1 = News
//   2 = Miniseries
//   3 = Reality
//   4 = Scripted (TV Series normal)
//   5 = Talk Show
//   6 = Video (inclui OVAs, Specials curtos)
// Para "TV Series" usamos type=4 (Scripted)
// Para "Miniseries" usamos type=2
// Para "Special / OVA" usamos type=6

const FORMAT_TV_OPTIONS = [
  { value: '',         label: 'Any Format'  },
  { value: 'scripted', label: 'TV Series'   },
  { value: 'miniseries',label: 'Miniseries' },
  { value: 'special',  label: 'Special'     },
  { value: 'reality',  label: 'Reality'     },
  { value: 'documentary', label: 'Documentary' },
];

const FORMAT_MOVIE_OPTIONS = [
  { value: '',         label: 'Any Format'  },
  { value: 'movie',    label: 'Movie'       },
  { value: 'short',    label: 'Short Film'  },
];

// ─── Expander ─────────────────────────────────────────────────────────────────

function resolveSeasonStatus(
  season: any,
  allSeasons: any[],
  seriesStatus: string,
  inProduction: boolean,
): 'Airing' | 'Finished' | 'Not Yet Aired' {
  const today = new Date().toISOString().split('T')[0];
  const airDate: string | undefined = season.air_date;

  // Ainda não estreou
  if (!airDate || airDate > today) return 'Not Yet Aired';

  // Série encerrada: toda temporada já passada é Finished
  if (!inProduction && seriesStatus !== 'Returning Series') return 'Finished';

  // Série em produção: só a temporada mais recente (maior season_number) é Airing
  const maxSeasonNumber = Math.max(
    ...allSeasons
      .filter(s => s.season_number > 0 && s.air_date && s.air_date <= today)
      .map(s => s.season_number)
  );

  return season.season_number === maxSeasonNumber ? 'Airing' : 'Finished';
}

async function expandShow(show: RawShow, includeSpecials = false, onlyInProduction = false): Promise<MediaCard[]> {
  try {
    const [res, resEn] = await Promise.all([
      fetch(`${TMDB}/tv/${show.id}?api_key=${API_KEY}&language=en-US`),
      fetch(`${TMDB}/tv/${show.id}?api_key=${API_KEY}&language=en-US`),
    ]);
    if (!res.ok) return [];
    const detail   = await res.json();
    // ✅ Série não está em produção? descarta
    if (onlyInProduction && !detail.in_production) return [];
    const detailEn = resEn.ok ? await resEn.json() : detail;
    // Nome sempre em inglês para títulos e cards
    const showName = detailEn.name || detail.name;
    const seasons: any[] = detail.seasons ?? [];
    const seriesStatus: string = detail.status ?? '';
    const inProduction: boolean = detail.in_production ?? false;


    return seasons
      .filter(s => includeSpecials || s.season_number > 0)
      .map(s => {
        const seasonStatus = resolveSeasonStatus(s, seasons, seriesStatus, inProduction);
        return {
          tmdbId: s.id,
          parentTmdbId: show.id,
          title: buildSeasonTitle(showName, s.season_number),
          poster_path: s.poster_path || show.poster_path,
          type: 'TV_SEASON' as const,
          episode_count: s.episode_count,
          season_number: s.season_number,
          linkSlug: `tv-${show.id}-s${s.season_number}`,
          popularity: show.popularity,
          airYear: s.air_date ? s.air_date.split('-')[0] : undefined,
          airDate: s.air_date ?? undefined,
          seriesStatus,
          seasonStatus, // ← 'Airing' | 'Finished' | 'Not Yet Aired'
        };
      });
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
    airYear: m.release_date ? m.release_date.split('-')[0] : undefined,
  };
}

/**
 * Determina se uma temporada está ativamente "em exibição".
 *
 * Critérios (todos precisam ser verdadeiros):
 *   1. A série pai tem status "Returning Series" (ainda produzindo)
 *   2. A air_date da temporada já passou (já começou a ir ao ar)
 *   3. É a temporada com o maior season_number da série
 *      OU sua air_date é do ano atual / ano anterior
 *      (cobre casos de séries com temporadas sobrepostas)
 */
function isSeasonAiring(card: MediaCard): boolean {
  // Usa o status já resolvido pelo resolveSeasonStatus dentro do expandShow
  // Elimina toda heurística — a fonte da verdade é a mesma lógica do page.tsx de detalhe
  return card.seasonStatus === 'Airing';
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
  const [isFilterActive, setIsFilterActive] = useState(false);

  // ─── CORREÇÃO 1: cada seção tem seu próprio estado de visibilidade ────────
  const [activeSection, setActiveSection] = useState<'trending' | 'popularNow' | 'allTime' | null>(null);

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

  // Hover state para cards
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // ─── Gêneros ──────────────────────────────────────────────────────────────
  const loadGenres = useCallback(async () => {
    try {
      // ✅ CORRIGIDO: language=en-US
      const res = await fetch(`${TMDB}/genre/${mediaType}/list?api_key=${API_KEY}&language=en-US`);
      const data = await res.json();
      setGenres(data.genres ?? []);
    } catch (err) { console.error(err); }
  }, [mediaType]);

  // ─── CORREÇÃO 2: All Time Popular usa top_rated + discover com vote_count ─
  // TMDB não tem endpoint de "all time popular" literal.
  // A melhor aproximação é /discover com sort_by=vote_count.desc (filmes/séries
  // com mais votos de todos os tempos = mais populares historicamente).
  // Para TV também combinamos com popularity.desc da lista /top_rated.
  const loadInitialSections = useCallback(async () => {
    setLoadingSections(true);
    try {
      const sortByPop = (a: MediaCard, b: MediaCard) => (b.popularity || 0) - (a.popularity || 0);

      if (mediaType === 'tv') {
        // ✅ CORRIGIDO: todas com language=en-US
        const [trendRes, onAirRes, allTimeRes] = await Promise.all([
          fetch(`${TMDB}/trending/tv/week?api_key=${API_KEY}&language=en-US`),
          fetch(`${TMDB}/tv/on_the_air?api_key=${API_KEY}&language=en-US`),
          // All Time: discover sorted by vote_count (quantidade de votos = popularidade histórica)
          fetch(`${TMDB}/discover/tv?api_key=${API_KEY}&language=en-US&sort_by=vote_count.desc&vote_count.gte=5000&page=1`),
        ]);
        const [trendData, onAirData, allTimeData] = await Promise.all([
          trendRes.json(), onAirRes.json(), allTimeRes.json(),
        ]);

const expandLatest = async (shows: RawShow[], requireAiring: boolean) => {
  const collected: MediaCard[] = [];
  for (const show of shows.slice(0, 20)) {
    if (collected.length >= 6) break;
    // requireAiring=true → passa onlyInProduction=true (Trending e Popular Now)
    // requireAiring=false → passa onlyInProduction=false (All Time Popular)
    const seasons = await expandShow(show, false, requireAiring);
    if (!seasons.length) continue;
    const sorted = seasons.sort((a, b) => (b.season_number ?? 0) - (a.season_number ?? 0));
    if (requireAiring) {
      const airingSeasons = sorted.filter(s => s.seasonStatus === 'Airing');
      if (airingSeasons.length === 0) continue;
      collected.push({ ...airingSeasons[0], popularity: show.popularity });
    } else {
      // All Time: pega a temporada mais recente independente de status
      collected.push({ ...sorted[0], popularity: show.popularity });
    }
  }
  return collected;
};

setTrending((await expandLatest(trendData.results ?? [], true)).sort(sortByPop));
setPopularNow((await expandLatest(onAirData.results ?? [], true)).sort(sortByPop));
setAllTimePopular((await expandLatest(allTimeData.results ?? [], false)).sort(sortByPop));
      } else {
        // ✅ CORRIGIDO: todas com language=en-US
        const [trendRes, nowPlayingRes, allTimeRes] = await Promise.all([
          fetch(`${TMDB}/trending/movie/week?api_key=${API_KEY}&language=en-US`),
          fetch(`${TMDB}/movie/now_playing?api_key=${API_KEY}&language=en-US`),
          // All Time movies: vote_count decrescente = mais votados da história
          fetch(`${TMDB}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=vote_count.desc&vote_count.gte=10000&page=1`),
        ]);
        const [trendData, nowPlayingData, allTimeData] = await Promise.all([
          trendRes.json(), nowPlayingRes.json(), allTimeRes.json(),
        ]);

        setTrending((trendData.results?.slice(0, 6) ?? []).map(movieToCard).sort(sortByPop));
        setPopularNow((nowPlayingData.results?.slice(0, 6) ?? []).map(movieToCard).sort(sortByPop));
        setAllTimePopular((allTimeData.results?.slice(0, 6) ?? []).map(movieToCard).sort(sortByPop));
      }
    } catch (err) {
      console.error('Erro ao carregar seções:', err);
    } finally {
      setLoadingSections(false);
    }
  }, [mediaType]);

  useEffect(() => {
    loadGenres();
    loadInitialSections();
    setActiveSection(null);
  }, [loadGenres, loadInitialSections]);

  // ─── Busca com filtros ────────────────────────────────────────────────────
  const performSearch = useCallback(async (page: number, resetResults = true) => {
    if (mediaType === 'movie') {
      // ✅ CORRIGIDO: language=en-US
      let url = `${TMDB}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&page=${page}`;
      if (selectedGenre) url += `&with_genres=${selectedGenre}`;
      if (selectedYear) url += `&primary_release_year=${selectedYear}`;
      // Filtro de formato para filmes: short films via runtime
      if (selectedFormat === 'short') url += `&with_runtime.lte=40`;
      const res = await fetch(url);
      const data = await res.json();
      const cards = (data.results ?? []).map(movieToCard);
      if (resetResults) setResults(cards); else setResults(prev => [...prev, ...cards]);
      setHasMore(data.page < data.total_pages);
    } else {
      // ✅ CORRIGIDO: language=en-US
      let url = `${TMDB}/discover/tv?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&page=${page}`;
if (selectedGenre) url += `&with_genres=${selectedGenre}`;
// Sem filtro de ano aqui — o TMDB filtra pela série pai, não pela temporada.
// O filtro real é feito por airYear após a expansão.
if (selectedFormat === 'scripted')    url += `&with_type=4`;
if (selectedFormat === 'miniseries')  url += `&with_type=2`;
if (selectedFormat === 'special')     url += `&with_type=6`;
if (selectedFormat === 'reality')     url += `&with_type=3`;
if (selectedFormat === 'documentary') url += `&with_type=0`;
if (selectedStatus === 'airing')       url += `&with_status=returning`;
if (selectedStatus === 'finished')     url += `&with_status=ended`;
if (selectedStatus === 'not_yet_aired') url += `&with_status=planned`;

const res = await fetch(url);
const data = await res.json();
const shows: RawShow[] = data.results ?? [];
let allSeasonCards = (await Promise.all(
  shows.map(s => expandShow(s, selectedFormat === 'special'))
)).flat();

// Filtro de ano por air_date da temporada (não da série pai)
if (selectedYear) {
  allSeasonCards = allSeasonCards.filter(
    card => card.airYear !== undefined && card.airYear === selectedYear
  );
}

// Filtro de status "airing": apenas a temporada ativa de cada série
if (selectedStatus === 'airing') {
  allSeasonCards = allSeasonCards.filter(isSeasonAiring);
}

if (selectedStatus === 'finished') {
  allSeasonCards = allSeasonCards.filter(c => c.seasonStatus === 'Finished');
}

if (selectedStatus === 'not_yet_aired') {
  allSeasonCards = allSeasonCards.filter(c => c.seasonStatus === 'Not Yet Aired');
}

if (resetResults) setResults(allSeasonCards);
else setResults(prev => [...prev, ...allSeasonCards]);
      setHasMore(data.page < data.total_pages);
    }
  }, [mediaType, selectedGenre, selectedYear, selectedFormat, selectedStatus]);

  useEffect(() => {
    const hasFilters = !!(selectedGenre || selectedYear || selectedFormat || selectedStatus);
    setIsFilterActive(hasFilters);
    if (hasFilters && !query.trim()) {
      setScrollPage(1); setHasMore(true);
      performSearch(1, true).catch(console.error);
    } else if (!hasFilters && !query.trim()) {
      setResults([]); setHasMore(false);
    }
  }, [selectedGenre, selectedYear, selectedFormat, selectedStatus, query, performSearch]);

const handleTextSearch = async () => {
  if (!query.trim()) return;
  setSearching(true);
  setResults([]);
  try {
    // ✅ JÁ CORRETO: language=en-US
    const res = await fetch(`${TMDB}/search/${mediaType}?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    if (mediaType === 'tv') {
const expanded = await Promise.all((data.results ?? []).map((show: RawShow) => expandShow(show, false)));
let allCards: MediaCard[] = expanded.flat();

if (selectedYear) {
  // Filtra apenas temporadas com airYear definido E igual ao ano selecionado
  // Temporadas sem air_date (airYear === undefined) são excluídas ao usar filtro de ano
  allCards = allCards.filter(
    (card: MediaCard) => card.airYear !== undefined && card.airYear === selectedYear
  );
}
setResults(allCards);
    } else {
      let movieCards: MediaCard[] = (data.results ?? []).map(movieToCard);
      if (selectedYear) {
        movieCards = movieCards.filter((card: MediaCard) => card.airYear === selectedYear);
      }
      setResults(movieCards);
    }
    setHasMore(false);
  } catch (err) {
    console.error(err);
  } finally {
    setSearching(false);
  }
};

  // Scroll infinito
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

  // ─── Card component ───────────────────────────────────────────────────────
function MediaCardComponent({ item }: { item: MediaCard }) {
  const hov = hoveredCard === item.tmdbId;
  const displayTitle = item.title || 'Sem título';

    const openEditor = async () => {
  // Busca entry existente no banco pelo slug
  const slug = item.linkSlug;
  let existingEntry = null;
  try {
    const r = await fetch(`/api/entry/${slug}`);
    if (r.ok) existingEntry = await r.json();
  } catch {}

  if (existingEntry) {
    // Entry já existe: abre o editor com os dados reais
    setEditorData({
      ...existingEntry,
      poster_path: item.poster_path,
      totalEpisodes: item.episode_count ?? existingEntry.totalEpisodes ?? null,
    });
  } else {
    // Entry não existe: cria via add-media antes de abrir
    try {
      const r = await fetch('/api/add-media', {
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
      if (r.ok) existingEntry = await r.json();
    } catch {}

    if (!existingEntry) {
      alert('Erro ao preparar entrada. Tente novamente.');
      return;
    }

    setEditorData({
      ...existingEntry,
      poster_path: item.poster_path,
      totalEpisodes: item.episode_count ?? existingEntry.totalEpisodes ?? null,
    });
  }

  setEditorOpen(true);
};

    return (
      <div style={{ position: 'relative' }}>
        <Link href={`/titles/${item.linkSlug}`} style={{ textDecoration: 'none', display: 'block' }}>
          <div
            style={{
              position: 'relative', overflow: 'hidden', borderRadius: '8px',
              boxShadow: hov ? '0 12px 32px rgba(0,0,0,0.5), 0 0 0 1.5px rgba(230,125,153,0.5)' : '0 4px 12px rgba(0,0,0,0.25)',
              transform: hov ? 'translateY(-6px) scale(1.03)' : 'none',
              transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseEnter={() => setHoveredCard(item.tmdbId)}
onMouseLeave={() => setHoveredCard(null)}
          >
            {item.poster_path ? (
              <img
  src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
  style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }}
  alt={displayTitle}
  loading="lazy"
/>
            ) : (
              <div style={{ width: '100%', aspectRatio: '2/3', background: 'rgb(58,55,55)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8ba2b9', fontSize: '32px' }}>
                🎬
              </div>
            )}
            {/* Overlay de ação — aparece no hover */}
            <div style={{
              position: 'absolute', inset: 0,
              background: hov ? 'linear-gradient(to top, rgba(20,18,18,0.92) 0%, rgba(20,18,18,0.15) 60%, transparent)' : 'transparent',
              transition: 'background 0.25s ease',
              borderRadius: '8px',
            }} />
            {/* Botão editar */}
            <button
              style={{
                position: 'absolute', top: '8px', right: '8px',
                background: hov ? '#e67d99' : 'rgba(0,0,0,0)',
                border: 'none', borderRadius: '50%',
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', color: 'white', cursor: 'pointer',
                opacity: hov ? 1 : 0,
                transform: hov ? 'scale(1)' : 'scale(0.7)',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
              onClick={e => { e.preventDefault(); e.stopPropagation(); openEditor(); }}
              title="Add to list"
            >
              ✎
            </button>
          </div>
        </Link>
        <p style={{
          fontSize: '12px', fontWeight: '600', marginTop: '8px',
          color: hov ? 'rgb(230,125,153)' : 'rgba(220,210,215,0.7)',
          lineHeight: '1.3', textAlign: 'center',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 0.2s',
        }}>
          {displayTitle}
        </p>
      </div>
    );
  }

  // ─── CORREÇÃO 1: SectionGrid clicável com toggle ───────────────────────────
  type SectionKey = 'trending' | 'popularNow' | 'allTime';

  const SECTION_META: Record<SectionKey, { label: string; icon: string; desc: string }> = {
    trending:   { label: 'Trending',         icon: '🔥', desc: 'This week' },
    popularNow: { label: 'Popular Now',       icon: '📺', desc: mediaType === 'tv' ? 'On the air' : 'Now playing' },
    allTime:    { label: 'All Time Popular',  icon: '🏆', desc: 'Most voted ever' },
  };

  const SECTION_DATA: Record<SectionKey, MediaCard[]> = {
    trending:   trending,
    popularNow: popularNow,
    allTime:    allTimePopular,
  };

  function SectionBlock({ sectionKey }: { sectionKey: SectionKey }) {
    const meta = SECTION_META[sectionKey];
    const data = SECTION_DATA[sectionKey];
    const isOpen = activeSection === sectionKey;

    return (
      <div style={{ marginBottom: '16px' }}>
        {/* Cabeçalho clicável */}
        <button
          onClick={() => setActiveSection(isOpen ? null : sectionKey)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
            background: isOpen ? 'rgba(230,125,153,0.08)' : 'rgb(50,47,47)',
            border: isOpen ? '1px solid rgba(230,125,153,0.35)' : '1px solid rgba(255,255,255,0.05)',
            borderRadius: isOpen ? '10px 10px 0 0' : '10px',
            padding: '14px 18px', cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(230,125,153,0.25)'; }}
          onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; }}
        >
          <span style={{ fontSize: '20px' }}>{meta.icon}</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: isOpen ? 'rgb(230,125,153)' : 'rgb(220,210,215)', lineHeight: 1 }}>
              {meta.label}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(220,210,215,0.4)', marginTop: '3px' }}>
              {meta.desc} · {data.length} titles
            </div>
          </div>
          {/* Chevron */}
          <span style={{
            fontSize: '12px', color: isOpen ? 'rgb(230,125,153)' : 'rgba(220,210,215,0.35)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
            display: 'inline-block',
          }}>▼</span>
        </button>

        {/* Conteúdo expandível */}
        <div style={{
          background: 'rgb(46,43,43)',
          border: isOpen ? '1px solid rgba(230,125,153,0.35)' : 'none',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          overflow: 'hidden',
          maxHeight: isOpen ? '1000px' : '0',
          transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <div style={{ padding: '20px' }}>
            {data.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(220,210,215,0.3)', fontSize: '13px' }}>
                Loading...
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '18px' }}>
                {data.map((item, idx) => <MediaCardComponent key={`${item.tmdbId}-${idx}`} item={item} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const years = Array.from({ length: new Date().getFullYear() - 1874 + 7 }, (_, i) => 1874 + i).reverse();
  const formatOptions = mediaType === 'tv' ? FORMAT_TV_OPTIONS : FORMAT_MOVIE_OPTIONS;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 80px',
      fontFamily: "'Overpass', -apple-system, BlinkMacSystemFont, sans-serif",
      background: 'rgb(42,39,39)', minHeight: '100vh', color: 'rgb(220,210,215)',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .search-results-grid > * {
          animation: shimmerIn 0.3s ease both;
        }
        .search-results-grid > *:nth-child(1)  { animation-delay: 0.02s; }
        .search-results-grid > *:nth-child(2)  { animation-delay: 0.04s; }
        .search-results-grid > *:nth-child(3)  { animation-delay: 0.06s; }
        .search-results-grid > *:nth-child(4)  { animation-delay: 0.08s; }
        .search-results-grid > *:nth-child(5)  { animation-delay: 0.10s; }
        .search-results-grid > *:nth-child(6)  { animation-delay: 0.12s; }
        .search-results-grid > *:nth-child(7)  { animation-delay: 0.14s; }
        .search-results-grid > *:nth-child(8)  { animation-delay: 0.16s; }
        .search-results-grid > *:nth-child(9)  { animation-delay: 0.18s; }
        .search-results-grid > *:nth-child(10) { animation-delay: 0.20s; }
        * { scrollbar-color: rgba(230,125,153,0.4) rgba(58,55,55,0.5); scrollbar-width: thin; }
      `}</style>

      {/* ── Toggle TV / Movies ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '28px',
        background: 'rgb(50,47,47)', borderRadius: '10px', padding: '4px',
        width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)',
      }}>
        {(['tv', 'movie'] as const).map(type => (
          <button
            key={type}
            onClick={() => {
              setMediaType(type); setResults([]); setQuery('');
              setSelectedGenre(''); setSelectedYear('');
              setSelectedFormat(''); setSelectedStatus('');
              setIsFilterActive(false); setScrollPage(1); setHasMore(true);
              setActiveSection(null);
            }}
            style={{
              background: mediaType === type ? 'linear-gradient(135deg, rgb(230,125,153), rgb(200,90,120))' : 'transparent',
              border: 'none',
              color: mediaType === type ? 'white' : 'rgba(220,210,215,0.5)',
              fontWeight: '700', fontSize: '14px', cursor: 'pointer',
              padding: '8px 22px', borderRadius: '7px',
              transition: 'all 0.2s ease',
              boxShadow: mediaType === type ? '0 2px 12px rgba(230,125,153,0.35)' : 'none',
              letterSpacing: '0.3px',
            }}
          >
            {type === 'tv' ? '📺 TV Shows' : '🎬 Movies'}
          </button>
        ))}
      </div>

      {/* ── Barra de filtros ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'rgb(48,45,45)',
        borderRadius: '14px', padding: '22px 22px 18px',
        marginBottom: '36px',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}>
        {/* Search row */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', pointerEvents: 'none', opacity: 0.4 }}>🔍</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTextSearch()}
              placeholder={mediaType === 'tv' ? 'Search series, seasons...' : 'Search movies...'}
              style={{
                width: '100%', padding: '11px 14px 11px 38px',
                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgb(58,55,55)', color: 'rgb(220,210,215)',
                fontSize: '14px', outline: 'none', fontFamily: 'Overpass, sans-serif',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(230,125,153,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
          <button
            onClick={handleTextSearch}
            style={{
              padding: '11px 24px',
              background: 'linear-gradient(135deg, rgb(230,125,153), rgb(200,90,120))',
              border: 'none', borderRadius: '8px', color: 'white',
              fontWeight: '700', cursor: 'pointer', fontSize: '14px',
              boxShadow: '0 4px 14px rgba(230,125,153,0.35)',
              transition: 'all 0.2s ease', letterSpacing: '0.3px',
              fontFamily: 'Overpass, sans-serif',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            Search
          </button>
          {(query || selectedGenre || selectedYear || selectedFormat || selectedStatus) && (
            <button
              onClick={() => {
                setQuery(''); setSelectedGenre(''); setSelectedYear('');
                setSelectedFormat(''); setSelectedStatus('');
                setResults([]); setIsFilterActive(false);
              }}
              style={{
                padding: '11px 16px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                color: 'rgba(220,210,215,0.5)', cursor: 'pointer', fontSize: '13px',
                transition: 'all 0.2s',
                fontFamily: 'Overpass, sans-serif',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(230,125,153,0.4)'; (e.currentTarget as HTMLElement).style.color = 'rgb(230,125,153)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(220,210,215,0.5)'; }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter chips row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'rgba(220,210,215,0.3)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Filters:</span>

          {/* Genre */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedGenre}
              onChange={e => { setSelectedGenre(e.target.value); setScrollPage(1); setHasMore(true); }}
              style={{ padding: '7px 28px 7px 12px', borderRadius: '20px', background: selectedGenre ? 'rgba(230,125,153,0.15)' : 'rgb(58,55,55)', color: selectedGenre ? 'rgb(230,125,153)' : 'rgba(220,210,215,0.6)', border: selectedGenre ? '1px solid rgba(230,125,153,0.4)' : '1px solid rgba(255,255,255,0.07)', fontSize: '12px', fontWeight: '600', outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', fontFamily: 'Overpass, sans-serif' }}
            >
              <option value="">Genre</option>
              {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '9px', pointerEvents: 'none', color: 'rgba(220,210,215,0.4)' }}>▼</span>
          </div>

          {/* Year */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedYear}
              onChange={e => { setSelectedYear(e.target.value); setScrollPage(1); setHasMore(true); }}
              style={{ padding: '7px 28px 7px 12px', borderRadius: '20px', background: selectedYear ? 'rgba(230,125,153,0.15)' : 'rgb(58,55,55)', color: selectedYear ? 'rgb(230,125,153)' : 'rgba(220,210,215,0.6)', border: selectedYear ? '1px solid rgba(230,125,153,0.4)' : '1px solid rgba(255,255,255,0.07)', fontSize: '12px', fontWeight: '600', outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', fontFamily: 'Overpass, sans-serif' }}
            >
              <option value="">Year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '9px', pointerEvents: 'none', color: 'rgba(220,210,215,0.4)' }}>▼</span>
          </div>

          {/* Format */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedFormat}
              onChange={e => { setSelectedFormat(e.target.value); setScrollPage(1); setHasMore(true); }}
              style={{ padding: '7px 28px 7px 12px', borderRadius: '20px', background: selectedFormat ? 'rgba(230,125,153,0.15)' : 'rgb(58,55,55)', color: selectedFormat ? 'rgb(230,125,153)' : 'rgba(220,210,215,0.6)', border: selectedFormat ? '1px solid rgba(230,125,153,0.4)' : '1px solid rgba(255,255,255,0.07)', fontSize: '12px', fontWeight: '600', outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', fontFamily: 'Overpass, sans-serif' }}
            >
              {formatOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '9px', pointerEvents: 'none', color: 'rgba(220,210,215,0.4)' }}>▼</span>
          </div>

          {/* Status (TV only) */}
          {mediaType === 'tv' && (
            <div style={{ position: 'relative' }}>
              <select
                value={selectedStatus}
                onChange={e => { setSelectedStatus(e.target.value); setScrollPage(1); setHasMore(true); }}
                style={{ padding: '7px 28px 7px 12px', borderRadius: '20px', background: selectedStatus ? 'rgba(230,125,153,0.15)' : 'rgb(58,55,55)', color: selectedStatus ? 'rgb(230,125,153)' : 'rgba(220,210,215,0.6)', border: selectedStatus ? '1px solid rgba(230,125,153,0.4)' : '1px solid rgba(255,255,255,0.07)', fontSize: '12px', fontWeight: '600', outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', fontFamily: 'Overpass, sans-serif' }}
              >
                <option value="">Status</option>
                <option value="airing">Airing</option>
                <option value="finished">Finished</option>
                <option value="not_yet_aired">Not Yet Aired</option>
              </select>
              <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '9px', pointerEvents: 'none', color: 'rgba(220,210,215,0.4)' }}>▼</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Conteúdo ────────────────────────────────────────────────────────── */}
      {searching ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid rgba(230,125,153,0.2)', borderTopColor: 'rgb(230,125,153)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '14px' }} />
          <div style={{ color: 'rgba(220,210,215,0.4)', fontSize: '13px' }}>Searching...</div>
        </div>
      ) : results.length > 0 ? (
        // ── RESULTADOS DE BUSCA / FILTROS ───────────────────────────────────
        <div style={{ animation: 'fadeUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '3px', height: '20px', background: 'linear-gradient(to bottom, rgb(230,125,153), rgba(230,125,153,0.3))', borderRadius: '4px' }} />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'rgb(230,125,153)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Results
            </h3>
            <span style={{ fontSize: '11px', color: 'rgba(220,210,215,0.3)', fontWeight: '600' }}>({results.length})</span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(230,125,153,0.25), transparent)' }} />
          </div>
          <div
            className="search-results-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '18px' }}
          >
            {results.map((item, idx) => <MediaCardComponent key={`${item.tmdbId}-${idx}`} item={item} />)}
          </div>
          {loadingMore && (
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '2px solid rgba(230,125,153,0.2)', borderTopColor: 'rgb(230,125,153)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}
          <div ref={loadMoreRef} style={{ height: '1px' }} />
        </div>
      ) : loadingSections ? (
        // ── SKELETON SEÇÕES ─────────────────────────────────────────────────
        <div>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ marginBottom: '12px', background: 'rgb(50,47,47)', borderRadius: '10px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: '24px', height: '24px', background: 'rgb(62,58,58)', borderRadius: '4px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '130px', height: '14px', background: 'rgb(62,58,58)', borderRadius: '4px', marginBottom: '6px' }} />
                <div style={{ width: '80px', height: '10px', background: 'rgb(58,55,55)', borderRadius: '4px' }} />
              </div>
              <div style={{ width: '16px', height: '16px', background: 'rgb(58,55,55)', borderRadius: '3px' }} />
            </div>
          ))}
        </div>
      ) : (
        // ── SEÇÕES ACORDEÃO (CORREÇÃO 1) ────────────────────────────────────
        <div style={{ animation: 'fadeUp 0.35s ease' }}>
          <SectionBlock sectionKey="trending" />
          <SectionBlock sectionKey="popularNow" />
          <SectionBlock sectionKey="allTime" />
        </div>
      )}

            {/* ── Modal ListEditor (versão unificada) ──────────────────────────── */}
            {editorOpen && (
              <ListEditor
                entry={{
  id: '', // temporário, será criado novo
  tmdbId: editorData.tmdbId,
  parentTmdbId: editorData.parentTmdbId ?? undefined,
  seasonNumber: editorData.seasonNumber ?? undefined,
  title: editorData.title,
  type: editorData.type,
  status: 'PLANNING',
  score: 0,
  progress: 0,
  totalEpisodes: editorData.totalEpisodes ?? null,
  imagePath: editorData.poster_path ?? null,
  isFavorite: false,
  startDate: null,
  finishDate: null,
  rewatchCount: 0,
  notes: null,
  hidden: false,
  updatedAt: new Date().toISOString(),
}}
                onClose={() => setEditorOpen(false)}
                onSave={(updatedEntry) => {
  setResults(prev => prev.map(card =>
    card.tmdbId === updatedEntry.tmdbId
      ? { ...card, status: updatedEntry.status, score: updatedEntry.score, progress: updatedEntry.progress }
      : card
  ));
  setEditorOpen(false);
}}
              />
            )}
          </div>
        );
      }
