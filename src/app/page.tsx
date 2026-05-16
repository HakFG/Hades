import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';
import Link from 'next/link';
import { getOrdinal } from '@/lib/utils';
import { entryStatusToBubbleStatus, productionStatusToDisplayStatus } from '@/lib/series-status';
import { titlePageSeasonStatus } from '@/lib/tmdb-status';
import SpinTheWheel from '@/components/SpinTheWheel';
import AiringProgressCard from '@/components/AiringProgressCard';
import ChallengeWidget from '@/components/ChallengeWidget';
import StatusBubble from '@/components/StatusBubble';
import { choiceIsActive, normalizePosterPath, posterChoiceKey } from '@/lib/poster-system';

// Novos componentes importados
import TodaySession from '@/components/TodaySession';
import ReleaseCalendar from '@/components/ReleaseCalendar';
import type { CalendarEpisode } from '@/components/ReleaseCalendar';
import WeeklyStats from '@/components/WeeklyStats';
import AchievementShowcase from '@/components/AchievementShowcase';

import { getNextUpItems } from '@/lib/next-up';
import { getGamificationStats } from '@/lib/gamification';
import { getWeeklyStats } from '@/lib/weekly-stats';

// ─── Skeleton ────────────────────────────────────────────────────────────────
function HomePageSkeleton() {
  return (
    <div style={{
      maxWidth: '1400px', margin: '0 auto', padding: '30px 24px',
      backgroundColor: 'rgb(42,39,39)', minHeight: '100vh',
      fontFamily: "'Overpass', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .sk { 
          background: linear-gradient(90deg, rgb(58,55,55) 25%, rgb(72,68,68) 50%, rgb(58,55,55) 75%);
          background-size: 600px 100%;
          animation: shimmer 1.6s infinite linear;
          border-radius: 6px;
        }
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
        <div>
          <div className="sk" style={{ height: '150px', borderRadius: '12px', marginBottom: '24px' }} />
          <div className="sk" style={{ height: '18px', width: '180px', marginBottom: '20px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '48px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="sk" style={{ aspectRatio: '2/3', borderRadius: '8px' }} />
                <div className="sk" style={{ height: '11px', width: '75%', marginTop: '8px', marginLeft: 'auto', marginRight: 'auto' }} />
              </div>
            ))}
          </div>
          <div className="sk" style={{ height: '18px', width: '220px', marginBottom: '20px' }} />
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: '14px', background: 'rgb(58,55,55)', padding: '14px', borderRadius: '10px' }}>
              <div className="sk" style={{ width: '80px', height: '50px', borderRadius: '6px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="sk" style={{ height: '14px', marginBottom: '8px' }} />
                <div className="sk" style={{ height: '11px', width: '55%' }} />
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="sk" style={{ height: '200px', borderRadius: '12px', marginBottom: '20px' }} />
          <div className="sk" style={{ height: '18px', width: '140px', marginBottom: '16px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="sk" style={{ aspectRatio: '2/3', borderRadius: '8px' }} />
                <div className="sk" style={{ height: '10px', width: '80%', marginTop: '6px', marginLeft: 'auto', marginRight: 'auto' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildSeasonSlug(showId: number, seasonNumber: number): string {
  return `tv-${showId}-s${seasonNumber}`;
}
function buildMovieSlug(movieId: number): string {
  return `movie-${movieId}`;
}

type HomePosterItem = {
  id?: number | string;
  tmdbId?: number;
  showId?: number;
  seasonNumber?: number;
  type?: string;
  poster?: string | null;
  poster_path?: string | null;
};

async function applyHomePosterChoices(popular: HomePosterItem[], newlyAdded: HomePosterItem[]) {
  const keyFor = (item: HomePosterItem) => {
    if (item.type === 'movie') return posterChoiceKey({ mediaType: 'MOVIE', tmdbId: Number(item.tmdbId ?? item.id) });
    return posterChoiceKey({ mediaType: 'TV_SEASON', tmdbId: Number(item.showId ?? item.tmdbId), seasonNumber: item.seasonNumber ?? 1 });
  };

  const allItems = [
    ...popular.map((item) => ({ item, field: 'poster' as const, type: 'tv' })),
    ...newlyAdded.map((item) => ({ item, field: 'poster_path' as const, type: item.type })),
  ];
  const keys = allItems.map(({ item, type }) => keyFor({ ...item, type }));
  const choices = await prisma.posterChoice.findMany({ where: { key: { in: keys } } });
  const byKey = new Map(choices.map((choice) => [choice.key, choice]));

  for (const wrapped of allItems) {
    const item = wrapped.item;
    const key = keyFor({ ...item, type: wrapped.type });
    const choice = byKey.get(key);
    const official = normalizePosterPath(item[wrapped.field]);
    if (choice && choiceIsActive(choice, official)) {
      item[wrapped.field] = choice.posterPath;
    }
  }
}

// ─── Data fetching ────────────────────────────────────────────────────────────
async function getHomeData() {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  // 1. Busca dados do usuário, next-up e gamificação
  const [weeklyStats, gamificationStats, nextUpItems] = await Promise.all([
    getWeeklyStats('main'),
    getGamificationStats('main'),
    getNextUpItems(2),
  ]);

  // 2. Títulos sendo assistidos (WATCHING)
  const myWatching = await prisma.entry.findMany({
    where: { status: 'WATCHING', type: 'TV_SEASON' },
    include: {
      seasons: {
        select: {
          status: true,
          airDate: true,
          seasonNumber: true,
          episodes: {
            select: { airDate: true, episodeNumber: true, title: true, stillPath: true },
            orderBy: { episodeNumber: 'asc' },
          },
        },
        orderBy: { seasonNumber: 'asc' },
      },
    },
  });

  // Prepara calendário de lançamentos baseados nos títulos WATCHING
  const calendarEpisodes: CalendarEpisode[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);

  for (const entry of myWatching) {
    for (const season of entry.seasons) {
      for (const ep of season.episodes) {
        if (ep.airDate) {
          const ad = new Date(ep.airDate);
          if (ad >= today && ad < next7Days) {
            calendarEpisodes.push({
              id: `${entry.id}-${season.seasonNumber}-${ep.episodeNumber}`,
              showName: entry.title,
              episodeName: ep.title ?? `Episódio ${ep.episodeNumber}`,
              seasonNumber: season.seasonNumber,
              episodeNumber: ep.episodeNumber,
              airDate: ep.airDate,
              posterPath: ep.stillPath ?? entry.imagePath,
              slug: buildSeasonSlug(entry.parentTmdbId ?? entry.tmdbId, season.seasonNumber)
            });
          }
        }
      }
    }
  }
  calendarEpisodes.sort((a, b) => new Date(a.airDate).getTime() - new Date(b.airDate).getTime());

  // Limitar os airings para exibir apenas 5
  const airingPromises = myWatching.slice(0, 5).map(async (entry) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${entry.parentTmdbId}?api_key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return {
      ...entry,
      seasonStatus: entryStatusToBubbleStatus(entry),
      nextEpisode: data?.next_episode_to_air ?? null,
      inProduction: data?.in_production ?? false,
      backdrop: data?.backdrop_path ?? null,
    };
  });
  let airingResults = await Promise.all(airingPromises);
  airingResults = airingResults.filter(e => e.nextEpisode !== null);

  // Trending & Popular
  const trendingRes = await fetch(
    `https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}`,
    { next: { revalidate: 3600 } }
  );
  const trendingData = await trendingRes.json();
  const popularPromises = trendingData.results.slice(0, 6).map(async (item: any) => {
    const detailRes = await fetch(
      `https://api.themoviedb.org/3/tv/${item.id}?api_key=${apiKey}`,
      { cache: 'no-store' }
    );
    const detail = await detailRes.json();
    const lastSeason = detail?.seasons?.[detail.seasons.length - 1] || null;
    const seasonNumber = lastSeason?.season_number ?? 1;
    const seasonDetail = await fetch(
      `https://api.themoviedb.org/3/tv/${item.id}/season/${seasonNumber}?api_key=${apiKey}&language=en-US`,
      { cache: 'no-store' }
    ).then(r => r.ok ? r.json() : null).catch(() => null);
    return {
      id: item.id, showId: item.id,
      name: `${item.name}${lastSeason && seasonNumber > 1 ? ' ' + getOrdinal(seasonNumber) + ' Temporada' : ''}`,
      poster: lastSeason?.poster_path || item.poster_path,
      seasonNumber, slug: buildSeasonSlug(item.id, seasonNumber),
      bubbleStatus: titlePageSeasonStatus(seasonDetail?.episodes ?? null),
    };
  });

  // Notícias em PT-BR (Foco em séries, filmes, anúncios)
  const newsSources = [
    { name: 'Omelete', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.omelete.com.br/rss', sourceSite: 'Omelete' },
    { name: 'AdoroCinema', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.adorocinema.com/rss/noticias.xml', sourceSite: 'AdoroCinema' },
    { name: 'CinePOP', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://cinepop.com.br/feed/', sourceSite: 'CinePOP' },
  ];
  // Notícias relevantes: anúncios, estreias, renovações, cancelamentos, trailers, datas
  const HIGH_RELEVANCE_KEYWORDS = [
    'estreia', 'temporada', 'renovada', 'renovação', 'cancelada', 'cancelamento',
    'anunciou', 'confirmada', 'confirmado', 'data de lançamento', 'previsão de estreia',
    'trailer', 'teaser', 'elenco confirmado', 'nova série', 'novo filme', 'continuação',
    'sequência', 'spinoff', 'spin-off', 'retorno', 'volta', 'episódio final',
    'última temporada', 'primera temporada', 'segunda temporada', 'terceira temporada',
  ];
  const GENERAL_CINEMA_KEYWORDS = [
    'filme', 'série', 'cinema', 'streaming', 'netflix', 'amazon prime', 'hbo', 'max',
    'disney+', 'apple tv', 'paramount+', 'globoplay', 'crunchyroll', 'marvel', 'dc',
    'bilheteria', 'oscar', 'emmy', 'golden globe', 'diretor', 'ator', 'atriz',
  ];
  const BLACKLIST = [
    'jogo', 'xbox', 'playstation', 'nintendo', 'steam', 'futebol', 'política',
    'eleição', 'governo', 'concurso público', 'bolsa de valores', 'criptomoeda',
    'review de game', 'esport', 'moba', 'rpg de mesa',
  ];
  function isRelevantCinemaNews(title: string, description: string = ''): boolean {
    const text = (title + ' ' + description).toLowerCase();
    const blacklisted = BLACKLIST.some(b => text.includes(b));
    if (blacklisted) return false;
    const highRelevance = HIGH_RELEVANCE_KEYWORDS.some(k => text.includes(k));
    if (highRelevance) return true;
    const generalCinema = GENERAL_CINEMA_KEYWORDS.some(k => text.includes(k));
    return generalCinema;
  }
  const newsPromises = newsSources.map(async (source) => {
    try {
      const response = await fetch(source.url, { next: { revalidate: 3600 } });
      const newsData = await response.json();
      return (newsData.items || [])
        .filter((item: any) => isRelevantCinemaNews(item.title, item.description || ''))
        .slice(0, 15)
        .map((item: any) => ({
          title: item.title, link: item.link, pubDate: item.pubDate,
          thumbnail: item.thumbnail || item.enclosure?.link || '',
          source: source.sourceSite,
        }));
    } catch { return []; }
  });

  // Newly Added (Séries e Filmes) - Expandido para 6 títulos
  const [movieChanges, tvChanges] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/movie/changes?api_key=${apiKey}&page=1`, { next: { revalidate: 1800 } }).then(r => r.json()),
    fetch(`https://api.themoviedb.org/3/tv/changes?api_key=${apiKey}&page=1`, { next: { revalidate: 1800 } }).then(r => r.json()),
  ]);
  const recentlyAddedItems: any[] = [];
  if (movieChanges.results?.length) {
    for (const id of movieChanges.results.slice(0, 20).map((c: any) => c.id)) {
      try {
        const d = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=pt-BR`, { next: { revalidate: 3600 } }).then(r => r.json());
        if (d && !d.status_code && d.poster_path) recentlyAddedItems.push({ id: `movie-${d.id}`, tmdbId: d.id, name: d.title, type: 'movie', releaseDate: d.release_date, poster_path: d.poster_path, slug: buildMovieSlug(d.id), addedAt: new Date().toISOString(), bubbleStatus: productionStatusToDisplayStatus(d.status) });
      } catch { }
    }
  }
  if (tvChanges.results?.length) {
    for (const id of tvChanges.results.slice(0, 20).map((c: any) => c.id)) {
      try {
        const d = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=pt-BR`, { next: { revalidate: 3600 } }).then(r => r.json());
        if (d && !d.status_code && d.poster_path && d.seasons) {
          const s1 = await fetch(`https://api.themoviedb.org/3/tv/${d.id}/season/1?api_key=${apiKey}&language=pt-BR`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
          recentlyAddedItems.push({ id: `tv-${d.id}`, tmdbId: d.id, name: `${d.name} 1ª Temp`, type: 'tv', releaseDate: d.first_air_date, poster_path: d.poster_path, seasonNumber: 1, slug: buildSeasonSlug(d.id, 1), addedAt: new Date().toISOString(), bubbleStatus: titlePageSeasonStatus(s1?.episodes ?? null) });
        }
      } catch { }
    }
  }

  const newlyAdded = recentlyAddedItems.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()).slice(0, 12);

  const airingEntryIds = new Set(airingResults.map(e => e.id));
  const inProgressEntries = await prisma.entry.findMany({
    where: {
      status: 'WATCHING',
      NOT: { id: { in: Array.from(airingEntryIds) } }
    },
    include: {
      seasons: {
        select: {
          status: true,
          airDate: true,
          seasonNumber: true,
          episodes: {
            select: { airDate: true },
            orderBy: { episodeNumber: 'asc' },
          },
        },
        orderBy: { seasonNumber: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });
  const inProgressWithStatus = inProgressEntries.map((entry) => ({
    ...entry,
    seasonStatus: entryStatusToBubbleStatus(entry),
  }));

  const planningEntries = await prisma.entry.findMany({
    where: { status: 'PLANNING' },
    select: { id: true, tmdbId: true, type: true, title: true, imagePath: true, synopsis: true, parentTmdbId: true, seasonNumber: true },
  });
  const planningItems = planningEntries.map(e => ({
    ...e,
    slug: e.type === 'MOVIE' ? buildMovieSlug(e.tmdbId) : buildSeasonSlug(e.parentTmdbId ?? e.tmdbId, e.seasonNumber ?? 1)
  }));

  const [popularResults, newsResults] = await Promise.all([
    Promise.all(popularPromises), Promise.all(newsPromises),
  ]);
  const uniqueNews = Array.from(new Map(newsResults.flat().map(item => [item.title, item])).values())
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()).slice(0, 20);

  await applyHomePosterChoices(popularResults, newlyAdded);

  return {
    weeklyStats,
    gamificationStats,
    nextUpItems,
    calendarEpisodes,
    airing: airingResults,
    popular: popularResults,
    news: uniqueNews,
    newlyAdded,
    inProgress: inProgressWithStatus,
    planningItems
  };
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default async function HomePage() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}

async function HomePageContent() {
  const data = await getHomeData();
  const {
    weeklyStats,
    gamificationStats,
    nextUpItems,
    calendarEpisodes,
    airing,
    popular,
    news,
    newlyAdded,
    inProgress,
    planningItems
  } = data;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgb(42,39,39)',
      fontFamily: "'Overpass', -apple-system, BlinkMacSystemFont, sans-serif",
      color: 'rgb(220,210,215)',
    }}>
      <style>{`
        /* ── Animações e estilos mantidos e melhorados ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.85); }
          70%  { transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .hades-home {
          max-width: 1440px;
          margin: 0 auto;
          padding: 28px 28px 60px;
          animation: fadeUp 0.5s ease-out both;
        }
        
        .cards-grid-5 {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
          gap: 14px;
        }
        @media (min-width: 1200px) {
          .cards-grid-5 {
            grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
            gap: 16px;
          }
        }
        
        .card-hover-effect {
          transition: all 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          will-change: transform;
        }
        .card-hover-effect:hover {
          transform: translateY(-8px);
          filter: brightness(1.05);
        }
        .card-hover-effect:hover > * {
          border-color: rgba(230,125,153, 0.7) !important;
          box-shadow: 0 20px 28px -12px rgba(0,0,0,0.5), 0 0 0 2px rgba(230,125,153, 0.3) !important;
        }
        
        .section-head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .section-head-bar {
          width: 4px;
          height: 22px;
          background: linear-gradient(to bottom, rgb(230,125,153), rgba(230,125,153,0.3));
          border-radius: 4px;
        }
        .section-head-title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: rgb(230,125,153);
          margin: 0;
        }
        .section-head-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, rgba(230,125,153,0.25), transparent);
        }
        .section-head-count {
          font-size: 10px;
          color: rgba(230,125,153,0.5);
          font-weight: 700;
          letter-spacing: 1px;
        }

        .page-main-grid {
          display: grid;
          grid-template-columns: 1fr minmax(320px, 440px);
          gap: 40px;
          align-items: flex-start;
        }
        @media (max-width: 1140px) {
          .page-main-grid {
            grid-template-columns: 1fr;
          }
        }
        .sidebar {
          min-width: 0;
          width: 100%;
          max-width: 440px;
        }
        @media (max-width: 1140px) {
          .sidebar {
            max-width: 100%;
          }
        }

        .side-panel {
          background: linear-gradient(180deg, rgba(38,34,34,0.98), rgba(28,25,25,0.96));
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: 0 22px 48px rgba(0,0,0,0.18);
        }
        .side-panel-header {
          padding: 18px 18px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(230,125,153,0.08);
        }
        .side-panel-header-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: rgb(230,125,153);
          box-shadow: 0 0 16px rgba(230,125,153,0.45);
        }
        .side-panel-header-title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgb(230,125,153);
          margin: 0;
        }
        .side-panel-header-pill {
          margin-left: auto;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 6px 10px;
        }
        .side-panel-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
          padding: 14px 14px 16px;
          align-items: start;
        }
        @media (max-width: 840px) {
          .side-panel-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .side-panel-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .side-panel-empty {
          min-height: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 28px 20px;
          color: rgba(255,255,255,0.78);
          text-align: center;
          border-radius: 18px;
          background: radial-gradient(circle at top, rgba(230,125,153,0.16), transparent 30%), rgba(28,24,24,0.96);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .side-panel-empty-graphic {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(230,125,153,0.14);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.04);
        }
        .side-panel-empty-graphic span {
          font-size: 22px;
          color: rgb(230,125,153);
          line-height: 1;
        }
        .side-panel-empty-title {
          font-size: 14px;
          font-weight: 700;
          color: rgb(242,236,240);
          margin: 0;
        }
        .side-panel-empty-text {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          line-height: 1.6;
          max-width: 240px;
        }

        .cover-card {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
          display: block;
          text-decoration: none;
        }
        .cover-card:hover {
          transform: translateY(-6px) scale(1.03);
          box-shadow: 0 20px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(230,125,153,0.35);
        }
        .cover-card img {
          width: 100%;
          aspect-ratio: 2/3;
          object-fit: cover;
          border-radius: 8px;
          background: rgb(58,55,55);
        }
        .cover-card .cover-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(20,18,18,0.92) 0%, rgba(20,18,18,0.1) 55%, transparent 100%);
          border-radius: 8px;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .cover-card:hover .cover-overlay { opacity: 1; }
        .cover-card .cover-title {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 32px 10px 10px;
          font-size: 7px;
          font-weight: 300;
          color: white;
          line-height: 1.3;
          text-align: center;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.25s ease, transform 0.25s ease;
          background: linear-gradient(transparent, rgba(42,39,39,0.95));
        }
        .cover-card:hover .cover-title { opacity: 1; transform: translateY(0); }

        .news-card {
          display: flex;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 10px;
          background: rgb(52,49,49);
          border: 1px solid rgba(255,255,255,0.04);
          margin-bottom: 10px;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
          cursor: pointer;
          animation: slideInLeft 0.4s ease both;
          text-decoration: none;
        }
        .news-card:hover {
          background: rgb(62,58,58);
          border-color: rgba(230,125,153,0.3);
          transform: translateX(4px);
        }
        .news-thumb {
          width: 80px;
          height: 52px;
          object-fit: cover;
          border-radius: 6px;
          flex-shrink: 0;
          background: rgb(72,68,68);
        }
        .news-source-badge {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          background: rgba(230,125,153,0.15);
          color: rgb(230,125,153);
          border: 1px solid rgba(230,125,153,0.2);
        }
        .glow-divider {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(230,125,153,0.35), transparent);
          margin: 36px 0;
          border: none;
        }
        .grain-overlay {
          position: fixed; inset: 0; pointer-events: none; z-index: 1000;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 180px 180px;
        }

        .stagger > *:nth-child(1) { animation: popIn 0.4s 0.05s ease both; }
        .stagger > *:nth-child(2) { animation: popIn 0.4s 0.10s ease both; }
        .stagger > *:nth-child(3) { animation: popIn 0.4s 0.15s ease both; }
        .stagger > *:nth-child(4) { animation: popIn 0.4s 0.20s ease both; }
        .stagger > *:nth-child(5) { animation: popIn 0.4s 0.25s ease both; }
        .stagger > *:nth-child(6) { animation: popIn 0.4s 0.30s ease both; }
        
        .news-stagger > *:nth-child(n) { animation: slideInLeft 0.4s ease both; }
      `}</style>

      <div className="grain-overlay" />

      <div className="hades-home">
        <div className="page-main-grid">

          {/* COLUNA PRINCIPAL (Esquerda) */}
          <div className="w-full min-w-0">

            {/* 1. SESSÃO DE HOJE */}
            {nextUpItems && nextUpItems.length > 0 && (
              <TodaySession items={nextUpItems} currentStreak={gamificationStats.streak.current} />
            )}

            <hr className="glow-divider" />

            {/* 2. POPULAR SEASONS */}
            <section className="mb-11">
              <div className="section-head">
                <div className="section-head-bar" />
                <h2 className="section-head-title">Populares na Semana</h2>
                <div className="section-head-line" />
                <span className="section-head-count">{popular.length} títulos</span>
              </div>
              <div className="stagger grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {popular.map((item: any) => (
                  <Link key={item.id} href={`/titles/${item.slug}`} className="cover-card">
                    <StatusBubble status={item.bubbleStatus} size="md" />
                    <img src={`https://image.tmdb.org/t/p/w300${item.poster}`} alt={item.name} loading="lazy" />
                    <div className="cover-overlay" />
                    <div className="cover-title">{item.name}</div>
                  </Link>
                ))}
              </div>
            </section>

            <hr className="glow-divider" />

            {/* 3. NOTÍCIAS PT-BR */}
            <section>
              <div className="section-head">
                <div className="section-head-bar" />
                <h2 className="section-head-title">Notícias de Filmes e Séries</h2>
                <div className="section-head-line" />
                <span className="section-head-count">{news.length} artigos</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 news-stagger">
                {news.length > 0 ? (
                  news.map((article: any, i: number) => (
                    <a
                      key={i}
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="news-card"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      {article.thumbnail && <img src={article.thumbnail} className="news-thumb" alt="news" loading="lazy" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="news-source-badge">{article.source || 'Notícia'}</span>
                        </div>
                        <p className="m-0 text-[13px] font-semibold text-white/90 leading-snug line-clamp-2">
                          {article.title}
                        </p>
                        <p className="m-0 mt-1 text-[10px] text-white/40">
                          {article.pubDate ? new Date(article.pubDate).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recente'}
                        </p>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="col-span-full bg-[#343131] rounded-xl p-8 text-center text-white/40 text-sm">
                    Carregando notícias...
                  </div>
                )}
              </div>
            </section>

            <hr className="glow-divider" />

            {/* 4. CALENDÁRIO DE LANÇAMENTOS */}
            <ReleaseCalendar episodes={calendarEpisodes} />

            <hr className="glow-divider" />

            {/* 5. ROLETA DO DESTINO */}
            <section className="mb-11">
              <SpinTheWheel items={planningItems} />
            </section>

            <hr className="glow-divider" />

            {/* 6. NEWLY ADDED (Agora expandido na coluna principal) */}
            <section className="mb-11">
              <div className="section-head">
                <div className="section-head-bar" style={{ background: 'linear-gradient(to bottom, #10b981, rgba(16,185,129,0.3))' }} />
                <h2 className="section-head-title" style={{ color: '#10b981' }}>Adicionados Recentemente</h2>
                <div className="section-head-line" style={{ background: 'linear-gradient(to right, rgba(16,185,129,0.25), transparent)' }} />
              </div>
              <div className="stagger grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
                {newlyAdded.length > 0 ? (
                  newlyAdded.map((item: any) => (
                    <Link key={item.id} href={`/titles/${item.slug}`} className="cover-card">
                      <StatusBubble status={item.bubbleStatus} size="sm" />
                      <img src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} alt={item.name} loading="lazy" />
                      <div className="cover-overlay" />
                      <div className="cover-title">{item.name}</div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-white/30 text-xs">
                    Nenhum título adicionado recentemente.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* COLUNA LATERAL (Direita) */}
          <div className="sidebar flex flex-col gap-0 w-full">


            {/* 7. AIRING NOW */}
            <div className="side-panel">
              <div className="side-panel-header">
                <div className="side-panel-header-dot" style={{ background: '#2ecc71', boxShadow: '0 0 12px rgba(46,204,113,0.45)' }} />
                <h3 className="side-panel-header-title" style={{ color: '#2ecc71' }}>Em Exibição</h3>
                <span className="side-panel-header-pill">{airing.length} itens</span>
              </div>
              {airing.length > 0 ? (
                <div className="side-panel-grid">
                  {airing.map((e: any) => (
                    <AiringProgressCard key={e.id} entry={e} />
                  ))}
                </div>
              ) : (
                <div className="side-panel-empty">
                  <div className="side-panel-empty-graphic"><span>⏳</span></div>
                  <div className="side-panel-empty-title">Ainda não há exibições</div>
                  <div className="side-panel-empty-text">
                    Acompanhe as séries em alta para ver as próximas exibições aparecerem aqui.
                  </div>
                </div>
              )}
            </div>

            {/* 8. IN PROGRESS */}
            <div className="side-panel">
              <div className="side-panel-header">
                <div className="side-panel-header-dot" style={{ background: 'rgb(230,125,153)', boxShadow: '0 0 16px rgba(230,125,153,0.35)' }} />
                <h3 className="side-panel-header-title">Em Andamento</h3>
                <span className="side-panel-header-pill">{inProgress.length} itens</span>
              </div>
              {inProgress.length > 0 ? (
                <div className="side-panel-grid">
                  {inProgress.map((e: any) => (
                    <AiringProgressCard key={e.id} entry={e} />
                  ))}
                </div>
              ) : (
                <div className="side-panel-empty">
                  <div className="side-panel-empty-graphic"><span>🎬</span></div>
                  <div className="side-panel-empty-title">Nada em andamento ainda</div>
                  <div className="side-panel-empty-text">
                    Marque episódios como assistidos para acompanhar sua jornada e preencher essa área com estilo.
                  </div>
                </div>
              )}
            </div>

            {/* 9. DESAFIOS ATUAIS */}
            <div className="mb-5">
              <ChallengeWidget compact />
            </div>

            {/* 10. VITRINE DE CONQUISTAS RECENTES */}
            <AchievementShowcase achievements={gamificationStats.achievements} />

            {/* 11. NÚMEROS DA SEMANA */}
            <WeeklyStats stats={weeklyStats} />
          </div>
        </div>
      </div>
    </div>
  );
}