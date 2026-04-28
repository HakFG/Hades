'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatScore, scoreColor } from '@/lib/utils';
import { Suspense } from 'react';

// ─── Tipos ─────────────────────────────────────────────────────────────────────

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
  genres?: string | null;
  runtime?: number | null;
  releaseDate?: string | null;
  format?: string | null;
  updatedAt: string;
}

interface ActivityLog {
  id: string;           // uuid único do evento
  entryId: string;
  title: string;
  imagePath?: string | null;
  type: 'MOVIE' | 'TV_SEASON';
  status: string;
  progress: number;
  progressStart?: number;   // ← ADICIONADO
  progressEnd?: number;     // ← ADICIONADO
  score: number;
  slug: string;
  createdAt: string;    // ISO timestamp do evento
}

interface Profile {
  id: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  avatarColor?: string | null;
}

type Tab = 'overview' | 'series' | 'films' | 'favorites' | 'stats';
type StatusKey = 'WATCHING' | 'COMPLETED' | 'PAUSED' | 'DROPPED' | 'PLANNING' | 'REWATCHING' | 'UPCOMING';

// ─── Constantes ────────────────────────────────────────────────────────────────

const TMDB_MIN_YEAR = 1874;
const TMDB_MAX_YEAR = new Date().getFullYear() + 6;

const STATUS_COLOR: Record<string, string> = {
  WATCHING:   '#3db4f2',
  COMPLETED:  '#2ecc71',
  PAUSED:     '#f1c40f',
  DROPPED:    '#e74c3c',
  PLANNING:   '#92a0ad',
  REWATCHING: '#9b59b6',
  UPCOMING:   '#f39c12',
};

const STATUS_LABEL: Record<string, string> = {
  WATCHING:   'Watching',
  COMPLETED:  'Completed',
  PAUSED:     'Paused',
  DROPPED:    'Dropped',
  PLANNING:   'Planning',
  REWATCHING: 'Rewatching',
  UPCOMING:   'Upcoming',
};

const ALL_STATUSES: StatusKey[] = ['WATCHING', 'COMPLETED', 'PAUSED', 'DROPPED', 'PLANNING', 'REWATCHING', 'UPCOMING'];

function imgUrl(p?: string | null): string {
  if (!p) return '';
  if (p.startsWith('http')) return p;
  if (p.startsWith('data:image')) return p;
  return `https://image.tmdb.org/t/p/w300${p}`;
}

function entrySlug(e: Entry): string {
  if (e.type === 'MOVIE') return `movie-${e.tmdbId}`;
  if (e.parentTmdbId && e.seasonNumber) return `tv-${e.parentTmdbId}-s${e.seasonNumber}`;
  return `movie-${e.tmdbId}`;
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function releaseYear(e: Entry): number | null {
  const src = e.releaseDate || e.startDate || e.finishDate;
  if (!src) return null;
  const y = parseInt(src.split('-')[0]);
  return isNaN(y) ? null : y;
}

function entryFormat(e: Entry): string {
  if (e.type === 'MOVIE') return 'MOVIE';
  if (e.format) return e.format.toUpperCase();
  if (e.seasonNumber === 0) return 'SPECIAL';
  if (e.title.toLowerCase().endsWith('specials') || e.title.toLowerCase().includes(' specials')) return 'SPECIAL';
  return 'TV';
}

// ─── EntryCard ─────────────────────────────────────────────────────────────────

function EntryCard({ entry, onEdit, onToggleFav, onUpdateProgress }: {
  entry: Entry;
  onEdit: (e: Entry) => void;
  onToggleFav: (e: Entry) => void;
  onUpdateProgress?: (entryId: string, newProgress: number) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const poster = imgUrl(entry.imagePath);
  
  // Exibição do progresso: para séries, se completou mostra apenas o total
  let progressDisplay = '';
  if (entry.type === 'TV_SEASON') {
    const total = entry.totalEpisodes ?? '?';
    if (entry.progress === entry.totalEpisodes) {
      progressDisplay = `${total}`;
    } else {
      progressDisplay = `${entry.progress}/${total}`;
    }
  } else {
    progressDisplay = entry.status === 'COMPLETED' ? 'Watched' : (entry.progress > 0 ? 'Watching' : '');
  }

const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (entry.type === 'TV_SEASON' && onUpdateProgress && entry.totalEpisodes) {
      const newProgress = Math.min(entry.progress + 1, entry.totalEpisodes);
      if (newProgress !== entry.progress) {
        onUpdateProgress(entry.id, newProgress);
      }
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (entry.type === 'TV_SEASON' && onUpdateProgress) {
      const newProgress = Math.max(entry.progress - 1, 0);
      if (newProgress !== entry.progress) onUpdateProgress(entry.id, newProgress);
    }
  };

  return (
    <div
      style={{
        flex: '0 0 135px',
        width: '135px',
        height: '210px',
        borderRadius: '3px',
        boxShadow: '0 2px 20px rgba(49,54,68,.2)',
        position: 'relative',
        overflow: 'hidden',
        display: 'block',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
        background: STATUS_COLOR[entry.status] ?? '#c9d0d8', zIndex: 4,
      }} />

      <Link href={`/titles/${entrySlug(entry)}`} style={{ display: 'block', height: '100%', width: '100%', textDecoration: 'none' }}>
        <div style={{
          backgroundImage: poster ? `url(${poster})` : undefined,
          backgroundColor: poster ? undefined : '#2b2d42',
          backgroundPosition: '50%',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          height: '100%',
          width: '100%',
          transform: hovered ? 'scale(1.03)' : 'scale(1)',
          transition: 'transform 0.25s ease',
        }} />

        <div style={{
          background: 'rgba(37,31,49,.85)',
          borderRadius: '0 0 3px 3px',
          bottom: 0, left: 0,
          padding: '12px',
          paddingBottom: '35px',
          position: 'absolute',
          width: '100%',
          zIndex: 2,
          boxSizing: 'border-box',
        }}>
          <div style={{
            color: '#e67d99',
            fontSize: '0.8rem',
            fontWeight: 600,
            lineHeight: '1.15',
            wordBreak: 'break-word',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {entry.title}
          </div>
        </div>

        
{/* Progresso com botões para séries (visíveis apenas no hover) */}
        {/* Progresso com botões para séries (visíveis apenas no hover) */}
        <div style={{
          bottom: 0,
          left: 0,
          color: '#ff9800',
          fontSize: '0.90rem',
          position: 'absolute',
          zIndex: 3,
          width: '100%',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          paddingLeft: '0px',   // ← aqui você controla a distância da borda esquerda
          paddingBottom: '9px',
          boxSizing: 'border-box',
        }}>
          {entry.type === 'TV_SEASON' && onUpdateProgress ? (
            <>
              <button
                onClick={handleDecrement}
                style={{
                  width: '14px', height: '14px',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '11px',
                  lineHeight: 1,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  opacity: hovered ? 1 : 0,
                  transition: 'opacity 0.35s ease, color 0.2s ease',
                  pointerEvents: hovered ? 'auto' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
              >
                −
              </button>
              <span style={{ minWidth: '28px', textAlign: 'left' }}>{progressDisplay}</span>
              <button
                onClick={handleIncrement}
                style={{
                  width: '14px', height: '14px',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '11px',
                  lineHeight: 1,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  opacity: hovered ? 1 : 0,
                  transition: 'opacity 0.35s ease, color 0.2s ease',
                  pointerEvents: hovered ? 'auto' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
              >
                +
              </button>
            </>
          ) : (
            <span>{progressDisplay}</span>
          )}
        </div>

        {entry.score > 0 && (
          <div style={{
            bottom: 0, right: 0,
            color: '#64ffda',
            fontSize: '0.8rem',
            padding: '12px',
            position: 'absolute',
            zIndex: 3,
            width: '50%',
            textAlign: 'right',
            whiteSpace: 'nowrap',
          }}>
            {formatScore(entry.score)}
          </div>
        )}
      </Link>

      <div style={{
        position: 'absolute', top: 8, right: 6, zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: '5px',
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translateX(0)' : 'translateX(10px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}>
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFav(entry); }}
          title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: entry.isFavorite ? 'rgba(231,76,60,0.9)' : 'rgba(0,0,0,0.65)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', color: 'white',
            transition: 'transform 0.1s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {entry.isFavorite ? '♥' : '♡'}
        </button>
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onEdit(entry); }}
          title="Edit"
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.65)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', color: 'white',
            transition: 'transform 0.1s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          ✎
        </button>
      </div>
    </div>
  );
}

// ─── List Editor ───────────────────────────────────────────────────────────────

function ListEditor({ entry, onClose, onSaved }: {
  entry: Entry;
  onClose: () => void;
  onSaved: (updated: Partial<Entry>) => void;
}) {
  const [status, setStatus] = useState(entry.status);
  const [score, setScore] = useState(entry.score);
  const [progress, setProgress] = useState(entry.progress);
  const [startDate, setStartDate] = useState(entry.startDate ?? '');
  const [finishDate, setFinishDate] = useState(entry.finishDate ?? '');
  const [rewatchCount, setRewatchCount] = useState(entry.rewatchCount ?? 0);
  const [notes, setNotes] = useState(entry.notes ?? '');
  const [hidden, setHidden] = useState(entry.hidden ?? false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (status === 'WATCHING' && !startDate) setStartDate(today);
    if (status === 'COMPLETED' && !finishDate) setFinishDate(today);
    if (status === 'REWATCHING' && !startDate) setStartDate(today);
  }, [status]);

async function save() {
  setSaving(true);
  try {
    const payload = { score, status, progress, startDate: startDate || null, finishDate: finishDate || null, rewatchCount, notes: notes || null, hidden };
    const res = await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const updatedEntry = await res.json();   // ← obtém a entry atualizada do banco
      onSaved(updatedEntry);                   // ← passa o objeto completo, não apenas o payload
      onClose();
    } else {
      alert('Error saving.');
    }
  } finally { setSaving(false); }
}

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja remover esta entrada permanentemente?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Erro ao deletar.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao deletar.');
    } finally {
      setDeleting(false);
    }
  }

  const poster = imgUrl(entry.imagePath);
  const maxEp = entry.totalEpisodes ?? 9999;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(3px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a2e', borderRadius: '12px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ position: 'relative', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px', alignItems: 'center' }}>
          {poster && <img src={poster} alt="" style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#e0e4e8', margin: 0 }}>{entry.title}</h3>
            <p style={{ fontSize: '12px', color: '#8ba2b9', margin: '4px 0 0' }}>{entry.type === 'MOVIE' ? 'Movie' : `Season ${entry.seasonNumber ?? ''}`}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8ba2b9', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Status</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {ALL_STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)} style={{
                  padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer',
                  background: status === s ? STATUS_COLOR[s] : '#2b2d42',
                  color: status === s ? 'white' : '#92a0ad',
                  transition: 'all 0.2s',
                }}>
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              Score (0 – 10) <span style={{ color: scoreColor(score), fontWeight: 'bold', marginLeft: '8px' }}>{formatScore(score)}</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={score === 0 ? '' : score}
              onChange={e => {
                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                setScore(isNaN(val) ? 0 : Math.min(10, Math.max(0, val)));
              }}
              placeholder="0"
              style={{
                width: '100%', padding: '10px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '8px',
                color: '#e0e4e8', fontSize: '14px', fontFamily: 'Overpass, sans-serif', outline: 'none', transition: '0.2s'
              }}
            />
          </div>

          {entry.type === 'TV_SEASON' && (
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Progress</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setProgress(p => Math.max(0, p - 1))} style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#2b2d42', border: '1px solid #3d3d5c', color: '#e0e4e8', fontSize: '18px', cursor: 'pointer' }}>−</button>
                <input type="number" min={0} max={maxEp} value={progress} onChange={e => setProgress(Math.min(maxEp, Math.max(0, Number(e.target.value))))} style={{ flex: 1, padding: '9px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '8px', color: '#e0e4e8', fontSize: '14px', textAlign: 'center' }} />
                <button onClick={() => setProgress(p => Math.min(maxEp, p + 1))} style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#2b2d42', border: '1px solid #3d3d5c', color: '#e0e4e8', fontSize: '18px', cursor: 'pointer' }}>+</button>
                <span style={{ fontSize: '12px', color: '#647380' }}>/ {entry.totalEpisodes ?? '?'}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '9px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '6px', color: '#e0e4e8', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Finish Date</label>
              <input type="date" value={finishDate} onChange={e => setFinishDate(e.target.value)} style={{ width: '100%', padding: '9px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '6px', color: '#e0e4e8', fontSize: '13px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Rewatch Count</label>
              <input type="number" min={0} value={rewatchCount} onChange={e => setRewatchCount(Number(e.target.value))} style={{ width: '100%', padding: '9px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '6px', color: '#e0e4e8', fontSize: '13px' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingTop: '22px' }}>
              <input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} style={{ accentColor: '#3db4f2', width: '18px', height: '18px' }} />
              <span style={{ fontSize: '12px', color: '#92a0ad' }}>Hidden</span>
            </label>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Personal notes..." style={{ width: '100%', padding: '9px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '8px', color: '#e0e4e8', fontSize: '13px', resize: 'vertical', fontFamily: 'Overpass, sans-serif' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
            <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', background: '#3db4f2', border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: saving ? 'wait' : 'pointer' }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '8px', color: '#e0e4e8', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>

          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              width: '100%', padding: '10px', background: '#e74c3c', border: 'none', borderRadius: '8px',
              color: 'white', fontSize: '13px', fontWeight: '700', cursor: deleting ? 'wait' : 'pointer',
              marginTop: '8px',
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Editor ───────────────────────────────────────────────────────────

function ProfileEditor({ profile, onClose, onSaved }: {
  profile: Profile;
  onClose: () => void;
  onSaved: (p: Profile) => void;
}) {
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '');
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor ?? '#3db4f2');
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl ?? '');
  const [bannerPreview, setBannerPreview] = useState(profile.bannerUrl ?? '');

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setAvatarPreview(dataUrl);
        setAvatarUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setBannerPreview(dataUrl);
        setBannerUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  async function save() {
    setSaving(true);
    try {
      const payload = { username, bio: bio || null, avatarUrl: avatarUrl || null, avatarColor, bannerUrl: bannerUrl || null };
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) { onSaved(await res.json()); onClose(); }
      else alert('Error saving profile.');
    } finally { setSaving(false); }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(3px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a2e', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#e0e4e8', margin: 0 }}>Edit Profile</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#92a0ad', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '10px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '8px', color: '#e0e4e8', fontSize: '14px' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '8px', color: '#e0e4e8', fontSize: '13px', resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Avatar (Image)</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {avatarPreview && <img src={avatarPreview} alt="avatar preview" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', background: 'transparent' }} />}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ flex: 1, padding: '8px', background: '#2b2d42', borderRadius: '8px', color: '#e0e4e8', fontSize: '12px', border: '1px solid #3d3d5c' }} />
              <input type="text" value={avatarUrl} onChange={e => { setAvatarUrl(e.target.value); setAvatarPreview(e.target.value); }} placeholder="Or paste URL" style={{ flex: 2, padding: '10px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '8px', color: '#e0e4e8', fontSize: '13px' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Avatar Color (fallback)</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input type="color" value={avatarColor} onChange={e => setAvatarColor(e.target.value)} style={{ width: '48px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
              <span style={{ fontSize: '13px', color: '#92a0ad' }}>{avatarColor}</span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Banner Image</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="file" accept="image/*" onChange={handleBannerUpload} style={{ flex: 1, padding: '8px', background: '#2b2d42', borderRadius: '8px', color: '#e0e4e8', fontSize: '12px', border: '1px solid #3d3d5c' }} />
              <input type="text" value={bannerUrl} onChange={e => { setBannerUrl(e.target.value); setBannerPreview(e.target.value); }} placeholder="Or paste URL" style={{ flex: 2, padding: '10px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '8px', color: '#e0e4e8', fontSize: '13px' }} />
            </div>
            {bannerPreview && <img src={bannerPreview} alt="banner preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginTop: '12px' }} />}
          </div>
          <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
            <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', background: '#3db4f2', border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: saving ? 'wait' : 'pointer' }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '8px', color: '#e0e4e8', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MediaListTab ─────────────────────────────────────────────────────────────

function MediaListTab({ entries, type, onEdit, onToggleFav, onUpdateProgress }: {
  entries: Entry[];
  type: 'TV_SEASON' | 'MOVIE';
  onEdit: (e: Entry) => void;
  onToggleFav: (e: Entry) => void;
  onUpdateProgress?: (entryId: string, newProgress: number) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusKey | 'ALL'>('ALL');
  const [formatFilter, setFormatFilter] = useState('ALL');
  const [genreFilter, setGenreFilter] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState(0);   // ← substitui yearMin/yearMax
  const [scoreFilter, setScoreFilter] = useState(0);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const formatOptions = type === 'TV_SEASON'
    ? [{ value: 'ALL', label: 'All Formats' }, { value: 'TV', label: 'TV' }, { value: 'SPECIAL', label: 'Special' }]
    : [{ value: 'ALL', label: 'All Formats' }, { value: 'MOVIE', label: 'Movie' }];

  const mine = entries.filter(e => e.type === type);
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: mine.length };
    ALL_STATUSES.forEach(s => { c[s] = mine.filter(e => e.status === s).length; });
    return c;
  }, [mine]);

  const baseFiltered = useMemo(() => {
    return mine.filter(e => {
      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (genreFilter !== 'ALL') {
        const entryGenres = e.genres?.toLowerCase() || '';
        if (!entryGenres.includes(genreFilter.toLowerCase())) return false;
      }
      if (scoreFilter > 0 && e.score < scoreFilter) return false;
      if (formatFilter !== 'ALL') {
        const fmt = entryFormat(e);
        if (fmt !== formatFilter) return false;
      }
      // Filtro de ano único
      if (selectedYear > 0) {
        const y = releaseYear(e);
        if (!y || y !== selectedYear) return false;
      }
      return true;
    });
  }, [mine, search, genreFilter, scoreFilter, formatFilter, selectedYear]);

  const sortedFiltered = useMemo(() => {
    return [...baseFiltered].sort((a, b) => {
      let diff = 0;
      if (sortBy === 'title') diff = a.title.localeCompare(b.title);
      else if (sortBy === 'score') diff = (b.score || 0) - (a.score || 0);
      else if (sortBy === 'progress') diff = (b.progress || 0) - (a.progress || 0);
      else if (sortBy === 'updatedAt') diff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      else if (sortBy === 'startDate') diff = (a.startDate || '').localeCompare(b.startDate || '');
      else if (sortBy === 'finishDate') diff = (a.finishDate || '').localeCompare(b.finishDate || '');
      else if (sortBy === 'releaseYear') diff = (releaseYear(a) ?? 0) - (releaseYear(b) ?? 0);
      return sortDir === 'asc' ? -diff : diff;
    });
  }, [baseFiltered, sortBy, sortDir]);

  const grouped = useMemo(() => {
    const groups: Record<string, Entry[]> = {};
    for (const s of ALL_STATUSES) groups[s] = [];
    for (const e of sortedFiltered) groups[e.status].push(e);
    return groups;
  }, [sortedFiltered]);

  const renderContent = () => {
    const statuses = statusFilter === 'ALL' ? ALL_STATUSES.filter(s => grouped[s].length) : [statusFilter];
    if (statuses.every(s => grouped[s].length === 0)) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#647380' }}>
          {search ? 'No results found.' : `No ${type === 'MOVIE' ? 'films' : 'series'} in this list yet.`}
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {statuses.map(s => {
          const items = grouped[s];
          if (!items.length) return null;
          return (
            <div key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '8px', borderBottom: `2px solid ${STATUS_COLOR[s]}33` }}>
                <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: STATUS_COLOR[s] }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: STATUS_COLOR[s], textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {STATUS_LABEL[s]}
                </span>
                <span style={{ fontSize: '11px', color: '#3d3d5c' }}>({items.length})</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px' }}>
                {items.map(e => (
                  <EntryCard key={e.id} entry={e} onEdit={onEdit} onToggleFav={onToggleFav} onUpdateProgress={onUpdateProgress} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const totalFiltered = statusFilter === 'ALL' ? sortedFiltered.length : grouped[statusFilter]?.length ?? 0;

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      <div style={{ width: sidebarCollapsed ? '40px' : '200px', flexShrink: 0, transition: 'width 0.2s' }}>
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ marginBottom: '12px', background: '#1e1e35', border: '1px solid #2d2d4a', borderRadius: '4px', color: '#92a0ad', padding: '6px 12px', fontSize: '11px', cursor: 'pointer', width: '100%' }}>
          {sidebarCollapsed ? '▶' : '◀ Filters'}
        </button>
        {!sidebarCollapsed && (
          <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '14px' }}>
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {(['ALL', ...ALL_STATUSES] as const).map(s => {
                  const cnt = s === 'ALL' ? mine.length : counts[s];
                  if (cnt === 0 && s !== 'ALL') return null;
                  const isActive = statusFilter === s;
                  return (
                    <button key={s} onClick={() => setStatusFilter(s)} style={{
                      textAlign: 'left', padding: isActive ? '8px 8px 8px 14px' : '8px', borderRadius: '3px', fontSize: '13px', cursor: 'pointer',
                      background: isActive ? `${STATUS_COLOR[s === 'ALL' ? 'WATCHING' : s]}18` : 'transparent', border: 'none',
                      color: isActive ? (s === 'ALL' ? '#3db4f2' : STATUS_COLOR[s]) : '#8ba2b9', fontWeight: isActive ? '700' : '400', transition: '0.2s',
                    }}>
                      {s === 'ALL' ? 'All' : STATUS_LABEL[s]} <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.7 }}>({cnt})</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <hr style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.05)', margin: '12px 0' }} />
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '8px' }}>Format</div>
              <select value={formatFilter} onChange={e => setFormatFilter(e.target.value)} style={{ width: '100%', background: '#151f2e', color: '#bcbedc', border: 'none', padding: '6px 10px', fontSize: '12px', borderRadius: '4px' }}>
                {formatOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '8px' }}>Genre</div>
              <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)} style={{ width: '100%', background: '#151f2e', color: '#bcbedc', border: 'none', padding: '6px 10px', fontSize: '12px', borderRadius: '4px' }}>
                <option value="ALL">All Genres</option>
                {['Action','Adventure','Comedy','Drama','Fantasy','Horror','Romance','Sci-Fi','Thriller','Mystery','Crime','Animation','Documentary','Family','Music','War','Western','History'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '8px' }}>
                Year
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#647380', marginBottom: '4px' }}>
                <span>Year</span>
                <span style={{ color: selectedYear > 0 ? '#3dbbee' : '#647380', fontWeight: 'bold' }}>
                  {selectedYear > 0 ? selectedYear : 'Any'}
                </span>
              </div>
              <input
                type="range"
                min={TMDB_MIN_YEAR}
                max={TMDB_MAX_YEAR}
                step={1}
                value={selectedYear > 0 ? selectedYear : TMDB_MIN_YEAR}
                onChange={e => setSelectedYear(Number(e.target.value) === TMDB_MIN_YEAR ? 0 : Number(e.target.value))}
                style={{ width: '100%', height: '6px', background: '#151f2e', borderRadius: '5px', accentColor: '#3dbbee', cursor: 'pointer' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '8px' }}>Score</div>
              <input type="range" min={0} max={10} step={1} value={scoreFilter} onChange={e => setScoreFilter(Number(e.target.value))} style={{ width: '100%', accentColor: scoreColor(scoreFilter), cursor: 'pointer', height: '4px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#647380', marginTop: '4px' }}><span>Any</span><span>10</span></div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '8px' }}>Sort</div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: '100%', background: '#151f2e', color: '#bcbedc', border: 'none', padding: '6px 10px', fontSize: '12px', borderRadius: '4px', marginBottom: '8px' }}>
                {['updatedAt','title','score','progress','releaseYear','startDate','finishDate'].map(o => <option key={o} value={o}>{o === 'updatedAt' ? 'Last Updated' : o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
              </select>
              <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} style={{ width: '100%', padding: '5px 8px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '3px', color: '#92a0ad', fontSize: '11px', cursor: 'pointer' }}>
                {sortDir === 'asc' ? '▲ Ascending' : '▼ Descending'}
              </button>
            </div>
            <button onClick={() => { setStatusFilter('ALL'); setFormatFilter('ALL'); setGenreFilter('ALL'); setSelectedYear(0); setScoreFilter(0); setSearch(''); setSortBy('updatedAt'); setSortDir('desc'); }} style={{ width: '100%', padding: '6px', background: '#3db4f2', border: 'none', borderRadius: '3px', color: 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>
              Reset Filters
            </button>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title..." style={{ width: '100%', background: '#1e1e1e', border: 'none', color: 'white', padding: '10px', borderRadius: '4px', fontSize: '13px', marginBottom: '20px' }} />
        {renderContent()}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: '#3d3d5c', padding: '12px' }}>Showing {totalFiltered} of {mine.length} entries</div>
      </div>
    </div>
  );
}

// ─── Favorites Tab ────────────────────────────────────────────────────────────

function FavoritesTab({ entries, onEdit, onToggleFav, onUpdateProgress }: {
  entries: Entry[];
  onEdit: (e: Entry) => void;
  onToggleFav: (e: Entry) => void;
  onUpdateProgress?: (entryId: string, newProgress: number) => void;
}) {
  const [favType, setFavType] = useState<'series' | 'films'>('series');
  const favSeries = entries.filter(e => e.isFavorite && e.type === 'TV_SEASON');
  const favFilms = entries.filter(e => e.isFavorite && e.type === 'MOVIE');
  if (favSeries.length === 0 && favFilms.length === 0) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#647380' }}><div style={{ fontSize: '32px', marginBottom: '12px' }}>♡</div><div>No favorites yet</div><div style={{ fontSize: '12px', opacity: 0.6 }}>Hover over a card and click ♡ to add favorites</div></div>;
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #1e2240', marginBottom: '24px' }}>
        <button onClick={() => setFavType('series')} style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: favType === 'series' ? '2px solid #3db4f2' : '2px solid transparent', color: favType === 'series' ? '#3db4f2' : '#647380', fontWeight: favType === 'series' ? '700' : '500', fontSize: '13px', cursor: 'pointer', marginBottom: '-1px' }}>Series ({favSeries.length})</button>
        <button onClick={() => setFavType('films')} style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: favType === 'films' ? '2px solid #f39c12' : '2px solid transparent', color: favType === 'films' ? '#f39c12' : '#647380', fontWeight: favType === 'films' ? '700' : '500', fontSize: '13px', cursor: 'pointer', marginBottom: '-1px' }}>Films ({favFilms.length})</button>
      </div>
      {favType === 'series' && (favSeries.length === 0 ? <div style={{ textAlign: 'center', padding: '60px', color: '#647380' }}>No favorite series yet.</div> : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px' }}>{favSeries.map(e => <EntryCard key={e.id} entry={e} onEdit={onEdit} onToggleFav={onToggleFav} onUpdateProgress={onUpdateProgress} />)}</div>)}
      {favType === 'films' && (favFilms.length === 0 ? <div style={{ textAlign: 'center', padding: '60px', color: '#647380' }}>No favorite films yet.</div> : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px' }}>{favFilms.map(e => <EntryCard key={e.id} entry={e} onEdit={onEdit} onToggleFav={onToggleFav} onUpdateProgress={onUpdateProgress} />)}</div>)}
    </div>
  );
}

// ─── Stats Tab (com botão de sincronização reposicionado) ───────────────────────

function StatsTab({ entries }: { entries: Entry[] }) {
  const [syncing, setSyncing] = useState(false);
  const series = entries.filter(e => e.type === 'TV_SEASON');
  const films = entries.filter(e => e.type === 'MOVIE');
  const scored = entries.filter(e => e.score > 0);

  const seriesCompleted = series.filter(e => e.status === 'COMPLETED');
  const filmsCompleted = films.filter(e => e.status === 'COMPLETED');

  const seriesMean = scored.filter(e => e.type === 'TV_SEASON').length
    ? (scored.filter(e => e.type === 'TV_SEASON').reduce((a, e) => a + e.score, 0) / scored.filter(e => e.type === 'TV_SEASON').length).toFixed(1) : '—';
  const filmsMean = scored.filter(e => e.type === 'MOVIE').length
    ? (scored.filter(e => e.type === 'MOVIE').reduce((a, e) => a + e.score, 0) / scored.filter(e => e.type === 'MOVIE').length).toFixed(1) : '—';

  const totalEpisodes = series.reduce((a, e) => a + (e.progress || 0), 0);
  const scoreDist: Record<number, number> = {};
  for (let i = 1; i <= 10; i++) scoreDist[i] = 0;
  scored.forEach(e => { const s = Math.floor(e.score); scoreDist[s] = (scoreDist[s] || 0) + 1; });
  const maxD = Math.max(...Object.values(scoreDist), 1);

  const genreMap: Record<string, number> = {};
  entries.forEach(e => { if (!e.genres) return; e.genres.split(',').forEach(g => { const t = g.trim(); if (t) genreMap[t] = (genreMap[t] || 0) + 1; }); });
  const genres = Object.entries(genreMap).sort((a, b) => b[1] - a[1]).slice(0, 15);

  const episodeCountDist = [
    { range: '2-6', count: series.filter(e => (e.totalEpisodes || 0) >= 2 && (e.totalEpisodes || 0) <= 6).length },
    { range: '7-16', count: series.filter(e => (e.totalEpisodes || 0) >= 7 && (e.totalEpisodes || 0) <= 16).length },
    { range: '17-28', count: series.filter(e => (e.totalEpisodes || 0) >= 17 && (e.totalEpisodes || 0) <= 28).length },
    { range: '29-55', count: series.filter(e => (e.totalEpisodes || 0) >= 29 && (e.totalEpisodes || 0) <= 55).length },
    { range: '56-100', count: series.filter(e => (e.totalEpisodes || 0) >= 56 && (e.totalEpisodes || 0) <= 100).length },
    { range: '101+', count: series.filter(e => (e.totalEpisodes || 0) >= 101).length },
  ];
  const maxEpCount = Math.max(...episodeCountDist.map(d => d.count), 1);

  const yearDist: Record<number, number> = {};
  entries.forEach(e => { const y = releaseYear(e); if (y && y >= 1874) yearDist[y] = (yearDist[y] || 0) + 1; });
  const yearsSorted = Object.entries(yearDist).sort((a, b) => Number(a[0]) - Number(b[0]));
  const maxYearCount = Math.max(...Object.values(yearDist), 1);

  const syncAll = async () => {
    if (!confirm('Isso vai atualizar capas, número de episódios e datas de todos os títulos do TMDB. Seus status, notas, progresso e favoritos permanecerão intactos. Continuar?')) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/refresh-all', { method: 'POST' });
      const data = await res.json();
      alert(`✅ Sincronização concluída!\nAtualizados: ${data.updated} títulos\nFalhas: ${data.failed}`);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('❌ Erro na sincronização. Tente novamente mais tarde.');
    } finally {
      setSyncing(false);
    }
  };

  const StatBox = ({ label, value, accent, sub }: { label: string; value: string | number; accent?: string; sub?: string }) => (
    <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '16px', textAlign: 'center', borderLeft: `3px solid ${accent || '#3db4f2'}` }}>
      <div style={{ fontSize: '10px', color: '#647380', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color: accent || '#e0e4e8', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#3d3d5c', marginTop: '4px' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Cabeçalho da seção Stats com título e botão alinhados */}
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#e67d99',
          margin: '0 0 16px 0',
          borderLeft: '3px solid #e67d99',
          paddingLeft: '12px',
          letterSpacing: '-0.3px',
        }}>
          Estatísticas
        </h2>
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <button
            onClick={syncAll}
            disabled={syncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: syncing ? '#4a4a5a' : '#3db4f2',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 14px',
              color: 'white',
              fontSize: '11px',
              fontWeight: '600',
              cursor: syncing ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: syncing ? 'none' : '0 1px 4px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={e => { if (!syncing) (e.currentTarget.style.background = '#2c8bc0'); }}
            onMouseLeave={e => { if (!syncing) (e.currentTarget.style.background = '#3db4f2'); }}
          >
            <span style={{ display: 'inline-block', animation: syncing ? 'spin 0.8s linear infinite' : 'none', fontSize: '12px' }}>↻</span>
            {syncing ? 'Sincronizando...' : 'Sincronizar dados'}
          </button>
        </div>
      </div>

      {/* Animações */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Grid de estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <StatBox label="Total Series" value={series.length} accent="#3db4f2" sub={`${seriesCompleted.length} completed`} />
        <StatBox label="Episodes" value={totalEpisodes.toLocaleString()} accent="#3db4f2" />
        <StatBox label="Series Score" value={seriesMean} accent={seriesMean !== '—' ? scoreColor(Number(seriesMean)) : '#647380'} />
        <StatBox label="Total Films" value={films.length} accent="#f39c12" sub={`${filmsCompleted.length} completed`} />
        <StatBox label="Films Watched" value={filmsCompleted.length} accent="#f39c12" />
        <StatBox label="Films Score" value={filmsMean} accent={filmsMean !== '—' ? scoreColor(Number(filmsMean)) : '#647380'} />
      </div>

      {scored.length > 0 && (
        <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '20px' }}>
          <div style={{ fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '18px' }}>Score Distribution</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px' }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => {
              const c = scoreDist[n] || 0;
              const h = c ? Math.max((c / maxD) * 80, 4) : 0;
              return (
                <div key={n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  {c > 0 && <span style={{ fontSize: '10px', color: scoreColor(n), fontWeight: '700' }}>{c}</span>}
                  <div style={{ width: '100%', height: `${h}px`, background: h ? scoreColor(n) : 'transparent', borderRadius: '3px 3px 0 0' }} />
                  <span style={{ fontSize: '10px', color: '#3d3d5c', fontWeight: '700' }}>{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '20px' }}>
        <div style={{ fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '18px' }}>Episode Count</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {episodeCountDist.map(({ range, count }) => (
            <div key={range} style={{ flex: 1, minWidth: '60px', textAlign: 'center' }}>
              <div style={{ height: `${Math.max((count / maxEpCount) * 60, 4)}px`, background: '#4a90e2', borderRadius: '3px 3px 0 0', marginBottom: '6px' }} />
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#e0e4e8' }}>{count}</div>
              <div style={{ fontSize: '10px', color: '#647380' }}>{range}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {[{ label: 'Series Status', data: series }, { label: 'Films Status', data: films }].map(({ label, data }) => (
          <div key={label} style={{ background: '#1e1e35', borderRadius: '4px', padding: '18px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '14px' }}>{label}</div>
            {ALL_STATUSES.filter(s => data.filter(e => e.status === s).length > 0).map(s => {
              const c = data.filter(e => e.status === s).length;
              const pct = data.length ? (c / data.length) * 100 : 0;
              return (
                <div key={s} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#92a0ad' }}>{STATUS_LABEL[s]}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: STATUS_COLOR[s] }}>{c}</span>
                  </div>
                  <div style={{ height: '4px', background: '#2b2d42', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: STATUS_COLOR[s], borderRadius: '2px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {yearsSorted.length > 0 && (
        <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '20px', overflowX: 'auto' }}>
          <div style={{ fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '18px' }}>Release Year</div>
          <div style={{ display: 'flex', gap: '2px', minWidth: '600px' }}>
            {yearsSorted.map(([year, count]) => (
              <div key={year} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: `${Math.max((Number(count) / maxYearCount) * 80, 4)}px`, background: '#f39c12', borderRadius: '2px 2px 0 0', marginBottom: '6px' }} />
                <div style={{ fontSize: '9px', color: '#647380' }}>{year}</div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#e0e4e8' }}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {genres.length > 0 && (
        <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '18px' }}>
          <div style={{ fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '14px' }}>Top Genres</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {genres.map(([g, c]) => <span key={g} style={{ background: '#2b2d42', borderRadius: '20px', padding: '5px 12px', fontSize: '12px', color: '#92a0ad', fontWeight: '600' }}>{g} <span style={{ color: '#3db4f2', fontWeight: '800' }}>({c})</span></span>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ActivityDescription (helper) ─────────────────────────────────────────────

function activityDescription(a: ActivityLog): string {
  if (a.type === 'MOVIE') {
    if (a.status === 'COMPLETED' || a.status === 'REWATCHING') return `Completed "${a.title}"`;
    if (a.status === 'WATCHING') return `Started watching "${a.title}"`;
    if (a.status === 'PLANNING') return `Added "${a.title}" to list`;
    if (a.status === 'PAUSED') return `Paused "${a.title}"`;
    if (a.status === 'DROPPED') return `Dropped "${a.title}"`;
    return `Updated "${a.title}"`;
  }

  // TV_SEASON
  if (a.status === 'PLANNING') return `Added "${a.title}" to list`;
  if (a.status === 'PAUSED') return `Paused "${a.title}"`;
  if (a.status === 'DROPPED') return `Dropped "${a.title}"`;
  if (a.status === 'COMPLETED') return `Completed "${a.title}"`;
  if (a.status === 'REWATCHING') {
    if (a.progressEnd && a.progressStart && a.progressEnd > a.progressStart)
      return `Rewatched episodes ${a.progressStart}–${a.progressEnd} of "${a.title}"`;
    return `Rewatched ep. ${a.progress} of "${a.title}"`;
  }

  // WATCHING com agrupamento
  if (a.progressEnd !== undefined && a.progressStart !== undefined && a.progressEnd > a.progressStart) {
    return `Watched episodes ${a.progressStart}–${a.progressEnd} of "${a.title}"`;
  }
  if (a.progress === 1) return `Started watching "${a.title}"`;
  return `Watched ep. ${a.progress} of "${a.title}"`;
}

// ─── ActivityItem (componente para cada linha do log) ─────────────────────────

function ActivityItem({ activity: a, onDelete }: { activity: ActivityLog; onDelete: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #2d2d4a', position: 'relative' }}
    >
      <Link href={`/titles/${a.slug}`} style={{ flexShrink: 0, width: '36px', height: '52px', borderRadius: '4px', overflow: 'hidden', display: 'block' }}>
        <div style={{ width: '100%', height: '100%', backgroundImage: imgUrl(a.imagePath) ? `url(${imgUrl(a.imagePath)})` : undefined, backgroundColor: '#2b2d42', backgroundSize: 'cover', backgroundPosition: '50%' }} />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '11px', color: '#647380', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activityDescription(a)}
          {a.score > 0 && <span style={{ color: '#64ffda', marginLeft: '6px' }}>{formatScore(a.score)}</span>}
        </div>
        <Link href={`/titles/${a.slug}`} style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#e0e4e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
        </Link>
      </div>
      <div style={{ fontSize: '10px', color: '#3d3d5c', flexShrink: 0, marginRight: hovered ? '24px' : '0', transition: 'margin 0.2s' }}>
        {relativeDate(a.createdAt)}
      </div>
      <button
        onClick={() => onDelete(a.id)}
        title="Delete activity"
        style={{
          position: 'absolute', right: 0,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#3d3d5c', fontSize: '13px', padding: '4px',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s ease, color 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#e74c3c')}
        onMouseLeave={e => (e.currentTarget.style.color = '#3d3d5c')}
      >
        🗑
      </button>
    </div>
  );
}

// ─── Overview Tab (versão modificada com activityLog) ──────────────────────────

function OverviewTab({ entries, onEdit, onToggleFav, onUpdateProgress, activityLog, activityVisible, onLoadMore, onDeleteActivity }: {
  entries: Entry[];
  onEdit: (e: Entry) => void;
  onToggleFav: (e: Entry) => void;
  onUpdateProgress?: (entryId: string, newProgress: number) => void;
  activityLog: ActivityLog[];
  activityVisible: number;
  onLoadMore: () => void;
  onDeleteActivity: (id: string) => void;
}) {
  const series = entries.filter(e => e.type === 'TV_SEASON');
  const films = entries.filter(e => e.type === 'MOVIE');
  const favSeries = series.filter(e => e.isFavorite);
  const favFilms = films.filter(e => e.isFavorite);

  const mean = (arr: Entry[]) => {
    const scored = arr.filter(e => e.score > 0);
    return scored.length ? (scored.reduce((a, e) => a + e.score, 0) / scored.length).toFixed(1) : '—';
  };

  const visibleActivity = activityLog.slice(0, activityVisible);
  const hasMore = activityLog.length > activityVisible;

  return (
    <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ width: '240px', flexShrink: 0 }}>
        {favSeries.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '12px' }}>★ Favorite Series</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {favSeries.slice(0,6).map(e => (
                <Link key={e.id} href={`/titles/${entrySlug(e)}`} style={{ display: 'block', borderRadius: '4px', overflow: 'hidden', aspectRatio: '2/3', position: 'relative' }}>
                  <div style={{ width: '100%', height: '100%', backgroundImage: imgUrl(e.imagePath) ? `url(${imgUrl(e.imagePath)})` : undefined, backgroundColor: '#2b2d42', backgroundSize: 'cover', backgroundPosition: '50%' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '6px 4px 3px' }}>
                    <div style={{ fontSize: '8px', color: 'white', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                  </div>
                </Link>
              ))}
            </div>
            {favSeries.length > 6 && <div style={{ fontSize: '11px', color: '#647380', marginTop: '8px', textAlign: 'center' }}>+{favSeries.length-6} more</div>}
          </div>
        )}
        {favFilms.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '12px' }}>★ Favorite Films</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {favFilms.slice(0,6).map(e => (
                <Link key={e.id} href={`/titles/${entrySlug(e)}`} style={{ display: 'block', borderRadius: '4px', overflow: 'hidden', aspectRatio: '2/3', position: 'relative' }}>
                  <div style={{ width: '100%', height: '100%', backgroundImage: imgUrl(e.imagePath) ? `url(${imgUrl(e.imagePath)})` : undefined, backgroundColor: '#2b2d42', backgroundSize: 'cover', backgroundPosition: '50%' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '6px 4px 3px' }}>
                    <div style={{ fontSize: '8px', color: 'white', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                  </div>
                </Link>
              ))}
            </div>
            {favFilms.length > 6 && <div style={{ fontSize: '11px', color: '#647380', marginTop: '8px', textAlign: 'center' }}>+{favFilms.length-6} more</div>}
          </div>
        )}
        {favSeries.length===0 && favFilms.length===0 && <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#3d3d5c' }}>♡ No favorites yet<br /><span style={{ fontSize: '10px' }}>Hover over cards and click ♡</span></div>}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {[{ label: 'Series', data: series, accent: '#3db4f2' }, { label: 'Films', data: films, accent: '#f39c12' }].map(({ label, data, accent }) => (
            <div key={label} style={{ background: '#1e1e35', borderRadius: '4px', padding: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '800', color: accent, textTransform: 'uppercase', marginBottom: '12px' }}>{label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2d2d4a' }}>
                <span style={{ fontSize: '12px', color: '#647380' }}>Total</span><span style={{ fontWeight: '800', color: accent }}>{data.length}</span>
              </div>
              {label === 'Series' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2d2d4a' }}>
                  <span style={{ fontSize: '12px', color: '#647380' }}>Episodes</span><span style={{ fontWeight: '800', color: '#e0e4e8' }}>{data.reduce((a,e)=>a+(e.progress||0),0).toLocaleString()}</span>
                </div>
              )}
              {label === 'Films' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2d2d4a' }}>
                  <span style={{ fontSize: '12px', color: '#647380' }}>Watched</span><span style={{ fontWeight: '800', color: '#e0e4e8' }}>{data.filter(e=>e.status==='COMPLETED').length}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: '12px', color: '#647380' }}>Mean Score</span><span style={{ fontWeight: '800', color: mean(data) !== '—' ? scoreColor(Number(mean(data))) : '#647380' }}>{mean(data)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Recent Activity ── */}
        <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '14px' }}>Recent Activity</div>
          {visibleActivity.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#3d3d5c', padding: '20px' }}>No activity yet.</div>
          ) : (
            visibleActivity.map(a => (
              <ActivityItem key={a.id} activity={a} onDelete={onDeleteActivity} />
            ))
          )}
          {hasMore && (
            <button
              onClick={onLoadMore}
              style={{
                display: 'block', width: '100%', marginTop: '12px',
                padding: '9px', background: 'none',
                border: '1px solid #2d2d4a', borderRadius: '4px',
                color: '#647380', fontSize: '12px', fontWeight: '600',
                cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e0e4e8'; e.currentTarget.style.borderColor = '#3d3d5c'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#647380'; e.currentTarget.style.borderColor = '#2d2d4a'; }}
            >
              Load more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal (corrigido com Suspense) ─────────────────────────────

function ProfileContent() {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editingProf, setEditingProf] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [activityVisible, setActivityVisible] = useState(15);
  const recentActivityIds = useRef<Set<string>>(new Set());

  // Sincronizar aba com a URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'series', 'films', 'favorites', 'stats'].includes(tabParam)) {
      setTab(tabParam as Tab);
    } else {
      setTab('overview');
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eRes, pRes] = await Promise.all([fetch('/api/entries'), fetch('/api/profile')]);
      if (eRes.ok) setEntries(await eRes.json());
      if (pRes.ok) setProfile(await pRes.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function pushActivity(entry: Entry) {
    const now = Date.now();
    const key = `${entry.id}-${entry.status}-${entry.progress}-${entry.score}-${Math.floor(now / 200)}`;
    if (recentActivityIds.current.has(key)) return;
    recentActivityIds.current.add(key);
    setTimeout(() => recentActivityIds.current.delete(key), 500);

    if (entry.type === 'TV_SEASON' && entry.status === 'WATCHING') {
      setActivityLog(prev => {
        // Verifica se o último evento é do mesmo entryId e é progress consecutivo
        const last = prev[0];
        if (
          last &&
          last.entryId === entry.id &&
          last.status === entry.status &&
          (last.progressEnd ?? last.progress) === entry.progress - 1
        ) {
          // Agrupa: atualiza progressEnd do último evento
          return [
            { ...last, progressEnd: entry.progress },
            ...prev.slice(1),
          ];
        }
        // Novo evento
        const event: ActivityLog = {
          id: crypto.randomUUID(),
          entryId: entry.id,
          title: entry.title,
          imagePath: entry.imagePath,
          type: entry.type,
          status: entry.status,
          progress: entry.progress,
          progressStart: entry.progress,
          progressEnd: entry.progress,
          score: entry.score,
          slug: entrySlug(entry),
          createdAt: new Date().toISOString(),
        };
        return [event, ...prev];
      });
      return;
    }

    const event: ActivityLog = {
      id: crypto.randomUUID(),
      entryId: entry.id,
      title: entry.title,
      imagePath: entry.imagePath,
      type: entry.type,
      status: entry.status,
      progress: entry.progress,
      score: entry.score,
      slug: entrySlug(entry),
      createdAt: new Date().toISOString(),
    };
    setActivityLog(prev => [event, ...prev]);
  }

  function handleSaved(updated: Partial<Entry>) {
    setEntries(prev => prev.map(e => {
      if (e.id !== editingEntry?.id) return e;
      const merged = { ...e, ...updated };
      pushActivity(merged);
      return merged;
    }));
  }

  async function toggleFav(entry: Entry) {
    const next = !entry.isFavorite;
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, isFavorite: next } : e));
    await fetch(`/api/entries/${entry.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isFavorite: next }) });
  }

  async function updateProgress(entryId: string, newProgress: number) {
    try {
      const entry = entries.find(e => e.id === entryId);
      const shouldComplete = entry?.type === 'TV_SEASON' && entry.totalEpisodes != null && newProgress === entry.totalEpisodes;

      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress, ...(shouldComplete ? { status: 'COMPLETED' } : {}) }),
      });
      if (res.ok) {
        const updatedEntry = await res.json();
        setEntries(prev => prev.map(e => e.id === entryId ? updatedEntry : e));
        pushActivity(updatedEntry);
      } else {
        console.error('Erro ao atualizar progresso');
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#121212', color: '#647380' }}>Loading...</div>;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' }, { id: 'series', label: 'Series List' },
    { id: 'films', label: 'Film List' }, { id: 'favorites', label: 'Favorites' }, { id: 'stats', label: 'Stats' }
  ];

  const series = entries.filter(e => e.type === 'TV_SEASON');
  const films = entries.filter(e => e.type === 'MOVIE');

  return (
    <div style={{ background: '#121212', minHeight: '100vh', fontFamily: 'Overpass, sans-serif', color: 'rgb(159,173,189)' }}>
      <div style={{ height: '300px', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', alignItems: 'flex-end', backgroundImage: profile?.bannerUrl ? `url(${profile.bannerUrl})` : 'linear-gradient(135deg, #121212 0%, #1e1e1e 50%, #121212 100%)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(18,18,18,0) 0%, rgba(18,18,18,.6) 100%)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '30px', position: 'relative', zIndex: 2, transform: 'translateY(35px)', maxWidth: '1140px', margin: '0 auto', padding: '0 50px', width: '100%' }}>
          <div style={{
            width: '160px', height: '160px', borderRadius: '4px',
            background: profile?.avatarUrl ? 'transparent' : (profile?.avatarColor ?? '#3db4f2'),
            boxShadow: '0 0 10px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px'
          }}>
            {profile?.avatarUrl
              ? <img src={profile.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="avatar" />
              : <span style={{ fontSize: '64px' }}>🎬</span>
            }
          </div>
          <div style={{ paddingBottom: '10px' }}>
            <h1 style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 800, filter: 'drop-shadow(0px 0px 6px black)', margin: 0 }}>{profile?.username ?? 'My Profile'}</h1>
          </div>
        </div>
        <button onClick={() => setEditingProf(true)} style={{ position: 'absolute', top: '14px', right: '16px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: 'white', padding: '7px 13px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>✎ Edit Profile</button>
      </div>

      <div style={{ background: '#1e1e1e', paddingTop: '50px', marginBottom: '30px' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 20px' }}>
          {profile?.bio && <div style={{ textAlign: 'center', fontSize: '13px', color: 'rgb(159,173,189)', marginBottom: '8px' }}>{profile.bio}</div>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '8px' }}>
            <div><span style={{ fontSize: '16px', fontWeight: 800, color: '#3db4f2' }}>{series.length}</span><span style={{ fontSize: '12px', marginLeft: '5px' }}>Series</span></div>
            <div><span style={{ fontSize: '16px', fontWeight: 800, color: 'rgb(159,173,189)' }}>{series.reduce((a,e)=>a+(e.progress||0),0).toLocaleString()}</span><span style={{ fontSize: '12px', marginLeft: '5px' }}>Episodes</span></div>
            <div><span style={{ fontSize: '16px', fontWeight: 800, color: '#f39c12' }}>{films.length}</span><span style={{ fontSize: '12px', marginLeft: '5px' }}>Films</span></div>
          </div>
          <nav style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)} style={{ padding: '15px', fontSize: '1.4rem', fontWeight: 600, color: tab === id ? 'rgb(179,104,230)' : 'rgb(159,173,189)', background: 'none', border: 'none', cursor: 'pointer', textShadow: tab === id ? '0 0 5px rgb(179,104,230)' : 'none', transition: '0.3s' }}>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 20px', paddingBottom: '80px' }}>
        {tab === 'overview' && (
          <OverviewTab
            entries={entries}
            onEdit={setEditingEntry}
            onToggleFav={toggleFav}
            onUpdateProgress={updateProgress}
            activityLog={activityLog}
            activityVisible={activityVisible}
            onLoadMore={() => setActivityVisible(v => v + 15)}
            onDeleteActivity={(id) => setActivityLog(prev => prev.filter(a => a.id !== id))}
          />
        )}
        {tab === 'series' && <MediaListTab entries={entries} type="TV_SEASON" onEdit={setEditingEntry} onToggleFav={toggleFav} onUpdateProgress={updateProgress} />}
        {tab === 'films' && <MediaListTab entries={entries} type="MOVIE" onEdit={setEditingEntry} onToggleFav={toggleFav} onUpdateProgress={updateProgress} />}
        {tab === 'favorites' && <FavoritesTab entries={entries} onEdit={setEditingEntry} onToggleFav={toggleFav} onUpdateProgress={updateProgress} />}
        {tab === 'stats' && <StatsTab entries={entries} />}
      </div>

      {editingEntry && <ListEditor entry={editingEntry} onClose={() => setEditingEntry(null)} onSaved={handleSaved} />}
      {editingProf && profile && <ProfileEditor profile={profile} onClose={() => setEditingProf(false)} onSaved={p => setProfile(p)} />}
    </div>
  );
}

// ─── Exportação principal com Suspense ────────────────────────────────────────
export default function ProfilePage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#121212', color: '#647380' }}>Carregando...</div>}>
      <ProfileContent />
    </Suspense>
  );
}