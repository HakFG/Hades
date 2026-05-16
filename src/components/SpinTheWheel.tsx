'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface PlanningItem {
  id: string;
  tmdbId: number;
  type: string;
  title: string;
  imagePath: string | null;
  synopsis: string | null;
  slug: string;
}

interface SpinTheWheelProps {
  items: PlanningItem[];
}

export default function SpinTheWheel({ items }: SpinTheWheelProps) {
  const [selected, setSelected] = useState<PlanningItem | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [shufflingTitle, setShufflingTitle] = useState<string>('');

  const spin = () => {
    if (items.length === 0 || isSpinning) return;
    setIsSpinning(true);
    setSelected(null);

    // Efeito de roleta rápida
    let iterations = 0;
    const maxIterations = 20;
    const interval = setInterval(() => {
      const rand = items[Math.floor(Math.random() * items.length)];
      setShufflingTitle(rand.title);
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        const finalItem = items[Math.floor(Math.random() * items.length)];
        setSelected(finalItem);
        setIsSpinning(false);
      }
    }, 60); // 60ms per tick
  };

  const poster = selected?.imagePath
    ? selected.imagePath.startsWith('http')
      ? selected.imagePath
      : `https://image.tmdb.org/t/p/w300${selected.imagePath}`
    : '';

  return (
    <div className="side-panel spin-panel">
      <div className="side-panel-header spin-header">
        <div className="side-panel-header-dot" style={{ background: '#9b59b6', boxShadow: '0 0 10px rgba(155,89,182,0.8)' }} />
        <h3 className="side-panel-header-title" style={{ color: '#9b59b6', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Destiny's Wheel</span>
          <span className="sparkle">✨</span>
        </h3>
      </div>
      
      <div className="spin-body">
        {!selected && !isSpinning && (
          <div className="intro">
            <p>Can't decide what to watch next?</p>
            <p className="sub">Let the fates choose from your {items.length} planned titles.</p>
          </div>
        )}

        <div className="wheel-container">
          {isSpinning && (
            <div className="shuffling-text">
              {shufflingTitle}
            </div>
          )}
          
          {selected && !isSpinning && (
            <Link href={`/titles/${selected.slug}`} className="result-card">
              <div className="poster-wrapper">
                {poster ? (
                  <img src={poster} alt={selected.title} />
                ) : (
                  <div className="placeholder">{selected.type === 'MOVIE' ? '🎬' : '📺'}</div>
                )}
                <div className="poster-glow" />
              </div>
              <div className="result-info">
                <h4>{selected.title}</h4>
                <p>{selected.synopsis || 'No overview available.'}</p>
                <span className="action-hint">Click to open</span>
              </div>
            </Link>
          )}
        </div>

        <button 
          className={`spin-btn ${isSpinning ? 'spinning' : ''}`} 
          onClick={spin}
          disabled={items.length === 0 || isSpinning}
        >
          {isSpinning ? 'Consulting the Fates...' : (selected ? 'Spin Again' : 'Spin the Wheel')}
          {items.length > 0 && !isSpinning && <div className="btn-glow" />}
        </button>
      </div>

      <style jsx>{`
        .spin-panel {
          position: relative;
          background: linear-gradient(145deg, rgb(46,39,46), rgb(40,36,40));
          border: 1px solid rgba(155, 89, 182, 0.2);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3), inset 0 0 20px rgba(155,89,182,0.05);
          overflow: hidden;
        }

        .spin-header {
          background: rgba(155, 89, 182, 0.08);
          border-bottom: 1px solid rgba(155, 89, 182, 0.15);
        }

        .sparkle {
          animation: pulse-sparkle 2s infinite alternate;
        }

        .spin-body {
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          min-height: 220px;
          justify-content: center;
        }

        .intro {
          text-align: center;
          animation: fadeIn 0.5s ease;
        }
        .intro p {
          margin: 0 0 6px;
          font-size: 14px;
          font-weight: 700;
          color: rgb(230, 220, 225);
        }
        .intro .sub {
          font-size: 11px;
          font-weight: 500;
          color: rgba(220, 210, 215, 0.5);
        }

        .wheel-container {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 120px;
        }

        .shuffling-text {
          font-size: 16px;
          font-weight: 800;
          color: #9b59b6;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 1px;
          filter: blur(0.5px);
          animation: shake 0.1s infinite;
        }

        .result-card {
          display: flex;
          gap: 16px;
          width: 100%;
          text-decoration: none;
          background: rgba(0,0,0,0.2);
          padding: 12px;
          border-radius: 12px;
          border: 1px solid rgba(155,89,182,0.15);
          animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          transition: transform 0.2s, background 0.2s, border-color 0.2s;
        }

        .result-card:hover {
          transform: translateY(-2px) scale(1.02);
          background: rgba(0,0,0,0.3);
          border-color: rgba(155,89,182,0.4);
        }

        .poster-wrapper {
          position: relative;
          width: 70px;
          height: 105px;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .poster-wrapper img, .poster-wrapper .placeholder {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 6px;
          position: relative;
          z-index: 2;
        }

        .placeholder {
          background: rgb(58,55,55);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .poster-glow {
          position: absolute;
          inset: -4px;
          background: linear-gradient(135deg, #9b59b6, #e74c3c);
          border-radius: 8px;
          z-index: 1;
          filter: blur(8px);
          opacity: 0.6;
          animation: pulse-glow 2s infinite alternate;
        }

        .result-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .result-info h4 {
          margin: 0 0 6px;
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .result-info p {
          margin: 0;
          font-size: 10px;
          color: rgba(220, 210, 215, 0.6);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }

        .action-hint {
          display: block;
          margin-top: 8px;
          font-size: 9px;
          font-weight: 700;
          color: #9b59b6;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .spin-btn {
          position: relative;
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #8e44ad, #9b59b6);
          color: white;
          font-weight: 800;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.1s, filter 0.2s;
          box-shadow: 0 4px 15px rgba(142,68,173,0.4);
        }

        .spin-btn:not(:disabled):hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .spin-btn:not(:disabled):active {
          transform: translateY(1px);
        }

        .spin-btn:disabled {
          background: rgb(60,55,60);
          color: rgba(255,255,255,0.4);
          cursor: not-allowed;
          box-shadow: none;
        }

        .btn-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: skewX(-20deg);
          animation: sweep 3s infinite;
        }

        .spin-btn.spinning .btn-glow {
          animation: sweep 0.5s infinite;
        }

        @keyframes pulse-sparkle {
          0% { opacity: 0.5; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1.1); filter: drop-shadow(0 0 4px rgba(255,255,255,0.8)); }
        }

        @keyframes pulse-glow {
          0% { opacity: 0.4; transform: scale(0.98); }
          100% { opacity: 0.7; transform: scale(1.02); }
        }

        @keyframes sweep {
          0% { left: -100%; }
          50% { left: 200%; }
          100% { left: 200%; }
        }

        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-2px) scale(1.02); }
          50% { transform: translateX(2px) scale(0.98); }
          75% { transform: translateX(-2px) scale(1.02); }
          100% { transform: translateX(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); }
          70% { transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
