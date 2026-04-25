'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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
}

interface MediaCard {
  tmdbId: number;
  parentTmdbId?: number;
  title: string;
  poster_path: string | null;
  type: 'MOVIE' | 'TV_SEASON';
  episode_count?: number;
  season_number?: number;

  // ✅ CORRIGIDO: string slug em vez de number
  // Séries:  "tv-{showId}-s{seasonNumber}"   ex: "tv-124364-s1"
  // Filmes:  "movie-{id}"                    ex: "movie-550"
  linkSlug: string;
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

// Expande uma série nos seus cards de temporada
async function expandShow(show: RawShow, includeSpecials = false): Promise<MediaCard[]> {
  try {
    const res = await fetch(`${TMDB}/tv/${show.id}?api_key=${API_KEY}&language=pt-BR`);
    if (!res.ok) return [];
    const detail = await res.json();

    const seasons: any[] = detail.seasons ?? [];

    return seasons
      .filter((s: any) => includeSpecials || s.season_number > 0)
      .map((s: any): MediaCard => ({
        tmdbId: s.id,
        parentTmdbId: show.id,
        title: buildSeasonTitle(show.name ?? show.title ?? '', s.season_number),
        poster_path: s.poster_path || show.poster_path,
        type: 'TV_SEASON',
        episode_count: s.episode_count,
        season_number: s.season_number,
        // ✅ CORRIGIDO: slug correto que a page.tsx sabe parsear
        linkSlug: `tv-${show.id}-s${s.season_number}`,
      }));
  } catch {
    return [];
  }
}

// Converte resultado bruto de filme em MediaCard
function movieToCard(m: RawShow): MediaCard {
  return {
    tmdbId: m.id,
    title: m.title ?? m.name ?? 'Sem título',
    poster_path: m.poster_path,
    type: 'MOVIE',
    // ✅ CORRIGIDO: slug correto para filmes
    linkSlug: `movie-${m.id}`,
  };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('tv');
  const [results, setResults] = useState<MediaCard[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);

  const [trending, setTrending] = useState<MediaCard[]>([]);
  const [popularThisSeason, setPopularThisSeason] = useState<MediaCard[]>([]);
  const [allTimePopular, setAllTimePopular] = useState<MediaCard[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);

  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [addingId, setAddingId] = useState<number | null>(null);

  // ── Carregar seções iniciais ────────────────────────────────────────────────
  const loadInitialSections = useCallback(async () => {
    setLoadingSections(true);
    setTrending([]);
    setPopularThisSeason([]);
    setAllTimePopular([]);

    try {
      const genRes = await fetch(`${TMDB}/genre/${mediaType}/list?api_key=${API_KEY}&language=pt-BR`);
      const genData = await genRes.json();
      setGenres(genData.genres ?? []);

      const [trendRaw, seasonRaw, popularRaw] = await Promise.all([
        fetch(`${TMDB}/trending/${mediaType}/week?api_key=${API_KEY}&language=pt-BR`).then(r => r.json()),
        fetch(
          `${TMDB}/${mediaType === 'tv' ? 'tv/on_the_air' : 'movie/now_playing'}?api_key=${API_KEY}&language=pt-BR`
        ).then(r => r.json()),
        fetch(`${TMDB}/${mediaType}/popular?api_key=${API_KEY}&language=pt-BR`).then(r => r.json()),
      ]);

      const trendShows: RawShow[] = (trendRaw.results ?? []).slice(0, 6);
      const seasonShows: RawShow[] = (seasonRaw.results ?? []).slice(0, 6);
      const popularShows: RawShow[] = (popularRaw.results ?? []).slice(0, 6);

      if (mediaType === 'tv') {
        const [trendCards, seasonCards, popularCards] = await Promise.all([
          expandAndPickLatest(trendShows),
          expandAndPickLatest(seasonShows),
          expandAndPickLatest(popularShows),
        ]);
        setTrending(trendCards);
        setPopularThisSeason(seasonCards);
        setAllTimePopular(popularCards);
      } else {
        setTrending(trendShows.map(movieToCard));
        setPopularThisSeason(seasonShows.map(movieToCard));
        setAllTimePopular(popularShows.map(movieToCard));
      }
    } catch (err) {
      console.error('Erro ao carregar seções iniciais:', err);
    } finally {
      setLoadingSections(false);
    }
  }, [mediaType]);

  async function expandAndPickLatest(shows: RawShow[]): Promise<MediaCard[]> {
    const expanded = await Promise.all(shows.map(s => expandShow(s)));
    return expanded.map(seasons => {
      if (seasons.length === 0) return null;
      const sorted = [...seasons].sort((a, b) => (b.season_number ?? 0) - (a.season_number ?? 0));
      return sorted[0];
    }).filter(Boolean) as MediaCard[];
  }

  useEffect(() => {
    loadInitialSections();
    setResults([]);
    setQuery('');
    setSelectedGenre('');
    setSelectedYear('');
  }, [loadInitialSections]);

  // ── Busca / Filtro ──────────────────────────────────────────────────────────
  async function handleSearch(isFilter = false) {
    if (!query.trim() && !isFilter) return;
    setSearching(true);
    setResults([]);

    try {
      let url = '';
      if (query.trim() && !isFilter) {
        url = `${TMDB}/search/${mediaType}?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query.trim())}`;
      } else {
        url = `${TMDB}/discover/${mediaType}?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc`;
        if (selectedGenre) url += `&with_genres=${selectedGenre}`;
        if (selectedYear) {
          const param = mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year';
          url += `&${param}=${selectedYear}`;
        }
      }

      const res = await fetch(url);
      const data = await res.json();
      const rawResults: RawShow[] = data.results ?? [];

      if (mediaType === 'tv') {
        const expanded = await Promise.all(rawResults.slice(0, 10).map(s => expandShow(s)));
        setResults(expanded.flat());
      } else {
        setResults(rawResults.map(movieToCard));
      }
    } catch (err) {
      console.error('Erro na busca:', err);
    } finally {
      setSearching(false);
    }
  }

  // ── Salvar no banco ────────────────────────────────────────────────────────
  async function saveToDatabase(item: MediaCard) {
    if (addingId !== null) return;
    setAddingId(item.tmdbId);

    try {
      const res = await fetch('/api/add-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: item.tmdbId,
          parentTmdbId: item.parentTmdbId ?? null,
          type: item.type,
          title: item.title,
          poster_path: item.poster_path,
          totalEpisodes: item.episode_count ?? 1,
          seasonNumber: item.season_number ?? null, // ✅ ADICIONADO
        }),
      });

      if (res.ok) {
        setAddedIds(prev => new Set(prev).add(item.tmdbId));
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Erro ao salvar:', err);
        alert('Erro ao adicionar. Veja o console.');
      }
    } catch (err) {
      console.error('Erro de rede:', err);
    } finally {
      setAddingId(null);
    }
  }

  // ── Card individual ─────────────────────────────────────────────────────────
  function MediaCardComponent({ item }: { item: MediaCard }) {
    const isAdded = addedIds.has(item.tmdbId);
    const isAdding = addingId === item.tmdbId;
    const displayTitle = item.title || 'Sem título';

    return (
      <div style={{ position: 'relative' }}>
        {/* ✅ CORRIGIDO: usa linkSlug em vez de linkId */}
        <Link href={`/titles/${item.linkSlug}`} style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
            {item.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                style={{
                  width: '100%',
                  display: 'block',
                  borderRadius: '4px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                  transition: 'transform 0.2s',
                }}
                alt={displayTitle}
                onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseOut={e => (e.currentTarget.style.transform = 'scale(1.0)')}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '2/3',
                  background: '#c9d0d8',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#5e7282',
                  fontSize: '12px',
                }}
              >
                Sem imagem
              </div>
            )}

            {item.type === 'TV_SEASON' && item.season_number && item.season_number > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '16px 6px 5px',
                  letterSpacing: '0.3px',
                }}
              >
                {getOrdinal(item.season_number)} Season
                {item.episode_count ? ` · ${item.episode_count} ep` : ''}
              </div>
            )}
          </div>

          <p
            style={{
              fontSize: '12px',
              fontWeight: '600',
              marginTop: '6px',
              color: '#516170',
              lineHeight: '1.3',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {displayTitle}
          </p>
        </Link>

        <button
          onClick={e => { e.preventDefault(); saveToDatabase(item); }}
          disabled={isAdded || isAdding}
          style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            background: isAdded
              ? 'rgba(46, 204, 113, 0.92)'
              : isAdding
              ? 'rgba(150,150,150,0.85)'
              : 'rgba(61, 180, 242, 0.92)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '3px 7px',
            fontSize: '10px',
            fontWeight: 'bold',
            cursor: isAdded ? 'default' : 'pointer',
            zIndex: 10,
            transition: 'background 0.2s',
          }}
        >
          {isAdded ? '✓ ADDED' : isAdding ? '...' : '+ ADD'}
        </button>
      </div>
    );
  }

  // ── Grid de seção ─────────────────────────────────────────────────────────
  function SectionGrid({ title, data }: { title: string; data: MediaCard[] }) {
    if (data.length === 0) return null;
    return (
      <div style={{ marginBottom: '40px' }}>
        <h3
          style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#647380',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '15px',
          }}
        >
          {title}
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
            gap: '18px',
          }}
        >
          {data.map((item, idx) => (
            <MediaCardComponent key={`${item.tmdbId}-${idx}`} item={item} />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: 'Overpass, sans-serif',
      }}
    >
      {/* TOGGLE FILME / SÉRIE */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '30px',
          borderBottom: '1px solid #dce1e7',
          paddingBottom: '10px',
        }}
      >
        {(['tv', 'movie'] as const).map(type => (
          <button
            key={type}
            onClick={() => { setMediaType(type); setResults([]); }}
            style={{
              background: 'none',
              border: 'none',
              color: mediaType === type ? '#3db4f2' : '#92a0ad',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '17px',
              paddingBottom: '4px',
              borderBottom: mediaType === type ? '2px solid #3db4f2' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {type === 'tv' ? 'TV Shows' : 'Movies'}
          </button>
        ))}
      </div>

      {/* FILTROS */}
      <div
        style={{
          display: 'flex',
          gap: '15px',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          marginBottom: '40px',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold', color: '#647380' }}>
            Search
          </label>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch(false)}
            placeholder={mediaType === 'tv' ? 'Nome da série...' : 'Nome do filme...'}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '4px',
              border: '1px solid #dce1e7',
              outline: 'none',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ width: '160px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold', color: '#647380' }}>
            Genre
          </label>
          <select
            value={selectedGenre}
            onChange={e => setSelectedGenre(e.target.value)}
            style={{ width: '100%', padding: '9px', borderRadius: '4px', border: '1px solid #dce1e7', fontSize: '13px' }}
          >
            <option value="">Any</option>
            {genres.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div style={{ width: '110px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold', color: '#647380' }}>
            Year
          </label>
          <input
            type="number"
            placeholder="Any"
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            style={{ width: '100%', padding: '9px', borderRadius: '4px', border: '1px solid #dce1e7', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        <button
          onClick={() => handleSearch(true)}
          style={{
            padding: '9px 22px',
            background: '#3db4f2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Filter
        </button>

        {results.length > 0 && (
          <button
            onClick={() => { setResults([]); setQuery(''); }}
            style={{
              padding: '9px 16px',
              background: 'transparent',
              color: '#92a0ad',
              border: '1px solid #dce1e7',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Limpar
          </button>
        )}
      </div>

      {/* CONTEÚDO */}
      {searching ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#92a0ad', fontSize: '14px' }}>
          {mediaType === 'tv' ? 'Expandindo temporadas...' : 'Buscando filmes...'}
        </div>
      ) : results.length > 0 ? (
        <SectionGrid title={`Resultados (${results.length})`} data={results} />
      ) : loadingSections ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#92a0ad', fontSize: '14px' }}>
          Carregando...
        </div>
      ) : (
        <>
          <SectionGrid title="Em Alta" data={trending} />
          <SectionGrid title="Popular Agora" data={popularThisSeason} />
          <SectionGrid title="Mais Populares" data={allTimePopular} />
        </>
      )}
    </div>
  );
}