import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';
import Link from 'next/link';

// Componente de Skeleton Loading
function HomePageSkeleton() {
  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '20px', 
      backgroundColor: '#f0f2f5', 
      minHeight: '100vh',
      fontFamily: 'Overpass, -apple-system, BlinkMacSystemFont, Segoe UI, Oxygen, Ubuntu, Cantarell, sans-serif'
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px' }}>
        <div>
          <div style={{ marginBottom: '40px' }}>
            <div style={{ height: '20px', width: '150px', backgroundColor: '#e0e4e8', borderRadius: '4px', marginBottom: '15px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '20px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div style={{ aspectRatio: '2/3', backgroundColor: '#e0e4e8', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ height: '12px', width: '80%', backgroundColor: '#e0e4e8', marginTop: '8px', marginLeft: 'auto', marginRight: 'auto', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ height: '20px', width: '180px', backgroundColor: '#e0e4e8', borderRadius: '4px', marginBottom: '15px' }} />
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '15px', backgroundColor: 'white', padding: '12px', borderRadius: '4px' }}>
                <div style={{ width: '80px', height: '50px', backgroundColor: '#e0e4e8', borderRadius: '3px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: '16px', backgroundColor: '#e0e4e8', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ height: '12px', width: '60%', backgroundColor: '#e0e4e8', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ backgroundColor: 'white', borderRadius: '4px', padding: '12px', marginBottom: '30px' }}>
            <div style={{ height: '16px', width: '100px', backgroundColor: '#e0e4e8', borderRadius: '4px', marginBottom: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ height: '14px', width: '70%', backgroundColor: '#e0e4e8', borderRadius: '4px', marginBottom: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: '10px', width: '50%', backgroundColor: '#e0e4e8', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '4px', padding: '12px' }}>
            <div style={{ height: '16px', width: '100px', backgroundColor: '#e0e4e8', borderRadius: '4px', marginBottom: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div style={{ aspectRatio: '2/3', backgroundColor: '#e0e4e8', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ height: '10px', width: '80%', backgroundColor: '#e0e4e8', marginTop: '6px', marginLeft: 'auto', marginRight: 'auto', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers para construir slugs ─────────────────────────────────────────────

function getOrdinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

function buildSeasonSlug(showId: number, seasonNumber: number): string {
  return `tv-${showId}-s${seasonNumber}`;
}

function buildMovieSlug(movieId: number): string {
  return `movie-${movieId}`;
}

async function getHomeData() {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  // 1. AIRING: Séries que você está assistindo
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
    return {
      ...entry,
      nextEpisode: data?.next_episode_to_air ?? null,
      inProduction: data?.in_production ?? false,
    };
  });

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
      id: item.id,
      showId: item.id,
      name: `${item.name}${lastSeason && seasonNumber > 1 ? ' ' + getOrdinal(seasonNumber) + ' Season' : ''}`,
      poster: lastSeason?.poster_path || item.poster_path,
      seasonNumber: seasonNumber,
      slug: buildSeasonSlug(item.id, seasonNumber),
    };
  });

  // 3. NEWS
  const newsSources = [
    { name: 'Deadline', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://deadline.com/category/film/feed/', sourceSite: 'Deadline', twitter: '@DEADLINE' },
    { name: 'Variety', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://variety.com/c/film/news/feed/', sourceSite: 'Variety', twitter: '@Variety' },
    { name: 'THR', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.hollywoodreporter.com/c/movies/movie-news/feed/', sourceSite: 'THR', twitter: '@THR' },
  ];
  
  const movieTvKeywords = [
    'movie', 'film', 'series', 'tv', 'television', 'episode', 'season',
    'streaming', 'netflix', 'amazon', 'hbo', 'disney+', 'marvel', 'dc',
    'casting', 'premiere', 'release date', 'sequel', 'remake', 'actor', 'director'
  ];
  
  function isMovieTVNews(title: string, description: string = ''): boolean {
    const text = (title + ' ' + description).toLowerCase();
    const isRelevant = movieTvKeywords.some(keyword => text.includes(keyword.toLowerCase()));
    const excludeTerms = ['game', 'playstation', 'xbox', 'nintendo'];
    const isExcluded = excludeTerms.some(term => text.includes(term));
    return isRelevant && !isExcluded;
  }
  
  const newsPromises = newsSources.map(async (source) => {
    try {
      const response = await fetch(source.url, { next: { revalidate: 3600 } });
      const newsData = await response.json();
      const items = newsData.items || [];
      
      return items
        .filter((item: any) => isMovieTVNews(item.title, item.description || ''))
        .slice(0, 3)
        .map((item: any) => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          thumbnail: item.thumbnail || item.enclosure?.link || '',
          source: source.sourceSite,
          twitter: source.twitter
        }));
    } catch (error) {
      console.error(`Error fetching news from ${source.name}:`, error);
      return [];
    }
  });

  // 4. NEWLY ADDED - RESTAURADO! Busca os 6 últimos títulos adicionados ao TMDb
  const [movieChanges, tvChanges] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/movie/changes?api_key=${apiKey}&page=1`, { next: { revalidate: 1800 } }).then(r => r.json()),
    fetch(`https://api.themoviedb.org/3/tv/changes?api_key=${apiKey}&page=1`, { next: { revalidate: 1800 } }).then(r => r.json()),
  ]);
  
  const recentlyAddedItems = [];
  
  // Buscar filmes recentemente adicionados
  if (movieChanges.results && movieChanges.results.length > 0) {
    const recentMovieIds = movieChanges.results.slice(0, 10).map((change: any) => change.id);
    for (const id of recentMovieIds) {
      try {
        const movieDetail = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`,
          { next: { revalidate: 3600 } }
        ).then(r => r.json());
        
        if (movieDetail && !movieDetail.status_code && movieDetail.poster_path) {
          recentlyAddedItems.push({
            id: `movie-${movieDetail.id}`,
            tmdbId: movieDetail.id,
            name: movieDetail.title,
            type: 'movie',
            releaseDate: movieDetail.release_date,
            poster_path: movieDetail.poster_path,
            slug: buildMovieSlug(movieDetail.id),
            addedAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Error fetching movie detail:', e);
      }
    }
  }
  
  // Buscar séries recentemente adicionadas
  if (tvChanges.results && tvChanges.results.length > 0) {
    const recentTVIds = tvChanges.results.slice(0, 10).map((change: any) => change.id);
    for (const id of recentTVIds) {
      try {
        const tvDetail = await fetch(
          `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}`,
          { next: { revalidate: 3600 } }
        ).then(r => r.json());
        
        if (tvDetail && !tvDetail.status_code && tvDetail.poster_path && tvDetail.seasons) {
          const firstSeason = tvDetail.seasons.find((s: any) => s.season_number === 1);
          const seasonSuffix = firstSeason ? ' Season 1' : '';
          
          recentlyAddedItems.push({
            id: `tv-${tvDetail.id}`,
            tmdbId: tvDetail.id,
            name: `${tvDetail.name}${seasonSuffix}`,
            type: 'tv',
            releaseDate: tvDetail.first_air_date,
            poster_path: tvDetail.poster_path,
            seasonNumber: 1,
            slug: buildSeasonSlug(tvDetail.id, 1),
            addedAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Error fetching TV detail:', e);
      }
    }
  }
  
  // Também buscar os "latest" de cada categoria
  const [latestMovies, latestTV] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/movie/latest?api_key=${apiKey}`, { next: { revalidate: 3600 } }).then(r => r.json()),
    fetch(`https://api.themoviedb.org/3/tv/latest?api_key=${apiKey}`, { next: { revalidate: 3600 } }).then(r => r.json()),
  ]);
  
  if (latestMovies && latestMovies.id && latestMovies.poster_path) {
    if (!recentlyAddedItems.some(item => item.id === `movie-${latestMovies.id}`)) {
      recentlyAddedItems.push({
        id: `movie-${latestMovies.id}`,
        tmdbId: latestMovies.id,
        name: latestMovies.title,
        type: 'movie',
        releaseDate: latestMovies.release_date,
        poster_path: latestMovies.poster_path,
        slug: buildMovieSlug(latestMovies.id),
        addedAt: new Date().toISOString()
      });
    }
  }
  
  if (latestTV && latestTV.id && latestTV.poster_path && latestTV.seasons) {
    if (!recentlyAddedItems.some(item => item.id === `tv-${latestTV.id}`)) {
      const firstSeason = latestTV.seasons.find((s: any) => s.season_number === 1);
      const seasonSuffix = firstSeason ? ' Season 1' : '';
      recentlyAddedItems.push({
        id: `tv-${latestTV.id}`,
        tmdbId: latestTV.id,
        name: `${latestTV.name}${seasonSuffix}`,
        type: 'tv',
        releaseDate: latestTV.first_air_date,
        poster_path: latestTV.poster_path,
        seasonNumber: 1,
        slug: buildSeasonSlug(latestTV.id, 1),
        addedAt: new Date().toISOString()
      });
    }
  }
  
  // Ordenar por data de adição e pegar os 6 primeiros
  const newlyAdded = recentlyAddedItems
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 6);
  
  // Executar todas as promises em PARALELO
  const [airingResults, popularResults, newsResults] = await Promise.all([
    Promise.all(airingPromises),
    Promise.all(popularPromises),
    Promise.all(newsPromises),
  ]);

  const uniqueNews = Array.from(
    new Map(newsResults.flat().map(item => [item.title, item])).values()
  ).sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
  .slice(0, 8);

  return {
    airing: airingResults,
    popular: popularResults,
    news: uniqueNews,
    newlyAdded: newlyAdded
  };
}

// Componente principal com Skeleton
export default async function HomePage() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}

// Conteúdo real da página
async function HomePageContent() {
  const { airing, popular, news, newlyAdded } = await getHomeData();

  const coverStyle: React.CSSProperties = {
    background: 'rgba(40, 45, 52, 0.8)',
    borderRadius: '4px',
    boxShadow: '0 14px 30px rgba(103, 132, 187, 0.15), 0 4px 4px rgba(103, 132, 187, 0.05)',
    cursor: 'pointer',
    width: '100%',
    height: 'auto',
    aspectRatio: '2/3',
    objectFit: 'cover',
    display: 'block'
  };

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '20px', 
      backgroundColor: '#f0f2f5', 
      minHeight: '100vh',
      fontFamily: 'Overpass, -apple-system, BlinkMacSystemFont, Segoe UI, Oxygen, Ubuntu, Cantarell, sans-serif'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .card-hover:hover {
          transform: scale(1.03);
          transition: transform 0.2s ease;
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px' }} className="fade-in">
        
        {/* COLUNA ESQUERDA: POPULAR SEASONS E NEWS */}
        <div>
          <section>
            <h2 style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              marginBottom: '15px', 
              color: '#647380', 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              borderLeft: '3px solid #3db4f2',
              paddingLeft: '10px'
            }}>
              POPULAR SEASONS
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
              gap: '20px',
              marginBottom: '40px'
            }}>
              {popular.map((item: any) => (
                <Link key={item.id} href={`/titles/${item.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="card-hover">
                    <img
                      src={`https://image.tmdb.org/t/p/w300${item.poster}`}
                      style={coverStyle}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                    />
                    <p style={{ 
                      marginTop: '8px', 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#516170',
                      lineHeight: '1.4',
                      textAlign: 'center'
                    }}>
                      {item.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              marginBottom: '15px', 
              color: '#647380', 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              borderLeft: '3px solid #3db4f2',
              paddingLeft: '10px'
            }}>
              FILMS & SERIES NEWS
            </h2>
            <div style={{ marginTop: '10px' }}>
              {news.length > 0 ? (
                news.map((article: any, i: number) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    marginBottom: '15px', 
                    backgroundColor: 'white', 
                    padding: '12px', 
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    cursor: 'pointer'
                  }}>
                    {article.thumbnail && (
                      <img
                        src={article.thumbnail}
                        style={{
                          width: '80px',
                          height: '50px',
                          objectFit: 'cover',
                          borderRadius: '3px'
                        }}
                        alt="news"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <a 
                        href={article.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                          textDecoration: 'none', 
                          color: '#3db4f2', 
                          fontSize: '13px', 
                          fontWeight: 'bold',
                          lineHeight: '1.4'
                        }}>
                        {article.title.length > 80 ? article.title.substring(0, 80) + '...' : article.title}
                      </a>
                      <p style={{ 
                        fontSize: '10px', 
                        color: '#92a0ad', 
                        marginTop: '5px' 
                      }}>
                        {article.source || 'Film/TV News'} • {article.pubDate ? new Date(article.pubDate).toLocaleDateString() : 'Recent'}
                        {article.twitter && (
                          <span style={{ marginLeft: '8px', color: '#1DA1F2' }}>
                            📱 {article.twitter}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ background: 'white', padding: '20px', borderRadius: '4px', textAlign: 'center', color: '#777' }}>
                  <p style={{ fontSize: '12px' }}>Loading latest film & series news...</p>
                </div>
              )}
            </div>
          </section>
        </div>

{/* COLUNA DIREITA: AIRING E NEWLY ADDED */}
<div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
  
  <section style={{ 
    backgroundColor: 'white', 
    borderRadius: '4px', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden'
  }}>
    <h3 style={{ 
      padding: '12px 15px', 
      margin: 0, 
      fontSize: '12px', 
      fontWeight: 'bold',
      backgroundColor: '#3db4f2', 
      color: 'white',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      AIRING NOW
    </h3>
    <div style={{ padding: '12px' }}>
      {airing.length > 0 ? (
        airing.map((e: any) => {
          // Construir o slug corretamente
          let slug = '';
          if (e.parentTmdbId && e.seasonNumber) {
            slug = `tv-${e.parentTmdbId}-s${e.seasonNumber}`;
          } else {
            slug = `movie-${e.tmdbId}`;
          }
          
          return (
            <Link 
              key={e.id} 
              href={`/titles/${slug}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{ 
                marginBottom: '12px', 
                borderBottom: '1px solid #edf1f5', 
                paddingBottom: '10px',
                transition: 'background 0.2s, transform 0.2s',
              }}
              className="airing-item"
              >
                <p style={{ 
                  margin: 0, 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  color: '#516170' 
                }}>
                  {e.title}
                </p>
                {e.nextEpisode ? (
                  <p style={{ 
                    margin: '4px 0 0', 
                    fontSize: '10px', 
                    color: '#3db4f2' 
                  }}>
                    Episode {e.nextEpisode.episode_number} • {new Date(e.nextEpisode.air_date).toLocaleDateString()}
                  </p>
                ) : (
                  <p style={{ 
                    margin: '4px 0 0', 
                    fontSize: '10px', 
                    color: '#92a0ad' 
                  }}>
                    {e.inProduction ? 'Currently in Production' : 'Season Completed'}
                  </p>
                )}
              </div>
            </Link>
          );
        })
      ) : (
        <p style={{ fontSize: '11px', color: '#92a0ad', textAlign: 'center', padding: '10px' }}>
          Add series to "Watching" to track episodes.
        </p>
      )}
    </div>
  </section>

  {/* NEWLY ADDED Section */}
  <section style={{ 
    backgroundColor: 'white', 
    borderRadius: '4px', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden'
  }}>
    <h3 style={{ 
      padding: '12px 15px', 
      margin: 0, 
      fontSize: '12px', 
      fontWeight: 'bold',
      backgroundColor: '#2b2d42', 
      color: 'white',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      NEWLY ADDED
    </h3>
    <div style={{ padding: '15px' }}>
      {newlyAdded.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '12px'
        }}>
          {newlyAdded.map((item: any) => (
            <Link key={item.id} href={`/titles/${item.slug}`} style={{ textDecoration: 'none' }}>
              <div className="card-hover">
                <img
                  src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                  style={coverStyle}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                />
                <p style={{ 
                  marginTop: '8px', 
                  fontSize: '11px', 
                  fontWeight: '600', 
                  color: '#516170',
                  lineHeight: '1.3',
                  textAlign: 'center'
                }}>
                  {item.name.length > 30 ? item.name.substring(0, 27) + '...' : item.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '11px', color: '#92a0ad', textAlign: 'center', padding: '10px' }}>
          Loading newly added titles...
        </p>
      )}
    </div>
  </section>
</div>
      </div>
    </div>
  );
}
