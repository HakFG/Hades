'use client';

interface GenreGridProps {
  genres: { id: number; name: string }[];
  selectedGenre: string;
  onGenreSelect: (genreId: string) => void;
}

export default function GenreGrid({ genres, selectedGenre, onGenreSelect }: GenreGridProps) {
  if (!genres.length) return null;

  return (
    <div className="genre-grid" aria-label="Genre quick filters">
      {genres.slice(0, 18).map((genre) => {
        const value = String(genre.id);
        const active = selectedGenre === value;
        return (
          <button
            key={genre.id}
            type="button"
            className={active ? 'active' : ''}
            onClick={() => onGenreSelect(active ? '' : value)}
          >
            {genre.name}
          </button>
        );
      })}

      <style jsx>{`
        @keyframes genreRailIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .genre-grid {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 2px 0 4px;
          scrollbar-width: thin;
          animation: genreRailIn 0.24s ease both;
        }

        button {
          flex: 0 0 auto;
          min-height: 30px;
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(58, 55, 55, 0.62);
          color: rgba(220, 210, 215, 0.72);
          font: inherit;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }

        button:hover,
        button.active {
          border-color: rgba(230, 125, 153, 0.46);
          background: rgba(230, 125, 153, 0.14);
          color: rgb(232, 226, 223);
          transform: translateY(-1px);
        }

        @media (prefers-reduced-motion: reduce) {
          .genre-grid,
          button {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
