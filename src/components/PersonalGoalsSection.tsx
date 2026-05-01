'use client';

import { useState, useEffect, useCallback } from 'react';
import { goalProgressPercent, goalDaysLeft, type PersonalGoal } from '@/lib/personal-goals';
import PersonalGoalModal from './PersonalGoalModal';

// ─── Sub-componente: card individual de uma meta ──────────────────────────────

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onTogglePin,
  onComplete,
}: {
  goal: PersonalGoal;
  onEdit: (g: PersonalGoal) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onComplete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const pct = goalProgressPercent(goal);
  const daysLeft = goalDaysLeft(goal);

  const barColor = goal.completed
    ? '#2ecc71'
    : pct >= 80
    ? '#e8699060'
    : pct >= 50
    ? 'rgba(232,105,144,0.5)'
    : 'rgba(232,105,144,0.3)';

  const barFill = goal.completed ? '#2ecc71' : 'rgb(232,105,144)';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${goal.completed ? 'rgba(46,204,113,0.25)' : goal.pinned ? 'rgba(232,105,144,0.3)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '8px',
        padding: '16px 18px',
        position: 'relative',
        transition: 'border-color 0.2s, background 0.2s',
        background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
      }}
    >
      {/* Pin indicator */}
      {goal.pinned && !goal.completed && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: '11px', color: 'rgba(232,105,144,0.7)',
        }}>📌</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '22px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>
          {goal.emoji}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: goal.completed ? '#2ecc71' : '#e5e5e5',
            lineHeight: 1.3,
            wordBreak: 'break-word',
            textDecoration: goal.completed ? 'line-through' : 'none',
            opacity: goal.completed ? 0.7 : 1,
          }}>
            {goal.title}
          </div>
          {goal.deadline && !goal.completed && (
            <div style={{ fontSize: '0.72rem', color: daysLeft === 0 ? '#e74c3c' : daysLeft !== null && daysLeft <= 7 ? '#f39c12' : 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
              {daysLeft === 0 ? '⚠ Hoje!' : daysLeft === 1 ? '⚠ Amanhã' : daysLeft !== null ? `${daysLeft}d restantes` : ''}
            </div>
          )}
        </div>
      </div>

      {/* Progresso numérico */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: '6px',
      }}>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
          {goal.completed ? 'Concluída ✓' : `${goal.current} / ${goal.target}${goal.unit ? ` ${goal.unit}` : ''}`}
        </span>
        <span style={{
          fontSize: '0.82rem',
          fontWeight: 700,
          color: goal.completed ? '#2ecc71' : pct >= 80 ? 'rgb(232,105,144)' : 'rgba(255,255,255,0.55)',
        }}>
          {pct}%
        </span>
      </div>

      {/* Barra de progresso */}
      <div style={{
        height: '4px', borderRadius: '2px',
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        marginBottom: goal.rewardXP > 0 ? '8px' : '0',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barFill,
          borderRadius: '2px',
          transition: 'width 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
          boxShadow: pct > 0 ? `0 0 6px ${barFill}80` : 'none',
        }} />
      </div>

      {/* Reward XP badge */}
      {goal.rewardXP > 0 && (
        <div style={{ fontSize: '0.7rem', color: 'rgba(232,105,144,0.6)', marginTop: '4px' }}>
          +{goal.rewardXP} XP ao completar
        </div>
      )}

      {/* Ações (visíveis no hover) */}
      <div style={{
        display: 'flex', gap: '6px', marginTop: '10px',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.2s',
        pointerEvents: hovered ? 'auto' : 'none',
      }}>
        {!goal.completed && (
          <button
            onClick={() => onComplete(goal.id)}
            title="Marcar como concluída"
            style={actionBtnStyle('#2ecc71')}
          >
            ✓ Concluir
          </button>
        )}
        {!goal.completed && (
          <button
            onClick={() => onEdit(goal)}
            style={actionBtnStyle('rgba(255,255,255,0.2)')}
          >
            ✎ Editar
          </button>
        )}
        <button
          onClick={() => onTogglePin(goal.id, !goal.pinned)}
          style={actionBtnStyle(goal.pinned ? 'rgba(232,105,144,0.3)' : 'rgba(255,255,255,0.1)')}
          title={goal.pinned ? 'Desafixar' : 'Fixar no topo'}
        >
          {goal.pinned ? '📌' : '📍'}
        </button>
        <button
          onClick={() => onDelete(goal.id)}
          style={actionBtnStyle('rgba(231,76,60,0.25)', '#e74c3c')}
        >
          🗑
        </button>
      </div>
    </div>
  );
}

function actionBtnStyle(bg: string, color = 'rgba(255,255,255,0.6)'): React.CSSProperties {
  return {
    background: bg,
    border: 'none',
    borderRadius: '4px',
    color,
    cursor: 'pointer',
    fontSize: '0.72rem',
    padding: '4px 8px',
    transition: 'opacity 0.15s',
  };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PersonalGoalsSection() {
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PersonalGoal | null>(null);
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/gamification/personal-goals');
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta meta?')) return;
    await fetch(`/api/gamification/personal-goals?id=${id}`, { method: 'DELETE' });
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleTogglePin = async (id: string, pinned: boolean) => {
    const res = await fetch('/api/gamification/personal-goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pinned }),
    });
    if (res.ok) {
      const updated = await res.json();
      setGoals(prev => prev.map(g => g.id === id ? updated : g));
    }
  };

  const handleComplete = async (id: string) => {
    const res = await fetch('/api/gamification/personal-goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'complete' }),
    });
    if (res.ok) {
      const updated = await res.json();
      setGoals(prev => prev.map(g => g.id === id ? updated : g));
    }
  };

  const handleSaved = (goal: PersonalGoal, isNew: boolean) => {
    if (isNew) {
      setGoals(prev => [goal, ...prev]);
    } else {
      setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
    }
    setShowModal(false);
    setEditingGoal(null);
  };

  const filtered = goals.filter(g => {
    if (filter === 'active') return !g.completed;
    if (filter === 'completed') return g.completed;
    return true;
  });

  const activeCount = goals.filter(g => !g.completed).length;
  const completedCount = goals.filter(g => g.completed).length;

  // ─── Stats summary ────────────────────────────────────────────────────────
  const totalPct = activeCount > 0
    ? Math.round(goals.filter(g => !g.completed).reduce((acc, g) => acc + goalProgressPercent(g), 0) / activeCount)
    : 0;

  return (
    <div style={{ padding: '24px 0', maxWidth: '900px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#e5e5e5' }}>
            🎯 Metas Pessoais
          </h2>
          {activeCount > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
              {activeCount} ativa{activeCount !== 1 ? 's' : ''} · progresso médio {totalPct}%
            </p>
          )}
        </div>
        <button
          onClick={() => { setEditingGoal(null); setShowModal(true); }}
          style={{
            background: 'rgb(232,105,144)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 600,
            padding: '8px 16px',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + Nova Meta
        </button>
      </div>

      {/* ── Filter tabs ── */}
      {goals.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
          {([
            { key: 'active',    label: `Ativas (${activeCount})` },
            { key: 'completed', label: `Concluídas (${completedCount})` },
            { key: 'all',       label: 'Todas' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                background: filter === key ? 'rgba(232,105,144,0.15)' : 'transparent',
                border: `1px solid ${filter === key ? 'rgba(232,105,144,0.4)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '20px',
                color: filter === key ? 'rgb(232,105,144)' : 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '4px 12px',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', padding: '40px 0', textAlign: 'center' }}>
          Carregando metas...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} onNew={() => setShowModal(true)} />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
        }}>
          {filtered.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={g => { setEditingGoal(g); setShowModal(true); }}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <PersonalGoalModal
          goal={editingGoal}
          onClose={() => { setShowModal(false); setEditingGoal(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter, onNew }: { filter: string; onNew: () => void }) {
  if (filter === 'completed') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.3)' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏆</div>
        <div style={{ fontSize: '0.9rem' }}>Nenhuma meta concluída ainda.</div>
      </div>
    );
  }
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.3)' }}>
      <div style={{ fontSize: '40px', marginBottom: '14px' }}>🎯</div>
      <div style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
        Nenhuma meta ainda
      </div>
      <div style={{ fontSize: '0.82rem', marginBottom: '20px', maxWidth: '280px', margin: '0 auto 20px' }}>
        Crie sua primeira meta — ver todas as séries da lista, zerar os pausados, manter uma streak de 30 dias...
      </div>
      <button
        onClick={onNew}
        style={{
          background: 'rgba(232,105,144,0.15)',
          border: '1px solid rgba(232,105,144,0.35)',
          borderRadius: '6px',
          color: 'rgb(232,105,144)',
          cursor: 'pointer',
          fontSize: '0.82rem',
          fontWeight: 600,
          padding: '8px 20px',
        }}
      >
        + Criar primeira meta
      </button>
    </div>
  );
}