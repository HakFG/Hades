'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Play, Flame, Tv, Film, ChevronRight, Zap } from 'lucide-react';
import type { NextUpItem } from '@/lib/next-up';
import StatusBubble from '@/components/StatusBubble';

interface TodaySessionProps {
  items: NextUpItem[];
  currentStreak: number;
}

const streakMessages = [
  { min: 0,  label: 'Pronto para assistir algo?',         sub: 'Continue de onde parou.' },
  { min: 1,  label: 'Vamos manter o ritmo!',              sub: 'Você está assistindo hoje.' },
  { min: 3,  label: 'Boa sequência!',                     sub: '{n} dias de streak.' },
  { min: 7,  label: 'Uma semana perfeita.',               sub: '{n} dias consecutivos.' },
  { min: 14, label: 'Imparável.',                         sub: '{n} dias sem parar.' },
  { min: 30, label: 'Lendário.',                          sub: '{n} dias de pura dedicação.' },
];

function getStreakMessage(n: number) {
  const found = [...streakMessages].reverse().find(m => n >= m.min) ?? streakMessages[0];
  return {
    label: found.label,
    sub: found.sub.replace('{n}', String(n)),
  };
}

export default function TodaySession({ items, currentStreak }: TodaySessionProps) {
  if (!items || items.length === 0) return null;

  const { label: streakLabel, sub: streakSub } = getStreakMessage(currentStreak);

  const reasonLabel = (r: string | undefined) => {
    if (r === 'next_episode')    return 'Próximo Episódio';
    if (r === 'paused_resume')   return 'Retomar';
    if (r === 'almost_finished') return 'Quase no fim';
    return 'Sessão Rápida';
  };

  return (
    <section className="today-session-root">
      <style>{`
        /* ── TodaySession: design language ── */
        .today-session-root {
          margin-bottom: 44px;
        }

        /* Header */
        .ts-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .ts-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ts-bar {
          width: 3px;
          height: 18px;
          border-radius: 4px;
          background: linear-gradient(180deg, #fbbf24 0%, rgba(251,191,36,0.15) 100%);
          flex-shrink: 0;
        }
        .ts-eyebrow {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.8px;
          text-transform: uppercase;
          color: #fbbf24;
          margin: 0;
        }
        .ts-divider {
          height: 1px;
          width: 64px;
          background: linear-gradient(90deg, rgba(251,191,36,0.3), transparent);
        }

        /* Streak badge */
        .ts-streak-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 5px 12px 5px 8px;
          background: rgba(251, 191, 36, 0.07);
          border: 1px solid rgba(251, 191, 36, 0.18);
          border-radius: 999px;
          backdrop-filter: blur(4px);
          animation: ts-fadein 0.6s 0.3s ease both;
        }
        .ts-streak-icon {
          width: 14px; height: 14px;
          color: #fb923c;
          filter: drop-shadow(0 0 4px rgba(251,146,60,0.7));
          animation: ts-flame-pulse 2.2s ease-in-out infinite;
        }
        .ts-streak-text {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #fbbf24;
        }

        /* Grid */
        .ts-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 680px) {
          .ts-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Card */
        .ts-card {
          position: relative;
          display: flex;
          height: 152px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.05);
          text-decoration: none;
          background: #2c2929;
          transition:
            transform 0.28s cubic-bezier(0.34,1.56,0.64,1),
            border-color 0.22s ease,
            box-shadow 0.28s ease;
          animation: ts-card-in 0.45s ease both;
          will-change: transform;
        }
        .ts-card:nth-child(1) { animation-delay: 0.05s; }
        .ts-card:nth-child(2) { animation-delay: 0.14s; }

        .ts-card:hover {
          transform: translateY(-5px);
          border-color: rgba(251,191,36,0.35);
          box-shadow:
            0 18px 42px rgba(0,0,0,0.55),
            0 0 0 1px rgba(251,191,36,0.12),
            0 0 28px rgba(251,191,36,0.08);
        }

        /* Poster */
        .ts-poster-wrap {
          position: relative;
          width: 104px;
          flex-shrink: 0;
        }
        .ts-poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ts-poster-empty {
          width: 100%;
          height: 100%;
          background: #3c3939;
        }
        /* Gradient bleed from poster into card */
        .ts-poster-fade {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 40%, #2c2929 100%);
          pointer-events: none;
        }

        /* Ambient glow from poster — subtle */
        .ts-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: inherit;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 0;
        }

        /* Info area */
        .ts-info {
          position: relative;
          z-index: 2;
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 14px 16px 14px 12px;
          min-width: 0;
        }

        /* Top row: type pill + reason label */
        .ts-top-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .ts-type-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 7px;
          border-radius: 6px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .ts-type-icon {
          width: 10px; height: 10px;
          color: rgba(255,255,255,0.35);
        }
        .ts-type-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
        }
        .ts-reason-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: rgba(251,191,36,0.55);
        }

        /* Title */
        .ts-title {
          font-size: 14px;
          font-weight: 700;
          color: rgba(255,255,255,0.88);
          line-height: 1.35;
          margin: 0 0 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s ease;
        }
        .ts-card:hover .ts-title {
          color: #fbbf24;
        }

        /* Bottom row */
        .ts-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }
        .ts-episode-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.38);
        }

        /* Play button */
        .ts-play-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(251,191,36,0.08);
          border: 1px solid rgba(251,191,36,0.22);
          transition:
            background 0.22s ease,
            border-color 0.22s ease,
            transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
            box-shadow 0.22s ease;
          flex-shrink: 0;
        }
        .ts-play-icon {
          width: 13px; height: 13px;
          color: #fbbf24;
          margin-left: 2px;
          transition: color 0.18s ease;
        }
        .ts-card:hover .ts-play-btn {
          background: #fbbf24;
          border-color: #fbbf24;
          transform: scale(1.12);
          box-shadow: 0 0 18px rgba(251,191,36,0.4);
        }
        .ts-card:hover .ts-play-icon {
          color: #1c1a1a;
        }

        /* Streak context (below cards) */
        .ts-context-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 14px;
          padding: 10px 14px;
          background: rgba(251,191,36,0.04);
          border: 1px solid rgba(251,191,36,0.1);
          border-radius: 10px;
          animation: ts-fadein 0.6s 0.4s ease both;
        }
        .ts-context-icon {
          width: 16px; height: 16px;
          color: #fbbf24;
          opacity: 0.7;
          flex-shrink: 0;
        }
        .ts-context-label {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.7);
        }
        .ts-context-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          margin-left: auto;
          white-space: nowrap;
        }

        /* Keyframes */
        @keyframes ts-card-in {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ts-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ts-flame-pulse {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(251,146,60,0.5)); }
          50%       { filter: drop-shadow(0 0 8px rgba(251,146,60,0.9)); }
        }
      `}</style>

      {/* Header */}
      <div className="ts-header">
        <div className="ts-header-left">
          <div className="ts-bar" />
          <h2 className="ts-eyebrow">Sessão de Hoje</h2>
          <div className="ts-divider" />
        </div>

        {currentStreak > 0 && (
          <div className="ts-streak-badge">
            <Flame className="ts-streak-icon" />
            <span className="ts-streak-text">{currentStreak} dias de streak</span>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="ts-grid">
        {items.slice(0, 2).map((item) => {
          const isMovie = item.type === 'MOVIE';
          const Icon = isMovie ? Film : Tv;

          return (
            <Link key={item.id} href={`/titles/${item.slug}`} className="ts-card">
              {/* Poster */}
              <div className="ts-poster-wrap">
                {item.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${item.posterPath}`}
                    alt={item.title}
                    className="ts-poster-img"
                  />
                ) : (
                  <div className="ts-poster-empty" />
                )}
                <div className="ts-poster-fade" />
              </div>

              {/* Info */}
              <div className="ts-info">
                <div className="ts-top-row">
                  <div className="ts-type-pill">
                    <Icon className="ts-type-icon" />
                    <span className="ts-type-label">{isMovie ? 'Filme' : 'Série'}</span>
                  </div>
                  <span className="ts-reason-label">{reasonLabel(item.reason)}</span>
                </div>

                <h3 className="ts-title">{item.title}</h3>

                {item.seasonStatus && !isMovie && (
                  <div style={{ marginBottom: 4 }}>
                    <StatusBubble status={item.seasonStatus} size="sm" />
                  </div>
                )}

                <div className="ts-bottom-row">
                  <span className="ts-episode-label">
                    {!isMovie && item.nextEpisodeNumber
                      ? `Episódio ${item.nextEpisodeNumber}`
                      : 'Filme'}
                  </span>
                  <div className="ts-play-btn">
                    <Play className="ts-play-icon" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Streak context bar */}
      <div className="ts-context-bar">
        <Zap className="ts-context-icon" />
        <span className="ts-context-label">{streakLabel}</span>
        {currentStreak > 0 && (
          <span className="ts-context-sub">{streakSub}</span>
        )}
      </div>
    </section>
  );
}