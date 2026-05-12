import Link from 'next/link';
import MediaCard from '@/components/MediaCard';
import { getBrowserHomeSections, type BrowserMediaItem } from '@/lib/browser-filter';

export const revalidate = 3600;

const SECTIONS: Array<{
  key: keyof Awaited<ReturnType<typeof getBrowserHomeSections>>;
  title: string;
  href: string;
}> = [
  { key: 'trendingMovies', title: 'Trending Movies', href: '/browser/trending-movies?type=movie&filter=All' },
  { key: 'popularMovies', title: 'Popular Movies', href: '/browser/popular-movies?type=movie&filter=All' },
  { key: 'trendingTv', title: 'Trending Series', href: '/browser/trending-tv?type=tv&filter=All' },
  { key: 'upcomingMovies', title: 'Upcoming Movies', href: '/browser/upcoming-movies?type=movie&filter=In%20Production,Post%20Production,Planned' },
  { key: 'popularTv', title: 'Popular Series', href: '/browser/popular-tv?type=tv&filter=All' },
];

function Section({ title, href, items }: { title: string; href: string; items: BrowserMediaItem[] }) {
  return (
    <section className="browser-section">
      <div className="section-header">
        <h2>{title}</h2>
        <Link href={href}>View all</Link>
      </div>
      <div className="media-grid">
        {items.slice(0, 10).map((item) => (
          <MediaCard key={item.id} item={item} href={href} showStatus />
        ))}
      </div>
    </section>
  );
}

export default async function BrowserPage() {
  const sections = await getBrowserHomeSections();

  return (
    <main className="browser-page">
      <header>
        <h1>Browse</h1>
        <p>Trending, popular and upcoming titles with production status filters.</p>
      </header>

      {SECTIONS.map((section) => (
        <Section
          key={section.key}
          title={section.title}
          href={section.href}
          items={sections[section.key]}
        />
      ))}

      <style>{`
        .browser-page {
          max-width: 1320px;
          min-height: 100vh;
          margin: 0 auto;
          padding: 32px 24px 72px;
          color: rgb(220, 210, 215);
          background: rgb(42, 39, 39);
          font-family: 'Overpass', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        header {
          display: grid;
          gap: 6px;
          margin-bottom: 32px;
        }

        h1 {
          margin: 0;
          color: rgb(232, 226, 223);
          font-size: 30px;
          letter-spacing: 0;
        }

        p {
          margin: 0;
          color: rgba(220, 210, 215, 0.54);
          font-size: 14px;
        }

        .browser-section {
          margin-bottom: 42px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 10px;
        }

        h2 {
          margin: 0;
          color: rgb(230, 125, 153);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        a {
          color: rgba(220, 210, 215, 0.68);
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }

        a:hover {
          color: rgb(230, 125, 153);
        }

        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(138px, 1fr));
          gap: 18px;
        }

        @media (max-width: 720px) {
          .browser-page {
            padding: 24px 16px 56px;
          }

          .media-grid {
            grid-template-columns: repeat(auto-fill, minmax(116px, 1fr));
            gap: 14px;
          }
        }
      `}</style>
    </main>
  );
}

