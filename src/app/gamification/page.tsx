'use client';

import { useEffect, useState } from 'react';
import { Flame, Trophy, Zap, Star, Shield, Target, Activity } from 'lucide-react';
import { ACHIEVEMENTS, RARITY_COLOR, RARITY_LABEL, type Achievement, type AchievementRarity } from '@/lib/achievements';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface GamificationStats {
  userId: string;
  totalXP: number;
  level: number;
  levelName: string;
  currentXP: number;
  xpToNext: number;
  xpPercent: number;
  xpRemaining: number;
  nextLevelAt: number | null;
  nextLevelName: string | null;
  multiplier: number;
  reward: string;
  streak: {
    current: number;
    longest: number;
    lastActivityDay: string | null;
  };
  badges: string[];
  achievements: Achievement[];
  recentActivity: {
    id: string;
    action: string;
    label: string;
    xpGained: number;
    createdAt: string;
  }[];
}

function fmt(n: number) {
  return Intl.NumberFormat('pt-BR').format(n);
}

function fmtCompact(n: number) {
  return Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div style={{
      background: 'var(--hades-card)',
      border: '1px solid var(--hades-border)',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: color ?? 'var(--flame)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: color ?? 'var(--flame)' }}>
        {icon}
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'Overpass, sans-serif' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 900, color: color ?? 'var(--text-primary)', fontFamily: 'Cinzel, serif', letterSpacing: '0.02em' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Overpass, sans-serif' }}>{sub}</div>}
    </div>
  );
}

function XPBar({ percent, color = 'var(--flame)' }: { percent: number; color?: string }) {
  return (
    <div style={{
      width: '100%',
      height: '8px',
      background: 'var(--hades-surface)',
      borderRadius: '4px',
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${Math.min(100, percent)}%`,
        height: '100%',
        background: `linear-gradient(90deg, ${color}aa, ${color})`,
        borderRadius: '4px',
        transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: `0 0 8px ${color}55`,
      }} />
    </div>
  );
}

function AchievementCard({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
  const color = RARITY_COLOR[achievement.rarity];
  return (
    <div style={{
      background: unlocked ? 'var(--hades-card)' : 'var(--hades-deep)',
      border: `1px solid ${unlocked ? color + '44' : 'var(--hades-border)'}`,
      borderRadius: '8px',
      padding: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      opacity: unlocked ? 1 : 0.45,
      transition: 'all 0.2s',
      filter: unlocked ? 'none' : 'grayscale(0.8)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {unlocked && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: color }} />
      )}
      <span style={{ fontSize: '26px', lineHeight: 1, flexShrink: 0 }}>
        {unlocked ? achievement.icon : '🔒'}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            color: unlocked ? '#e8e2df' : 'var(--text-muted)',
            fontFamily: 'Cinzel, serif',
            letterSpacing: '0.02em',
          }}>
            {achievement.name}
          </span>
          <span style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color,
            background: color + '18',
            border: `1px solid ${color}44`,
            borderRadius: '3px',
            padding: '1px 5px',
            fontFamily: 'Overpass, sans-serif',
            flexShrink: 0,
          }}>
            {RARITY_LABEL[achievement.rarity]}
          </span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'Overpass, sans-serif' }}>
          {unlocked ? achievement.description : '???'}
        </div>
        {unlocked && (
          <div style={{ fontSize: '11px', color: '#c9973a', marginTop: '2px', fontFamily: 'Overpass, sans-serif' }}>
            +{achievement.xpReward} XP
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────────────────────

export default function GamificationPage() {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rarityFilter, setRarityFilter] = useState<AchievementRarity | 'all'>('all');

  useEffect(() => {
    fetch('/api/gamification/user-stats')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'Overpass, sans-serif' }}>
        Carregando dados...
      </div>
    );
  }

  if (!stats) return null;

  const unlockedIds = new Set(stats.badges);
  const rarities: (AchievementRarity | 'all')[] = ['all', 'common', 'rare', 'epic', 'legendary'];

  const filteredAchievements = ACHIEVEMENTS.filter(
    (a) => rarityFilter === 'all' || a.rarity === rarityFilter,
  ).sort((a, b) => {
    const ua = unlockedIds.has(a.id) ? 0 : 1;
    const ub = unlockedIds.has(b.id) ? 0 : 1;
    return ua - ub;
  });

  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)).length;

  // Verifica se houve atividade hoje para streak visual
  const streakActive = stats.streak.lastActivityDay
    ? new Date(stats.streak.lastActivityDay).toDateString() === new Date().toDateString()
    : false;

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '40px 24px',
      fontFamily: 'Overpass, sans-serif',
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '36px' }}>
        <h1 style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '28px',
          fontWeight: 900,
          letterSpacing: '0.06em',
          background: 'linear-gradient(135deg, #e8e2df, var(--flame), var(--gold))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '4px',
        }}>
          Gamificação
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', letterSpacing: '0.04em' }}>
          Seu progresso, conquistas e histórico de XP
        </p>
      </div>

      {/* ── Nível atual + barra de XP (destaque) ── */}
      <div style={{
        background: 'var(--hades-card)',
        border: '1px solid var(--hades-border)',
        borderRadius: '12px',
        padding: '28px 32px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at top right, rgba(230,125,153,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                background: 'var(--flame-faint)',
                border: '1px solid var(--flame-dim)',
                borderRadius: '6px',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--flame)',
                fontWeight: 700,
                fontSize: '14px',
              }}>
                <Trophy size={14} />
                Nível {stats.level}
              </div>
              {stats.multiplier > 1 && (
                <div style={{
                  background: 'rgba(201,151,58,0.1)',
                  border: '1px solid rgba(201,151,58,0.3)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: 'var(--gold)',
                  fontWeight: 700,
                  fontSize: '13px',
                }}>
                  <Zap size={12} />
                  {stats.multiplier.toFixed(2)}x XP
                </div>
              )}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Cinzel, serif', color: '#e8e2df', letterSpacing: '0.03em' }}>
              {stats.levelName}
            </div>
            {stats.reward && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                🎁 {stats.reward}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '2px' }}>XP Total</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--flame)', fontFamily: 'Cinzel, serif' }}>
              {fmt(stats.totalXP)}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <XPBar percent={stats.xpPercent} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>{fmtCompact(stats.currentXP)} / {fmtCompact(stats.xpToNext)} XP</span>
          {stats.nextLevelName && (
            <span>Próximo: <span style={{ color: 'var(--text-secondary)' }}>{stats.nextLevelName}</span> — faltam {fmt(stats.xpRemaining)} XP</span>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <StatCard
          icon={<Flame size={16} />}
          label="Streak Atual"
          value={stats.streak.current}
          sub={`Maior: ${stats.streak.longest} dias`}
          color={streakActive ? '#e8855a' : 'var(--text-muted)'}
        />
        <StatCard
          icon={<Shield size={16} />}
          label="Conquistas"
          value={`${unlockedCount}/${totalAchievements}`}
          sub={`${Math.round((unlockedCount / totalAchievements) * 100)}% completo`}
          color="var(--gold)"
        />
        <StatCard
          icon={<Star size={16} />}
          label="Multiplicador"
          value={`${stats.multiplier.toFixed(2)}x`}
          sub="Bônus de XP por nível"
          color="var(--asphodel)"
        />
        <StatCard
          icon={<Target size={16} />}
          label="Próximo Nível"
          value={stats.nextLevelName ?? '—'}
          sub={stats.nextLevelAt ? `${fmt(stats.xpRemaining)} XP restantes` : 'Nível máximo!'}
          color="var(--flame)"
        />
      </div>

      {/* ── Grid principal: Achievements + Atividade ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '24px',
        alignItems: 'start',
      }}>

        {/* ── Achievements ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '16px', fontWeight: 700, color: '#e8e2df', letterSpacing: '0.04em' }}>
              Conquistas
            </h2>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {rarities.map((r) => (
                <button
                  key={r}
                  onClick={() => setRarityFilter(r)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: 'Overpass, sans-serif',
                    transition: 'all 0.15s',
                    borderColor: rarityFilter === r
                      ? (r === 'all' ? 'var(--flame)' : RARITY_COLOR[r as AchievementRarity])
                      : 'var(--hades-border-md)',
                    color: rarityFilter === r
                      ? (r === 'all' ? 'var(--flame)' : RARITY_COLOR[r as AchievementRarity])
                      : 'var(--text-muted)',
                    background: rarityFilter === r
                      ? (r === 'all' ? 'var(--flame-faint)' : RARITY_COLOR[r as AchievementRarity] + '18')
                      : 'transparent',
                  }}
                >
                  {r === 'all' ? 'Todos' : RARITY_LABEL[r as AchievementRarity]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
            {filteredAchievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} unlocked={unlockedIds.has(a.id)} />
            ))}
          </div>
        </div>

        {/* ── Atividade Recente + Streak Calendar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Streak visual */}
          <div style={{
            background: 'var(--hades-card)',
            border: '1px solid var(--hades-border)',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Flame size={15} color={streakActive ? '#e8855a' : 'var(--text-muted)'} />
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', fontWeight: 700, color: '#e8e2df' }}>
                Streak
              </span>
            </div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
              {[
                { label: 'Atual', value: stats.streak.current, color: streakActive ? '#e8855a' : 'var(--text-secondary)' },
                { label: 'Recorde', value: stats.streak.longest, color: 'var(--gold)' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'Cinzel, serif', color }}>{value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</div>
                </div>
              ))}
            </div>
            {/* Mini calendário — últimos 28 dias */}
            <StreakCalendar lastActivityDay={stats.streak.lastActivityDay} currentStreak={stats.streak.current} />
          </div>

          {/* Atividade recente */}
          <div style={{
            background: 'var(--hades-card)',
            border: '1px solid var(--hades-border)',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Activity size={15} color="var(--flame)" />
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', fontWeight: 700, color: '#e8e2df' }}>
                Atividade Recente
              </span>
            </div>
            {stats.recentActivity.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Nenhuma atividade ainda.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.recentActivity.map((a) => (
                  <div key={a.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: 'var(--hades-surface)',
                    borderRadius: '5px',
                    gap: '8px',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: '#e8e2df', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.label}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {relativeDate(a.createdAt)}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--flame)',
                      flexShrink: 0,
                    }}>
                      +{fmt(a.xpGained)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Calendário de streak (últimos 28 dias) ────────────────────────────────────

function StreakCalendar({ lastActivityDay, currentStreak }: {
  lastActivityDay: string | null;
  currentStreak: number;
}) {
  const days = 28;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Estima quais dias foram ativos com base no streak e lastActivityDay
  const lastActive = lastActivityDay ? new Date(lastActivityDay) : null;
  if (lastActive) lastActive.setHours(0, 0, 0, 0);

  const activeDays = new Set<number>();
  if (lastActive) {
    const lastTs = lastActive.getTime();
    for (let i = 0; i < currentStreak; i++) {
      activeDays.add(lastTs - i * 86400000);
    }
  }

  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getTime() - (days - 1 - i) * 86400000);
    d.setHours(0, 0, 0, 0);
    const isActive = activeDays.has(d.getTime());
    const isToday = d.getTime() === today.getTime();
    return { date: d, isActive, isToday };
  });

  const weekLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '3px' }}>
        {weekLabels.map((l, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>{l}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {cells.map(({ date, isActive, isToday }, i) => (
          <div
            key={i}
            title={date.toLocaleDateString('pt-BR')}
            style={{
              aspectRatio: '1',
              borderRadius: '3px',
              background: isActive
                ? 'rgba(232, 133, 90, 0.75)'
                : 'var(--hades-surface)',
              border: isToday ? '1px solid var(--flame)' : '1px solid transparent',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  );
}