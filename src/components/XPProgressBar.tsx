'use client';

import { useEffect, useRef, useState } from 'react';
import { Flame, Trophy, Zap } from 'lucide-react';
import { XP_AWARDED_EVENT } from '@/hooks/useXPNotification';

interface GameStats {
  totalXP: number;
  level: number;
  levelName: string;
  currentXP: number;
  xpToNext: number;
  xpPercent: number;
  xpRemaining: number;
  multiplier: number;
  streak: {
    current: number;
    longest: number;
    lastActivityDay: string | null;
  };
}

function formatCompact(value: number) {
  return Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

// ── SVG Greek Key ornament inline ─────────────────────────────────────────────
function GreekKeyLine() {
  return (
    <svg
      width="100%"
      height="6"
      viewBox="0 0 120 6"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', opacity: 0.18 }}
    >
      <path
        d="M0,5 L0,1 L4,1 L4,5 L8,5 L8,1 L12,1 L12,3 L10,3 L10,5 L14,5 L14,1 L18,1 L18,5 L22,5 L22,1 L26,1 L26,3 L24,3 L24,5 L28,5 L28,1 L32,1 L32,5 L36,5 L36,1 L40,1 L40,3 L38,3 L38,5 L42,5 L42,1 L46,1 L46,5 L50,5 L50,1 L54,1 L54,3 L52,3 L52,5 L56,5 L56,1 L60,1 L60,5 L64,5 L64,1 L68,1 L68,3 L66,3 L66,5 L70,5 L70,1 L74,1 L74,5 L78,5 L78,1 L82,1 L82,3 L80,3 L80,5 L84,5 L84,1 L88,1 L88,5 L92,5 L92,1 L96,1 L96,3 L94,3 L94,5 L98,5 L98,1 L102,1 L102,5 L106,5 L106,1 L110,1 L110,3 L108,3 L108,5 L112,5 L112,1 L116,1 L116,5 L120,5"
        stroke="var(--flame)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  );
}

export default function XPProgressBar() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelPulse, setLevelPulse] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [displayXP, setDisplayXP] = useState(0);
  const [displayPercent, setDisplayPercent] = useState(0);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/gamification/user-stats', { cache: 'no-store' });
      if (!res.ok) return;
      const data: GameStats = await res.json();
      setStats(data);
      // Anima os números ao carregar
      animateValues(data.currentXP, data.xpPercent);
    } finally {
      setLoading(false);
    }
  };

  function animateValues(targetXP: number, targetPercent: number) {
    const duration = 800;
    const start = performance.now();
    const fromXP = displayXP;
    const fromPct = displayPercent;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplayXP(Math.round(fromXP + (targetXP - fromXP) * ease));
      setDisplayPercent(+(fromPct + (targetPercent - fromPct) * ease).toFixed(2));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  useEffect(() => {
    loadStats();

    const handleAwarded = (event: Event) => {
      const customEvent = event as CustomEvent<{ awards?: Array<{ leveledUp?: boolean }> }>;
      if (customEvent.detail?.awards?.some((a) => a.leveledUp)) {
        setLevelPulse(true);
        if (animRef.current) clearTimeout(animRef.current);
        animRef.current = setTimeout(() => setLevelPulse(false), 1200);
      }
      setTimeout(loadStats, 180);
    };

    window.addEventListener(XP_AWARDED_EVENT, handleAwarded);
    return () => {
      window.removeEventListener(XP_AWARDED_EVENT, handleAwarded);
      if (animRef.current) clearTimeout(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !stats) {
    return (
      <div style={styles.container}>
        <div style={styles.skeletonTop} />
        <div style={styles.skeletonBar} />
      </div>
    );
  }

  if (!stats) return null;

  const remaining = stats.xpToNext - stats.currentXP;
  const pct = Math.min(100, displayPercent);

  return (
    <>
      <style>{css}</style>

      <div
        style={{
          ...styles.container,
          ...(levelPulse ? styles.levelUpPulse : {}),
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={`${stats.totalXP.toLocaleString('pt-BR')} XP total`}
      >
        {/* Ornamento grego superior */}
        <GreekKeyLine />

        {/* Header: nível + streak */}
        <div style={styles.header}>
          <div style={styles.levelCluster}>
            <span style={styles.levelBadge} className={levelPulse ? 'xp-level-glow' : ''}>
              <Trophy size={11} aria-hidden="true" />
              {stats.level}
            </span>
            <span style={styles.levelName}>{stats.levelName}</span>
          </div>
          <span style={styles.streakBadge} title={`Maior streak: ${stats.streak.longest} dias`}>
            <Flame size={11} aria-hidden="true" />
            {stats.streak.current}
          </span>
        </div>

        {/* Barra XP */}
        <div style={styles.barShell} aria-label={`Nível ${stats.level}: ${pct}%`}>
          {/* Track com ornamento pontilhado */}
          <div style={styles.barTrack}>
            {/* Fill animado */}
            <div
              style={{
                ...styles.barFill,
                width: `${pct}%`,
              }}
              className="xp-bar-fill"
            />
            {/* Marcadores de 25%, 50%, 75% */}
            {[25, 50, 75].map((mark) => (
              <div
                key={mark}
                style={{
                  ...styles.barMark,
                  left: `${mark}%`,
                  opacity: pct > mark ? 0.3 : 0.15,
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer: XP atual / total + multiplicador */}
        <div style={styles.footer}>
          <span style={styles.xpText}>
            {formatCompact(displayXP)}<span style={styles.xpSep}> / </span>{formatCompact(stats.xpToNext)} XP
          </span>
          {stats.multiplier > 1 && (
            <span style={styles.multiplier}>
              <Zap size={10} aria-hidden="true" />
              {stats.multiplier.toFixed(2)}x
            </span>
          )}
        </div>

        {/* Ornamento grego inferior */}
        <GreekKeyLine />

        {/* Tooltip ao hover */}
        {showTooltip && (
          <div ref={tooltipRef} style={styles.tooltip} className="xp-tooltip">
            {/* Cabeçalho do tooltip */}
            <div style={styles.tooltipHeader}>
              <span style={styles.tooltipLevel}>Nível {stats.level}</span>
              <span style={styles.tooltipLevelName}>{stats.levelName}</span>
            </div>

            <div style={styles.tooltipDivider} />

            <div style={styles.tooltipRow}>
              <span style={styles.tooltipLabel}>XP neste nível</span>
              <span style={styles.tooltipValue}>{stats.currentXP.toLocaleString('pt-BR')}</span>
            </div>
            <div style={styles.tooltipRow}>
              <span style={styles.tooltipLabel}>Necessário</span>
              <span style={styles.tooltipValue}>{stats.xpToNext.toLocaleString('pt-BR')}</span>
            </div>

            {/* Barra mini no tooltip */}
            <div style={styles.tooltipBarTrack}>
              <div style={{ ...styles.tooltipBarFill, width: `${pct}%` }} />
            </div>

            <div style={styles.tooltipRow}>
              <span style={{ ...styles.tooltipLabel, color: 'var(--flame)' }}>Faltam</span>
              <span style={{ ...styles.tooltipValue, color: 'var(--flame)', fontWeight: 800 }}>
                {remaining.toLocaleString('pt-BR')} XP
              </span>
            </div>

            <div style={styles.tooltipDivider} />

            <div style={styles.tooltipRow}>
              <span style={styles.tooltipLabel}>XP Total</span>
              <span style={styles.tooltipValue}>{stats.totalXP.toLocaleString('pt-BR')}</span>
            </div>
            <div style={styles.tooltipRow}>
              <span style={styles.tooltipLabel}>🔥 Streak</span>
              <span style={styles.tooltipValue}>{stats.streak.current} dias</span>
            </div>
            {stats.multiplier > 1 && (
              <div style={styles.tooltipRow}>
                <span style={styles.tooltipLabel}>⚡ Multiplicador</span>
                <span style={{ ...styles.tooltipValue, color: '#c9973a' }}>{stats.multiplier.toFixed(2)}x</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '260px',
    maxWidth: '340px',
    padding: '14px 16px',
    background: 'rgba(16,14,14,0.96)',
    border: '1px solid rgba(230,125,153,0.18)',
    borderRadius: '16px',
    cursor: 'default',
    transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
    boxShadow: '0 24px 45px rgba(0,0,0,0.24)',
    backdropFilter: 'blur(16px)',
    marginTop: '70px',
  },
  levelUpPulse: {
    border: '1px solid rgba(230,125,153,0.55)',
    boxShadow: '0 0 18px rgba(230,125,153,0.25)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
  },
  levelCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    minWidth: 0,
  },
  levelBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    background: 'rgba(230,125,153,0.12)',
    border: '1px solid rgba(230,125,153,0.3)',
    borderRadius: '4px',
    color: 'rgb(230,125,153)',
    fontSize: '11px',
    fontWeight: 800,
    fontFamily: 'Cinzel, serif',
    letterSpacing: '0.05em',
    flexShrink: 0,
  },
  levelName: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    fontFamily: 'Cinzel, serif',
    letterSpacing: '0.04em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  streakBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--ember)',
    flexShrink: 0,
    fontFamily: 'Overpass, sans-serif',
  },
  barShell: {
    position: 'relative',
  },
  barTrack: {
    position: 'relative',
    height: '5px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '3px',
    overflow: 'visible',
  },
  barFill: {
    position: 'absolute',
    inset: 0,
    height: '100%',
    background: 'linear-gradient(90deg, rgba(230,125,153,0.6), rgb(230,125,153))',
    borderRadius: '3px',
    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
    boxShadow: '0 0 8px rgba(230,125,153,0.45)',
  },
  barMark: {
    position: 'absolute',
    top: '-1px',
    width: '1px',
    height: '7px',
    background: 'var(--flame)',
    borderRadius: '1px',
    transition: 'opacity 0.4s ease',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4px',
  },
  xpText: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    fontFamily: 'Overpass, sans-serif',
    letterSpacing: '0.02em',
  },
  xpSep: {
    color: 'var(--hades-border-md)',
  },
  multiplier: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    fontSize: '9px',
    fontWeight: 700,
    color: '#c9973a',
    fontFamily: 'Overpass, sans-serif',
  },
  skeletonTop: {
    height: '10px',
    borderRadius: '3px',
    background: 'rgba(255,255,255,0.05)',
    animation: 'pulse 1.4s ease infinite',
  },
  skeletonBar: {
    height: '5px',
    borderRadius: '3px',
    background: 'rgba(255,255,255,0.05)',
    animation: 'pulse 1.4s ease 0.2s infinite',
  },
  // ── Tooltip ──
  tooltip: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    zIndex: 9000,
    minWidth: '220px',
    background: 'rgba(20,18,18,0.98)',
    border: '1px solid rgba(230,125,153,0.22)',
    borderRadius: '6px',
    padding: '12px 14px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(230,125,153,0.06)',
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },
  tooltipHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  tooltipLevel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'rgb(230,125,153)',
    fontFamily: 'Overpass, sans-serif',
  },
  tooltipLevelName: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#e8e2df',
    fontFamily: 'Cinzel, serif',
    letterSpacing: '0.04em',
  },
  tooltipDivider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(230,125,153,0.2), transparent)',
  },
  tooltipRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  tooltipLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontFamily: 'Overpass, sans-serif',
  },
  tooltipValue: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    fontFamily: 'Overpass, sans-serif',
  },
  tooltipBarTrack: {
    width: '100%',
    height: '4px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  tooltipBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, rgba(230,125,153,0.5), rgb(230,125,153))',
    borderRadius: '2px',
    transition: 'width 0.6s ease',
    boxShadow: '0 0 6px rgba(230,125,153,0.4)',
  },
};

// ── CSS inline para animações que não cabem em style= ─────────────────────────
const css = `
  .xp-bar-fill {
    animation: xpShimmer 2.5s linear infinite;
    background-size: 200% 100%;
    background-image: linear-gradient(
      90deg,
      rgba(230,125,153,0.55) 0%,
      rgb(230,125,153) 45%,
      rgba(255,180,200,0.95) 55%,
      rgb(230,125,153) 70%,
      rgba(230,125,153,0.55) 100%
    );
  }

  @keyframes xpShimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .xp-level-glow {
    animation: levelGlow 0.9s ease both;
  }

  @keyframes levelGlow {
    0%   { box-shadow: 0 0 0px rgba(230,125,153,0); }
    40%  { box-shadow: 0 0 14px rgba(230,125,153,0.7); }
    100% { box-shadow: 0 0 0px rgba(230,125,153,0); }
  }

  .xp-tooltip {
    animation: tooltipIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  @keyframes tooltipIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
`;