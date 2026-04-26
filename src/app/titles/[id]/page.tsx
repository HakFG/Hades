'use client';

import { useState, useEffect, use } from 'react';
import ListEditor from '@/components/ListEditor';

// ─── SISTEMA DE SLUGS ─────────────────────────────────────────────────────────

function parseSlug(slug: string):
  | { kind: 'movie'; movieId: number }
  | { kind: 'tv'; showId: number; seasonNumber: number }
  | { kind: 'unknown' } {

  const tvMatch = slug.match(/^tv-(\d+)-s(\d+)$/);
  if (tvMatch) return { kind: 'tv', showId: parseInt(tvMatch[1]), seasonNumber: parseInt(tvMatch[2]) };

  const movieMatch = slug.match(/^movie-(\d+)$/);
  if (movieMatch) return { kind: 'movie', movieId: parseInt(movieMatch[1]) };

  const numMatch = slug.match(/^(\d+)$/);
  if (numMatch) return { kind: 'movie', movieId: parseInt(numMatch[1]) };

  return { kind: 'unknown' };
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CastMember { id: number; name: string; character: string; profile_path: string | null; }
interface CrewMember { id: number; name: string; job: string; profile_path: string | null; }
interface VideoItem { id: string; key: string; name: string; type: string; site: string; }
interface Episode { id: number; name: string; episode_number: number; still_path: string | null; air_date: string; vote_average: number; }

interface RelationItem {
  slug: string;
  relationType: string;
  title: string;
  poster_path: string | null;
  kind: 'movie' | 'tv';
  year?: string;
  seasonNumber?: number;
}

interface TmdbSeasonStub {
  id: number; name: string; season_number: number;
  poster_path: string | null; air_date: string; episode_count: number;
}

interface TmdbShow {
  id: number; name: string; original_name: string; overview: string;
  backdrop_path: string | null; poster_path: string | null;
  vote_average: number; popularity: number; status: string;
  genres: { id: number; name: string }[];
  seasons: TmdbSeasonStub[];
  number_of_seasons: number; number_of_episodes: number; first_air_date: string;
  last_air_date: string | null;
  in_production: boolean;
  production_companies: { id: number; name: string }[];
  networks: { id: number; name: string }[];
  credits: { cast: CastMember[]; crew: CrewMember[] };
  videos: { results: VideoItem[] };
  recommendations: { results: TmdbRecommendation[] };
}

interface TmdbSeasonDetail {
  id: number; name: string; overview: string; poster_path: string | null;
  air_date: string; season_number: number; vote_average: number;
  episodes: Episode[];
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  videos?: { results: VideoItem[] };
}

interface TmdbMovie {
  id: number; title: string; original_title: string; overview: string;
  backdrop_path: string | null; poster_path: string | null;
  vote_average: number; popularity: number; status: string;
  genres: { id: number; name: string }[];
  runtime: number; release_date: string;
  production_companies: { id: number; name: string }[];
  credits: { cast: CastMember[]; crew: CrewMember[] };
  videos: { results: VideoItem[] };
  recommendations: { results: TmdbRecommendation[] };
}

interface TmdbRecommendation {
  id: number; title?: string; name?: string; poster_path: string | null;
  vote_average: number; media_type?: string; release_date?: string; first_air_date?: string;
}

interface EntryData {
  id: string; tmdbId: number; parentTmdbId?: number | null; seasonNumber?: number | null;
  title: string; type: 'MOVIE' | 'TV_SEASON'; status: string;
  score: number; progress: number; totalEpisodes?: number | null; imagePath?: string | null;
  startDate?: string | null; finishDate?: string | null; rewatchCount?: number;
  notes?: string | null; hidden?: boolean;
  releaseDate?: string | null;
  endDate?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB = 'https://api.themoviedb.org/3';

const getYear = (d?: string) => d?.split('-')[0] ?? '';

function getOrdinal(n: number) {
  if (n === 1) return '1st'; if (n === 2) return '2nd'; if (n === 3) return '3rd'; return `${n}th`;
}

function buildSeasonTitle(showName: string, sn: number) {
  if (sn === 0) return `${showName} Specials`;
  if (sn === 1) return showName;
  return `${showName} ${getOrdinal(sn)} Season`;
}

function getFormat(networks: any[], productionCompanies: any[]): string {
  const streamingKeywords = ['Netflix', 'Amazon', 'Prime Video', 'Hulu', 'Disney+', 'Apple TV+', 'Max', 'Paramount+', 'Crunchyroll', 'Peacock'];
  const all = [...networks, ...productionCompanies];
  const isStreaming = all.some(c => streamingKeywords.some(kw => c.name?.toLowerCase().includes(kw.toLowerCase())));
  return isStreaming ? 'Streaming' : 'TV';
}

function getSeasonAiringStatus(episodes: Episode[]): string {
  const today = new Date().toISOString().split('T')[0];
  const airedEpisodes = episodes.filter(ep => ep.air_date && ep.air_date <= today);
  
  if (airedEpisodes.length === 0) return 'Not Yet Aired';
  if (airedEpisodes.length === episodes.length) return 'Finished';
  return 'Airing';
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function TitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const parsed = parseSlug(id);

  const [entry, setEntry] = useState<EntryData | null>(null);
  const [show, setShow] = useState<TmdbShow | null>(null);
  const [seasonDetail, setSeasonDetail] = useState<TmdbSeasonDetail | null>(null);
  const [movie, setMovie] = useState<TmdbMovie | null>(null);
  const [relations, setRelations] = useState<RelationItem[]>([]);
  const [editingRelations, setEditingRelations] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'staff' | 'videos'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true); setError(null);
      try {
        if (parsed.kind === 'movie') {
          const [entryRes, tmdbRes] = await Promise.all([
            fetch(`/api/entry/movie-${parsed.movieId}`),
            fetch(`${TMDB}/movie/${parsed.movieId}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,videos,recommendations`),
          ]);
          if (entryRes.ok) setEntry(await entryRes.json());
          if (!tmdbRes.ok) throw new Error(`Filme ${parsed.movieId} não encontrado no TMDB`);
          const movieData = await tmdbRes.json();
          setMovie(movieData);

          try {
            const keywordsRes = await fetch(`${TMDB}/movie/${parsed.movieId}/keywords?api_key=${API_KEY}`);
            if (keywordsRes.ok) {
              const keywordsData = await keywordsRes.json();
              const keywords = keywordsData.keywords?.map((k: any) => k.name.toLowerCase()) || [];
              if (keywords.some((k: string) => k.includes('comic') || k.includes('manga') || k.includes('graphic novel'))) {
                setSource('Comic Book');
              } else if (keywords.some((k: string) => k.includes('novel') || k.includes('book') || k.includes('literature'))) {
                setSource('Novel');
              } else if (keywords.some((k: string) => k.includes('video game') || k.includes('game'))) {
                setSource('Video Game');
              } else if (keywords.some((k: string) => k.includes('anime'))) {
                setSource('Anime');
              } else {
                setSource('Original');
              }
            }
          } catch (e) {
            setSource('Original');
          }

        } else if (parsed.kind === 'tv') {
          const { showId, seasonNumber } = parsed;
          const [entryRes, showRes, seasonRes] = await Promise.all([
            fetch(`/api/entry/tv-${showId}-s${seasonNumber}`),
            fetch(`${TMDB}/tv/${showId}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,videos,recommendations`),
            fetch(`${TMDB}/tv/${showId}/season/${seasonNumber}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,videos`),
          ]);
          if (entryRes.ok) setEntry(await entryRes.json());
          if (!showRes.ok) throw new Error(`Série ${showId} não encontrada no TMDB`);
          const showData: TmdbShow = await showRes.json();
          setShow(showData);
          if (seasonRes.ok) setSeasonDetail(await seasonRes.json());

          try {
            const keywordsRes = await fetch(`${TMDB}/tv/${showId}/keywords?api_key=${API_KEY}`);
            if (keywordsRes.ok) {
              const keywordsData = await keywordsRes.json();
              const keywords = keywordsData.results?.map((k: any) => k.name.toLowerCase()) || [];
              if (keywords.some((k: string) => k.includes('comic') || k.includes('manga') || k.includes('anime'))) {
                setSource('Manga');
              } else if (keywords.some((k: string) => k.includes('novel') || k.includes('book') || k.includes('light novel'))) {
                setSource('Light Novel');
              } else if (keywords.some((k: string) => k.includes('video game') || k.includes('game'))) {
                setSource('Video Game');
              } else if (keywords.some((k: string) => k.includes('webtoon') || k.includes('manhwa'))) {
                setSource('Webtoon');
              } else {
                setSource('Original');
              }
            }
          } catch (e) {
            setSource('Original');
          }

          setRelations(
            showData.seasons
              .filter(s => s.season_number > 0 && s.season_number !== seasonNumber)
              .map(s => ({
                slug: `tv-${showId}-s${s.season_number}`,
                relationType: s.season_number < seasonNumber ? 'PREQUEL' : 'SEQUEL',
                title: buildSeasonTitle(showData.name, s.season_number),
                poster_path: s.poster_path,
                kind: 'tv' as const,
                year: getYear(s.air_date),
                seasonNumber: s.season_number,
              }))
          );
        } else {
          setError('Slug inválido.');
        }
      } catch (e: any) {
        setError(e.message ?? 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function handleAddRelation() {
    const kindChoice = prompt('Tipo: "movie" ou "tv"?')?.toLowerCase();
    if (kindChoice !== 'movie' && kindChoice !== 'tv') return;
    const tmdbIdStr = prompt('TMDB ID (para tv = ID da série pai):');
    const tmdbId = parseInt(tmdbIdStr ?? '', 10);
    if (isNaN(tmdbId)) return;
    const relType = prompt('Relação (sequel, prequel, spin off, adaptation, other):') ?? 'other';

    try {
      if (kindChoice === 'tv') {
        const snStr = prompt('Número da temporada:');
        const sn = parseInt(snStr ?? '1', 10);
        if (isNaN(sn)) return;
        const [sRes, pRes] = await Promise.all([
          fetch(`${TMDB}/tv/${tmdbId}/season/${sn}?api_key=${API_KEY}&language=pt-BR`),
          fetch(`${TMDB}/tv/${tmdbId}?api_key=${API_KEY}&language=pt-BR`),
        ]);
        const [sd, pd] = await Promise.all([sRes.json(), pRes.json()]);
        setRelations(prev => [...prev, { slug: `tv-${tmdbId}-s${sn}`, relationType: relType, title: buildSeasonTitle(pd.name, sn), poster_path: sd.poster_path, kind: 'tv', year: getYear(sd.air_date), seasonNumber: sn }]);
      } else {
        const res = await fetch(`${TMDB}/movie/${tmdbId}?api_key=${API_KEY}&language=pt-BR`);
        const d = await res.json();
        setRelations(prev => [...prev, { slug: `movie-${tmdbId}`, relationType: relType, title: d.title, poster_path: d.poster_path, kind: 'movie', year: getYear(d.release_date) }]);
      }
    } catch { alert('Erro ao buscar no TMDB.'); }
  }

  // ─── Loading / Error ──────────────────────────────────────────────────────
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#3a3737', fontFamily: 'Overpass, sans-serif', color: '#e0e4e8' }}>Carregando...</div>;
  if (error || parsed.kind === 'unknown') return <div style={{ padding: '100px', textAlign: 'center', color: '#e0e4e8', fontFamily: 'Overpass, sans-serif' }}><div style={{ fontSize: '18px', marginBottom: '10px' }}>Título não encontrado</div><div style={{ fontSize: '13px', color: '#92a0ad' }}>{error}</div></div>;

  // ─── Dados derivados ──────────────────────────────────────────────────────
  const isTV = parsed.kind === 'tv';
  const displayTitle = isTV && show ? buildSeasonTitle(show.name, parsed.seasonNumber) : movie?.title ?? '';
  const banner = (isTV ? show?.backdrop_path : movie?.backdrop_path) ? `https://image.tmdb.org/t/p/original${isTV ? show!.backdrop_path : movie!.backdrop_path}` : null;
  const posterPath = isTV ? (seasonDetail?.poster_path || show?.poster_path || entry?.imagePath) : (entry?.imagePath || movie?.poster_path);
  const poster = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;
  const rawScore = isTV ? (seasonDetail?.vote_average ?? show?.vote_average ?? 0) : (movie?.vote_average ?? 0);
  const score = rawScore ? Math.round(rawScore * 10) : null;
  const overview = isTV ? (seasonDetail?.overview || show?.overview || '') : (movie?.overview || '');
  const cast: CastMember[] = isTV ? (seasonDetail?.credits?.cast ?? show?.credits?.cast ?? []) : (movie?.credits?.cast ?? []);
  const staffJobs = ['Director', 'Writer', 'Screenplay', 'Producer', 'Executive Producer', 'Director of Photography', 'Original Music Composer', 'Series Director'];
  const allCrew: CrewMember[] = isTV ? (seasonDetail?.credits?.crew ?? show?.credits?.crew ?? []) : (movie?.credits?.crew ?? []);
  const filteredCrew = allCrew.filter(c => staffJobs.includes(c.job)).reduce<CrewMember[]>((acc, cur) => { if (!acc.find(x => x.id === cur.id && x.job === cur.job)) acc.push(cur); return acc; }, []);
  const allVids: VideoItem[] = isTV ? [...(seasonDetail?.videos?.results ?? []), ...(show?.videos?.results ?? [])] : (movie?.videos?.results ?? []);
  const uniqueVideos = allVids.filter(v => v.site === 'YouTube' && ['Trailer', 'Teaser', 'Clip'].includes(v.type)).filter((v, i, a) => a.findIndex(x => x.key === v.key) === i);
  const recommendations: TmdbRecommendation[] = isTV ? (show?.recommendations?.results?.slice(0, 6) ?? []) : (movie?.recommendations?.results?.slice(0, 6) ?? []);
  
  // DATAS DA TEMPORADA ESPECÍFICA (não da série!)
  const seasonAirDate = isTV ? (seasonDetail?.air_date || entry?.releaseDate) : (movie?.release_date || entry?.releaseDate);
  const seasonEpisodes = isTV ? (seasonDetail?.episodes ?? []) : [];
  const seasonAiringStatus = isTV ? getSeasonAiringStatus(seasonEpisodes) : null;
  
  // End Date = último episódio que já foi ao ar (da temporada específica)
  const today = new Date().toISOString().split('T')[0];
  const airedEpisodes = seasonEpisodes.filter(ep => ep.air_date && ep.air_date <= today);
  const lastAiredEpisodeDate = airedEpisodes.length > 0 ? airedEpisodes[airedEpisodes.length - 1].air_date : null;
  const endDate = isTV ? (lastAiredEpisodeDate || entry?.endDate) : null;
  
  const year = getYear(seasonAirDate ?? undefined);
  const episodeCount = isTV ? (seasonDetail?.episodes?.length ?? show?.seasons?.find(s => s.season_number === parsed.seasonNumber)?.episode_count) : null;
  const genresList = (isTV ? show?.genres : movie?.genres) ?? [];
  const studios = (isTV ? show?.production_companies : movie?.production_companies) ?? [];

  const formatDisplay = isTV && show 
    ? getFormat(show.networks ?? [], show.production_companies ?? []) 
    : 'Movie';

  // ─── Estilos ──────────────────────────────────────────────────────────────
  const bgColor = '#3a3737';
  const accentColor = 'rgb(230, 125, 153)';
  const cardBg = '#2a2727';

  const card: React.CSSProperties = { background: cardBg, borderRadius: '4px', overflow: 'hidden' };
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '30px' };
  const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '30px' };
  const grid4: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '30px' };
  const sectionTitle: React.CSSProperties = { fontSize: '14px', fontWeight: 'bold', color: accentColor, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' };
  const dataType: React.CSSProperties = { fontWeight: 'bold', color: '#92a0ad', fontSize: '12px', marginBottom: '2px' };
  const dataValue: React.CSSProperties = { color: '#e0e4e8', lineHeight: '1.4' };
  const tabItem = (active: boolean): React.CSSProperties => ({ padding: '12px 20px', fontSize: '14px', fontWeight: active ? 'bold' : 'normal', color: active ? accentColor : '#92a0ad', borderBottom: active ? `2px solid ${accentColor}` : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none', whiteSpace: 'nowrap' });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'WATCHING': return '#3db4f2';
      case 'COMPLETED': return '#2ecc71';
      case 'PAUSED': return '#f1c40f';
      case 'DROPPED': return '#e74c3c';
      case 'REWATCHING': return '#9b59b6';
      case 'UPCOMING': return '#e67e22';
      default: return accentColor;
    }
  };

  // ─── Subcomponentes ───────────────────────────────────────────────────────

  function CharCard({ p }: { p: CastMember }) {
    return (
      <div style={{ ...card, display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex' }}>
          <img src={p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : `https://placehold.co/60x80/2a2727/92a0ad?text=${encodeURIComponent(p.name[0])}`} style={{ width: '60px', height: '80px', objectFit: 'cover' }} alt={p.name} />
          <div style={{ padding: '8px 10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e0e4e8' }}>{p.name}</div>
            <div style={{ fontSize: '11px', color: '#92a0ad', marginTop: '2px' }}>Actor</div>
          </div>
        </div>
        <div style={{ padding: '8px 10px', textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#e0e4e8', fontWeight: '500' }}>{p.character}</div>
          <div style={{ fontSize: '11px', color: '#92a0ad', marginTop: '2px' }}>Character</div>
        </div>
      </div>
    );
  }

  function StaffCard({ p }: { p: CrewMember }) {
    return (
      <div style={{ ...card, display: 'flex' }}>
        <img src={p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : `https://placehold.co/50x65/2a2727/92a0ad?text=${encodeURIComponent(p.name[0])}`} style={{ width: '50px', height: '65px', objectFit: 'cover' }} alt={p.name} />
        <div style={{ padding: '8px 10px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#e0e4e8', lineHeight: '1.3' }}>{p.name}</div>
          <div style={{ fontSize: '11px', color: '#92a0ad', marginTop: '3px' }}>{p.job}</div>
        </div>
      </div>
    );
  }

  function RelCard({ rel }: { rel: RelationItem }) {
    return (
      <div style={{ ...card, display: 'flex', height: '90px', position: 'relative' }}>
        <img src={rel.poster_path ? `https://image.tmdb.org/t/p/w200${rel.poster_path}` : 'https://placehold.co/60x90/2a2727/92a0ad?text=?'} style={{ width: '60px', objectFit: 'cover', flexShrink: 0 }} alt={rel.title} />
        <a href={`/titles/${rel.slug}`} style={{ textDecoration: 'none', display: 'flex', flex: 1, minWidth: 0 }}>
          <div style={{ padding: '10px 12px', flex: 1, minWidth: 0 }}>
            <div style={{ color: accentColor, fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '4px' }}>{rel.relationType.toUpperCase()}</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e0e4e8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rel.title}</div>
            {rel.year && <div style={{ fontSize: '11px', color: '#92a0ad', marginTop: '3px' }}>{rel.kind === 'movie' ? 'Movie' : rel.seasonNumber ? `${getOrdinal(rel.seasonNumber)} Season` : 'TV'} · {rel.year}</div>}
          </div>
        </a>
        {editingRelations && (
          <button onClick={() => setRelations(prev => prev.filter(r => r.slug !== rel.slug))} style={{ position: 'absolute', top: '6px', right: '6px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        )}
      </div>
    );
  }

  function RecCard({ rec }: { rec: TmdbRecommendation }) {
    const t = rec.title || rec.name || '';
    const slug = rec.media_type === 'movie' ? `movie-${rec.id}` : `tv-${rec.id}-s1`;
    return (
      <a href={`/titles/${slug}`} style={{ textDecoration: 'none' }}>
        <div style={{ ...card, cursor: 'pointer' }}>
          {rec.poster_path ? <img src={`https://image.tmdb.org/t/p/w342${rec.poster_path}`} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} alt={t} /> : <div style={{ width: '100%', aspectRatio: '2/3', backgroundColor: '#2a2727', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#92a0ad', fontSize: '12px' }}>Sem imagem</div>}
          <div style={{ padding: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#e0e4e8', lineHeight: '1.3' }}>{t}</div>
            <div style={{ fontSize: '11px', color: '#92a0ad', marginTop: '2px' }}>{getYear(rec.release_date || rec.first_air_date)} · {Math.round(rec.vote_average * 10)}%</div>
          </div>
        </div>
      </a>
    );
  }

  // ─── Aba Overview ─────────────────────────────────────────────────────────

  function OverviewTab() {
    return (
      <>
        <div style={{ backgroundColor: cardBg, borderRadius: '4px', padding: '20px', marginBottom: '25px', lineHeight: '1.7', color: '#e0e4e8', fontSize: '14px' }}>
          {overview || 'Nenhuma sinopse disponível.'}
        </div>

        {relations.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <div style={sectionTitle}>
              <span>Relations</span>
              <button onClick={() => setEditingRelations(v => !v)} style={{ marginLeft: 'auto', background: editingRelations ? '#e53e3e' : accentColor, color: 'white', border: 'none', borderRadius: '3px', padding: '3px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>{editingRelations ? 'Cancelar' : 'Editar'}</button>
              {editingRelations && <button onClick={handleAddRelation} style={{ background: '#48bb78', color: 'white', border: 'none', borderRadius: '3px', padding: '3px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>+ Adicionar</button>}
            </div>
            <div style={grid2}>{relations.map(rel => <RelCard key={rel.slug} rel={rel} />)}</div>
          </div>
        )}

        {cast.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <div style={sectionTitle}><span>Characters</span><span style={{ marginLeft: 'auto', color: accentColor, fontSize: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('characters')}>Ver todos</span></div>
            <div style={grid2}>{cast.slice(0, 6).map(p => <CharCard key={p.id} p={p} />)}</div>
          </div>
        )}

        {filteredCrew.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <div style={sectionTitle}><span>Staff</span><span style={{ marginLeft: 'auto', color: accentColor, fontSize: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('staff')}>Ver todos</span></div>
            <div style={grid3}>{filteredCrew.slice(0, 3).map(p => <StaffCard key={`${p.id}-${p.job}`} p={p} />)}</div>
          </div>
        )}

        {uniqueVideos.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <div style={sectionTitle}><span>Trailer</span><span style={{ marginLeft: 'auto', color: accentColor, fontSize: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('videos')}>Ver todos</span></div>
            <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#000' }}>
              <iframe src={`https://www.youtube.com/embed/${uniqueVideos[0].key}`} title={uniqueVideos[0].name} allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <div style={sectionTitle}>Recomendações</div>
            <div style={grid4}>{recommendations.slice(0, 4).map(rec => <RecCard key={rec.id} rec={rec} />)}</div>
          </div>
        )}
      </>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: bgColor, minHeight: '100vh', fontFamily: 'Overpass, sans-serif', color: '#e0e4e8' }}>
      {/* BANNER */}
      <div style={{ width: '100%', height: '400px', position: 'relative', backgroundColor: '#1a1a2e', overflow: 'hidden' }}>
        {banner && <img src={banner} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} alt="banner" />}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(to bottom, transparent, #3a3737)' }} />
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', marginTop: '-140px', padding: '0 20px', paddingBottom: '80px' }}>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>

          {/* SIDEBAR */}
          <div style={{ width: '215px', flexShrink: 0 }}>
            {poster && <img src={poster} style={{ width: '215px', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', marginBottom: '8px', display: 'block' }} alt="poster" />}
            
            <button
              onClick={() => setEditorOpen(true)}
              style={{
                backgroundColor: getStatusColor(entry?.status),
                color: 'white',
                padding: '10px',
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 'bold',
                marginBottom: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                border: 'none',
                width: '100%',
                transition: 'background 0.2s, transform 0.1s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.opacity = '1';
              }}
            >
              {entry?.status ?? 'PLANNING'}
            </button>

            <div style={{ backgroundColor: cardBg, borderRadius: '4px', padding: '16px', fontSize: '13px', color: '#e0e4e8' }}>
              {[
                ['Format', formatDisplay],
                isTV && show ? ['Season', `${getOrdinal(parsed.seasonNumber)} of ${show.number_of_seasons}`] : null,
                isTV && seasonAiringStatus ? ['Status', seasonAiringStatus] : null,
                seasonAirDate ? ['First Air Date', new Date(seasonAirDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })] : null,
                isTV && endDate ? ['Last Air Date', new Date(endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })] : null,
                episodeCount ? ['Episodes', String(episodeCount)] : null,
                !isTV && movie?.runtime ? ['Duration', `${movie.runtime} min`] : null,
                score !== null ? ['Average Score', `${score}%`] : null,
                ['Popularity', Math.floor((isTV ? show?.popularity : movie?.popularity) ?? 0).toLocaleString('pt-BR')],
                genresList.length > 0 ? ['Genres', genresList.map(g => g.name).join(', ')] : null,
                ['Source', source ?? 'Original'],
                isTV && show?.networks?.[0] ? ['Network', show.networks[0].name] : null,
                studios && studios[0] ? ['Studio', studios[0].name] : null,
              ].filter((item): item is [string, string] => item !== null && item !== undefined).map(([label, value]) => (
                <div key={label} style={{ marginBottom: '14px' }}>
                  <div style={dataType}>{label}</div>
                  <div style={label === 'Average Score' ? { ...dataValue, color: (score ?? 0) >= 70 ? '#2ecc71' : (score ?? 0) >= 50 ? '#f1c40f' : '#e74c3c', fontWeight: 'bold' } : dataValue}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MAIN */}
          <div style={{ flex: 1, paddingTop: '140px', minWidth: 0 }}>
            <h1 style={{ fontSize: '26px', color: accentColor, marginBottom: '4px', fontWeight: '600', lineHeight: '1.2' }}>{displayTitle}</h1>
            <div style={{ fontSize: '13px', color: '#92a0ad', marginBottom: '20px' }}>{year}</div>

            {/* Abas */}
            <div style={{ display: 'flex', borderBottom: '1px solid #2a2727', marginBottom: '25px' }}>
              {(['overview', 'characters', 'staff', 'videos'] as const).map(tab => (
                <span key={tab} style={tabItem(activeTab === tab)} onClick={() => setActiveTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </span>
              ))}
            </div>

            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'characters' && (<><div style={sectionTitle}>Elenco Completo</div><div style={grid2}>{cast.map(p => <CharCard key={p.id} p={p} />)}</div></>)}
            {activeTab === 'staff' && (<><div style={sectionTitle}>Equipe Completa</div><div style={grid3}>{filteredCrew.map(p => <StaffCard key={`${p.id}-${p.job}`} p={p} />)}</div></>)}
            {activeTab === 'videos' && (
              uniqueVideos.length === 0
                ? <div style={{ color: '#92a0ad', textAlign: 'center', padding: '40px', fontSize: '14px' }}>Nenhum vídeo disponível.</div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {uniqueVideos.map(v => (
                    <div key={v.id}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e0e4e8', marginBottom: '8px' }}>{v.name} <span style={{ fontWeight: 'normal', color: '#92a0ad', fontSize: '12px' }}>({v.type})</span></div>
                      <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#000' }}>
                        <iframe src={`https://www.youtube.com/embed/${v.key}`} title={v.name} allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* ListEditor Modal */}
      <ListEditor
        isOpen={editorOpen}
        onClose={() => { setEditorOpen(false); window.location.reload(); }}
        tmdbId={isTV ? (parsed as any).showId : (parsed as any).movieId}
        parentTmdbId={isTV ? (parsed as any).showId : undefined}
        seasonNumber={isTV ? (parsed as any).seasonNumber : undefined}
        type={isTV ? 'TV_SEASON' : 'MOVIE'}
        title={displayTitle}
        poster_path={posterPath}
        totalEpisodes={episodeCount ?? undefined}
        existingData={entry ? {
          status: entry.status,
          score: entry.score ?? null,
          progress: entry.progress ?? null,
          startDate: entry.startDate ?? null,
          finishDate: entry.finishDate ?? null,
          rewatchCount: entry.rewatchCount ?? 0,
          notes: entry.notes ?? null,
          hidden: entry.hidden ?? false,
        } : undefined}
      />
    </div>
  );
}
