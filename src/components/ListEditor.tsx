'use client';

import { useState, useEffect } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ListEditorProps {
  isOpen: boolean;
  onClose: () => void;
  tmdbId: number;
  parentTmdbId?: number;
  seasonNumber?: number;
  type: 'MOVIE' | 'TV_SEASON';
  title: string;
  poster_path: string | null | undefined;
  totalEpisodes?: number;
  existingData?: {
    status: string;
    score: number | null;
    progress: number | null;
    startDate: string | null;
    finishDate: string | null;
    rewatchCount: number;
    notes: string | null;
    hidden: boolean;
  };
}

// ─── Status Options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'WATCHING', label: 'Watching', icon: '👁️' },
  { value: 'PLANNING', label: 'Plan to Watch', icon: '📋' },
  { value: 'COMPLETED', label: 'Completed', icon: '✅' },
  { value: 'REWATCHING', label: 'Rewatching', icon: '🔄' },
  { value: 'PAUSED', label: 'Paused', icon: '⏸️' },
  { value: 'DROPPED', label: 'Dropped', icon: '❌' },
  { value: 'UPCOMING', label: 'Upcoming', icon: '🔮' },
];

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function ListEditor({
  isOpen,
  onClose,
  tmdbId,
  parentTmdbId,
  seasonNumber,
  type,
  title,
  poster_path,
  totalEpisodes,
  existingData,
}: ListEditorProps) {
  // Estados do formulário
  const [status, setStatus] = useState(existingData?.status ?? 'PLANNING');
  const [score, setScore] = useState<number | null>(existingData?.score ?? null);
  const [scoreInput, setScoreInput] = useState(existingData?.score?.toString() ?? '');
  const [progress, setProgress] = useState(existingData?.progress ?? 0);
  const [startDate, setStartDate] = useState(existingData?.startDate ?? '');
  const [finishDate, setFinishDate] = useState(existingData?.finishDate ?? '');
  const [rewatchCount, setRewatchCount] = useState(existingData?.rewatchCount ?? 0);
  const [notes, setNotes] = useState(existingData?.notes ?? '');
  const [isHidden, setIsHidden] = useState(existingData?.hidden ?? false);
  
  // Estados de UI
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [saving, setSaving] = useState(false);

  // Resetar quando abrir
  useEffect(() => {
    if (isOpen && existingData) {
      setStatus(existingData.status);
      setScore(existingData.score ?? null);
      setScoreInput(existingData.score?.toString() ?? '');
      setProgress(existingData.progress ?? 0);
      setStartDate(existingData.startDate ?? '');
      setFinishDate(existingData.finishDate ?? '');
      setRewatchCount(existingData.rewatchCount ?? 0);
      setNotes(existingData.notes ?? '');
      setIsHidden(existingData.hidden ?? false);
    }
  }, [isOpen, existingData]);

  // Fechar ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Handler para input de score (aceita decimais)
  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setScoreInput(value);
    
    // Permite vazio, números inteiros ou decimais (0-10)
    if (value === '') {
      setScore(null);
    } else {
      const num = parseFloat(value);
      if (!isNaN(num) && num >= 0 && num <= 10) {
        setScore(num);
      }
    }
  };

  // Salvar no banco
async function handleSave() {
  setSaving(true);
  try {
    const res = await fetch('/api/update-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tmdbId,
        parentTmdbId: parentTmdbId ?? null,
        seasonNumber: seasonNumber ?? null,
        type,
        title,
        status,
        score: score !== null ? Math.round(score * 10) : null, // Converte 7.5 → 75
        progress: progress > 0 ? progress : null,
        totalEpisodes: totalEpisodes ?? null,
        imagePath: poster_path ?? null,
        startDate: startDate || null,
        finishDate: finishDate || null,
        rewatchCount,
        notes: notes || null,
        hidden: isHidden,
      }),
    });

    if (res.ok) {
      onClose();
      // Recarregar a página para mostrar as mudanças
      window.location.reload();
    } else {
      const err = await res.json().catch(() => ({}));
      alert('Erro ao salvar: ' + (err.error ?? 'Erro desconhecido'));
    }
  } catch (err) {
    console.error('Erro ao salvar:', err);
    alert('Erro de rede ao salvar');
  } finally {
    setSaving(false);
  }
}

  // Auto-set finish date quando completar
  useEffect(() => {
    if (status === 'COMPLETED' && !finishDate) {
      setFinishDate(new Date().toISOString().split('T')[0]);
    }
    if (status === 'WATCHING' && !startDate) {
      setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [status]);

  if (!isOpen) return null;

  const maxProgress = totalEpisodes ?? 1;

  // Cor do score baseada na nota
  const getScoreColor = (score: number | null) => {
    if (score === null) return '#3d3d5c';
    if (score >= 7) return '#2ecc71';
    if (score >= 5) return '#f1c40f';
    return '#e74c3c';
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: '#1a1a2e',
            borderRadius: '6px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header com Cover */}
          <div
            style={{
              position: 'relative',
              height: '120px',
              background: `linear-gradient(135deg, rgba(61,180,242,0.3), rgba(43,45,66,0.9))`,
              borderRadius: '6px 6px 0 0',
              overflow: 'hidden',
            }}
          >
            {poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w200${poster_path}`}
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '20px',
                  width: '60px',
                  height: '90px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                }}
                alt={title}
              />
            )}
            <div
              style={{
                position: 'absolute',
                left: poster_path ? '95px' : '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
              }}
            >
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  maxWidth: '350px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </h2>
              <div
                style={{
                  fontSize: '12px',
                  color: '#92a0ad',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {type === 'MOVIE' ? 'Movie' : `Season ${seasonNumber}`}
              </div>
            </div>
            {/* Botão Fechar */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                opacity: 0.7,
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '0.7')}
            >
              ×
            </button>
          </div>

          {/* Body do Formulário */}
          <div style={{ padding: '25px 20px' }}>
            {/* Status */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#647380', marginBottom: '8px', textTransform: 'uppercase' }}>
                Status
              </label>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    backgroundColor: '#2b2d42',
                    border: '1px solid #3d3d5c',
                    borderRadius: '4px',
                    color: '#e0e4e8',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    {STATUS_OPTIONS.find((s) => s.value === status)?.icon}{' '}
                    {STATUS_OPTIONS.find((s) => s.value === status)?.label}
                  </span>
                  <span style={{ fontSize: '12px', color: '#92a0ad' }}>▼</span>
                </button>
                {showStatusDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#2b2d42',
                      border: '1px solid #3d3d5c',
                      borderRadius: '4px',
                      marginTop: '5px',
                      zIndex: 10,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setStatus(opt.value);
                          setShowStatusDropdown(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 15px',
                          backgroundColor: status === opt.value ? '#3db4f2' : 'transparent',
                          border: 'none',
                          color: status === opt.value ? 'white' : '#e0e4e8',
                          fontSize: '13px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.2s',
                        }}
                        onMouseOver={(e) => {
                          if (status !== opt.value) e.currentTarget.style.backgroundColor = '#3d3d5c';
                        }}
                        onMouseOut={(e) => {
                          if (status !== opt.value) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Score (0-10 com decimais) */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#647380', marginBottom: '8px', textTransform: 'uppercase' }}>
                Score (0-10)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={scoreInput}
                  onChange={handleScoreChange}
                  placeholder="0-10"
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#2b2d42',
                    border: '1px solid #3d3d5c',
                    borderRadius: '4px',
                    color: '#e0e4e8',
                    fontSize: '14px',
                  }}
                />
                <div
                  style={{
                    minWidth: '60px',
                    textAlign: 'center',
                    padding: '8px 12px',
                    backgroundColor: getScoreColor(score),
                    borderRadius: '4px',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '16px',
                  }}
                >
                  {score !== null ? score.toFixed(1) : '-'}
                </div>
              </div>
              <p style={{ fontSize: '11px', color: '#92a0ad', marginTop: '6px' }}>
                Ex: 7.5, 8.0, 9.5
              </p>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#647380', marginBottom: '8px', textTransform: 'uppercase' }}>
                {type === 'MOVIE' ? 'Watched' : 'Episode Progress'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setProgress(Math.max(0, progress - 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#2b2d42',
                    border: '1px solid #3d3d5c',
                    borderRadius: '4px',
                    color: '#e0e4e8',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  max={maxProgress}
                  value={progress}
                  onChange={(e) => setProgress(Math.min(maxProgress, Math.max(0, parseInt(e.target.value) || 0)))}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#2b2d42',
                    border: '1px solid #3d3d5c',
                    borderRadius: '4px',
                    color: '#e0e4e8',
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                />
                <button
                  onClick={() => setProgress(Math.min(maxProgress, progress + 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#2b2d42',
                    border: '1px solid #3d3d5c',
                    borderRadius: '4px',
                    color: '#e0e4e8',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  +
                </button>
                <span style={{ color: '#92a0ad', fontSize: '13px', minWidth: '60px' }}>
                  / {maxProgress} {type === 'MOVIE' ? 'movie' : 'episodes'}
                </span>
              </div>
            </div>

            {/* Datas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#647380', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2b2d42',
                    border: '1px solid #3d3d5c',
                    borderRadius: '4px',
                    color: '#e0e4e8',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#647380', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Finish Date
                </label>
                <input
                  type="date"
                  value={finishDate}
                  onChange={(e) => setFinishDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2b2d42',
                    border: '1px solid #3d3d5c',
                    borderRadius: '4px',
                    color: '#e0e4e8',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            {/* Rewatch Count */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#647380', marginBottom: '8px', textTransform: 'uppercase' }}>
                Total Rewatches
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setRewatchCount(Math.max(0, rewatchCount - 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#2b2d42',
                    border: '1px solid #3d3d5c',
                    borderRadius: '4px',
                    color: '#e0e4e8',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  −
                </button>
                <div
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#2b2d42',
                    border: '1px solid #3d3d5c',
                    borderRadius: '4px',
                    color: '#e0e4e8',
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                >
                  {rewatchCount}
                </div>
                <button
                  onClick={() => setRewatchCount(rewatchCount + 1)}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#2b2d42',
                    border: '1px solid #3d3d5c',
                    borderRadius: '4px',
                    color: '#e0e4e8',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#647380', marginBottom: '8px', textTransform: 'uppercase' }}>
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Personal notes about this title..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#2b2d42',
                  border: '1px solid #3d3d5c',
                  borderRadius: '4px',
                  color: '#e0e4e8',
                  fontSize: '13px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Checkbox Hidden (apenas este permanece) */}
            <div style={{ marginBottom: '25px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={isHidden}
                  onChange={(e) => setIsHidden(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: '#92a0ad' }}>Hide from status lists</span>
              </label>
            </div>

            {/* Botões de Ação */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: saving ? '#92a0ad' : '#3db4f2',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
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
                  backgroundColor: '#2b2d42',
                  border: '1px solid #3d3d5c',
                  borderRadius: '4px',
                  color: '#e0e4e8',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
