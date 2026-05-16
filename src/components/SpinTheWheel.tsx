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
  const [rotation, setRotation] = useState(0);

  const spin = () => {
    if (items.length === 0 || isSpinning) return;
    setIsSpinning(true);
    setSelected(null);

    // Efeito de roleta com rotação visual
    let iterations = 0;
    const maxIterations = 30;
    const interval = setInterval(() => {
      const rand = items[Math.floor(Math.random() * items.length)];
      setShufflingTitle(rand.title);
      setRotation(prev => prev + 45); // Rotação visual da roleta
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        const finalItem = items[Math.floor(Math.random() * items.length)];
        setSelected(finalItem);
        setIsSpinning(false);
      }
    }, 50);
  };

  const poster = selected?.imagePath
    ? selected.imagePath.startsWith('http')
      ? selected.imagePath
      : `https://image.tmdb.org/t/p/w300${selected.imagePath}`
    : '';

  return (
    <div className="side-panel spin-panel">
      <div className="side-panel-header spin-header">
        <div className="side-panel-header-dot" style={{ background: '#d4af37', boxShadow: '0 0 10px rgba(212,175,55,0.8)' }} />
        <h3 className="side-panel-header-title" style={{ color: '#d4af37', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Roda do Destino</span>
          <span className="sparkle">⚡</span>
        </h3>
      </div>
      
      <div className="spin-body">
        {!selected && !isSpinning && (
          <div className="intro">
            <p>Não consegue decidir o que assistir?</p>
            <p className="sub">Deixe as Parcas escolherem entre seus {items.length} títulos planejados.</p>
          </div>
        )}

        <div className="wheel-container">
          {isSpinning && (
            <div className="shuffling-text" style={{ transform: `rotate(${rotation}deg)` }}>
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
                <p>{selected.synopsis || 'Sinopse não disponível.'}</p>
                <span className="action-hint">Clique para abrir</span>
              </div>
            </Link>
          )}
        </div>

        <button 
          className={`spin-btn ${isSpinning ? 'spinning' : ''}`} 
          onClick={spin}
          disabled={items.length === 0 || isSpinning}
        >
          {isSpinning ? 'Consultando as Parcas...' : (selected ? 'Girar Novamente' : 'Girar a Roda')}
          {items.length > 0 && !isSpinning && <div className="btn-glow" />}
        </button>
      </div>

      <style jsx>{`
        .spin-panel {
          position: relative;
          background: linear-gradient(145deg, rgb(50, 44, 38), rgb(42, 37, 32));
          border: 2px solid rgba(212, 175, 55, 0.25);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(212, 175, 55, 0.1), 0 0 30px rgba(212, 175, 55, 0.08);
          overflow: hidden;
          border-radius: 12px;
        }

        .spin-header {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.05));
          border-bottom: 1.5px solid rgba(212, 175, 55, 0.2);
        }

        .sparkle {
          animation: pulse-sparkle 1.5s infinite alternate;
          filter: drop-shadow(0 0 3px rgba(212, 175, 55, 0.6));
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
          color: rgba(212, 175, 55, 0.7);
        }

        .wheel-container {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 120px;
          perspective: 1000px;
        }

        .shuffling-text {
          font-size: 18px;
          font-weight: 900;
          color: #d4af37;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 2px;
          filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.6));
          animation: spin-rotate 0.15s linear infinite;
          transform-origin: center;
          font-style: italic;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }

        .result-card {
          display: flex;
          gap: 16px;
          width: 100%;
          text-decoration: none;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.05), rgba(212, 175, 55, 0.02));
          padding: 12px;
          border-radius: 12px;
          border: 1.5px solid rgba(212, 175, 55, 0.25);
          animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .result-card:hover {
          transform: translateY(-3px) scale(1.01);
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.05));
          border-color: rgba(212, 175, 55, 0.5);
          box-shadow: 0 8px 20px rgba(212, 175, 55, 0.15);
        }

        .poster-wrapper {
          position: relative;
          width: 70px;
          height: 105px;
          border-radius: 8px;
          flex-shrink: 0;
          overflow: hidden;
        }

        .poster-wrapper img, .poster-wrapper .placeholder {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
          position: relative;
          z-index: 2;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .placeholder {
          background: linear-gradient(135deg, rgb(58, 52, 45), rgb(48, 42, 35));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .poster-glow {
          position: absolute;
          inset: -6px;
          background: linear-gradient(135deg, #d4af37, #f4d03f);
          border-radius: 10px;
          z-index: 1;
          filter: blur(12px);
          opacity: 0.4;
          animation: pulse-glow-gold 2.5s ease-in-out infinite;
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
          color: #d4af37;
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
          color: #d4af37;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .spin-btn {
          position: relative;
          width: 100%;
          padding: 14px;
          border: 2px solid #d4af37;
          border-radius: 8px;
          background: linear-gradient(135deg, #b8941d, #d4af37);
          color: rgb(20, 18, 18);
          font-weight: 900;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 2px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 6px 20px rgba(212, 175, 55, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          font-style: italic;
        }

        .spin-btn:not(:disabled):hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 32px rgba(212, 175, 55, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
          filter: brightness(1.15);
        }

        .spin-btn:not(:disabled):active {
          transform: translateY(1px) scale(0.98);
        }

        .spin-btn:disabled {
          background: linear-gradient(135deg, rgb(60, 55, 50), rgb(50, 45, 40));
          color: rgba(255, 255, 255, 0.3);
          cursor: not-allowed;
          box-shadow: none;
          border-color: rgba(212, 175, 55, 0.1);
        }

        .btn-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transform: skewX(-20deg);
          animation: sweep-gold 3s infinite;
        }

        .spin-btn.spinning .btn-glow {
          animation: sweep-gold 0.6s infinite;
        }

        @keyframes pulse-sparkle {
          0% { opacity: 0.6; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes pulse-glow-gold {
          0%, 100% { opacity: 0.3; transform: scale(0.95); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }

        @keyframes sweep-gold {
          0% { left: -100%; }
          50% { left: 200%; }
          100% { left: 200%; }
        }

        @keyframes spin-rotate {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.85) translateY(10px); }
          70% { transform: scale(1.05) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
