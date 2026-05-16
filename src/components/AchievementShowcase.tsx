import React from 'react';
import type { Achievement } from '@/lib/achievements';
import { RARITY_COLOR, RARITY_LABEL } from '@/lib/achievements';

interface AchievementShowcaseProps {
  achievements: Achievement[];
}

// Mapeamento de raridade para terminologia grega
const RARITY_GREEK: Record<string, { title: string; glyph: string }> = {
  COMMON:    { title: 'Mortal',    glyph: 'Ι' },
  UNCOMMON:  { title: 'Herói',     glyph: 'ΙΙ' },
  RARE:      { title: 'Semideus',  glyph: 'ΙΙΙ' },
  EPIC:      { title: 'Olímpico',  glyph: 'Δ' },
  LEGENDARY: { title: 'Divino',    glyph: 'Ω' },
};

export default function AchievementShowcase({ achievements }: AchievementShowcaseProps) {
  if (!achievements || achievements.length === 0) return null;

  const recentAchievements = [...achievements].reverse().slice(0, 6);

  return (
    <div className="ach-root side-panel">
      <style>{`
        /* ── AchievementShowcase: Greek Underworld Design ── */

        .ach-root {
          position: relative;
          overflow: hidden;
        }

        /* Panel header */
        .ach-header {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 11px 15px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: linear-gradient(90deg, rgba(230,125,153,0.06) 0%, transparent 100%);
          position: relative;
        }
        .ach-header::after {
          content: 'ΚΑΤΟΡΘΩΜΑΤΑ';
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 2px;
          color: rgba(230,125,153,0.18);
          font-family: 'Cinzel', serif;
          pointer-events: none;
        }
        .ach-header-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: rgb(230,125,153);
          box-shadow: 0 0 8px rgba(230,125,153,0.6);
          flex-shrink: 0;
        }
        .ach-header-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgb(230,125,153);
          margin: 0;
          font-family: 'Cinzel', serif;
        }

        /* Background ornament */
        .ach-bg-ornament {
          position: absolute;
          bottom: -18px;
          right: -14px;
          font-size: 88px;
          font-family: 'Cinzel', serif;
          font-weight: 900;
          color: rgba(230,125,153,0.028);
          pointer-events: none;
          user-select: none;
          line-height: 1;
          z-index: 0;
        }

        /* Scroll track */
        .ach-scroll {
          display: flex;
          gap: 9px;
          overflow-x: auto;
          padding: 12px 12px 10px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          position: relative;
          z-index: 1;
        }
        .ach-scroll::-webkit-scrollbar { display: none; }

        /* Achievement card */
        .ach-card {
          flex-shrink: 0;
          width: 120px;
          scroll-snap-align: start;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 8px 10px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.06);
          background: linear-gradient(160deg, #2e2b2b 0%, #272424 100%);
          position: relative;
          overflow: hidden;
          cursor: default;
          transition:
            transform 0.24s cubic-bezier(0.34,1.56,0.64,1),
            border-color 0.2s ease,
            box-shadow 0.24s ease;
          animation: ach-card-in 0.38s ease both;
        }
        .ach-card:nth-child(1) { animation-delay: 0.04s; }
        .ach-card:nth-child(2) { animation-delay: 0.09s; }
        .ach-card:nth-child(3) { animation-delay: 0.14s; }
        .ach-card:nth-child(4) { animation-delay: 0.19s; }
        .ach-card:nth-child(5) { animation-delay: 0.24s; }
        .ach-card:nth-child(6) { animation-delay: 0.29s; }

        .ach-card:hover {
          transform: translateY(-5px);
        }

        /* Corner glyph (Greek numeral) */
        .ach-corner-glyph {
          position: absolute;
          top: 6px;
          right: 8px;
          font-size: 9px;
          font-weight: 700;
          font-family: 'Cinzel', serif;
          opacity: 0.35;
          letter-spacing: 0.5px;
          line-height: 1;
        }

        /* Radial glow overlay (rarity-tinted) */
        .ach-glow {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.28s ease;
          pointer-events: none;
          border-radius: 10px;
        }
        .ach-card:hover .ach-glow {
          opacity: 1;
        }

        /* Greek meander border accent (top) */
        .ach-meander {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          border-radius: 10px 10px 0 0;
          opacity: 0.55;
          transition: opacity 0.2s ease;
        }
        .ach-card:hover .ach-meander {
          opacity: 1;
        }

        /* Icon medallion */
        .ach-medallion {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          position: relative;
          z-index: 1;
          margin-bottom: 9px;
          flex-shrink: 0;
          transition: transform 0.24s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.24s ease;
        }
        .ach-card:hover .ach-medallion {
          transform: scale(1.1);
        }
        /* Outer ring */
        .ach-medallion::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid currentColor;
          opacity: 0.2;
          transition: opacity 0.2s ease, transform 0.3s ease;
        }
        .ach-card:hover .ach-medallion::before {
          opacity: 0.5;
          transform: scale(1.06);
        }
        /* Inner ring */
        .ach-medallion::after {
          content: '';
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1px solid currentColor;
          opacity: 0.08;
          transition: opacity 0.2s ease;
        }
        .ach-card:hover .ach-medallion::after {
          opacity: 0.2;
        }

        /* Name */
        .ach-name {
          font-size: 10px;
          font-weight: 700;
          font-family: 'Cinzel', serif;
          color: rgba(255,255,255,0.85);
          text-align: center;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 26px;
          margin-bottom: 7px;
          letter-spacing: 0.3px;
          position: relative;
          z-index: 1;
          transition: color 0.18s ease;
        }
        .ach-card:hover .ach-name {
          color: white;
        }

        /* Rarity label */
        .ach-rarity {
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 999px;
          font-family: 'Cinzel', serif;
          position: relative;
          z-index: 1;
          margin-bottom: 5px;
        }

        /* XP badge */
        .ach-xp {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.35);
          position: relative;
          z-index: 1;
          letter-spacing: 0.3px;
        }
        .ach-xp-value {
          font-weight: 800;
          color: rgba(212,175,55,0.7);
        }

        /* Keyframes */
        @keyframes ach-card-in {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div className="ach-header">
        <div className="ach-header-dot" />
        <h3 className="ach-header-title">Conquistas Recentes</h3>
      </div>

      {/* Background ornament */}
      <div className="ach-bg-ornament">Ω</div>

      {/* Cards scroll */}
      <div className="ach-scroll">
        {recentAchievements.map((ach) => {
          const color  = RARITY_COLOR[ach.rarity] ?? 'rgb(230,125,153)';
          const greek  = RARITY_GREEK[ach.rarity] ?? { title: 'Mortal', glyph: 'Ι' };

          return (
            <div key={ach.id} className="ach-card">
              {/* Rarity top bar */}
              <div
                className="ach-meander"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
              />

              {/* Hover glow */}
              <div
                className="ach-glow"
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}18 0%, transparent 70%)` }}
              />

              {/* Corner greek numeral */}
              <span className="ach-corner-glyph" style={{ color }}>
                {greek.glyph}
              </span>

              {/* Icon medallion */}
              <div
                className="ach-medallion"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${color}22, rgba(20,18,18,0.7) 70%)`,
                  border: `1px solid ${color}30`,
                  boxShadow: `0 0 14px ${color}25, inset 0 1px 0 ${color}15`,
                  color,
                }}
              >
                {ach.icon}
              </div>

              {/* Name */}
              <span className="ach-name">{ach.name}</span>

              {/* Rarity */}
              <span
                className="ach-rarity"
                style={{
                  color,
                  background: `${color}12`,
                  border: `1px solid ${color}25`,
                }}
              >
                {greek.title}
              </span>

              {/* XP */}
              <span className="ach-xp">
                +<span className="ach-xp-value">{ach.xpReward}</span> XP
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}