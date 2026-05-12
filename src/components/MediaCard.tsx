 'use client';

import Link from 'next/link';
import StatusBubble from '@/components/StatusBubble';
import type { BrowserMediaItem } from '@/lib/browser-filter';

interface MediaCardProps {
  item: BrowserMediaItem;
  href?: string;
  showStatus?: boolean;
}

export default function MediaCard({ item, href, showStatus = true }: MediaCardProps) {
  const target = href ?? `/titles/${item.linkSlug}`;
  const poster = item.posterPath ? `https://image.tmdb.org/t/p/w300${item.posterPath}` : '';

  return (
    <Link href={target} className="media-card">
      <div className="poster">
        {showStatus && (
          <StatusBubble
            status={item.productionStatus}
            mediaType={item.type === 'MOVIE' ? 'movie' : 'tv'}
            size="md"
          />
        )}
        {poster ? <img src={poster} alt={item.title} loading="lazy" /> : <div className="placeholder" />}
        <div className="overlay">
          <strong>{item.productionStatus}</strong>
          {item.releaseDate && <span>{item.releaseDate.split('-')[0]}</span>}
        </div>
      </div>
      <p>{item.title}</p>

      <style jsx>{`
        .media-card {
          display: block;
          min-width: 0;
          text-decoration: none;
          color: rgb(220, 210, 215);
        }

        .poster {
          position: relative;
          aspect-ratio: 2 / 3;
          overflow: hidden;
          border-radius: 8px;
          background: rgb(58, 55, 55);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        img,
        .placeholder {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.22s ease;
        }

        .placeholder {
          background: linear-gradient(135deg, rgb(58, 55, 55), rgb(42, 39, 39));
        }

        .media-card:hover img {
          transform: scale(1.045);
        }

        .overlay {
          position: absolute;
          inset: auto 0 0;
          display: grid;
          gap: 3px;
          padding: 34px 10px 10px;
          background: linear-gradient(transparent, rgba(20, 18, 18, 0.92));
          opacity: 0;
          transition: opacity 0.18s ease;
        }

        .media-card:hover .overlay {
          opacity: 1;
        }

        strong {
          font-size: 11px;
          color: rgb(232, 226, 223);
        }

        span {
          font-size: 10px;
          color: rgba(220, 210, 215, 0.62);
        }

        p {
          margin: 8px 0 0;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.25;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </Link>
  );
}
