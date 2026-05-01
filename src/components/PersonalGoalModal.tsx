'use client';

import { useState, useEffect } from 'react';
import { GOAL_TEMPLATES, type PersonalGoal, type GoalType } from '@/lib/personal-goals';

interface Props {
  goal: PersonalGoal | null; // null = criando novo
  onClose: () => void;
  onSaved: (goal: PersonalGoal, isNew: boolean) => void;
}

type Step = 'pick' | 'form' | 'ai';

export default function PersonalGoalModal({ goal, onClose, onSaved }: Props) {
  const isEditing = !!goal;

  // ── Step control (só relevante ao criar) ──
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

  const selectedTemplate = GOAL_TEMPLATES.find((t) => t.type === type);

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
  }>>([]);
  const [aiError, setAiError] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fecha com Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  // Quando seleciona um template, preenche os defaults
  function pickTemplate(templateType: GoalType) {
    const t = GOAL_TEMPLATES.find(t => t.type === templateType);
    if (t) {
      setType(t.type);
      setUnit(t.unit);
      setEmoji(t.emoji);
      if (t.suggestedTargets.length > 0) {
        setTarget(t.suggestedTargets[Math.floor(t.suggestedTargets.length / 2)].toString());
      }
    }
    setStep('form');
  }

  // ── AI: pede sugestões de metas ──
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
          system: `Você é um assistente de metas pessoais para um tracker de séries e filmes.
O usuário vai descrever o que quer alcançar. Gere 3 metas específicas, mensuráveis e motivadoras com base nisso.
Retorne SOMENTE JSON válido, sem markdown, sem explicações. Formato:
[
  {
    "title": "título curto da meta",
    "type": "episodes|series_completed|movies_completed|paused_cleared|streak_days|score_avg|titles_genre|custom",
    "target": 50,
    "unit": "eps",
    "emoji": "📺",
    "deadline": "2026-12-31",
    "rewardXP": 200
  }
]
Regras:
- title deve ser inspirador e específico (ex: "Zerar todas as séries pausadas", "100 episódios em Maio")
- deadline só inclua se fizer sentido para o contexto descrito; formato YYYY-MM-DD
- rewardXP entre 50 e 500 dependendo da dificuldade
- use emojis relevantes
- deadline pode ser null se não mencionado`,
          messages: [{ role: 'user', content: aiPrompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.map((c: any) => c.text || '').join('') ?? '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setAiSuggestions(parsed);
    } catch (err) {
      setAiError('Não consegui gerar sugestões. Tente reformular ou crie manualmente.');
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
    if (s.deadline) setDeadline(s.deadline);
    setStep('form');
  }

  // ── Salvar ──
  async function handleSave() {
    if (!title.trim() || !target) {
      setError('Preencha o título e o target.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const body = { title, type, target: Number(target), unit, emoji, deadline: deadline || null, rewardXP: Number(rewardXP), pinned };

      if (isEditing) {
        const res = await fetch('/api/gamification/personal-goals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: goal.id, ...body }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        onSaved(updated, false);
      } else {
        const res = await fetch('/api/gamification/personal-goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        onSaved(created, true);
      }
    } catch {
      setError('Erro ao salvar. Tente novamente.');
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
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#e5e5e5' }}>
            {isEditing ? '✎ Editar Meta' : step === 'ai' ? '✨ Assistente de Metas' : step === 'pick' ? '🎯 Nova Meta' : '🎯 Configurar Meta'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px 6px' }}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>

          {/* ── STEP: pick (tipo ou AI) ── */}
          {step === 'pick' && (
            <div>
              {/* Botão AI em destaque */}
              <button
                onClick={() => setStep('ai')}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(232,105,144,0.15), rgba(155,89,182,0.15))',
                  border: '1px solid rgba(232,105,144,0.3)',
                  borderRadius: '8px',
                  color: '#e5e5e5',
                  cursor: 'pointer',
                  padding: '14px 16px',
                  textAlign: 'left',
                  marginBottom: '16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}
              >
                <span style={{ fontSize: '24px' }}>✨</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'rgb(232,105,144)' }}>Criar com assistente</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>Descreva em palavras livres e a IA sugere metas para você</div>
                </div>
              </button>

              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: '12px' }}>
                — ou escolha um tipo —
              </div>

              {/* Templates grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {GOAL_TEMPLATES.map(t => (
                  <button
                    key={t.type}
                    onClick={() => pickTemplate(t.type)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      color: '#c9d0d8',
                      cursor: 'pointer',
                      padding: '10px 12px',
                      textAlign: 'left',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(232,105,144,0.3)'; e.currentTarget.style.background = 'rgba(232,105,144,0.07)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>{t.emoji}</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{t.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{t.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP: ai ── */}
          {step === 'ai' && (
            <div>
              <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)', marginTop: 0, marginBottom: '14px' }}>
                Descreva o que você quer alcançar. A IA vai sugerir metas específicas para o seu perfil.
              </p>
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Ex: Quero zerar todas as séries que estão pausadas. Tenho muitas acumulando e nunca termino. Também quero ver todos os filmes da minha lista de planning..."
                style={{
                  width: '100%', minHeight: '100px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px',
                  color: '#e5e5e5', fontSize: '0.83rem', padding: '10px 12px',
                  resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button onClick={() => setStep('pick')} style={secondaryBtnStyle}>← Voltar</button>
                <button
                  onClick={handleAISuggest}
                  disabled={!aiPrompt.trim() || aiLoading}
                  style={{
                    ...primaryBtnStyle,
                    flex: 1,
                    opacity: !aiPrompt.trim() || aiLoading ? 0.5 : 1,
                  }}
                >
                  {aiLoading ? 'Gerando...' : '✨ Gerar sugestões'}
                </button>
              </div>

              {aiError && (
                <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: '10px' }}>{aiError}</div>
              )}

              {aiSuggestions.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                    Escolha uma sugestão para personalizar:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {aiSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => applySuggestion(s)}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#e5e5e5',
                          cursor: 'pointer',
                          padding: '10px 14px',
                          textAlign: 'left',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(232,105,144,0.4)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                      >
                        <div style={{ fontSize: '16px', marginBottom: '4px' }}>{s.emoji}</div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, marginBottom: '2px' }}>{s.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                          Meta: {s.target} {s.unit}{s.deadline ? ` · até ${new Date(s.deadline).toLocaleDateString('pt-BR')}` : ''} · +{s.rewardXP} XP
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: form ── */}
          {step === 'form' && (
            <div>
              {!isEditing && (
                <button onClick={() => setStep('pick')} style={{ ...secondaryBtnStyle, marginBottom: '16px' }}>← Voltar</button>
              )}

              {/* Emoji picker simples */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Emoji</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['🎯','📺','✅','🎬','⏯️','🔥','⭐','🏆','💪','📊','🎭','🌟'].map(e => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      style={{
                        background: emoji === e ? 'rgba(232,105,144,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${emoji === e ? 'rgba(232,105,144,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px 6px',
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Título da meta *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Zerar todos os pausados"
                  style={inputStyle}
                />
              </div>

              {/* Target + Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Target *</label>
                  <input
                    type="number"
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    placeholder="Ex: 50"
                    min={0}
                    style={inputStyle}
                  />
                  {/* Suggested targets */}
                  {selectedTemplate?.suggestedTargets?.length ? (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '5px', flexWrap: 'wrap' }}>
                      {selectedTemplate.suggestedTargets.map((n) => (
                        <button
                          key={n}
                          onClick={() => setTarget(n.toString())}
                          style={{
                            background: target === n.toString() ? 'rgba(232,105,144,0.2)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${target === n.toString() ? 'rgba(232,105,144,0.4)' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: '4px',
                            color: 'rgba(255,255,255,0.6)',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            padding: '2px 7px',
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

              {/* Deadline */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Prazo (opcional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Reward XP */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Recompensa XP ao concluir</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {[0, 50, 100, 200, 300, 500].map(n => (
                    <button
                      key={n}
                      onClick={() => setRewardXP(n.toString())}
                      style={{
                        background: rewardXP === n.toString() ? 'rgba(232,105,144,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${rewardXP === n.toString() ? 'rgba(232,105,144,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '4px',
                        color: rewardXP === n.toString() ? 'rgb(232,105,144)' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        padding: '4px 9px',
                      }}
                    >
                      {n === 0 ? 'Sem XP' : `+${n} XP`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pinned */}
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="pinned"
                  checked={pinned}
                  onChange={e => setPinned(e.target.checked)}
                  style={{ accentColor: 'rgb(232,105,144)', cursor: 'pointer' }}
                />
                <label htmlFor="pinned" style={{ ...labelStyle, margin: 0, cursor: 'pointer' }}>
                  Fixar esta meta no topo
                </label>
              </div>

              {error && (
                <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginBottom: '12px' }}>{error}</div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={secondaryBtnStyle}>Cancelar</button>
                <button onClick={handleSave} disabled={saving} style={{ ...primaryBtnStyle, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar meta'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Estilos compartilhados ───────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  color: 'rgba(255,255,255,0.45)',
  marginBottom: '5px',
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '6px',
  color: '#e5e5e5',
  fontSize: '0.85rem',
  padding: '8px 10px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const primaryBtnStyle: React.CSSProperties = {
  background: 'rgb(232,105,144)',
  border: 'none',
  borderRadius: '6px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontWeight: 600,
  padding: '8px 18px',
};

const secondaryBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '6px',
  color: 'rgba(255,255,255,0.6)',
  cursor: 'pointer',
  fontSize: '0.82rem',
  padding: '8px 14px',
};