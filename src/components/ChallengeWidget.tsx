'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Flame, RefreshCw, Sparkles, Target, Trophy } from 'lucide-react';

interface ChallengeDTO {
  id: string;
  challengeId: string;
  periodKey: string;
  category: 'daily' | 'weekly' | 'special';
  title: string;
  description: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  goal: number;
  current: number;
  rewardXP: number;
  rewardBadge: string | null;
  expiresAt: string;
  completedAt: string | null;
  completed: boolean;
  progressPercent: number;
}

interface ChallengeDashboard {
  generatedAt: string;
  active: ChallengeDTO[];
  pools: { daily: number; weekly: number; special: number };
}

const CATEGORY_META = {
  daily: { label: 'Hoje', icon: CalendarClock, color: 'rgb(230,125,153)' },
  weekly: { label: 'Semana', icon: Flame, color: '#c9973a' },
  special: { label: 'Especial', icon: Sparkles, color: '#9bd6e8' },
};

const DIFFICULTY_LABEL = {
  easy: 'Facil',
  medium: 'Medio',
  hard: 'Dificil',
  legendary: 'Lendario',
};

function fmtTimeLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'expirado';
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.max(1, Math.floor(diff / 60_000));
  return `${mins}m`;
}

function ChallengeRow({ challenge }: { challenge: ChallengeDTO }) {
  const meta = CATEGORY_META[challenge.category] ?? CATEGORY_META.daily;
  const Icon = challenge.completed ? CheckCircle2 : Target;

  return (
    <div style={{
      position: 'relative',
      padding: '13px',
      borderRadius: '8px',
      border: `1px solid ${challenge.completed ? 'rgba(46,204,113,0.35)' : 'rgba(255,255,255,0.08)'}`,
      background: challenge.completed ? 'rgba(46,204,113,0.08)' : 'rgba(255,255,255,0.035)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: '0 auto 0 0',
        width: '3px',
        background: challenge.completed ? '#2ecc71' : meta.color,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{
          width: '30px',
          height: '30px',
          display: 'grid',
          placeItems: 'center',
          borderRadius: '7px',
          color: challenge.completed ? '#d8ffe6' : '#fff4ec',
          background: challenge.completed
            ? 'rgba(46,204,113,0.18)'
            : `linear-gradient(135deg, ${meta.color}, rgba(201,151,58,0.8))`,
          flexShrink: 0,
        }}>
          <Icon size={16} aria-hidden="true" />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <strong style={{
              color: '#e8e2df',
              fontSize: '13px',
              lineHeight: 1.2,
              fontFamily: 'Cinzel, serif',
              letterSpacing: '0.02em',
            }}>
              {challenge.title}
            </strong>
            <span style={{
              color: meta.color,
              border: `1px solid ${meta.color}44`,
              background: `${meta.color}14`,
              borderRadius: '4px',
              padding: '1px 5px',
              fontSize: '9px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {DIFFICULTY_LABEL[challenge.difficulty]}
            </span>
          </div>

          <p style={{
            margin: '0 0 9px',
            color: 'rgba(232,226,223,0.62)',
            fontSize: '11px',
            lineHeight: 1.35,
          }}>
            {challenge.description}
          </p>

          <div style={{ display: 'grid', gap: '6px' }}>
            <div style={{
              height: '7px',
              borderRadius: '7px',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.07)',
            }}>
              <div style={{
                width: `${Math.min(100, challenge.progressPercent)}%`,
                height: '100%',
                borderRadius: 'inherit',
                background: challenge.completed
                  ? 'linear-gradient(90deg, #2ecc71, #8df0b2)'
                  : `linear-gradient(90deg, ${meta.color}aa, ${meta.color})`,
                boxShadow: `0 0 12px ${challenge.completed ? 'rgba(46,204,113,0.28)' : `${meta.color}55`}`,
                transition: 'width 0.35s ease',
              }} />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              color: 'rgba(232,226,223,0.58)',
              fontSize: '10.5px',
              fontWeight: 700,
            }}>
              <span>{challenge.current}/{challenge.goal} · {challenge.progressPercent}%</span>
              <span style={{ color: '#c9973a', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <Trophy size={11} aria-hidden="true" />
                +{challenge.rewardXP.toLocaleString('pt-BR')} XP
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChallengeWidget({ compact = false }: { compact?: boolean }) {
  const [dashboard, setDashboard] = useState<ChallengeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'daily' | 'weekly' | 'special'>('daily');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/gamification/challenges', { cache: 'no-store' });
      if (res.ok) setDashboard(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const items = dashboard?.active ?? [];
    return items.filter((challenge) => challenge.category === activeCategory);
  }, [dashboard, activeCategory]);

  const completedCount = visible.filter((challenge) => challenge.completed).length;
  const nextExpiry = visible[0]?.expiresAt;

  const resetDaily = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/gamification/reset-daily-challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeCategory }),
      });
      if (res.ok) setDashboard(await res.json());
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section style={{
      border: '1px solid rgba(230,125,153,0.14)',
      borderRadius: compact ? '8px' : '10px',
      background: 'rgba(26,23,23,0.58)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: compact ? '12px 13px' : '16px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{
            margin: 0,
            color: '#e8e2df',
            fontSize: compact ? '12px' : '15px',
            fontFamily: 'Cinzel, serif',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Desafios
          </h2>
          <p style={{ margin: '3px 0 0', color: 'rgba(232,226,223,0.45)', fontSize: '11px' }}>
            {loading ? 'Carregando missoes...' : `${completedCount}/${visible.length} completos${nextExpiry ? ` · expira em ${fmtTimeLeft(nextExpiry)}` : ''}`}
          </p>
        </div>

        <button
          type="button"
          onClick={resetDaily}
          disabled={refreshing || loading}
          title="Regenerar desafios deste periodo"
          style={{
            width: '34px',
            height: '34px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '7px',
            border: '1px solid rgba(230,125,153,0.28)',
            color: 'rgb(230,125,153)',
            background: 'rgba(230,125,153,0.08)',
            cursor: refreshing || loading ? 'wait' : 'pointer',
          }}
        >
          <RefreshCw size={15} aria-hidden="true" style={{ animation: refreshing ? 'challengeSpin 0.8s linear infinite' : undefined }} />
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {(['daily', 'weekly', 'special'] as const).map((category) => {
          const meta = CATEGORY_META[category];
          const Icon = meta.icon;
          const active = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                minHeight: '36px',
                border: 0,
                borderRight: category !== 'special' ? '1px solid rgba(255,255,255,0.06)' : 0,
                color: active ? meta.color : 'rgba(232,226,223,0.52)',
                background: active ? `${meta.color}12` : 'transparent',
                fontSize: '10.5px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              <Icon size={12} aria-hidden="true" />
              {meta.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: compact ? '12px' : '14px', display: 'grid', gap: '10px' }}>
        {loading ? (
          [0, 1, 2].map((item) => (
            <div key={item} style={{
              height: '92px',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
              backgroundSize: '220% 100%',
              animation: 'challengeSkeleton 1.2s ease-in-out infinite',
            }} />
          ))
        ) : visible.length > 0 ? (
          visible.map((challenge) => <ChallengeRow key={challenge.id} challenge={challenge} />)
        ) : (
          <div style={{
            padding: '24px 14px',
            textAlign: 'center',
            color: 'rgba(232,226,223,0.44)',
            fontSize: '12px',
            lineHeight: 1.45,
          }}>
            Nenhum desafio ativo neste periodo.
          </div>
        )}
      </div>

      <style>{`
        @keyframes challengeSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes challengeSkeleton {
          0% { background-position: 120% 0; }
          100% { background-position: -120% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </section>
  );
}
