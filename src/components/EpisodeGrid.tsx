'use client';

interface EpisodeGridItem {
  id: string;
  episodeNumber: number;
  title: string;
  airDate?: string | null;
  runtime?: number | null;
  watched: boolean;
}

interface EpisodeGridProps {
  episodes: EpisodeGridItem[];
  onToggleEpisode?: (episode: EpisodeGridItem) => void;
}

export default function EpisodeGrid({ episodes, onToggleEpisode }: EpisodeGridProps) {
  if (episodes.length === 0) return null;

  return (
    <div className="episode-grid">
      {episodes.map((episode) => (
        <button
          key={episode.id}
          type="button"
          className={episode.watched ? 'watched' : ''}
          onClick={() => onToggleEpisode?.(episode)}
          title={episode.title}
        >
          <strong>{episode.episodeNumber}</strong>
          <span>{episode.title}</span>
        </button>
      ))}

      <style jsx>{`
        .episode-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
          gap: 8px;
        }

        button {
          min-height: 64px;
          padding: 8px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgb(50, 47, 47);
          color: rgba(220, 210, 215, 0.72);
          cursor: pointer;
          font: inherit;
          text-align: left;
          overflow: hidden;
        }

        button:hover,
        button.watched {
          border-color: rgba(46, 204, 113, 0.42);
          background: rgba(46, 204, 113, 0.13);
          color: rgb(232, 226, 223);
        }

        strong {
          display: block;
          font-size: 13px;
          margin-bottom: 4px;
        }

        span {
          display: -webkit-box;
          overflow: hidden;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          font-size: 10px;
          line-height: 1.25;
        }
      `}</style>
    </div>
  );
}
