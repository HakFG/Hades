// components/ListEditor.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface Entry {
  id: string;
  tmdbId: number;
  parentTmdbId?: number | null;
  seasonNumber?: number | null;
  title: string;
  type: 'MOVIE' | 'TV_SEASON';
  status: 'WATCHING' | 'COMPLETED' | 'PAUSED' | 'DROPPED' | 'PLANNING' | 'REWATCHING' | 'UPCOMING';
  score: number;
  progress: number;
  totalEpisodes?: number | null;
  imagePath?: string | null;
  isFavorite: boolean;
  startDate?: string | null;
  finishDate?: string | null;
  rewatchCount: number;
  notes?: string | null;
  hidden: boolean;
  // ... outros campos opcionais
}

interface ListEditorProps {
  entry: Entry;
  onClose: () => void;
  onSave: (updatedEntry: Entry) => void;   // ← novo callback
  onDelete?: () => void;                   // opcional, se quiser notificar pai
}

const STATUS_OPTIONS = [
  { value: 'WATCHING', label: 'Watching', icon: '👁️' },
  { value: 'PLANNING', label: 'Plan to Watch', icon: '📋' },
  { value: 'COMPLETED', label: 'Completed', icon: '✅' },
  { value: 'REWATCHING', label: 'Rewatching', icon: '🔄' },
  { value: 'PAUSED', label: 'Paused', icon: '⏸️' },
  { value: 'DROPPED', label: 'Dropped', icon: '❌' },
  { value: 'UPCOMING', label: 'Upcoming', icon: '🔮' },
];

export default function ListEditor({ entry, onClose, onSave, onDelete }: ListEditorProps) {
  // Estado do formulário
  const [status, setStatus] = useState(entry.status);
  const [score, setScore] = useState(entry.score);
  const [scoreInput, setScoreInput] = useState(entry.score === 0 ? '' : entry.score.toString());
  const [progress, setProgress] = useState(entry.progress);
  const [startDate, setStartDate] = useState(entry.startDate ?? '');
  const [finishDate, setFinishDate] = useState(entry.finishDate ?? '');
  const [rewatchCount, setRewatchCount] = useState(entry.rewatchCount ?? 0);
  const [notes, setNotes] = useState(entry.notes ?? '');
  const [isHidden, setIsHidden] = useState(entry.hidden ?? false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Resetar ao mudar a entry (quando reabrir com outro título)
  useEffect(() => {
    setStatus(entry.status);
    setScore(entry.score);
    setScoreInput(entry.score === 0 ? '' : entry.score.toString());
    setProgress(entry.progress);
    setStartDate(entry.startDate ?? '');
    setFinishDate(entry.finishDate ?? '');
    setRewatchCount(entry.rewatchCount ?? 0);
    setNotes(entry.notes ?? '');
    setIsHidden(entry.hidden ?? false);
  }, [entry]);

  // Bloquear scroll e fechar com ESC
  useEffect(() => {
    if (!entry) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [entry, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setScoreInput(value);
    if (value === '') {
      setScore(0);
    } else {
      const num = parseFloat(value);
      if (!isNaN(num) && num >= 0 && num <= 10) setScore(num);
    }
  };

  // Auto‑preencher datas ao mudar status
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (status === 'COMPLETED' && !finishDate) setFinishDate(today);
    if (status === 'WATCHING' && !startDate) setStartDate(today);
    if (status === 'REWATCHING' && !startDate) setStartDate(today);
  }, [status, finishDate, startDate]);

  const maxProgress = Math.max(entry.totalEpisodes ?? 1, 1);

  const getScoreColor = (s: number) => {
    if (s === 0) return '#4a4a5a';
    if (s >= 7) return '#2ecc71';
    if (s >= 5) return '#f39c12';
    return '#e74c3c';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        status,
        score: score > 0 ? Math.round(score * 10) : 0,
        progress,
        startDate: startDate || null,
        finishDate: finishDate || null,
        rewatchCount,
        notes: notes || null,
        hidden: isHidden,
      };
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updatedEntry = await res.json();
        onSave(updatedEntry);  // ← notifica o pai e fecha
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Erro ao salvar: ' + (err.error ?? 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover esta entrada permanentemente?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onDelete) onDelete();
        onClose();
      } else {
        alert('Erro ao deletar entrada.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao deletar.');
    } finally {
      setDeleting(false);
    }
  };

  if (!entry) return null;

  const poster = entry.imagePath
    ? `https://image.tmdb.org/t/p/w200${entry.imagePath}`
    : null;

  return (
    <div
      className="list-editor-overlay"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        ref={modalRef}
        style={{
          background: 'rgb(42,39,39)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          border: '1px solid rgba(230,125,153,0.2)',
          animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Header com poster e gradiente */}
        <div
          style={{
            position: 'relative',
            padding: '24px 24px 20px',
            background: 'linear-gradient(135deg, rgba(230,125,153,0.2) 0%, rgba(58,55,55,0.9) 100%)',
            borderBottom: '1px solid rgba(230,125,153,0.2)',
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {poster ? (
              <img
                src={poster}
                alt={entry.title}
                style={{
                  width: '64px',
                  height: '96px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(230,125,153,0.3)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '64px',
                  height: '96px',
                  background: 'rgb(58,55,55)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  border: '1px solid rgba(230,125,153,0.2)',
                }}
              >
                🎬
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'rgb(230,125,153)',
                  margin: '0 0 4px 0',
                  lineHeight: 1.3,
                }}
              >
                {entry.title}
              </h2>
              <p style={{ fontSize: '12px', color: 'rgba(220,210,215,0.6)', margin: 0 }}>
                {entry.type === 'MOVIE' ? 'Film' : `Season ${entry.seasonNumber ?? ''}`}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(230,125,153,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.4)')}
            >
              ×
            </button>
          </div>
        </div>

        {/* Formulário */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'rgb(230,125,153)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'block' }}>
              Status
            </label>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowStatusDropdown(v => !v)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgb(58,55,55)',
                  border: '1px solid rgba(230,125,153,0.3)',
                  borderRadius: '12px',
                  color: 'rgb(220,210,215)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'border-color 0.2s',
                }}
              >
                <span>
                  {STATUS_OPTIONS.find(s => s.value === status)?.icon}{' '}
                  {STATUS_OPTIONS.find(s => s.value === status)?.label}
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(220,210,215,0.5)' }}>▼</span>
              </button>
              {showStatusDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'rgb(50,47,47)',
                    border: '1px solid rgba(230,125,153,0.3)',
                    borderRadius: '12px',
                    marginTop: '6px',
                    zIndex: 20,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                  }}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setStatus(opt.value as any);
                        setShowStatusDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        background: status === opt.value ? 'rgba(230,125,153,0.15)' : 'transparent',
                        border: 'none',
                        color: status === opt.value ? 'rgb(230,125,153)' : 'rgb(220,210,215)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Score */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'rgb(230,125,153)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Score (0–10)
              </label>
              <span style={{ fontSize: '18px', fontWeight: '800', color: getScoreColor(score) }}>
                {score > 0 ? score.toFixed(1) : '-'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={scoreInput}
                onChange={handleScoreChange}
                placeholder="0–10"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'rgb(58,55,55)',
                  border: '1px solid rgba(230,125,153,0.3)',
                  borderRadius: '12px',
                  color: 'rgb(220,210,215)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
            <p style={{ fontSize: '10px', color: 'rgba(220,210,215,0.4)', marginTop: '6px' }}>
              Use ponto (.) para decimais, ex: 7.5
            </p>
          </div>

          {/* Progresso (apenas para TV) */}
          {entry.type === 'TV_SEASON' && (
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'rgb(230,125,153)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                Episode Progress {entry.totalEpisodes ? `/ ${entry.totalEpisodes}` : ''}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setProgress(p => Math.max(0, p - 1))}
                  style={{
                    width: '36px',
                    height: '36px',
                    background: 'rgb(58,55,55)',
                    border: '1px solid rgba(230,125,153,0.3)',
                    borderRadius: '10px',
                    color: 'rgb(220,210,215)',
                    fontSize: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  max={maxProgress}
                  value={progress}
                  onChange={e => setProgress(Math.min(maxProgress, Math.max(0, Number(e.target.value) || 0)))}
                  style={{
                    flex: 1,
                    padding: '10px',
                    textAlign: 'center',
                    background: 'rgb(58,55,55)',
                    border: '1px solid rgba(230,125,153,0.3)',
                    borderRadius: '12px',
                    color: 'rgb(220,210,215)',
                    fontSize: '14px',
                  }}
                />
                <button
                  onClick={() => setProgress(p => Math.min(maxProgress, p + 1))}
                  style={{
                    width: '36px',
                    height: '36px',
                    background: 'rgb(58,55,55)',
                    border: '1px solid rgba(230,125,153,0.3)',
                    borderRadius: '10px',
                    color: 'rgb(220,210,215)',
                    fontSize: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Datas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'rgb(230,125,153)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgb(58,55,55)',
                  border: '1px solid rgba(230,125,153,0.3)',
                  borderRadius: '12px',
                  color: 'rgb(220,210,215)',
                  fontSize: '13px',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'rgb(230,125,153)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                Finish Date
              </label>
              <input
                type="date"
                value={finishDate}
                onChange={e => setFinishDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgb(58,55,55)',
                  border: '1px solid rgba(230,125,153,0.3)',
                  borderRadius: '12px',
                  color: 'rgb(220,210,215)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          {/* Rewatch Count */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'rgb(230,125,153)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
              Rewatches
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setRewatchCount(r => Math.max(0, r - 1))}
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'rgb(58,55,55)',
                  border: '1px solid rgba(230,125,153,0.3)',
                  borderRadius: '10px',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                −
              </button>
              <div
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '10px',
                  background: 'rgb(58,55,55)',
                  border: '1px solid rgba(230,125,153,0.3)',
                  borderRadius: '12px',
                  color: 'rgb(220,210,215)',
                }}
              >
                {rewatchCount}
              </div>
              <button
                onClick={() => setRewatchCount(r => r + 1)}
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'rgb(58,55,55)',
                  border: '1px solid rgba(230,125,153,0.3)',
                  borderRadius: '10px',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'rgb(230,125,153)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Personal notes..."
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgb(58,55,55)',
                border: '1px solid rgba(230,125,153,0.3)',
                borderRadius: '12px',
                color: 'rgb(220,210,215)',
                fontSize: '13px',
                resize: 'vertical',
                fontFamily: 'Overpass, sans-serif',
              }}
            />
          </div>

          {/* Hidden checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isHidden}
              onChange={e => setIsHidden(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'rgb(230,125,153)' }}
            />
            <span style={{ fontSize: '13px', color: 'rgba(220,210,215,0.7)' }}>Hide from lists</span>
          </label>

          {/* Botões de ação */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px',
                background: saving ? 'rgb(80,70,70)' : 'linear-gradient(135deg, rgb(230,125,153), rgb(200,90,120))',
                border: 'none',
                borderRadius: '30px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '700',
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px',
                background: 'transparent',
                border: '1px solid rgba(230,125,153,0.4)',
                borderRadius: '30px',
                color: 'rgb(220,210,215)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
          </div>

          {/* Botão Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              width: '100%',
              padding: '12px',
              background: '#e74c3c',
              border: 'none',
              borderRadius: '30px',
              color: 'white',
              fontSize: '13px',
              fontWeight: '700',
              cursor: deleting ? 'wait' : 'pointer',
              marginTop: '4px',
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Entry'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}