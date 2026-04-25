'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface Entry {
  id: string;
  tmdbId: number;
  parentTmdbId?: number | null;
  seasonNumber?: number | null;
  title: string;
  type: 'MOVIE' | 'TV_SEASON';
  status: 'WATCHING' | 'COMPLETED' | 'PAUSED' | 'DROPPED' | 'PLANNING' | 'REWATCHING';
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
  updatedAt: string;
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
type StatusKey = 'WATCHING' | 'COMPLETED' | 'PAUSED' | 'DROPPED' | 'PLANNING' | 'REWATCHING';

// ─── Constantes ────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  WATCHING:   '#3db4f2',
  COMPLETED:  '#2ecc71',
  PAUSED:     '#f1c40f',
  DROPPED:    '#e74c3c',
  PLANNING:   '#92a0ad',
  REWATCHING: '#9b59b6',
};

const STATUS_LABEL: Record<string, string> = {
  WATCHING:   'Watching',
  COMPLETED:  'Completed',
  PAUSED:     'Paused',
  DROPPED:    'Dropped',
  PLANNING:   'Planning',
  REWATCHING: 'Rewatching',
};

const ALL_STATUSES: StatusKey[] = ['WATCHING', 'COMPLETED', 'PAUSED', 'DROPPED', 'PLANNING', 'REWATCHING'];

const FORMAT_OPTIONS = [
  { value: 'ALL', label: 'All Formats' },
  { value: 'TV', label: 'TV' },
  { value: 'MOVIE', label: 'Movie' },
  { value: 'OVA', label: 'OVA' },
  { value: 'SPECIAL', label: 'Special' },
];

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'title',     label: 'Title'        },
  { value: 'score',     label: 'Score'        },
  { value: 'progress',  label: 'Progress'     },
  { value: 'startDate', label: 'Start Date'   },
  { value: 'finishDate',label: 'Finish Date'  },
];

const GENRES_LIST = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance',
  'Sci-Fi', 'Thriller', 'Mystery', 'Crime', 'Animation', 'Documentary',
  'Family', 'Music', 'War', 'Western', 'History'
];

// ─── Cores baseadas na nota (AniList style) ───────────────────────────────────

function scoreColor(s: number): string {
  if (!s)     return '#c9d0d8';
  if (s >= 9) return '#2ecc71';
  if (s >= 7) return '#3db4f2';
  if (s >= 5) return '#f39c12';
  return '#e74c3c';
}

function formatScore(s: number): string {
  if (!s) return '-';
  return s.toString();
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function imgUrl(p?: string | null): string {
  if (!p) return '';
  if (p.startsWith('http')) return p;
  return `https://image.tmdb.org/t/p/w300${p}`;
}

function entrySlug(e: Entry): string {
  if (e.type === 'MOVIE') return `movie-${e.tmdbId}`;
  if (e.parentTmdbId && e.seasonNumber) return `tv-${e.parentTmdbId}-s${e.seasonNumber}`;
  return `movie-${e.tmdbId}`;
}

function relativeDate(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── AniList Entry Card (IDÊNTICO ao seu - SEM ALTERAÇÕES) ────────────────────

function EntryCard({ entry, onEdit, onToggleFav }: {
  entry:       Entry;
  onEdit:      (e: Entry) => void;
  onToggleFav: (e: Entry) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const poster  = imgUrl(entry.imagePath);
  const prog    = entry.type === 'TV_SEASON'
    ? `${entry.progress}/${entry.totalEpisodes ?? '?'}`
    : entry.status === 'COMPLETED' ? 'Watched' : entry.progress > 0 ? 'Watching' : '';

  return (
    <div
      style={{
        borderRadius: '3px',
        boxShadow: '0 2px 20px rgba(49,54,68,.2)',
        height: '210px',
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        display: 'inline-block',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Status bar — topo esquerdo */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
        background: STATUS_COLOR[entry.status] ?? '#c9d0d8', zIndex: 4,
      }} />

      {/* Imagem de fundo */}
      <Link href={`/titles/${entrySlug(entry)}`} style={{ display: 'block', height: '100%', textDecoration: 'none' }}>
        <div
          style={{
            backgroundImage: poster ? `url(${poster})` : undefined,
            backgroundColor: poster ? undefined : '#c9d0d8',
            backgroundPosition: '50%',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            borderRadius: '3px',
            height: '100%',
            width: '100%',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.25s ease',
          }}
        />

        {/* Rodapé com título — igual AniList */}
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          borderRadius: '0 0 3px 3px',
          bottom: 0, left: 0,
          padding: '12px',
          paddingBottom: '35px',
          position: 'absolute',
          width: '100%',
          zIndex: 2,
          wordBreak: 'break-word',
          boxSizing: 'border-box',
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.3',
          }}>
            {entry.title}
          </div>

          {/* Score + progresso — linha inferior do rodapé */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {entry.score > 0 ? (
              <span style={{
                fontSize: '12px', fontWeight: '800',
                color: scoreColor(entry.score),
                background: 'rgba(0,0,0,0.4)', borderRadius: '3px',
                padding: '1px 5px',
              }}>
                ★ {entry.score}
              </span>
            ) : <span />}

            {prog && (
              <span style={{ fontSize: '11px', color: '#c9d0d8', fontVariantNumeric: 'tabular-nums' }}>
                {prog}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Botões flutuantes */}
      <div style={{
        position: 'absolute', top: 8, right: 6, zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: '5px',
        opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
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
          }}>
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
          }}>
          ✎
        </button>
      </div>
    </div>
  );
}

// ─── List Editor Modal (COMPLETO) ─────────────────────────────────────────────

function ListEditor({ entry, onClose, onSaved }: {
  entry:   Entry;
  onClose: () => void;
  onSaved: (updated: Partial<Entry>) => void;
}) {
  const [status,       setStatus]       = useState(entry.status);
  const [score,        setScore]        = useState(entry.score);
  const [progress,     setProgress]     = useState(entry.progress);
  const [startDate,    setStartDate]    = useState(entry.startDate ?? '');
  const [finishDate,   setFinishDate]   = useState(entry.finishDate ?? '');
  const [rewatchCount, setRewatchCount] = useState(entry.rewatchCount ?? 0);
  const [notes,        setNotes]        = useState(entry.notes ?? '');
  const [hidden,       setHidden]       = useState(entry.hidden ?? false);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (status === 'WATCHING'   && !startDate)  setStartDate(today);
    if (status === 'COMPLETED'  && !finishDate) setFinishDate(today);
    if (status === 'REWATCHING' && !startDate)  setStartDate(today);
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
      if (res.ok) { onSaved(payload); onClose(); }
      else alert('Error saving.');
    } finally { setSaving(false); }
  }

  const poster = imgUrl(entry.imagePath);
  const maxEp  = entry.totalEpisodes ?? 9999;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a2e', borderRadius: '6px', width: '100%', maxWidth: '460px', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 16px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ position: 'relative', minHeight: '110px', background: 'linear-gradient(135deg, rgba(61,180,242,0.25), rgba(43,45,66,0.95))', borderRadius: '6px 6px 0 0', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
          {poster && <img src={poster} style={{ width: '55px', height: '80px', objectFit: 'cover', borderRadius: '3px', boxShadow: '0 2px 10px rgba(0,0,0,0.4)', flexShrink: 0 }} alt={entry.title} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', lineHeight: '1.3', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{entry.title}</div>
            <div style={{ fontSize: '11px', color: '#92a0ad', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{entry.type === 'MOVIE' ? 'Film' : `Season ${entry.seasonNumber ?? ''}`}</div>
          </div>
          <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Status */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Status</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {ALL_STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{
                    padding: '8px 4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                    border: status === s ? `2px solid ${STATUS_COLOR[s]}` : '1px solid #3d3d5c',
                    borderRadius: '4px',
                    background: status === s ? `${STATUS_COLOR[s]}22` : '#2b2d42',
                    color: status === s ? STATUS_COLOR[s] : '#92a0ad',
                    transition: 'all 0.15s',
                  }}>
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Score */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Score</div>
              <span style={{ fontSize: '16px', fontWeight: '800', color: scoreColor(score), minWidth: '30px', textAlign: 'right' }}>
                {score > 0 ? score : '—'}
              </span>
            </div>
            <input type="range" min={0} max={10} step={1} value={score} onChange={e => setScore(Number(e.target.value))} style={{ width: '100%', accentColor: scoreColor(score), cursor: 'pointer', height: '4px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#3d3d5c', marginTop: '3px' }}>
              {[0,1,2,3,4,5,6,7,8,9,10].map(n => <span key={n}>{n}</span>)}
            </div>
          </div>

          {/* Progress - só para TV */}
          {entry.type === 'TV_SEASON' && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Episodes {entry.totalEpisodes ? `/ ${entry.totalEpisodes}` : ''}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => setProgress(p => Math.max(0, p - 1))} style={{ width: '38px', height: '38px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <input type="number" min={0} max={maxEp} value={progress} onChange={e => setProgress(Math.min(maxEp, Math.max(0, Number(e.target.value))))} style={{ flex: 1, padding: '9px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '14px', textAlign: 'center' }} />
                <button onClick={() => setProgress(p => Math.min(maxEp, p + 1))} style={{ width: '38px', height: '38px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
          )}

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Start Date</div>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '9px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Finish Date</div>
              <input type="date" value={finishDate} onChange={e => setFinishDate(e.target.value)} style={{ width: '100%', padding: '9px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Rewatch */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Rewatches</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setRewatchCount(r => Math.max(0, r - 1))} style={{ width: '38px', height: '38px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <div style={{ flex: 1, padding: '9px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '14px', textAlign: 'center' }}>{rewatchCount}</div>
              <button onClick={() => setRewatchCount(r => r + 1)} style={{ width: '38px', height: '38px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Personal notes..." style={{ width: '100%', padding: '9px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '13px', resize: 'vertical', fontFamily: 'Overpass, sans-serif', boxSizing: 'border-box' }} />
          </div>

          {/* Hidden */}
          <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '13px', color: '#92a0ad' }}>Hide from lists</span>
          </label>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', background: '#3db4f2', border: 'none', borderRadius: '4px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: saving ? 'wait' : 'pointer', fontFamily: 'Overpass, sans-serif' }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Overpass, sans-serif' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Editor Modal ──────────────────────────────────────────────────────

function ProfileEditor({ profile, onClose, onSaved }: {
  profile: Profile;
  onClose: () => void;
  onSaved: (p: Profile) => void;
}) {
  const [username,    setUsername]    = useState(profile.username);
  const [bio,         setBio]         = useState(profile.bio ?? '');
  const [avatarUrl,   setAvatarUrl]   = useState(profile.avatarUrl ?? '');
  const [bannerUrl,   setBannerUrl]   = useState(profile.bannerUrl ?? '');
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor ?? '#3db4f2');
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() || 'My Profile', bio: bio || null, avatarUrl: avatarUrl || null, bannerUrl: bannerUrl || null, avatarColor }),
      });
      if (res.ok) { onSaved(await res.json()); onClose(); }
      else alert('Error saving profile.');
    } finally { setSaving(false); }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a2e', borderRadius: '6px', width: '100%', maxWidth: '440px', boxShadow: '0 16px 60px rgba(0,0,0,0.5)', overflow: 'auto', maxHeight: '92vh' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #2d2d4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#e0e4e8' }}>Edit Profile</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#92a0ad', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Username</div>
            <input value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '10px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Bio</div>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '13px', resize: 'vertical', fontFamily: 'Overpass, sans-serif', boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Avatar URL</div>
            <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Avatar Color</div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="color" value={avatarColor} onChange={e => setAvatarColor(e.target.value)} style={{ width: '44px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'none' }} />
              <span style={{ fontSize: '13px', color: '#92a0ad' }}>{avatarColor}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Banner URL</div>
            <input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '13px', boxSizing: 'border-box' }} />
            <div style={{ fontSize: '11px', color: '#647380', marginTop: '5px' }}>Ideal size: 1900×400px</div>
          </div>
          {bannerUrl && (
            <div style={{ height: '80px', borderRadius: '4px', overflow: 'hidden', background: '#2b2d42' }}>
              <img src={bannerUrl} alt="banner preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', background: '#3db4f2', border: 'none', borderRadius: '4px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: saving ? 'wait' : 'pointer', fontFamily: 'Overpass, sans-serif' }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Overpass, sans-serif' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Media List Tab COM SIDEBAR DE FILTROS COMPLETA ────────────────────────────

function MediaListTab({ entries, type, onEdit, onToggleFav }: {
  entries:     Entry[];
  type:        'TV_SEASON' | 'MOVIE';
  onEdit:      (e: Entry) => void;
  onToggleFav: (e: Entry) => void;
}) {
  // Filtros
  const [statusFilter, setStatusFilter] = useState<StatusKey | 'ALL'>('ALL');
  const [formatFilter, setFormatFilter] = useState('ALL');
  const [genreFilter, setGenreFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState(0); // 0 = any
  const [scoreFilter, setScoreFilter] = useState(0); // 0 = any, 1-10 = min score
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const mine = entries.filter(e => e.type === type);

  // Estatísticas para a sidebar
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: mine.length };
    ALL_STATUSES.forEach(s => { c[s] = mine.filter(e => e.status === s).length; });
    return c;
  }, [mine]);

  // Filtragem
  const filtered = useMemo(() => {
    return mine
      .filter(e => {
        if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
        if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
        if (genreFilter !== 'ALL' && (!e.genres || !e.genres.toLowerCase().includes(genreFilter.toLowerCase()))) return false;
        if (scoreFilter > 0 && (e.score < scoreFilter)) return false;
        
        // Year filter (aproximado via finishDate ou startDate)
        if (yearFilter > 0) {
          const year = e.finishDate ? parseInt(e.finishDate.split('-')[0]) : (e.startDate ? parseInt(e.startDate.split('-')[0]) : 0);
          if (year !== yearFilter) return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'title')      diff = a.title.localeCompare(b.title);
        if (sortBy === 'score')      diff = (b.score || 0) - (a.score || 0);
        if (sortBy === 'progress')   diff = (b.progress || 0) - (a.progress || 0);
        if (sortBy === 'updatedAt')  diff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (sortBy === 'startDate')  diff = (a.startDate || '').localeCompare(b.startDate || '');
        if (sortBy === 'finishDate') diff = (a.finishDate || '').localeCompare(b.finishDate || '');
        return sortDir === 'asc' ? -diff : diff;
      });
  }, [mine, statusFilter, search, genreFilter, scoreFilter, yearFilter, sortBy, sortDir]);

  const years = useMemo(() => {
    const yrs = new Set<number>();
    mine.forEach(e => {
      if (e.finishDate) yrs.add(parseInt(e.finishDate.split('-')[0]));
      if (e.startDate) yrs.add(parseInt(e.startDate.split('-')[0]));
    });
    return Array.from(yrs).sort((a, b) => b - a);
  }, [mine]);

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      
      {/* ─── SIDEBAR DE FILTROS (AniList Style) ─────────────────────────────── */}
      <div style={{ width: sidebarCollapsed ? '40px' : '240px', flexShrink: 0, transition: 'width 0.2s' }}>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{ marginBottom: '12px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#92a0ad', padding: '6px 12px', fontSize: '11px', cursor: 'pointer', width: '100%' }}
        >
          {sidebarCollapsed ? '▶' : '◀ Filters'}
        </button>
        
        {!sidebarCollapsed && (
          <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '14px' }}>
            
            {/* Status Section */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(['ALL', ...ALL_STATUSES] as const).map(s => {
                  if (counts[s] === 0 && s !== 'ALL') return null;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      style={{
                        textAlign: 'left', padding: '5px 8px', borderRadius: '3px', fontSize: '12px', cursor: 'pointer',
                        background: statusFilter === s ? `${STATUS_COLOR[s === 'ALL' ? 'WATCHING' : s]}22` : 'transparent',
                        border: 'none', color: statusFilter === s ? (s === 'ALL' ? '#3db4f2' : STATUS_COLOR[s]) : '#92a0ad', fontWeight: statusFilter === s ? '700' : '400',
                      }}>
                      {s === 'ALL' ? 'All' : STATUS_LABEL[s]} <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.7 }}>({counts[s]})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ height: '1px', background: '#2d2d4a', margin: '12px 0' }} />

            {/* Format */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '8px' }}>Format</div>
              <select value={formatFilter} onChange={e => setFormatFilter(e.target.value)}
                style={{ width: '100%', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '3px', color: '#e0e4e8', padding: '6px 8px', fontSize: '12px' }}>
                {FORMAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Genre */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '8px' }}>Genre</div>
              <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)}
                style={{ width: '100%', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '3px', color: '#e0e4e8', padding: '6px 8px', fontSize: '12px' }}>
                <option value="ALL">All Genres</option>
                {GENRES_LIST.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Year */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '8px' }}>Year</div>
              <select value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))}
                style={{ width: '100%', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '3px', color: '#e0e4e8', padding: '6px 8px', fontSize: '12px' }}>
                <option value={0}>Any Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Score */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '8px' }}>Score</div>
              <div style={{ direction: 'rtl' }}>
                <input type="range" min={0} max={10} step={1} value={scoreFilter} onChange={e => setScoreFilter(Number(e.target.value))}
                  style={{ width: '100%', accentColor: scoreColor(scoreFilter), cursor: 'pointer', height: '4px', direction: 'ltr' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#647380', marginTop: '4px' }}>
                <span>Any</span>
                {scoreFilter > 0 && <span style={{ color: scoreColor(scoreFilter), fontWeight: 'bold' }}>≥ {scoreFilter}</span>}
                <span>10</span>
              </div>
            </div>

            {/* Sort */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '8px' }}>Sort</div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ width: '100%', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '3px', color: '#e0e4e8', padding: '6px 8px', fontSize: '12px', marginBottom: '8px' }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                style={{ width: '100%', padding: '5px 8px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '3px', color: '#92a0ad', fontSize: '11px', cursor: 'pointer' }}>
                {sortDir === 'asc' ? '▲ Ascending' : '▼ Descending'}
              </button>
            </div>

            {/* Reset */}
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setFormatFilter('ALL');
                setGenreFilter('ALL');
                setYearFilter(0);
                setScoreFilter(0);
                setSearch('');
                setSortBy('updatedAt');
                setSortDir('desc');
              }}
              style={{ width: '100%', padding: '6px', background: '#3db4f2', border: 'none', borderRadius: '3px', color: 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ─── CONTEÚDO PRINCIPAL ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Search Bar */}
        <div style={{ marginBottom: '20px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title..."
            style={{ width: '100%', padding: '10px 14px', background: '#2b2d42', border: '1px solid #3d3d5c', borderRadius: '4px', color: '#e0e4e8', fontSize: '13px', fontFamily: 'Overpass, sans-serif', boxSizing: 'border-box' }}
          />
        </div>

        {/* Grid de Cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#647380', fontSize: '14px' }}>
            {search ? 'No results found.' : `No ${type === 'MOVIE' ? 'films' : 'series'} in this list yet.`}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '20px' }}>
            {filtered.map(e => (
              <EntryCard key={e.id} entry={e} onEdit={onEdit} onToggleFav={onToggleFav} />
            ))}
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: '#3d3d5c', padding: '12px' }}>
          Showing {filtered.length} of {mine.length} entries
        </div>
      </div>
    </div>
  );
}

// ─── Favorites Tab (COMPLETA com abas) ─────────────────────────────────────────

function FavoritesTab({ entries, onEdit, onToggleFav }: {
  entries:     Entry[];
  onEdit:      (e: Entry) => void;
  onToggleFav: (e: Entry) => void;
}) {
  const [favType, setFavType] = useState<'series' | 'films'>('series');
  
  const favSeries = entries.filter(e => e.isFavorite && e.type === 'TV_SEASON');
  const favFilms = entries.filter(e => e.isFavorite && e.type === 'MOVIE');

  if (favSeries.length === 0 && favFilms.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#647380', fontSize: '14px', lineHeight: '1.8' }}>
        No favorites yet.<br />
        <span style={{ fontSize: '12px' }}>Hover over any card and click ♡ to favorite.</span>
      </div>
    );
  }

  return (
    <div>
      {/* Abas de favoritos */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #2d2d4a', marginBottom: '24px' }}>
        <button
          onClick={() => setFavType('series')}
          style={{
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: favType === 'series' ? '2px solid #3db4f2' : '2px solid transparent',
            color: favType === 'series' ? '#3db4f2' : '#647380',
            fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s',
          }}>
          Series ({favSeries.length})
        </button>
        <button
          onClick={() => setFavType('films')}
          style={{
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: favType === 'films' ? '2px solid #f39c12' : '2px solid transparent',
            color: favType === 'films' ? '#f39c12' : '#647380',
            fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s',
          }}>
          Films ({favFilms.length})
        </button>
      </div>

      {/* Conteúdo das abas */}
      {favType === 'series' && (
        favSeries.length === 0
          ? <div style={{ textAlign: 'center', padding: '60px', color: '#647380' }}>No favorite series yet.</div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '20px' }}>
              {favSeries.map(e => <EntryCard key={e.id} entry={e} onEdit={onEdit} onToggleFav={onToggleFav} />)}
            </div>
      )}

      {favType === 'films' && (
        favFilms.length === 0
          ? <div style={{ textAlign: 'center', padding: '60px', color: '#647380' }}>No favorite films yet.</div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '20px' }}>
              {favFilms.map(e => <EntryCard key={e.id} entry={e} onEdit={onEdit} onToggleFav={onToggleFav} />)}
            </div>
      )}
    </div>
  );
}

// ─── Stats Tab (COMPLETA com todos os gráficos) ────────────────────────────────

function StatsTab({ entries }: { entries: Entry[] }) {
  const series   = entries.filter(e => e.type === 'TV_SEASON');
  const films    = entries.filter(e => e.type === 'MOVIE');
  const scored   = entries.filter(e => e.score > 0);
  
  const seriesCompleted = series.filter(e => e.status === 'COMPLETED');
  const filmsCompleted = films.filter(e => e.status === 'COMPLETED');
  
  // Médias
  const seriesMean = scored.filter(e => e.type === 'TV_SEASON').length
    ? (scored.filter(e => e.type === 'TV_SEASON').reduce((a, e) => a + e.score, 0) / scored.filter(e => e.type === 'TV_SEASON').length).toFixed(1) : '—';
  const filmsMean = scored.filter(e => e.type === 'MOVIE').length
    ? (scored.filter(e => e.type === 'MOVIE').reduce((a, e) => a + e.score, 0) / scored.filter(e => e.type === 'MOVIE').length).toFixed(1) : '—';
  
  // Total de episódios assistidos
  const totalEpisodes = series.reduce((a, e) => a + (e.progress || 0), 0);
  
  // Distribuição de notas
  const scoreDist: Record<number, number> = {};
  for (let i = 1; i <= 10; i++) scoreDist[i] = 0;
  scored.forEach(e => { scoreDist[e.score] = (scoreDist[e.score] || 0) + 1; });
  const maxD = Math.max(...Object.values(scoreDist), 1);
  
  // Gêneros
  const genreMap: Record<string, number> = {};
  entries.forEach(e => { if (!e.genres) return; e.genres.split(',').forEach(g => { const t = g.trim(); if (t) genreMap[t] = (genreMap[t] || 0) + 1; }); });
  const genres = Object.entries(genreMap).sort((a, b) => b[1] - a[1]).slice(0, 15);
  
  // Distribuição por temporada (para séries com episódios)
  const episodeCountDist = [
    { range: '2-6', count: series.filter(e => (e.totalEpisodes || 0) >= 2 && (e.totalEpisodes || 0) <= 6).length },
    { range: '7-16', count: series.filter(e => (e.totalEpisodes || 0) >= 7 && (e.totalEpisodes || 0) <= 16).length },
    { range: '17-28', count: series.filter(e => (e.totalEpisodes || 0) >= 17 && (e.totalEpisodes || 0) <= 28).length },
    { range: '29-55', count: series.filter(e => (e.totalEpisodes || 0) >= 29 && (e.totalEpisodes || 0) <= 55).length },
    { range: '56-100', count: series.filter(e => (e.totalEpisodes || 0) >= 56 && (e.totalEpisodes || 0) <= 100).length },
    { range: '101+', count: series.filter(e => (e.totalEpisodes || 0) >= 101).length },
  ];
  const maxEpCount = Math.max(...episodeCountDist.map(d => d.count), 1);
  
  // Distribuição por ano de lançamento (aproximado)
  const yearDist: Record<number, number> = {};
  entries.forEach(e => {
    const year = e.finishDate ? parseInt(e.finishDate.split('-')[0]) : (e.startDate ? parseInt(e.startDate.split('-')[0]) : null);
    if (year && year > 1970) yearDist[year] = (yearDist[year] || 0) + 1;
  });
  const yearsSorted = Object.entries(yearDist).sort((a, b) => Number(a[0]) - Number(b[0]));
  const maxYearCount = Math.max(...Object.values(yearDist), 1);

  function StatBox({ label, value, accent, sub }: { label: string; value: string | number; accent?: string; sub?: string }) {
    return (
      <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '16px', textAlign: 'center', borderLeft: `3px solid ${accent || '#3db4f2'}` }}>
        <div style={{ fontSize: '10px', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700', marginBottom: '6px' }}>{label}</div>
        <div style={{ fontSize: '28px', fontWeight: '800', color: accent || '#e0e4e8', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: '11px', color: '#3d3d5c', marginTop: '4px' }}>{sub}</div>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <StatBox label="Total Series" value={series.length} accent="#3db4f2" sub={`${seriesCompleted.length} completed`} />
        <StatBox label="Episodes" value={totalEpisodes.toLocaleString()} accent="#3db4f2" />
        <StatBox label="Series Score" value={seriesMean} accent={seriesMean !== '—' ? scoreColor(Number(seriesMean)) : '#647380'} />
        <StatBox label="Total Films" value={films.length} accent="#f39c12" sub={`${filmsCompleted.length} completed`} />
        <StatBox label="Films Watched" value={filmsCompleted.length} accent="#f39c12" />
        <StatBox label="Films Score" value={filmsMean} accent={filmsMean !== '—' ? scoreColor(Number(filmsMean)) : '#647380'} />
      </div>

      {/* Score Distribution Chart */}
      {scored.length > 0 && (
        <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '18px' }}>Score Distribution</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px' }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => {
              const c = scoreDist[n] || 0;
              const h = c ? Math.max((c / maxD) * 80, 4) : 0;
              return (
                <div key={n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  {c > 0 && <span style={{ fontSize: '10px', color: scoreColor(n), fontWeight: '700' }}>{c}</span>}
                  <div style={{ width: '100%', height: `${h}px`, background: h ? scoreColor(n) : 'transparent', borderRadius: '3px 3px 0 0', minHeight: h ? '4px' : 0 }} />
                  <span style={{ fontSize: '10px', color: '#3d3d5c', fontWeight: '700' }}>{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Episode Count Distribution (AniList style) */}
      <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '18px' }}>Episode Count</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {episodeCountDist.map(({ range, count }) => (
            <div key={range} style={{ flex: 1, minWidth: '60px', textAlign: 'center' }}>
              <div style={{ width: '100%', height: `${Math.max((count / maxEpCount) * 60, 4)}px`, background: '#4a90e2', borderRadius: '3px 3px 0 0', marginBottom: '6px' }} />
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#e0e4e8' }}>{count}</div>
              <div style={{ fontSize: '10px', color: '#647380' }}>{range}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Distribution (AniList style - horizontal bars) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '14px' }}>Series Status</div>
          {ALL_STATUSES.filter(s => series.filter(e => e.status === s).length > 0).map(s => {
            const c = series.filter(e => e.status === s).length;
            const pct = (c / series.length) * 100;
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
        <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', marginBottom: '14px' }}>Films Status</div>
          {ALL_STATUSES.filter(s => films.filter(e => e.status === s).length > 0).map(s => {
            const c = films.filter(e => e.status === s).length;
            const pct = (c / films.length) * 100;
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
      </div>

      {/* Release Year Timeline */}
      {yearsSorted.length > 0 && (
        <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '20px', overflowX: 'auto' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '18px' }}>Release Year</div>
          <div style={{ display: 'flex', gap: '2px', minWidth: '600px' }}>
            {yearsSorted.map(([year, count]) => (
              <div key={year} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: `${Math.max((count / maxYearCount) * 80, 4)}px`, background: '#f39c12', borderRadius: '2px 2px 0 0', marginBottom: '6px' }} />
                <div style={{ fontSize: '9px', color: '#647380' }}>{year}</div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#e0e4e8' }}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Genres */}
      {genres.length > 0 && (
        <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '14px' }}>Top Genres</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {genres.map(([g, c]) => (
              <span key={g} style={{ background: '#2b2d42', borderRadius: '20px', padding: '5px 12px', fontSize: '12px', color: '#92a0ad', fontWeight: '600' }}>
                {g} <span style={{ color: '#3db4f2', fontWeight: '800' }}>({c})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab (com layout corrigido: favoritos na esquerda, stats + activity na direita) ───

function OverviewTab({ entries, onEdit, onToggleFav }: {
  entries:     Entry[];
  onEdit:      (e: Entry) => void;
  onToggleFav: (e: Entry) => void;
}) {
  const series    = entries.filter(e => e.type === 'TV_SEASON');
  const films     = entries.filter(e => e.type === 'MOVIE');
  const favSeries = series.filter(e => e.isFavorite);
  const favFilms  = films.filter(e => e.isFavorite);

  const scored = (arr: Entry[]) => arr.filter(e => e.score > 0);
  const mean = (arr: Entry[]) => scored(arr).length ? (scored(arr).reduce((a, e) => a + e.score, 0) / scored(arr).length).toFixed(1) : '—';
  const recent = [...entries].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 15);

  return (
    <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      
      {/* COLUNA ESQUERDA - FAVORITOS (como na imagem) */}
      <div style={{ width: '240px', flexShrink: 0 }}>
        {/* Favorite Series */}
        {favSeries.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
              ★ Favorite Series
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {favSeries.slice(0, 6).map(e => (
                <Link key={e.id} href={`/titles/${entrySlug(e)}`} title={e.title}
                  style={{ display: 'block', borderRadius: '4px', overflow: 'hidden', textDecoration: 'none', aspectRatio: '2/3', position: 'relative' }}>
                  <div style={{ width: '100%', height: '100%', backgroundImage: imgUrl(e.imagePath) ? `url(${imgUrl(e.imagePath)})` : undefined, backgroundColor: '#2b2d42', backgroundSize: 'cover', backgroundPosition: '50%' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '6px 4px 3px' }}>
                    <div style={{ fontSize: '8px', color: 'white', fontWeight: '600', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                  </div>
                </Link>
              ))}
            </div>
            {favSeries.length > 6 && (
              <div style={{ fontSize: '11px', color: '#647380', marginTop: '8px', textAlign: 'center' }}>
                +{favSeries.length - 6} more
              </div>
            )}
          </div>
        )}

        {/* Favorite Films */}
        {favFilms.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
              ★ Favorite Films
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {favFilms.slice(0, 6).map(e => (
                <Link key={e.id} href={`/titles/${entrySlug(e)}`} title={e.title}
                  style={{ display: 'block', borderRadius: '4px', overflow: 'hidden', textDecoration: 'none', aspectRatio: '2/3', position: 'relative' }}>
                  <div style={{ width: '100%', height: '100%', backgroundImage: imgUrl(e.imagePath) ? `url(${imgUrl(e.imagePath)})` : undefined, backgroundColor: '#2b2d42', backgroundSize: 'cover', backgroundPosition: '50%' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '6px 4px 3px' }}>
                    <div style={{ fontSize: '8px', color: 'white', fontWeight: '600', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                  </div>
                </Link>
              ))}
            </div>
            {favFilms.length > 6 && (
              <div style={{ fontSize: '11px', color: '#647380', marginTop: '8px', textAlign: 'center' }}>
                +{favFilms.length - 6} more
              </div>
            )}
          </div>
        )}

        {favSeries.length === 0 && favFilms.length === 0 && (
          <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#3d3d5c', lineHeight: '1.6' }}>
            ♡ No favorites yet<br />
            <span style={{ fontSize: '10px' }}>Hover over cards and click ♡</span>
          </div>
        )}
      </div>

      {/* COLUNA DIREITA - Stats + Activity */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Series Stats */}
          <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#3db4f2', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Series</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2d2d4a' }}>
              <span style={{ fontSize: '12px', color: '#647380' }}>Total</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#3db4f2' }}>{series.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2d2d4a' }}>
              <span style={{ fontSize: '12px', color: '#647380' }}>Episodes</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#e0e4e8' }}>{series.reduce((a, e) => a + (e.progress || 0), 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: '12px', color: '#647380' }}>Mean Score</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: mean(series) !== '—' ? scoreColor(Number(mean(series))) : '#647380' }}>{mean(series)}</span>
            </div>
          </div>

          {/* Films Stats */}
          <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#f39c12', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Films</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2d2d4a' }}>
              <span style={{ fontSize: '12px', color: '#647380' }}>Total</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#f39c12' }}>{films.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2d2d4a' }}>
              <span style={{ fontSize: '12px', color: '#647380' }}>Watched</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#e0e4e8' }}>{films.filter(e => e.status === 'COMPLETED').length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: '12px', color: '#647380' }}>Mean Score</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: mean(films) !== '—' ? scoreColor(Number(mean(films))) : '#647380' }}>{mean(films)}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ background: '#1e1e35', borderRadius: '4px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#647380', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>Recent Activity</div>
          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#3d3d5c', padding: '20px' }}>No activity yet.</div>
          ) : (
            recent.map(e => (
              <div key={e.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #2d2d4a' }}>
                <Link href={`/titles/${entrySlug(e)}`} style={{ flexShrink: 0, display: 'block', width: '36px', height: '52px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', backgroundImage: imgUrl(e.imagePath) ? `url(${imgUrl(e.imagePath)})` : undefined, backgroundColor: '#2b2d42', backgroundSize: 'cover', backgroundPosition: '50%' }} />
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '10px', color: STATUS_COLOR[e.status], fontWeight: '700', marginBottom: '2px' }}>
                    {STATUS_LABEL[e.status]}
                    {e.type === 'TV_SEASON' && e.progress > 0 && <span style={{ color: '#647380', fontWeight: '400' }}> · Ep {e.progress}</span>}
                    {e.score > 0 && <span style={{ color: scoreColor(e.score) }}> ★ {e.score}</span>}
                  </div>
                  <Link href={`/titles/${entrySlug(e)}`} style={{ textDecoration: 'none' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#e0e4e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                  </Link>
                </div>
                <div style={{ fontSize: '10px', color: '#3d3d5c', flexShrink: 0 }}>{relativeDate(e.updatedAt)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

export default function ProfilePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editingProf, setEditingProf] = useState(false);

const load = useCallback(async () => {
  setLoading(true);
  try {
    const [eRes, pRes] = await Promise.all([
      fetch('/api/entries'), // ← Certifique-se que esta rota existe
      fetch('/api/profile'),
    ]);
    if (eRes.ok) setEntries(await eRes.json());
    if (pRes.ok) setProfile(await pRes.json());
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => { load(); }, [load]);

  function handleSaved(updated: Partial<Entry>) {
    setEntries(prev => prev.map(e => e.id === editingEntry?.id ? { ...e, ...updated } : e));
  }

  async function toggleFav(entry: Entry) {
    const next = !entry.isFavorite;
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, isFavorite: next } : e));
    await fetch(`/api/entries/${entry.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isFavorite: next }) });
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0e27', fontFamily: 'Overpass, sans-serif', color: '#647380' }}>Loading...</div>;
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'series', label: 'Series List' },
    { id: 'films', label: 'Film List' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'stats', label: 'Stats' },
  ];

  const series = entries.filter(e => e.type === 'TV_SEASON');
  const films = entries.filter(e => e.type === 'MOVIE');

  return (
    <div style={{ background: '#0a0e27', minHeight: '100vh', fontFamily: 'Overpass, sans-serif', color: '#e0e4e8' }}>

      {/* Banner */}
      <div style={{ height: '280px', position: 'relative', overflow: 'hidden', background: '#141830' }}>
        {profile?.bannerUrl
          ? <img src={profile.bannerUrl} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #141927 0%, #1e2d52 50%, #0f1a33 100%)' }} />
        }
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(transparent, #0a0e27)' }} />
        <button onClick={() => setEditingProf(true)} style={{ position: 'absolute', top: '14px', right: '16px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: 'white', padding: '7px 13px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
          ✎ Edit Profile
        </button>
      </div>

      {/* Profile Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '22px', marginTop: '-55px', paddingBottom: '22px' }}>
          <div style={{ width: '90px', height: '90px', borderRadius: '4px', flexShrink: 0, background: profile?.avatarColor ?? '#3db4f2', border: '3px solid #0a0e27', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
            {profile?.avatarUrl ? <img src={profile.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" /> : '🎬'}
          </div>
          <div style={{ paddingBottom: '6px', flex: 1 }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '6px', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>{profile?.username ?? 'My Profile'}</div>
            {profile?.bio && <div style={{ fontSize: '12px', color: '#647380', marginBottom: '8px', maxWidth: '500px' }}>{profile.bio}</div>}
            <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
              <div><span style={{ fontSize: '16px', fontWeight: '800', color: '#3db4f2' }}>{series.length}</span><span style={{ fontSize: '12px', color: '#647380', marginLeft: '5px' }}>Series</span></div>
              <div><span style={{ fontSize: '16px', fontWeight: '800', color: '#92a0ad' }}>{series.reduce((a, e) => a + (e.progress || 0), 0).toLocaleString()}</span><span style={{ fontSize: '12px', color: '#647380', marginLeft: '5px' }}>Episodes</span></div>
              <div><span style={{ fontSize: '16px', fontWeight: '800', color: '#f39c12' }}>{films.length}</span><span style={{ fontSize: '12px', color: '#647380', marginLeft: '5px' }}>Films</span></div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e2240', marginBottom: '28px', overflowX: 'auto' }}>
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding: '13px 20px', background: 'none', border: 'none', borderBottom: tab === id ? '2px solid #3db4f2' : '2px solid transparent', color: tab === id ? '#3db4f2' : '#647380', fontWeight: tab === id ? '700' : '500', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', marginBottom: '-1px' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ paddingBottom: '80px' }}>
          {tab === 'overview' && <OverviewTab entries={entries} onEdit={setEditingEntry} onToggleFav={toggleFav} />}
          {tab === 'series' && <MediaListTab entries={entries} type="TV_SEASON" onEdit={setEditingEntry} onToggleFav={toggleFav} />}
          {tab === 'films' && <MediaListTab entries={entries} type="MOVIE" onEdit={setEditingEntry} onToggleFav={toggleFav} />}
          {tab === 'favorites' && <FavoritesTab entries={entries} onEdit={setEditingEntry} onToggleFav={toggleFav} />}
          {tab === 'stats' && <StatsTab entries={entries} />}
        </div>
      </div>

      {/* Modals */}
      {editingEntry && <ListEditor entry={editingEntry} onClose={() => setEditingEntry(null)} onSaved={handleSaved} />}
      {editingProf && profile && <ProfileEditor profile={profile} onClose={() => setEditingProf(false)} onSaved={p => setProfile(p)} />}
    </div>
  );
}