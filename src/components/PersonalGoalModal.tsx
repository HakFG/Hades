'use client';

import { useState, useEffect } from 'react';
import {
  GOAL_TEMPLATES,
  DIFFICULTY_CONFIG,
  GOAL_TYPE_MYTHS,
  suggestXPForGoal,
  type PersonalGoal,
  type GoalType,
} from '@/lib/personal-goals';

interface Props {
  goal: PersonalGoal | null;
  onClose: () => void;
  onSaved: (goal: PersonalGoal, isNew: boolean) => void;
}

type Step = 'pick' | 'form' | 'ai';

// ─── Emojis organizados por categoria ────────────────────────────────────────
const EMOJI_SETS = {
  'Conquista': ['🏆','⚔️','🛡️','👑','🎖️','🏅','⚡','🌟'],
  'Mídia':     ['📺','🎬','🎭','🎞️','📽️','🎥','📼','🎪'],
  'Jornada':   ['🔥','⭐','💫','✨','🌙','☀️','🌊','🏛️'],
  'Progresso': ['📈','✅','🎯','⏯️','📜','🗝️','⚗️','🔮'],
};

export default function PersonalGoalModal({ goal, onClose, onSaved }: Props) {
  const isEditing = !!goal;
  const [step, setStep] = useState<Step>(isEditing ? 'form' : 'pick');

  // ── Form state ──
  const [title, setTitle] = useState(goal?.title ?? '');
  const [type, setType] = useState<GoalType>(goal?.type ?? 'episodes');
  const [target, setTarget] = useState(goal?.target?.toString() ?? '');
  const [unit, setUnit] = useState(goal?.unit ?? '');
  const [emoji, setEmoji] = useState(goal?.emoji ?? '🎯');
  const [deadline, setDeadline] = useState(
    goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : ''
  );
  const [rewardXP, setRewardXP] = useState(goal?.rewardXP?.toString() ?? '0');
  const [pinned, setPinned] = useState(goal?.pinned ?? false);
  const [difficulty, setDifficulty] = useState<PersonalGoal['difficulty']>(
    (goal as any)?.difficulty ?? 'mortal'
  );
  const [notes, setNotes] = useState((goal as any)?.notes ?? '');
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_SETS>('Conquista');
  const [currentProgress, setCurrentProgress] = useState(goal?.current?.toString() ?? '0');

  const selectedTemplate = GOAL_TEMPLATES.find((t) => t.type === type);
  const mythData = GOAL_TYPE_MYTHS[type] ?? GOAL_TYPE_MYTHS.custom;

  // ── AI assistant state ──
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    title: string;
    type: GoalType;
    target: number;
    unit: string;
    emoji: string;
    deadline?: string;
    rewardXP: number;
    notes?: string;
  }>>([]);
  const [aiError, setAiError] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-sugere XP ao mudar tipo/target/difficulty
  useEffect(() => {
    if (!isEditing && target && difficulty) {
      const suggested = suggestXPForGoal(type, Number(target), difficulty);
      setRewardXP(suggested.toString());
    }
  }, [type, target, difficulty, isEditing]);

  // Fecha com Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function pickTemplate(templateType: GoalType) {
    const t = GOAL_TEMPLATES.find(t => t.type === templateType);
    if (t) {
      setType(t.type);
      setUnit(t.unit);
      setEmoji(t.emoji);
      setDifficulty(t.difficulty ?? 'mortal');
      if (t.suggestedTargets.length > 0) {
        const mid = t.suggestedTargets[Math.floor(t.suggestedTargets.length / 2)];
        setTarget(mid.toString());
      }
    }
    setStep('form');
  }

  // ── AI: gera sugestões de metas ──
  async function handleAISuggest() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiSuggestions([]);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `Você é o Oráculo de Delfos para um tracker de séries e filmes chamado Hades.
O usuário descreve o que quer alcançar. Gere 3 metas específicas, mensuráveis e motivadoras com linguagem épica e mitológica sutil.
Retorne SOMENTE JSON válido, sem markdown, sem backticks. Formato EXATO:
[
  {
    "title": "título épico e específico da meta",
    "type": "episodes|series_completed|movies_completed|paused_cleared|streak_days|score_avg|titles_genre|watchlist_cleared|custom",
    "target": 50,
    "unit": "eps",
    "emoji": "📺",
    "deadline": null,
    "rewardXP": 200,
    "notes": "dica motivacional curta e épica"
  }
]
Regras:
- title deve ser inspirador como "Cruzar o Estige: Zerar os Pausados" ou "100 Episódios — A Odisseia do Binge"
- deadline: string "YYYY-MM-DD" se fizer sentido, ou null
- rewardXP entre 25 e 1000 baseado na dificuldade estimada
- notes: uma frase mitológica motivadora curta (max 80 chars)
- emojis temáticos: épicos e relevantes`,
          messages: [{ role: 'user', content: aiPrompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.map((c: any) => c.text || '').join('') ?? '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setAiSuggestions(Array.isArray(parsed) ? parsed : []);
    } catch {
      setAiError('O Oráculo está em silêncio. Tente reformular ou crie manualmente.');
    } finally {
      setAiLoading(false);
    }
  }

  function applySuggestion(s: typeof aiSuggestions[0]) {
    setTitle(s.title);
    setType(s.type);
    setTarget(s.target.toString());
    setUnit(s.unit);
    setEmoji(s.emoji);
    setRewardXP(s.rewardXP.toString());
    setNotes(s.notes ?? '');
    if (s.deadline) setDeadline(s.deadline);
    setStep('form');
  }

  // ── Salvar ──
  async function handleSave() {
    if (!title.trim()) { setError('O título da meta é obrigatório.'); return; }
    if (!target || Number(target) <= 0) { setError('O target deve ser maior que zero.'); return; }
    if (deadline) {
      const d = new Date(deadline);
      if (isNaN(d.getTime()) || d < new Date()) {
        setError('O prazo deve ser uma data futura válida.');
        return;
      }
    }
    setSaving(true);
    setError('');

    try {
      const body = {
        title: title.trim(),
        type,
        target: Number(target),
        unit,
        emoji,
        deadline: deadline || null,
        rewardXP: Number(rewardXP),
        pinned,
        ...(isEditing && { current: Number(currentProgress) }),
      };

      if (isEditing) {
        const res = await fetch('/api/gamification/personal-goals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: goal.id, ...body }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? 'Erro desconhecido');
        }
        const updated = await res.json();
        onSaved(updated, false);
      } else {
        const res = await fetch('/api/gamification/personal-goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? 'Erro desconhecido');
        }
        const created = await res.json();
        onSaved(created, true);
      }
    } catch (e: any) {
      setError(e.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #0f0f1a 0%, #12101e 50%, #0a0a14 100%)',
          border: '1px solid rgba(232,105,144,0.2)',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(232,105,144,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header fixo ── */}
        <div style={{
          padding: '18px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
          background: 'rgba(0,0,0,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px',
              background: 'linear-gradient(135deg, rgba(232,105,144,0.25), rgba(155,89,182,0.2))',
              border: '1px solid rgba(232,105,144,0.3)',
              borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px',
            }}>
              {isEditing ? '✎' : step === 'ai' ? '🔮' : step === 'pick' ? '⚡' : (selectedTemplate?.emoji ?? '🎯')}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#e8e8f0', letterSpacing: '0.01em' }}>
                {isEditing
                  ? 'Editar Decreto'
                  : step === 'ai'
                  ? 'Oráculo de Delfos'
                  : step === 'pick'
                  ? 'Novo Decreto Mortal'
                  : 'Forjar o Decreto'}
              </h3>
              {step === 'form' && !isEditing && (
                <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>
                  {mythData.deity} · {mythData.realm}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              fontSize: '13px',
              lineHeight: 1,
              padding: '5px 8px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            ✕
          </button>
        </div>

        {/* ── Content scrollável ── */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, minHeight: 0 }}>

          {/* ── STEP: pick ── */}
          {step === 'pick' && (
            <div>
              {/* Botão Oráculo / IA */}
              <button
                onClick={() => setStep('ai')}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(155,89,182,0.12), rgba(232,105,144,0.10))',
                  border: '1px solid rgba(232,105,144,0.28)',
                  borderRadius: '10px',
                  color: '#e5e5e5',
                  cursor: 'pointer',
                  padding: '14px 16px',
                  textAlign: 'left',
                  marginBottom: '20px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  transition: 'border-color 0.2s, background 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(232,105,144,0.5)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(155,89,182,0.18), rgba(232,105,144,0.16))';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(232,105,144,0.28)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(155,89,182,0.12), rgba(232,105,144,0.10))';
                }}
              >
                <div style={{
                  width: '40px', height: '40px', flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(155,89,182,0.3), rgba(232,105,144,0.25))',
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px',
                }}>🔮</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.87rem', color: 'rgb(232,105,144)', marginBottom: '2px' }}>
                    Consultar o Oráculo
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                    A IA de Delfos sugere metas épicas baseadas no seu relato
                  </div>
                </div>
                <div style={{ fontSize: '16px', color: 'rgba(232,105,144,0.5)' }}>→</div>
              </button>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
              }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  ou forja tu mesmo
                </span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              </div>

              {/* Templates grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {GOAL_TEMPLATES.map(t => {
                  const myth = GOAL_TYPE_MYTHS[t.type];
                  return (
                    <button
                      key={t.type}
                      onClick={() => pickTemplate(t.type)}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '9px',
                        color: '#c9d0d8',
                        cursor: 'pointer',
                        padding: '11px 12px',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(232,105,144,0.35)';
                        e.currentTarget.style.background = 'rgba(232,105,144,0.06)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }}
                    >
                      <div style={{ fontSize: '18px', marginBottom: '5px' }}>{t.emoji}</div>
                      <div style={{ fontSize: '0.77rem', fontWeight: 700, color: '#e0e0ee', marginBottom: '2px' }}>
                        {t.label}
                      </div>
                      <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.3 }}>
                        {t.description}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(232,105,144,0.45)', marginTop: '5px', fontStyle: 'italic' }}>
                        {myth?.deity}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP: ai (Oráculo) ── */}
          {step === 'ai' && (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(155,89,182,0.08), rgba(232,105,144,0.06))',
                border: '1px solid rgba(155,89,182,0.2)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "Gnôthi Seautón" — O Oráculo ouve tuas intenções e revela o caminho.<br />
                  Descreve o que buscas alcançar.
                </p>
              </div>

              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Ex: Tenho muitas séries pausadas acumulando há meses. Quero me forçar a terminar tudo que está abandonado, especialmente ficção científica. Também quero manter uma rotina mais consistente..."
                style={{
                  ...inputStyle,
                  minHeight: '110px',
                  resize: 'vertical',
                  lineHeight: 1.6,
                  fontSize: '0.83rem',
                }}
              />

              <button
                onClick={handleAISuggest}
                disabled={!aiPrompt.trim() || aiLoading}
                style={{
                  ...primaryBtnStyle,
                  width: '100%',
                  marginTop: '10px',
                  opacity: !aiPrompt.trim() || aiLoading ? 0.45 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '10px',
                }}
              >
                {aiLoading ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚗️</span>
                    O Oráculo consulta os deuses...
                  </>
                ) : (
                  <>🔮 Revelar Metas</>
                )}
              </button>

              {aiError && (
                <div style={{
                  marginTop: '10px', padding: '10px 12px',
                  background: 'rgba(231,76,60,0.08)',
                  border: '1px solid rgba(231,76,60,0.25)',
                  borderRadius: '6px',
                  color: '#e87c72', fontSize: '0.77rem',
                }}>
                  ⚠ {aiError}
                </div>
              )}

              {aiSuggestions.length > 0 && (
                <div style={{ marginTop: '18px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    O Oráculo revelou — escolha vossa saga:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {aiSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => applySuggestion(s)}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.09)',
                          borderRadius: '9px',
                          color: '#e5e5e5',
                          cursor: 'pointer',
                          padding: '12px 14px',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'rgba(232,105,144,0.45)';
                          e.currentTarget.style.background = 'rgba(232,105,144,0.06)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <span style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1.2 }}>{s.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#e8e8f0', marginBottom: '3px' }}>
                              {s.title}
                            </div>
                            {s.notes && (
                              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', marginBottom: '4px', lineHeight: 1.4 }}>
                                {s.notes}
                              </div>
                            )}
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              <span>Meta: {s.target} {s.unit}</span>
                              {s.deadline && <span>Prazo: {new Date(s.deadline).toLocaleDateString('pt-BR')}</span>}
                              <span style={{ color: 'rgba(232,105,144,0.7)' }}>+{s.rewardXP} XP</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(232,105,144,0.45)', flexShrink: 0 }}>→</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CSS spin animation */}
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── STEP: form ── */}
          {step === 'form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Flavor text mítico */}
              {!isEditing && (
                <div style={{
                  background: 'rgba(232,105,144,0.05)',
                  border: '1px solid rgba(232,105,144,0.12)',
                  borderRadius: '7px',
                  padding: '9px 12px',
                  display: 'flex', gap: '8px', alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>🏛️</span>
                  <p style={{ margin: 0, fontSize: '0.71rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    {mythData.flavorText}
                  </p>
                </div>
              )}

              {/* Emoji picker */}
              <div>
                <label style={labelStyle}>Brasão da Meta</label>
                {/* Category tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {(Object.keys(EMOJI_SETS) as Array<keyof typeof EMOJI_SETS>).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setEmojiCategory(cat)}
                      style={{
                        background: emojiCategory === cat ? 'rgba(232,105,144,0.15)' : 'transparent',
                        border: `1px solid ${emojiCategory === cat ? 'rgba(232,105,144,0.35)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '4px',
                        color: emojiCategory === cat ? 'rgb(232,105,144)' : 'rgba(255,255,255,0.35)',
                        cursor: 'pointer',
                        fontSize: '0.67rem',
                        padding: '2px 8px',
                        transition: 'all 0.12s',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {EMOJI_SETS[emojiCategory].map(e => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      style={{
                        background: emoji === e ? 'rgba(232,105,144,0.2)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${emoji === e ? 'rgba(232,105,144,0.55)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px 6px',
                        transition: 'all 0.12s',
                        transform: emoji === e ? 'scale(1.15)' : 'scale(1)',
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div>
                <label style={labelStyle}>Título do Decreto *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: A Odisseia dos Pausados"
                  maxLength={80}
                  style={inputStyle}
                  autoFocus={!isEditing}
                />
                {title.length > 60 && (
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '3px', textAlign: 'right' }}>
                    {title.length}/80
                  </div>
                )}
              </div>

              {/* Dificuldade */}
              <div>
                <label style={labelStyle}>Dificuldade</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '5px' }}>
                  {(Object.entries(DIFFICULTY_CONFIG) as Array<[NonNullable<PersonalGoal['difficulty']>, typeof DIFFICULTY_CONFIG[keyof typeof DIFFICULTY_CONFIG]]>).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setDifficulty(key)}
                      title={cfg.description}
                      style={{
                        background: difficulty === key ? `rgba(232,105,144,0.12)` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${difficulty === key ? 'rgba(232,105,144,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        padding: '7px 4px',
                        textAlign: 'center',
                        transition: 'all 0.12s',
                      }}
                    >
                      <div style={{ fontSize: '14px', marginBottom: '2px' }}>{cfg.emoji}</div>
                      <div style={{ fontSize: '0.64rem', color: difficulty === key ? cfg.color : 'rgba(255,255,255,0.35)', fontWeight: difficulty === key ? 700 : 400 }}>
                        {cfg.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target + Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Meta (target) *</label>
                  <input
                    type="number"
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    placeholder="Ex: 50"
                    min={1}
                    style={inputStyle}
                  />
                  {selectedTemplate?.suggestedTargets?.length ? (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {selectedTemplate.suggestedTargets.map((n) => (
                        <button
                          key={n}
                          onClick={() => setTarget(n.toString())}
                          style={{
                            background: target === n.toString() ? 'rgba(232,105,144,0.2)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${target === n.toString() ? 'rgba(232,105,144,0.45)' : 'rgba(255,255,255,0.09)'}`,
                            borderRadius: '4px',
                            color: target === n.toString() ? 'rgb(232,105,144)' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer',
                            fontSize: '0.68rem',
                            padding: '2px 7px',
                            transition: 'all 0.12s',
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div>
                  <label style={labelStyle}>Unidade</label>
                  <input
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="eps, séries, dias..."
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Edição: progresso atual */}
              {isEditing && (
                <div>
                  <label style={labelStyle}>Progresso atual</label>
                  <input
                    type="number"
                    value={currentProgress}
                    onChange={e => setCurrentProgress(e.target.value)}
                    min={0}
                    max={Number(target) || undefined}
                    style={inputStyle}
                  />
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: '3px' }}>
                    Para tipos com sync automático, use apenas se quiser corrigir manualmente.
                  </div>
                </div>
              )}

              {/* Deadline */}
              <div>
                <label style={labelStyle}>Prazo de Julgamento (opcional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={inputStyle}
                />
              </div>

              {/* Reward XP */}
              <div>
                <label style={labelStyle}>
                  Glória ao Concluir (XP)
                  {rewardXP !== '0' && (
                    <span style={{ marginLeft: '6px', color: 'rgba(232,105,144,0.6)', fontStyle: 'italic' }}>
                      sugerido para {difficulty ?? 'mortal'}
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {[0, 25, 50, 100, 200, 300, 500, 750, 1000].map(n => (
                    <button
                      key={n}
                      onClick={() => setRewardXP(n.toString())}
                      style={{
                        background: rewardXP === n.toString() ? 'rgba(232,105,144,0.18)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${rewardXP === n.toString() ? 'rgba(232,105,144,0.45)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '4px',
                        color: rewardXP === n.toString() ? 'rgb(232,105,144)' : 'rgba(255,255,255,0.45)',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        padding: '4px 8px',
                        transition: 'all 0.12s',
                        fontWeight: rewardXP === n.toString() ? 700 : 400,
                      }}
                    >
                      {n === 0 ? '—' : `+${n}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pinned toggle */}
              <button
                onClick={() => setPinned(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: pinned ? 'rgba(232,105,144,0.07)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${pinned ? 'rgba(232,105,144,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '7px',
                  cursor: 'pointer',
                  padding: '9px 12px',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '16px' }}>{pinned ? '📌' : '📍'}</span>
                <div>
                  <div style={{ fontSize: '0.77rem', fontWeight: 600, color: pinned ? 'rgb(232,105,144)' : 'rgba(255,255,255,0.55)' }}>
                    {pinned ? 'Inscrito nas Tábuas Eternas' : 'Fixar no topo'}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}>
                    Metas fixadas aparecem primeiro na lista
                  </div>
                </div>
              </button>

              {error && (
                <div style={{
                  padding: '9px 12px',
                  background: 'rgba(231,76,60,0.08)',
                  border: '1px solid rgba(231,76,60,0.25)',
                  borderRadius: '6px',
                  color: '#e87c72', fontSize: '0.77rem',
                }}>
                  ⚠ {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer fixo ── */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: '8px', justifyContent: 'flex-end',
          background: 'rgba(0,0,0,0.25)',
          flexShrink: 0,
        }}>
          {step === 'form' && !isEditing && (
            <button onClick={() => setStep('pick')} style={secondaryBtnStyle}>← Voltar</button>
          )}
          {step === 'ai' && (
            <button onClick={() => setStep('pick')} style={secondaryBtnStyle}>← Voltar</button>
          )}
          <button onClick={onClose} style={secondaryBtnStyle}>Cancelar</button>
          {step === 'form' && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ ...primaryBtnStyle, opacity: saving ? 0.55 : 1, minWidth: '110px' }}
            >
              {saving ? '⚗️ Forjando...' : isEditing ? '✓ Salvar' : '⚡ Forjar Meta'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Estilos compartilhados ───────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.71rem',
  color: 'rgba(255,255,255,0.38)',
  marginBottom: '6px',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '7px',
  color: '#e8e8f0',
  fontSize: '0.85rem',
  padding: '9px 11px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
};

const primaryBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgb(232,105,144), rgb(200,75,120))',
  border: 'none',
  borderRadius: '7px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontWeight: 700,
  padding: '9px 18px',
  letterSpacing: '0.02em',
  boxShadow: '0 2px 12px rgba(232,105,144,0.3)',
};

const secondaryBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '7px',
  color: 'rgba(255,255,255,0.5)',
  cursor: 'pointer',
  fontSize: '0.82rem',
  padding: '9px 14px',
};