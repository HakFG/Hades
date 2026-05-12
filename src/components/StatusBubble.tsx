'use client';

import { resolveSeriesStatusDot } from '@/lib/series-status';

/**
 * Bolinha de status da série/temporada baseada no status REAL de exibição:
 *  - Airing          → verde pulsante
 *  - Not Yet Aired   → laranja
 *  - Returning Series→ azul
 *  - In Production   → roxo
 *  - Canceled        → cinza
 *  - Finished / Ended / Released → SEM bolinha (null)
 *
 * Passa `status` como o `seasonStatus` (Airing | Finished | Not Yet Aired)
 * ou como o `productionStatus` do banco (Returning Series, Ended, …).
 * O componente resolve automaticamente qual cor mostrar (ou não mostrar).
 */

const SIZE_MAP = {
  sm: { size: 8,  offset: 5  },
  md: { size: 11, offset: 6  },
  lg: { size: 15, offset: 8  },
};

interface StatusBubbleProps {
  status?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Posição da bolinha. Padrão: top-left */
  position?: 'tl' | 'tr' | 'bl' | 'br';
}

export default function StatusBubble({
  status,
  size = 'sm',
  className,
  position = 'tl',
}: StatusBubbleProps) {
  const cfg = resolveSeriesStatusDot(status);
  if (!cfg) return null;

  const dim = SIZE_MAP[size];

  const posStyle =
    position === 'tl' ? { top: dim.offset, left: dim.offset } :
    position === 'tr' ? { top: dim.offset, right: dim.offset } :
    position === 'bl' ? { bottom: dim.offset, left: dim.offset } :
                        { bottom: dim.offset, right: dim.offset };

  return (
    <>
      <span
        className={`status-bubble-dot${cfg.pulse ? ' status-bubble-pulse' : ''}${className ? ` ${className}` : ''}`}
        title={cfg.label}
        aria-label={`Status: ${cfg.label}`}
        style={{
          position:        'absolute',
          ...posStyle,
          width:           dim.size,
          height:          dim.size,
          borderRadius:    '50%',
          backgroundColor: cfg.color,
          border:          '1.5px solid rgba(255,255,255,0.6)',
          zIndex:          15,
          boxShadow:       `0 2px 8px rgba(0,0,0,0.45), 0 0 6px ${cfg.color}66`,
          pointerEvents:   'none',
          display:         'block',
        }}
      />
      {cfg.pulse && (
        <style>{`
          @keyframes status-bubble-pulse {
            0%   { box-shadow: 0 0 0 0 ${cfg.color}88, 0 2px 8px rgba(0,0,0,0.45); }
            70%  { box-shadow: 0 0 0 6px ${cfg.color}00, 0 2px 8px rgba(0,0,0,0.45); }
            100% { box-shadow: 0 0 0 0 ${cfg.color}00, 0 2px 8px rgba(0,0,0,0.45); }
          }
          .status-bubble-pulse {
            animation: status-bubble-pulse 2s infinite;
          }
        `}</style>
      )}
    </>
  );
}