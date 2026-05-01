'use client';

import { useEffect, useState, useRef } from 'react';
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

// ── Estilos de animação injetados uma única vez ────────────────────────────────

const GREEK_KEYFRAMES = `
@keyframes xpBarFill {
  from { width: 0%; }
}
@keyframes olympusGlow {
  0%, 100% { box-shadow: 0 0 12px rgba(201,151,58,0.3), inset 0 0 20px rgba(201,151,58,0.05); }
  50%       { box-shadow: 0 0 28px rgba(201,151,58,0.55), inset 0 0 30px rgba(201,151,58,0.12); }
}
@keyframes laurelShimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes tooltipIn {
  from { opacity: 0; transform: translateY(4px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes particleFloat {
  0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.7; }
  100% { transform: translateY(-30px) translateX(8px) scale(0); opacity: 0; }
}
@keyframes streakFlicker {
  0%, 100% { opacity: 1; }
  45%       { opacity: 0.85; }
  50%       { opacity: 1; }
  55%       { opacity: 0.9; }
}
@keyframes borderSerpent {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes xpRemainingPulse {
  0%, 100% { opacity: 0.65; }
  50%       { opacity: 1; }
}
`;

function InjectStyles() {
  return <style dangerouslySetInnerHTML={{ __html: GREEK_KEYFRAMES }} />;
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
      animation: 'fadeSlideIn 0.4s ease both',
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

// ── Barra de XP com animação grega ────────────────────────────────────────────

function XPBar({ percent, currentXP, xpToNext, xpRemaining, nextLevelName }: {
  percent: number;
  currentXP: number;
  xpToNext: number;
  xpRemaining: number;
  nextLevelName: string | null;
}) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  const safePercent = Math.min(100, Math.max(0, percent));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Barra principal */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '14px',
        background: 'var(--hades-surface)',
        borderRadius: '7px',
        overflow: 'hidden',
        border: '1px solid rgba(201,151,58,0.15)',
      }}>
        {/* Preenchimento com gradiente animado */}
        <div style={{
          width: animated ? `${safePercent}%` : '0%',
          height: '100%',
          background: 'linear-gradient(90deg, #c9973a 0%, #e8c46a 40%, #c9973a 70%, #f0d080 100%)',
          backgroundSize: '200% 100%',
          animation: animated
            ? `xpBarFill 1s cubic-bezier(0.22,1,0.36,1) both, laurelShimmer 3s linear infinite`
            : 'none',
          borderRadius: '7px',
          boxShadow: '0 0 10px rgba(201,151,58,0.45)',
          transition: 'width 1s cubic-bezier(0.22,1,0.36,1)',
          position: 'relative',
        }}>
          {/* Brilho interno */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)',
            borderRadius: '7px 7px 0 0',
          }} />
        </div>

        {/* Marcador de posição atual */}
        {safePercent > 2 && safePercent < 98 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: `${safePercent}%`,
            transform: 'translate(-50%, -50%)',
            width: '3px',
            height: '20px',
            background: '#f0d080',
            borderRadius: '2px',
            boxShadow: '0 0 6px #c9973a',
          }} />
        )}
      </div>

      {/* Legenda abaixo da barra */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Overpass, sans-serif' }}>
          {fmtCompact(currentXP)} <span style={{ color: 'rgba(201,151,58,0.5)' }}>/</span> {fmtCompact(xpToNext)} XP
          <span style={{
            display: 'inline-block',
            marginLeft: '8px',
            padding: '1px 7px',
            borderRadius: '4px',
            background: 'rgba(201,151,58,0.1)',
            border: '1px solid rgba(201,151,58,0.25)',
            color: '#c9973a',
            fontSize: '11px',
            fontWeight: 700,
            animation: 'xpRemainingPulse 2s ease-in-out infinite',
          }}>
            {fmt(xpRemaining)} XP restantes
          </span>
        </span>
        {nextLevelName && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Overpass, sans-serif' }}>
            Próximo: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{nextLevelName}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ── Tooltip de conquista ───────────────────────────────────────────────────────

function AchievementTooltip({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
  const color = RARITY_COLOR[achievement.rarity];
  return (
    <div style={{
      position: 'absolute',
      bottom: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '220px',
      background: 'var(--hades-deep, #0e0c10)',
      border: `1px solid ${color}55`,
      borderRadius: '8px',
      padding: '12px 14px',
      zIndex: 100,
      pointerEvents: 'none',
      animation: 'tooltipIn 0.18s ease both',
      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${color}22`,
    }}>
      {/* Seta */}
      <div style={{
        position: 'absolute',
        bottom: '-6px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '10px',
        height: '6px',
        background: 'var(--hades-deep, #0e0c10)',
        clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
        borderBottom: `1px solid ${color}55`,
      }} />

      {/* Ícone + nome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '22px', lineHeight: 1 }}>
          {unlocked ? achievement.icon : '🔒'}
        </span>
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'Cinzel, serif',
            color: unlocked ? '#e8e2df' : 'var(--text-muted)',
            letterSpacing: '0.02em',
            lineHeight: 1.2,
          }}>
            {achievement.name}
          </div>
          <div style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color,
            marginTop: '2px',
          }}>
            {RARITY_LABEL[achievement.rarity]}
          </div>
        </div>
      </div>

      {/* Descrição */}
      <div style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontFamily: 'Overpass, sans-serif',
        lineHeight: 1.5,
        marginBottom: '8px',
        borderBottom: `1px solid ${color}22`,
        paddingBottom: '8px',
      }}>
        {achievement.description}
      </div>

      {/* Como desbloquear */}
      <div style={{ fontSize: '11px', color: unlocked ? '#c9973a' : 'var(--text-secondary)', fontFamily: 'Overpass, sans-serif', lineHeight: 1.4 }}>
        <span style={{ fontWeight: 700, color: unlocked ? '#c9973a' : color, display: 'block', marginBottom: '2px', fontSize: '9px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {unlocked ? '✓ Desbloqueada' : 'Como obter'}
        </span>
        {unlocked
          ? `+${achievement.xpReward} XP recebidos`
          : achievement.howToUnlock}
      </div>
    </div>
  );
}

// ── Card de conquista com tooltip ──────────────────────────────────────────────

function AchievementCard({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
  const color = RARITY_COLOR[achievement.rarity];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: unlocked ? 'var(--hades-card)' : 'var(--hades-deep)',
        border: `1px solid ${unlocked ? color + '44' : 'var(--hades-border)'}`,
        borderRadius: '8px',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: unlocked ? 1 : 0.5,
        transition: 'all 0.2s ease',
        filter: unlocked ? 'none' : 'grayscale(0.7)',
        position: 'relative',
        overflow: 'visible',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered
          ? (unlocked ? `0 6px 20px ${color}25, 0 0 0 1px ${color}33` : '0 4px 14px rgba(0,0,0,0.4)')
          : 'none',
      }}
    >
      {/* Linha de raridade no topo */}
      {unlocked && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '2px',
          background: color,
          boxShadow: `0 0 8px ${color}66`,
        }} />
      )}

      {/* Ícone */}
      <span style={{ fontSize: '26px', lineHeight: 1, flexShrink: 0 }}>
        {unlocked ? achievement.icon : '🔒'}
      </span>

      {/* Conteúdo */}
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

      {/* Tooltip ao hover */}
      {hovered && (
        <AchievementTooltip achievement={achievement} unlocked={unlocked} />
      )}
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
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        color: 'var(--text-muted)',
        fontFamily: 'Overpass, sans-serif',
      }}>
        {/* Spinner grego */}
        <div style={{
          width: '40px',
          height: '40px',
          border: '2px solid rgba(201,151,58,0.15)',
          borderTop: '2px solid rgba(201,151,58,0.7)',
          borderRadius: '50%',
          animation: 'laurelShimmer 0.8s linear infinite',
        }} />
        <span style={{ fontSize: '13px', letterSpacing: '0.06em' }}>Invocando os deuses...</span>
        <InjectStyles />
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
      <InjectStyles />

      {/* ── Header ── */}
      <div style={{ marginBottom: '36px', animation: 'fadeSlideIn 0.5s ease both' }}>
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
        border: '1px solid rgba(201,151,58,0.2)',
        borderRadius: '12px',
        padding: '28px 32px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        animation: 'olympusGlow 4s ease-in-out infinite, fadeSlideIn 0.5s ease both',
      }}>
        {/* Fundo decorativo grego */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at top right, rgba(201,151,58,0.08) 0%, transparent 55%), radial-gradient(ellipse at bottom left, rgba(232,105,144,0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        {/* Padrão grego sutil no topo */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, transparent, rgba(201,151,58,0.3), rgba(201,151,58,0.7), rgba(201,151,58,0.3), transparent)',
          backgroundSize: '200% 100%',
          animation: 'borderSerpent 4s linear infinite',
        }} />

        {/* Topo: Nível + XP total */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}>
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
            <div style={{
              fontSize: '22px',
              fontWeight: 700,
              fontFamily: 'Cinzel, serif',
              color: '#e8e2df',
              letterSpacing: '0.03em',
            }}>
              {stats.levelName}
            </div>
            {stats.reward && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                🎁 {stats.reward}
              </div>
            )}
          </div>

          {/* XP Total com destaque */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px', letterSpacing: '0.04em' }}>
              XP Total
            </div>
            <div style={{
              fontSize: '26px',
              fontWeight: 900,
              color: '#c9973a',
              fontFamily: 'Cinzel, serif',
              textShadow: '0 0 20px rgba(201,151,58,0.4)',
            }}>
              {fmt(stats.totalXP)}
            </div>
          </div>
        </div>

        {/* Barra de XP melhorada */}
        <XPBar
          percent={stats.xpPercent}
          currentXP={stats.currentXP}
          xpToNext={stats.xpToNext}
          xpRemaining={stats.xpRemaining}
          nextLevelName={stats.nextLevelName}
        />
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
          label="Nível"
          value={stats.level}
          sub={stats.levelName}
          color="var(--asphodel)"
        />
        <StatCard
          icon={<Zap size={16} />}
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{
                fontFamily: 'Cinzel, serif',
                fontSize: '16px',
                fontWeight: 700,
                color: '#e8e2df',
                letterSpacing: '0.04em',
              }}>
                Conquistas
              </h2>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                background: 'var(--hades-surface)',
                border: '1px solid var(--hades-border)',
                borderRadius: '4px',
                padding: '2px 7px',
                fontFamily: 'Overpass, sans-serif',
              }}>
                {unlockedCount} / {totalAchievements}
              </span>
            </div>
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

          {/* Dica de hover */}
          <p style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            fontFamily: 'Overpass, sans-serif',
            letterSpacing: '0.03em',
          }}>
            🖱️ Passe o mouse sobre uma conquista para ver como desbloqueá-la.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '10px',
          }}>
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
            animation: 'fadeSlideIn 0.5s 0.1s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Flame
                size={15}
                color={streakActive ? '#e8855a' : 'var(--text-muted)'}
                style={{ animation: streakActive ? 'streakFlicker 2s ease-in-out infinite' : 'none' }}
              />
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
            <StreakCalendar lastActivityDay={stats.streak.lastActivityDay} currentStreak={stats.streak.current} />
          </div>

          {/* Atividade recente */}
          <div style={{
            background: 'var(--hades-card)',
            border: '1px solid var(--hades-border)',
            borderRadius: '8px',
            padding: '20px',
            animation: 'fadeSlideIn 0.5s 0.2s ease both',
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
                    transition: 'background 0.15s',
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
              background: isActive ? 'rgba(232,133,90,0.75)' : 'var(--hades-surface)',
              border: isToday ? '1px solid var(--flame)' : '1px solid transparent',
              transition: 'background 0.2s',
              boxShadow: isActive ? '0 0 4px rgba(232,133,90,0.4)' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}