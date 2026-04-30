import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';
import Link from 'next/link';
import { getOrdinal } from '@/lib/utils';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getHomeData() {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  // 1. AIRING (apenas séries com próximo episódio)
  const myWatching = await prisma.entry.findMany({
    where: { status: 'WATCHING', type: 'TV_SEASON' },
    take: 6,
  });
  const airingPromises = myWatching.map(async (entry) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${entry.parentTmdbId}?api_key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return { ...entry, nextEpisode: data?.next_episode_to_air ?? null, inProduction: data?.in_production ?? false, backdrop: data?.backdrop_path ?? null };
  });
  let airingResults = await Promise.all(airingPromises);
  // Filtra apenas entradas que realmente têm próximo episódio
  airingResults = airingResults.filter(e => e.nextEpisode !== null);

  // 2. POPULAR SEASONS
  const trendingRes = await fetch(
    `https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}`,
    { next: { revalidate: 3600 } }
  );
  const trendingData = await trendingRes.json();
  const popularPromises = trendingData.results.slice(0, 6).map(async (item: any) => {
    const detailRes = await fetch(
      `https://api.themoviedb.org/3/tv/${item.id}?api_key=${apiKey}`,
      { next: { revalidate: 7200 } }
    );
    const detail = await detailRes.json();
    const lastSeason = detail?.seasons?.[detail.seasons.length - 1] || null;
    const seasonNumber = lastSeason?.season_number ?? 1;
    return {
      id: item.id, showId: item.id,
      name: `${item.name}${lastSeason && seasonNumber > 1 ? ' ' + getOrdinal(seasonNumber) + ' Season' : ''}`,
      poster: lastSeason?.poster_path || item.poster_path,
      seasonNumber, slug: buildSeasonSlug(item.id, seasonNumber),
    };
  });

  // 3. NEWS
  const newsSources = [
    { name: 'Deadline', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://deadline.com/category/film/feed/', sourceSite: 'Deadline', twitter: '@DEADLINE' },
    { name: 'Variety', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://variety.com/c/film/news/feed/', sourceSite: 'Variety', twitter: '@Variety' },
    { name: 'THR', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.hollywoodreporter.com/c/movies/movie-news/feed/', sourceSite: 'THR', twitter: '@THR' },
  ];
  const movieTvKeywords = ['movie', 'film', 'series', 'tv', 'television', 'episode', 'season', 'streaming', 'netflix', 'amazon', 'hbo', 'disney+', 'marvel', 'dc', 'casting', 'premiere', 'release date', 'sequel', 'remake', 'actor', 'director'];
  function isMovieTVNews(title: string, description: string = ''): boolean {
    const text = (title + ' ' + description).toLowerCase();
    return movieTvKeywords.some(k => text.includes(k)) && !['game', 'playstation', 'xbox', 'nintendo'].some(t => text.includes(t));
  }
  const newsPromises = newsSources.map(async (source) => {
    try {
      const response = await fetch(source.url, { next: { revalidate: 3600 } });
      const newsData = await response.json();
      return (newsData.items || []).filter((item: any) => isMovieTVNews(item.title, item.description || '')).slice(0, 3).map((item: any) => ({
        title: item.title, link: item.link, pubDate: item.pubDate,
        thumbnail: item.thumbnail || item.enclosure?.link || '',
        source: source.sourceSite, twitter: source.twitter
      }));
    } catch { return []; }
  });

  // 4. NEWLY ADDED
  const [movieChanges, tvChanges] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/movie/changes?api_key=${apiKey}&page=1`, { next: { revalidate: 1800 } }).then(r => r.json()),
    fetch(`https://api.themoviedb.org/3/tv/changes?api_key=${apiKey}&page=1`, { next: { revalidate: 1800 } }).then(r => r.json()),
  ]);
  const recentlyAddedItems: any[] = [];
  if (movieChanges.results?.length) {
    for (const id of movieChanges.results.slice(0, 10).map((c: any) => c.id)) {
      try {
        const d = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`, { next: { revalidate: 3600 } }).then(r => r.json());
        if (d && !d.status_code && d.poster_path) recentlyAddedItems.push({ id: `movie-${d.id}`, tmdbId: d.id, name: d.title, type: 'movie', releaseDate: d.release_date, poster_path: d.poster_path, slug: buildMovieSlug(d.id), addedAt: new Date().toISOString() });
      } catch {}
    }
  }
  if (tvChanges.results?.length) {
    for (const id of tvChanges.results.slice(0, 10).map((c: any) => c.id)) {
      try {
        const d = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}`, { next: { revalidate: 3600 } }).then(r => r.json());
        if (d && !d.status_code && d.poster_path && d.seasons) {
          recentlyAddedItems.push({ id: `tv-${d.id}`, tmdbId: d.id, name: `${d.name} Season 1`, type: 'tv', releaseDate: d.first_air_date, poster_path: d.poster_path, seasonNumber: 1, slug: buildSeasonSlug(d.id, 1), addedAt: new Date().toISOString() });
        }
      } catch {}
    }
  }
  const [latestMovies, latestTV] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/movie/latest?api_key=${apiKey}`, { next: { revalidate: 3600 } }).then(r => r.json()),
    fetch(`https://api.themoviedb.org/3/tv/latest?api_key=${apiKey}`, { next: { revalidate: 3600 } }).then(r => r.json()),
  ]);
  if (latestMovies?.id && latestMovies.poster_path && !recentlyAddedItems.some(i => i.id === `movie-${latestMovies.id}`))
    recentlyAddedItems.push({ id: `movie-${latestMovies.id}`, tmdbId: latestMovies.id, name: latestMovies.title, type: 'movie', releaseDate: latestMovies.release_date, poster_path: latestMovies.poster_path, slug: buildMovieSlug(latestMovies.id), addedAt: new Date().toISOString() });
  if (latestTV?.id && latestTV.poster_path && latestTV.seasons && !recentlyAddedItems.some(i => i.id === `tv-${latestTV.id}`))
    recentlyAddedItems.push({ id: `tv-${latestTV.id}`, tmdbId: latestTV.id, name: `${latestTV.name} Season 1`, type: 'tv', releaseDate: latestTV.first_air_date, poster_path: latestTV.poster_path, seasonNumber: 1, slug: buildSeasonSlug(latestTV.id, 1), addedAt: new Date().toISOString() });

  const newlyAdded = recentlyAddedItems.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()).slice(0, 6);

  // 5. IN PROGRESS — filmes + séries com status WATCHING (excluindo os que já estão em Airing Now)
  const airingEntryIds = new Set(airingResults.map(e => e.id));
  const inProgressEntries = await prisma.entry.findMany({
    where: {
      status: 'WATCHING',
      NOT: { id: { in: Array.from(airingEntryIds) } }
    },
    orderBy: { updatedAt: 'desc' },
    take: 6,
  });

  const [popularResults, newsResults] = await Promise.all([
    Promise.all(popularPromises), Promise.all(newsPromises),
  ]);
  const uniqueNews = Array.from(new Map(newsResults.flat().map(item => [item.title, item])).values())
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()).slice(0, 8);

  return { airing: airingResults, popular: popularResults, news: uniqueNews, newlyAdded, inProgress: inProgressEntries };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}

async function HomePageContent() {
  const { airing, popular, news, newlyAdded, inProgress } = await getHomeData();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgb(42,39,39)',
      fontFamily: "'Overpass', -apple-system, BlinkMacSystemFont, sans-serif",
      color: 'rgb(220,210,215)',
    }}>
      <style>{`
        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 8px rgba(230,125,153,0.25); }
          50%       { box-shadow: 0 0 22px rgba(230,125,153,0.55); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(230,125,153,0.3); }
          50%       { border-color: rgba(230,125,153,0.7); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.85); }
          70%  { transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* ── Page wrapper ── */
        .hades-home {
          max-width: 1440px;
          margin: 0 auto;
          padding: 28px 28px 60px;
          animation: fadeUp 0.5s ease-out both;
        }

        /* ── Section headers ── */
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
          flex-shrink: 0;
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

        /* ── Cover card (poster) ── */
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
          z-index: 2;
        }
        .cover-card img {
          width: 100%;
          aspect-ratio: 2/3;
          object-fit: cover;
          display: block;
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
          font-size: 11px;
          font-weight: 700;
          color: white;
          line-height: 1.3;
          text-align: center;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.25s ease, transform 0.25s ease;
          background: linear-gradient(transparent, rgba(42,39,39,0.95));
        }
        .cover-card:hover .cover-title { opacity: 1; transform: translateY(0); }

        /* ── Plain label under card (non-overlay style) ── */
        .card-label {
          margin-top: 8px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(220,210,215,0.7);
          line-height: 1.3;
          text-align: center;
          transition: color 0.2s;
        }
        .cover-card:hover + .card-label,
        a:hover .card-label { color: rgb(230,125,153); }

        /* ── Airing card ── */
        .airing-card {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
          display: block;
          text-decoration: none;
          background: rgb(52,49,49);
          border: 1px solid rgba(230,125,153,0.12);
        }
        .airing-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 16px 36px rgba(0,0,0,0.5), 0 0 0 1px rgba(230,125,153,0.4);
          border-color: rgba(230,125,153,0.4);
        }
        .airing-card img {
          width: 100%;
          aspect-ratio: 2/3;
          object-fit: cover;
          display: block;
        }
        .airing-card .airing-info {
          padding: 10px 10px 12px;
        }
        .airing-card .airing-title {
          font-size: 11px;
          font-weight: 700;
          color: rgb(220,210,215);
          margin: 0 0 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .airing-card .airing-ep {
          font-size: 10px;
          color: rgb(230,125,153);
          font-weight: 600;
          margin: 0;
        }
        .airing-card .airing-prod {
          font-size: 10px;
          color: rgba(220,210,215,0.4);
          margin: 0;
        }
        /* Pulse dot for airing */
        .live-dot {
          display: inline-block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #2ecc71;
          box-shadow: 0 0 0 2px rgba(46,204,113,0.3);
          animation: glow-pulse 2s infinite;
          margin-right: 5px;
          vertical-align: middle;
        }

        /* ── In Progress badge ── */
        .progress-badge {
          display: inline-block;
          padding: 1px 6px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: rgba(230,125,153,0.15);
          color: rgb(230,125,153);
          border: 1px solid rgba(230,125,153,0.25);
        }
        .progress-ep {
          font-size: 10px;
          color: rgba(220,210,215,0.55);
          margin: 3px 0 0;
          font-weight: 600;
        }
        .progress-bar-track {
          height: 3px;
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
          margin-top: 6px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(to right, rgb(230,125,153), rgba(230,125,153,0.5));
          border-radius: 4px;
        }

        /* ── News cards ── */
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

        /* ── Sidebar panels ── */
        .side-panel {
          background: rgb(50,47,47);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
          margin-bottom: 20px;
        }
        .side-panel-header {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(230,125,153,0.08);
        }
        .side-panel-header-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgb(230,125,153);
          box-shadow: 0 0 8px rgba(230,125,153,0.6);
          animation: glow-pulse 2.5s infinite;
          flex-shrink: 0;
        }
        .side-panel-header-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgb(230,125,153);
          margin: 0;
        }
        .side-panel-body { padding: 14px; }

        /* ── Airing list item (sidebar text style) ── */
        .airing-list-item {
          display: block;
          padding: 10px 12px;
          border-radius: 8px;
          margin-bottom: 6px;
          background: rgb(58,55,55);
          border: 1px solid rgba(255,255,255,0.04);
          transition: background 0.2s, border-color 0.2s, transform 0.18s;
          text-decoration: none;
        }
        .airing-list-item:hover {
          background: rgb(68,64,64);
          border-color: rgba(230,125,153,0.35);
          transform: translateX(3px);
        }
        .airing-list-title {
          font-size: 12px; font-weight: 700; color: rgb(220,210,215); margin: 0 0 3px;
        }
        .airing-list-sub {
          font-size: 10px; color: rgb(230,125,153); margin: 0; font-weight: 600;
        }
        .airing-list-sub-muted {
          font-size: 10px; color: rgba(220,210,215,0.38); margin: 0;
        }

        /* ── Divider with glow ── */
        .glow-divider {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(230,125,153,0.35), transparent);
          margin: 28px 0;
          border: none;
        }

        /* ── Decorative grain overlay (purely visual) ── */
        .grain-overlay {
          position: fixed; inset: 0; pointer-events: none; z-index: 1000;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 180px 180px;
        }

        /* ── Stagger animation for grids ── */
        .stagger > *:nth-child(1) { animation: popIn 0.4s 0.05s ease both; }
        .stagger > *:nth-child(2) { animation: popIn 0.4s 0.10s ease both; }
        .stagger > *:nth-child(3) { animation: popIn 0.4s 0.15s ease both; }
        .stagger > *:nth-child(4) { animation: popIn 0.4s 0.20s ease both; }
        .stagger > *:nth-child(5) { animation: popIn 0.4s 0.25s ease both; }
        .stagger > *:nth-child(6) { animation: popIn 0.4s 0.30s ease both; }
        .stagger > *:nth-child(7) { animation: popIn 0.4s 0.35s ease both; }
        .stagger > *:nth-child(8) { animation: popIn 0.4s 0.40s ease both; }

        /* ── Scrollbar ── */
        * { scrollbar-color: rgba(230,125,153,0.4) rgba(58,55,55,0.5); scrollbar-width: thin; }

        /* ── News stagger delay ── */
        .news-card:nth-child(1) { animation-delay: 0.05s; }
        .news-card:nth-child(2) { animation-delay: 0.12s; }
        .news-card:nth-child(3) { animation-delay: 0.19s; }
        .news-card:nth-child(4) { animation-delay: 0.26s; }
        .news-card:nth-child(5) { animation-delay: 0.33s; }
        .news-card:nth-child(6) { animation-delay: 0.40s; }
        .news-card:nth-child(7) { animation-delay: 0.47s; }
        .news-card:nth-child(8) { animation-delay: 0.54s; }
      `}</style>

      {/* Subtle grain texture overlay */}
      <div className="grain-overlay" />

      <div className="hades-home">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 304px', gap: '36px', alignItems: 'flex-start' }}>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA ESQUERDA
          ══════════════════════════════════════════════════════════════ */}
          <div>

            {/* ── POPULAR SEASONS ─────────────────────────────────────── */}
            <section style={{ marginBottom: '44px' }}>
              <div className="section-head">
                <div className="section-head-bar" />
                <h2 className="section-head-title">Popular Seasons</h2>
                <div className="section-head-line" />
                <span className="section-head-count">{popular.length} titles</span>
              </div>

              <div className="stagger" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '20px',
              }}>
                {popular.map((item: any) => (
                  <Link key={item.id} href={`/titles/${item.slug}`} className="cover-card" style={{ display: 'block', textDecoration: 'none' }}>
                    <img
                      src={`https://image.tmdb.org/t/p/w300${item.poster}`}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="cover-overlay" />
                    <div className="cover-title">{item.name}</div>
                  </Link>
                ))}
              </div>
            </section>

            <hr className="glow-divider" />

            {/* ── FILMS & SERIES NEWS ──────────────────────────────────── */}
            <section>
              <div className="section-head">
                <div className="section-head-bar" />
                <h2 className="section-head-title">Films &amp; Series News</h2>
                <div className="section-head-line" />
                <span className="section-head-count">{news.length} articles</span>
              </div>

              <div>
                {news.length > 0 ? (
                  news.map((article: any, i: number) => (
                    <a
                      key={i}
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="news-card"
                    >
                      {article.thumbnail && (
                        <img src={article.thumbnail} className="news-thumb" alt="news" loading="lazy" decoding="async" />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span className="news-source-badge">{article.source || 'News'}</span>
                          {article.twitter && (
                            <span style={{ fontSize: '9px', color: 'rgba(220,210,215,0.35)', fontWeight: '600' }}>{article.twitter}</span>
                          )}
                        </div>
                        <p style={{
                          margin: '0 0 5px', fontSize: '13px', fontWeight: '600',
                          color: 'rgb(220,210,215)', lineHeight: '1.4',
                          overflow: 'hidden', display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>
                          {article.title}
                        </p>
                        <p style={{ margin: 0, fontSize: '10px', color: 'rgba(220,210,215,0.4)' }}>
                          {article.pubDate ? new Date(article.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                        </p>
                      </div>
                    </a>
                  ))
                ) : (
                  <div style={{ background: 'rgb(52,49,49)', borderRadius: '10px', padding: '28px', textAlign: 'center', color: 'rgba(220,210,215,0.35)', fontSize: '13px' }}>
                    Loading latest film &amp; series news...
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA DIREITA
          ══════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

            {/* ── AIRING NOW ──────────────────────────────────────────── */}
            <div className="side-panel">
              <div className="side-panel-header">
                <div className="side-panel-header-dot" style={{ background: '#2ecc71', boxShadow: '0 0 8px rgba(46,204,113,0.6)' }} />
                <h3 className="side-panel-header-title" style={{ color: '#2ecc71' }}>Airing Now</h3>
              </div>

              {airing.length > 0 ? (
                <div className="stagger" style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {airing.map((e: any) => {
                    const slug = e.parentTmdbId && e.seasonNumber
                      ? `tv-${e.parentTmdbId}-s${e.seasonNumber}`
                      : `movie-${e.tmdbId}`;
                    const hasNext = !!e.nextEpisode;
                    return (
                      <Link key={e.id} href={`/titles/${slug}`} className="airing-card">
                        {e.imagePath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w300${e.imagePath}`}
                            alt={e.title}
                            loading="lazy"
                            decoding="async"
                            style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <div style={{ aspectRatio: '2/3', background: 'rgb(62,58,58)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>📺</div>
                        )}
                        <div className="airing-info">
                          <p className="airing-title">{e.title}</p>
                          {hasNext ? (
                            <p className="airing-ep">
                              <span className="live-dot" />
                              Ep {e.nextEpisode.episode_number} • {new Date(e.nextEpisode.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          ) : (
                            <p className="airing-prod">{e.inProduction ? 'In production' : 'Season ended'}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: '12px', color: 'rgba(220,210,215,0.35)', lineHeight: '1.6' }}>
                  No series currently airing.<br />
                  <span style={{ color: '#3db4f2', fontWeight: '700' }}>Add a series</span> to Watching to track new episodes.
                </div>
              )}
            </div>

            {/* ── IN PROGRESS ─────────────────────────────────────────── */}
            <div className="side-panel">
              <div className="side-panel-header">
                <div className="side-panel-header-dot" style={{ background: 'rgb(230,125,153)', boxShadow: '0 0 8px rgba(230,125,153,0.6)' }} />
                <h3 className="side-panel-header-title">In Progress</h3>
              </div>

              {inProgress.length > 0 ? (
                <div className="stagger" style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {inProgress.map((e: any) => {
                    const isMovie = e.type === 'MOVIE';
                    const slug = isMovie
                      ? `movie-${e.tmdbId}`
                      : `tv-${e.parentTmdbId}-s${e.seasonNumber ?? 1}`;

                    const progressLabel = !isMovie && e.progress != null && e.totalEpisodes
                      ? `Ep ${e.progress}/${e.totalEpisodes}`
                      : null;

                    return (
                      <Link key={e.id} href={`/titles/${slug}`} className="airing-card">
                        {e.imagePath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w300${e.imagePath}`}
                            alt={e.title}
                            loading="lazy"
                            decoding="async"
                            style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <div style={{ aspectRatio: '2/3', background: 'rgb(62,58,58)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                            {isMovie ? '🎬' : '📺'}
                          </div>
                        )}
                        <div className="airing-info">
                          <p className="airing-title">{e.title}</p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                            <span className="progress-badge">{isMovie ? '🎬 Film' : '📺 Series'}</span>
                            {progressLabel && (
                              <span className="progress-ep">{progressLabel}</span>
                            )}
                          </div>
                          {isMovie && (
                            <div className="progress-bar-track">
                              <div className="progress-bar-fill" style={{ width: '40%' }} />
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: '12px', color: 'rgba(220,210,215,0.35)', lineHeight: '1.6' }}>
                  No titles in progress.<br />
                  <span style={{ color: 'rgb(230,125,153)', fontWeight: '700' }}>Start watching</span> something to see it here.
                </div>
              )}
            </div>

            {/* ── NEWLY ADDED ─────────────────────────────────────────── */}
            <div className="side-panel">
              <div className="side-panel-header">
                <div className="side-panel-header-dot" />
                <h3 className="side-panel-header-title">Newly Added</h3>
              </div>

              <div className="stagger" style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {newlyAdded.length > 0 ? (
                  newlyAdded.map((item: any) => (
                    <Link key={item.id} href={`/titles/${item.slug}`} className="cover-card">
                      <img
                        src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="cover-overlay" />
                      <div className="cover-title">{item.name}</div>
                    </Link>
                  ))
                ) : (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', fontSize: '12px', color: 'rgba(220,210,215,0.35)' }}>
                    Loading newly added titles...
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* fim coluna direita */}
        </div>
      </div>
    </div>
  );
}