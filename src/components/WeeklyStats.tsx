import React from 'react';
import { Tv, Film, Clock, Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { WeeklyStats as WeeklyStatsType } from '@/lib/weekly-stats';

interface WeeklyStatsProps {
  stats: WeeklyStatsType;
}

export default function WeeklyStats({ stats }: WeeklyStatsProps) {
  const metrics = [
    {
      label:   'Episódios',
      sublabel: 'Assistidos',
      greek:   'ΕΠΕΙΣΟΔΙΑ',
      value:   stats.episodes.current,
      trend:   stats.episodes.trend,
      unit:    '',
      icon:    Tv,
      color:   '#60a5fa',
      shadow:  'rgba(96,165,250,0.35)',
    },
    {
      label:   'Filmes',
      sublabel: 'Assistidos',
      greek:   'ΤΑΙΝΙΕΣ',
      value:   stats.movies.current,
      trend:   stats.movies.trend,
      unit:    '',
      icon:    Film,
      color:   '#34d399',
      shadow:  'rgba(52,211,153,0.35)',
    },
    {
      label:   'Horas',
      sublabel: 'Totais',
      greek:   'ΩΡΕΣ',
      value:   stats.hours.current,
      trend:   stats.hours.trend,
      unit:    'h',
      icon:    Clock,
      color:   '#fbbf24',
      shadow:  'rgba(251,191,36,0.35)',
    },
    {
      label:   'XP',
      sublabel: 'Ganho',
      greek:   'ΕΜΠΕΙΡΙΑ',
      value:   stats.xp.current,
      trend:   stats.xp.trend,
      unit:    '',
      icon:    Star,
      color:   'rgb(230,125,153)',
      shadow:  'rgba(230,125,153,0.35)',
    },
  ];

  return (
    <div className="ws-root side-panel">
      <style>{`
        /* ── WeeklyStats: Greek Pantheon Design ── */

        .ws-root {
          position: relative;
          overflow: hidden;
        }

        /* Panel header */
        .ws-header {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 11px 15px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: linear-gradient(90deg, rgba(212,175,55,0.07) 0%, transparent 100%);
          position: relative;
        }
        /* Greek subtitle watermark */
        .ws-header::after {
          content: 'ΕΒΔΟΜΑΔΑ';
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 2px;
          color: rgba(212,175,55,0.18);
          font-family: 'Cinzel', serif;
          pointer-events: none;
        }
        .ws-header-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: rgb(212,175,55);
          box-shadow: 0 0 8px rgba(212,175,55,0.7);
          flex-shrink: 0;
        }
        .ws-header-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgb(212,175,55);
          margin: 0;
          font-family: 'Cinzel', serif;
        }

        /* Background column ornament */
        .ws-bg-col {
          position: absolute;
          bottom: -8px;
          right: 10px;
          display: flex;
          gap: 6px;
          pointer-events: none;
          user-select: none;
          z-index: 0;
        }
        .ws-bg-col-pillar {
          width: 5px;
          height: 52px;
          background: linear-gradient(180deg, rgba(212,175,55,0.06) 0%, transparent 100%);
          border-radius: 2px 2px 0 0;
        }

        /* Grid */
        .ws-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          padding: 11px;
          position: relative;
          z-index: 1;
        }

        /* Metric card */
        .ws-card {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 11px 11px 10px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.055);
          background: linear-gradient(145deg, #2e2b2b 0%, #272424 100%);
          overflow: hidden;
          cursor: default;
          transition:
            transform 0.24s cubic-bezier(0.34,1.56,0.64,1),
            border-color 0.2s ease,
            box-shadow 0.24s ease;
          animation: ws-card-in 0.4s ease both;
        }
        .ws-card:nth-child(1) { animation-delay: 0.04s; }
        .ws-card:nth-child(2) { animation-delay: 0.10s; }
        .ws-card:nth-child(3) { animation-delay: 0.16s; }
        .ws-card:nth-child(4) { animation-delay: 0.22s; }

        .ws-card:hover {
          transform: translateY(-4px);
        }

        /* Top accent line */
        .ws-card-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          border-radius: 10px 10px 0 0;
          opacity: 0.5;
          transition: opacity 0.2s ease;
        }
        .ws-card:hover .ws-card-accent { opacity: 1; }

        /* Hover glow */
        .ws-card-glow {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.28s ease;
          border-radius: 10px;
        }
        .ws-card:hover .ws-card-glow { opacity: 1; }

        /* Corner greek text */
        .ws-greek-label {
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 1.4px;
          font-family: 'Cinzel', serif;
          opacity: 0.2;
          text-transform: uppercase;
          margin-bottom: 7px;
          transition: opacity 0.2s ease;
          line-height: 1;
        }
        .ws-card:hover .ws-greek-label { opacity: 0.42; }

        /* Icon */
        .ws-icon-wrap {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
          transition: transform 0.24s cubic-bezier(0.34,1.56,0.64,1);
        }
        .ws-card:hover .ws-icon-wrap {
          transform: scale(1.1);
        }
        .ws-icon {
          width: 13px; height: 13px;
        }

        /* Value row */
        .ws-value-row {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          position: relative;
          z-index: 1;
        }
        .ws-value {
          font-size: 26px;
          font-weight: 800;
          font-family: 'Cinzel', serif;
          line-height: 1;
          color: rgba(232,226,223,0.92);
          letter-spacing: -0.5px;
        }
        .ws-unit {
          font-size: 12px;
          font-weight: 700;
          color: rgba(232,226,223,0.4);
          margin-bottom: 2px;
          font-family: 'Cinzel', serif;
        }

        /* Label */
        .ws-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;
          position: relative;
          z-index: 1;
        }
        .ws-label-text {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          line-height: 1.2;
        }

        /* Trend chip */
        .ws-trend {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 2px 6px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.3px;
        }
        .ws-trend.up {
          background: rgba(52,211,153,0.1);
          border: 1px solid rgba(52,211,153,0.2);
          color: #34d399;
        }
        .ws-trend.down {
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.2);
          color: #f87171;
        }
        .ws-trend.neutral {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.28);
        }
        .ws-trend-icon {
          width: 9px; height: 9px;
        }

        /* Keyframes */
        @keyframes ws-card-in {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div className="ws-header">
        <div className="ws-header-dot" />
        <h3 className="ws-header-title">Seus Números (7 Dias)</h3>
      </div>

      {/* Background ornament pillars */}
      <div className="ws-bg-col">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="ws-bg-col-pillar" style={{ height: `${38 + i * 8}px` }} />
        ))}
      </div>

      {/* Metrics grid */}
      <div className="ws-grid">
        {metrics.map((m, i) => {
          const isUp      = m.trend > 0;
          const isDown    = m.trend < 0;
          const isNeutral = m.trend === 0;

          return (
            <div key={i} className="ws-card">
              {/* Top accent */}
              <div
                className="ws-card-accent"
                style={{ background: `linear-gradient(90deg, transparent, ${m.color}, transparent)` }}
              />

              {/* Hover glow */}
              <div
                className="ws-card-glow"
                style={{ background: `radial-gradient(ellipse at 20% 0%, ${m.color}14 0%, transparent 65%)` }}
              />

              {/* Greek label */}
              <span className="ws-greek-label" style={{ color: m.color }}>
                {m.greek}
              </span>

              {/* Icon */}
              <div
                className="ws-icon-wrap"
                style={{
                  background: `${m.color}12`,
                  border: `1px solid ${m.color}22`,
                  boxShadow: `0 0 10px ${m.color}18`,
                }}
              >
                <m.icon className="ws-icon" style={{ color: m.color }} />
              </div>

              {/* Value */}
              <div className="ws-value-row">
                <span className="ws-value" style={{ color: m.color === 'rgb(230,125,153)' ? 'rgba(232,226,223,0.92)' : undefined }}>
                  {m.value}
                </span>
                {m.unit && <span className="ws-unit">{m.unit}</span>}
              </div>

              {/* Label + trend */}
              <div className="ws-label-row">
                <span className="ws-label-text">
                  {m.label}<br />{m.sublabel}
                </span>

                <div className={`ws-trend ${isUp ? 'up' : isDown ? 'down' : 'neutral'}`}>
                  {isUp   && <TrendingUp   className="ws-trend-icon" />}
                  {isDown && <TrendingDown className="ws-trend-icon" />}
                  {isNeutral && <Minus     className="ws-trend-icon" />}
                  <span>{isNeutral ? '—' : (isUp ? '+' : '') + m.trend}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}