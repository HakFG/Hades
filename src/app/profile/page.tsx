'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatScore, scoreColor, imgUrl, entrySlug } from '@/lib/utils';
import { Suspense } from 'react';
import ListEditor from '@/components/ListEditor';
import PersonalGoalsSection from '@/components/PersonalGoalsSection';
import styles from './profile.module.css';
import { emitXPNotification, type XPNotificationAward } from '@/hooks/useXPNotification';

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
  
  // ─── Imagens ───
  imagePath?: string | null;
  bannerPath?: string | null;
  customImage?: string | null;
  
  // ─── Flags & Ranking ───
  isFavorite: boolean;
  hidden: boolean;
  private?: boolean;
  favoriteRank?: number | null;
  
  // ─── Datas ───
  startDate?: string | null;
  finishDate?: string | null;
  releaseDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  updatedAt: string;
  
  // ─── Conteúdo ───
  rewatchCount: number;
  notes?: string | null;
  synopsis?: string | null;
  
  // ─── Metadados TMDB ───
  genres?: string | null;
  rating?: number | null;
  popularity?: number;
  studio?: string | null;
  format?: string | null;
  runtime?: number | null;
  staff?: any;
}

type EntryWithGamification = Entry & {
  gamification?: XPNotificationAward[];
};

interface ActivityLog {
  id: string;
  entryId: string;
  title: string;
  imagePath?: string | null;
  type: 'MOVIE' | 'TV_SEASON';
  status: string;
  progressStart?: number;
  progressEnd?: number;
  score: number;
  slug: string;
  createdAt: string;
  lastUpdatedAt: string;
}

interface Profile {
  id: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  avatarColor?: string | null;
}

type Tab = 'overview' | 'series' | 'films' | 'favorites' | 'stats' | 'search' | 'goals';
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

export function EntryCard({ entry, onEdit, onToggleFav, onUpdateProgress }: {
  entry: Entry;
  onEdit: (e: Entry) => void;
  onToggleFav: (e: Entry) => void;
  onUpdateProgress?: (entryId: string, newProgress: number) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const poster = imgUrl(entry.imagePath);
  
  // Exibição do progresso: para séries, se completou mostra apenas o total
  let progressDisplay = ''
  if (entry.type === 'TV_SEASON') {
    const total = entry.totalEpisodes ?? '?';
    if (entry.progress === entry.totalEpisodes) {
      progressDisplay = `${total}`;
    } else {
      progressDisplay = `${entry.progress}/${total}`;
    }
  } else {
    // MOVIE: exibe 1 se assistido (COMPLETED), 0/1 se não assistiu ainda, vazio se planning/sem progresso
    if (entry.status === 'COMPLETED') {
      progressDisplay = '1';
    } else if (entry.status === 'WATCHING' || entry.status === 'PAUSED' || entry.status === 'DROPPED') {
      progressDisplay = '0/1';
    } else {
      progressDisplay = '';
    }
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
          gap: '0px',
          paddingLeft: entry.type === 'TV_SEASON' ? '0px' : '12px',
          marginLeft: entry.type === 'TV_SEASON' ? '-6px' : '0px',
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
                  marginLeft: '2px',
                  marginRight: '2px',
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
    <div onClick={onClose} className={styles.modalOverlay}>
      <div onClick={e => e.stopPropagation()} className={styles.modalBox}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Edit Profile</h3>
          <button onClick={onClose} className={styles.modalCloseBtn}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div>
            <label className={styles.modalFieldLabel}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} className={styles.modalInput} />
          </div>
          <div>
            <label className={styles.modalFieldLabel}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className={styles.modalTextarea} />
          </div>
          <div>
            <label className={styles.modalFieldLabel}>Avatar (Image)</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="avatar preview"
                  className={styles.modalAvatarPreview}
                />
              )}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className={styles.modalFileInput} />
              <input type="text" value={avatarUrl} onChange={e => { setAvatarUrl(e.target.value); setAvatarPreview(e.target.value); }} placeholder="Or paste URL" className={styles.modalInput} style={{ flex: 2 }} />
            </div>
          </div>
          <div>
            <label className={styles.modalFieldLabel}>Avatar Color (fallback)</label>
            <div className={styles.modalColorWrap}>
              <input type="color" value={avatarColor} onChange={e => setAvatarColor(e.target.value)} className={styles.modalColorInput} />
              <span className={styles.modalColorLabel}>{avatarColor}</span>
            </div>
          </div>
          <div>
            <label className={styles.modalFieldLabel}>Banner Image</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="file" accept="image/*" onChange={handleBannerUpload} className={styles.modalFileInput} />
              <input type="text" value={bannerUrl} onChange={e => { setBannerUrl(e.target.value); setBannerPreview(e.target.value); }} placeholder="Or paste URL" className={styles.modalInput} style={{ flex: 2 }} />
            </div>
            {bannerPreview && <img src={bannerPreview} alt="banner preview" className={styles.modalBannerPreview} />}
          </div>
          <div className={styles.modalFooter}>
            <button onClick={save} disabled={saving} className={styles.modalSaveBtn}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className={styles.modalCancelBtn}>
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
  const [selectedYear, setSelectedYear] = useState(0);
  const [scoreFilter, setScoreFilter] = useState(0);
  const [sortBy, setSortBy] = useState('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
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
        <div className={styles.listEmpty}>
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
            <div key={s} className={styles.statusGroup}>
              <div
                className={styles.statusGroupHeader}
                style={{ '--statusColor': STATUS_COLOR[s] } as React.CSSProperties}
              >
                <div
                  className={styles.statusGroupBar}
                  style={{ background: STATUS_COLOR[s] }}
                />
                <span
                  className={styles.statusGroupLabel}
                  style={{ color: STATUS_COLOR[s] }}
                >
                  {STATUS_LABEL[s]}
                </span>
                <span className={styles.statusGroupCount}>({items.length})</span>
              </div>
              <div className={styles.cardsGrid}>
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
    <div className={styles.listLayout}>
      <div className={styles.listSidebar} style={{ width: sidebarCollapsed ? '40px' : '200px' }}>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={styles.sidebarCollapseBtn}
        >
          {sidebarCollapsed ? '▶' : '◀ Filters'}
        </button>
        {!sidebarCollapsed && (
          <div className={styles.sidebarPanel}>
            <div style={{ marginBottom: '18px' }}>
              <div className={styles.filterSectionTitle}>Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {(['ALL', ...ALL_STATUSES] as const).map(s => {
                  const cnt = s === 'ALL' ? mine.length : counts[s];
                  if (cnt === 0 && s !== 'ALL') return null;
                  const isActive = statusFilter === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`${styles.filterStatusBtn} ${isActive ? styles.filterStatusBtnActive : ''}`}
                      style={isActive && s !== 'ALL' ? { color: STATUS_COLOR[s], borderLeftColor: STATUS_COLOR[s] } : undefined}
                    >
                      {s === 'ALL' ? 'All' : STATUS_LABEL[s]}
                      <span className={styles.filterStatusCount}>({cnt})</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <hr className={styles.filterDivider} />
            <div style={{ marginBottom: '16px' }}>
              <div className={styles.filterSectionTitle}>Format</div>
              <select value={formatFilter} onChange={e => setFormatFilter(e.target.value)} className={styles.filterSelect}>
                {formatOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div className={styles.filterSectionTitle}>Genre</div>
              <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)} className={styles.filterSelect}>
                <option value="ALL">All Genres</option>
                {['Action','Adventure','Comedy','Drama','Fantasy','Horror','Romance','Sci-Fi','Thriller','Mystery','Crime','Animation','Documentary','Family','Music','War','Western','History'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div className={styles.filterSectionTitle}>Year</div>
              <div className={styles.filterRangeLabel}>
                <span>Year</span>
                <span className={selectedYear > 0 ? styles.filterRangeValue : ''}>
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
                className={styles.filterRange}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div className={styles.filterSectionTitle}>Score</div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={scoreFilter}
                onChange={e => setScoreFilter(Number(e.target.value))}
                className={styles.filterRange}
                style={{ accentColor: scoreColor(scoreFilter) }}
              />
              <div className={styles.filterRangeLabel}><span>Any</span><span>10</span></div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div className={styles.filterSectionTitle}>Sort</div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={styles.filterSelect} style={{ marginBottom: '8px' }}>
                {[
                  { value: 'title', label: 'Title' },
                  { value: 'updatedAt', label: 'Last Updated' },
                  { value: 'score', label: 'Score' },
                  { value: 'progress', label: 'Progress' },
                  { value: 'releaseYear', label: 'Release Year' },
                  { value: 'startDate', label: 'Start Date' },
                  { value: 'finishDate', label: 'Finish Date' },
                ].map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} className={styles.sortDirBtn}>
                {sortDir === 'asc' ? '▲ Ascending' : '▼ Descending'}
              </button>
            </div>
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setFormatFilter('ALL');
                setGenreFilter('ALL');
                setSelectedYear(0);
                setScoreFilter(0);
                setSearch('');
                setSortBy('title');
                setSortDir('asc');
              }}
              className={styles.resetFiltersBtn}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
      <div className={styles.listMain}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search title..."
          className={styles.searchInput}
        />
        {renderContent()}
        <div className={styles.listFooter}>Showing {totalFiltered} of {mine.length} entries</div>
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
    return (
      <div className={styles.favAllEmpty}>
        <span className={styles.favEmptyIcon}>♡</span>
        <div className={styles.favEmptyText}>No favorites yet</div>
        <div className={styles.favEmptyHint}>Hover over a card and click ♡ to add favorites</div>
      </div>
    );
  }

  return (
    <div className={styles.favoritesContainer}>
      <div className={styles.favSubTabs}>
        <button
          onClick={() => setFavType('series')}
          className={`${styles.favSubTab} ${favType === 'series' ? styles.favSubTabActive : ''}`}
        >
          Series ({favSeries.length})
        </button>
        <button
          onClick={() => setFavType('films')}
          className={`${styles.favSubTab} ${favType === 'films' ? styles.favSubTabActive : ''}`}
        >
          Films ({favFilms.length})
        </button>
      </div>

      {favType === 'series' && (
        favSeries.length === 0
          ? (
            <div className={styles.favEmptyState}>
              <span className={styles.favEmptyIcon}>☆</span>
              <div className={styles.favEmptyText}>No favorite series yet.</div>
            </div>
          )
          : <div className={styles.favoritesGrid}>{favSeries.map(e => <EntryCard key={e.id} entry={e} onEdit={onEdit} onToggleFav={onToggleFav} onUpdateProgress={onUpdateProgress} />)}</div>
      )}
      {favType === 'films' && (
        favFilms.length === 0
          ? (
            <div className={styles.favEmptyState}>
              <span className={styles.favEmptyIcon}>☆</span>
              <div className={styles.favEmptyText}>No favorite films yet.</div>
            </div>
          )
          : <div className={styles.favoritesGrid}>{favFilms.map(e => <EntryCard key={e.id} entry={e} onEdit={onEdit} onToggleFav={onToggleFav} onUpdateProgress={onUpdateProgress} />)}</div>
      )}
    </div>
  );
}

// ─── Stats Tab ─────────────────────────────────────────────────────────────────

function StatsTab({ entries, onImport }: { entries: Entry[]; onImport?: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleFullExport = async () => {
    try {
      const res = await fetch('/api/backup/full-export');
      if (!res.ok) throw new Error('Falha ao exportar');
      const backup = await res.json();
      const data = JSON.stringify(backup, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hades-complete-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('✅ Backup completo exportado com sucesso!');
    } catch (err) {
      alert('❌ Erro ao exportar backup: ' + err);
      console.error(err);
    }
  };

  const handleFullImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('⚠️ Isso vai RESTAURAR O BACKUP COMPLETO:\n\n✓ Todas as entries\n✓ Relações entre títulos\n✓ Histórico de atividades\n✓ Configurações do perfil\n\nEntradas existentes com o mesmo ID serão sobrescritas.\n\nContinuar?')) {
      e.target.value = '';
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup || typeof backup !== 'object') throw new Error('Formato de backup inválido');
      const res = await fetch('/api/backup/full-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backup),
      });
      if (res.ok) {
        const result = await res.json();
        alert(
          `✅ Backup restaurado com sucesso!\n\n` +
          `📚 Entries: ${result.entriesRestored}\n` +
          `🔗 Relações: ${result.relationsRestored}\n` +
          `📊 Atividades: ${result.activitiesRestored}\n` +
          `👤 Perfil: ${result.profileRestored ? 'Sim' : 'Não'}` +
          (result.errors.length > 0 ? `\n\n⚠️ Avisos: ${result.errors.length}` : '')
        );
        onImport?.();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('❌ Erro na importação: ' + (err.error ?? 'Erro desconhecido'));
      }
    } catch (err) {
      alert('❌ Arquivo inválido ou corrompido.');
      console.error(err);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(entries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-entries-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Isso vai restaurar os títulos do backup. Entradas existentes com o mesmo ID serão sobrescritas. Continuar?')) {
      e.target.value = '';
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Formato inválido');
      const res = await fetch('/api/entries/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      if (res.ok) {
        const result = await res.json();
        alert(`✅ Importação concluída!\nRestaurados: ${result.restored} títulos`);
        onImport?.();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('❌ Erro na importação: ' + (err.error ?? 'Erro desconhecido'));
      }
    } catch (err) {
      alert('❌ Arquivo inválido ou corrompido.');
      console.error(err);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

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
    { range: '2-6',    count: series.filter(e => (e.totalEpisodes || 0) >= 2   && (e.totalEpisodes || 0) <= 6).length },
    { range: '7-16',   count: series.filter(e => (e.totalEpisodes || 0) >= 7   && (e.totalEpisodes || 0) <= 16).length },
    { range: '17-28',  count: series.filter(e => (e.totalEpisodes || 0) >= 17  && (e.totalEpisodes || 0) <= 28).length },
    { range: '29-55',  count: series.filter(e => (e.totalEpisodes || 0) >= 29  && (e.totalEpisodes || 0) <= 55).length },
    { range: '56-100', count: series.filter(e => (e.totalEpisodes || 0) >= 56  && (e.totalEpisodes || 0) <= 100).length },
    { range: '101+',   count: series.filter(e => (e.totalEpisodes || 0) >= 101).length },
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
    <div
      className={styles.statBox}
      style={{ '--statAccent': accent } as React.CSSProperties}
    >
      <div className={styles.statBoxLabel}>{label}</div>
      <div className={styles.statBoxValue} style={{ color: accent || undefined }}>{value}</div>
      {sub && <div className={styles.statBoxSub}>{sub}</div>}
    </div>
  );

  return (
    <div className={styles.statsContainer}>
      {/* Header */}
      <div className={styles.statsHeader}>
        <h2 className={styles.statsTitle}>Statistics</h2>
        <div className={styles.statsActions}>
          <input ref={importInputRef} type="file" accept=".json" onChange={handleFullImport} style={{ display: 'none' }} />
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className={`${styles.statsActionBtn} ${importing ? styles.statsActionBtnSyncing : styles.statsActionBtnRestore}`}
            title="Importa TUDO: entries, relações, atividades e perfil"
          >
            ⬆️ {importing ? 'Importing...' : 'Restore'}
          </button>
          <button
            onClick={handleFullExport}
            className={`${styles.statsActionBtn} ${styles.statsActionBtnBackup}`}
            title="Exporta TUDO: entries, relações, atividades e perfil"
          >
            ⬇️ Backup
          </button>
          <div className={styles.statsDivider} />
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} id="legacy-import" />
          <button
            onClick={() => (document.getElementById('legacy-import') as HTMLInputElement)?.click()}
            disabled={importing}
            className={`${styles.statsActionBtn} ${importing ? styles.statsActionBtnSyncing : styles.statsActionBtnImport}`}
            title="Importa só entries (compatível com backups antigos)"
          >
            ↑ {importing ? 'Importing...' : 'Entries'}
          </button>
          <button
            onClick={handleExport}
            className={`${styles.statsActionBtn} ${styles.statsActionBtnExport}`}
            title="Exporta só entries (compatível com backups antigos)"
          >
            ↓ Entries
          </button>
          <button
            onClick={syncAll}
            disabled={syncing}
            className={`${styles.statsActionBtn} ${syncing ? styles.statsActionBtnSyncing : styles.statsActionBtnSync}`}
            title="Sincroniza metadados TMDB"
          >
            <span className={syncing ? styles.spinIcon : ''}>↻</span>
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Stat boxes */}
      <div className={styles.statsGrid}>
        <StatBox label="Total Series"   value={series.length}                 accent="#3db4f2" sub={`${seriesCompleted.length} completed`} />
        <StatBox label="Episodes"        value={totalEpisodes.toLocaleString()} accent="#3db4f2" />
        <StatBox label="Series Score"    value={seriesMean}                    accent={seriesMean !== '—' ? scoreColor(Number(seriesMean)) : undefined} />
        <StatBox label="Total Films"     value={films.length}                  accent="#c9965a" sub={`${filmsCompleted.length} completed`} />
        <StatBox label="Films Watched"   value={filmsCompleted.length}         accent="#c9965a" />
        <StatBox label="Films Score"     value={filmsMean}                     accent={filmsMean !== '—' ? scoreColor(Number(filmsMean)) : undefined} />
      </div>

      {/* Score distribution */}
      {scored.length > 0 && (
        <div className={styles.chartPanel}>
          <div className={styles.chartPanelTitle}>Score Distribution</div>
          <div className={styles.scoreBarsWrap}>
            {[1,2,3,4,5,6,7,8,9,10].map((n, i) => {
              const c = scoreDist[n] || 0;
              const h = c ? Math.max((c / maxD) * 80, 4) : 0;
              return (
                <div key={n} className={styles.scoreBarCol}>
                  {c > 0 && <span className={styles.scoreBarCount} style={{ color: scoreColor(n) }}>{c}</span>}
                  <div
                    className={styles.scoreBar}
                    style={{
                      height: `${h}px`,
                      background: h ? scoreColor(n) : 'transparent',
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                  <span className={styles.scoreBarLabel}>{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Episode count */}
      <div className={styles.chartPanel}>
        <div className={styles.chartPanelTitle}>Episode Count</div>
        <div className={styles.episodeBarsWrap}>
          {episodeCountDist.map(({ range, count }, i) => (
            <div key={range} className={styles.episodeBarItem}>
              <div
                className={styles.episodeBarFill}
                style={{
                  height: `${Math.max((count / maxEpCount) * 60, count > 0 ? 4 : 0)}px`,
                  animationDelay: `${i * 0.07}s`,
                }}
              />
              <div className={styles.episodeBarValue}>{count}</div>
              <div className={styles.episodeBarRange}>{range}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status bars */}
      <div className={styles.statusBarsGrid}>
        {[{ label: 'Series Status', data: series }, { label: 'Films Status', data: films }].map(({ label, data }) => (
          <div key={label} className={styles.statusBarsPanel}>
            <div className={styles.chartPanelTitle}>{label}</div>
            {ALL_STATUSES.filter(s => data.filter(e => e.status === s).length > 0).map(s => {
              const c = data.filter(e => e.status === s).length;
              const pct = data.length ? (c / data.length) * 100 : 0;
              return (
                <div key={s} className={styles.statusBarItem}>
                  <div className={styles.statusBarMeta}>
                    <span className={styles.statusBarMetaLabel}>{STATUS_LABEL[s]}</span>
                    <span className={styles.statusBarMetaValue} style={{ color: STATUS_COLOR[s] }}>{c}</span>
                  </div>
                  <div className={styles.statusBarTrack}>
                    <div
                      className={styles.statusBarFill}
                      style={{ width: `${pct}%`, background: STATUS_COLOR[s] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Year chart */}
      {yearsSorted.length > 0 && (
        <div className={styles.chartPanel} style={{ overflowX: 'auto' }}>
          <div className={styles.chartPanelTitle}>Release Year</div>
          <div className={styles.yearChartWrap}>
            {yearsSorted.map(([year, count], i) => (
              <div key={year} className={styles.yearBarItem}>
                <div
                  className={styles.yearBarFill}
                  style={{
                    height: `${Math.max((Number(count) / maxYearCount) * 80, 4)}px`,
                    animationDelay: `${i * 0.02}s`,
                  }}
                />
                <div className={styles.yearBarLabel}>{year}</div>
                <div className={styles.yearBarValue}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Genre chips */}
      {genres.length > 0 && (
        <div className={styles.chartPanel}>
          <div className={styles.chartPanelTitle}>Top Genres</div>
          <div className={styles.genreChipsWrap}>
            {genres.map(([g, c]) => (
              <span key={g} className={styles.genreChip}>
                {g} <span className={styles.genreChipCount}>({c})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sistema de Activity Log ──────────────────────────────────────────────────

function activityDescription(a: ActivityLog): string {
  if (a.type === 'MOVIE') {
    if (a.status === 'COMPLETED') return `Completed`;
    if (a.status === 'WATCHING') return `Started watching`;
    if (a.status === 'PLANNING') return `Added to list`;
    if (a.status === 'PAUSED') return `Paused`;
    if (a.status === 'DROPPED') return `Dropped`;
    return `Updated`;
  }
  if (a.status === 'PLANNING') return `Added to list`;
  if (a.status === 'PAUSED') return `Paused`;
  if (a.status === 'DROPPED') return `Dropped`;
  if (a.status === 'COMPLETED') return `Completed`;
  if (a.status === 'REWATCHING') return `Rewatching`;
  if (a.status === 'WATCHING') {
    const start = a.progressStart;
    const end = a.progressEnd;
    if (start !== undefined && end !== undefined) {
      if (start === end) return `Watched ep. ${end}`;
      return `Watched ep. ${start}–${end}`;
    }
    if (end !== undefined) return `Watched ep. ${end}`;
    return `Watching`;
  }
  return `Updated`;
}

function ActivityItemEntry({ activity, onDelete }: { activity: ActivityLog; onDelete: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={styles.activityItem}
    >
      <Link href={`/titles/${activity.slug}`} className={styles.activityThumb}>
        <div
          className={styles.activityThumbImg}
          style={{
            backgroundImage: activity.imagePath ? `url(${imgUrl(activity.imagePath)})` : undefined,
          }}
        />
      </Link>
      <div className={styles.activityInfo}>
        <div className={styles.activityDesc}>
          {activityDescription(activity)}
          {activity.score > 0 && <span className={styles.activityScore}>{formatScore(activity.score)}</span>}
        </div>
        <Link href={`/titles/${activity.slug}`} className={styles.activityTitle}>{activity.title}</Link>
      </div>
      <div className={styles.activityDate} style={{ marginRight: hovered ? '28px' : '0' }}>
        {relativeDate(activity.createdAt)}
      </div>
      <button
        onClick={() => onDelete(activity.id)}
        className={styles.activityDeleteBtn}
        style={{ opacity: hovered ? 1 : 0 }}
      >
        🗑
      </button>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

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

  const visibleActivities = activityLog.slice(0, activityVisible);
  const hasMore = activityLog.length > activityVisible;

  return (
    <div className={styles.overviewLayout}>
      {/* Sidebar: favorites */}
      <div className={styles.overviewSidebar}>
        {favSeries.length > 0 && (
          <div className={styles.favGroup}>
            <div className={styles.favGroupTitle}>Favorite Series</div>
            <div className={styles.favGrid}>
              {favSeries.slice(0, 6).map(e => (
                <Link key={e.id} href={`/titles/${entrySlug(e)}`} className={styles.favPoster}>
                  <div
                    className={styles.favPosterImg}
                    style={{ backgroundImage: imgUrl(e.imagePath) ? `url(${imgUrl(e.imagePath)})` : undefined }}
                  />
                  <div className={styles.favPosterLabel}>
                    <div className={styles.favPosterTitle}>{e.title}</div>
                  </div>
                </Link>
              ))}
            </div>
            {favSeries.length > 6 && <div className={styles.favMore}>+{favSeries.length - 6} more</div>}
          </div>
        )}

        {favFilms.length > 0 && (
          <div className={styles.favGroup}>
            <div className={styles.favGroupTitle}>Favorite Films</div>
            <div className={styles.favGrid}>
              {favFilms.slice(0, 6).map(e => (
                <Link key={e.id} href={`/titles/${entrySlug(e)}`} className={styles.favPoster}>
                  <div
                    className={styles.favPosterImg}
                    style={{ backgroundImage: imgUrl(e.imagePath) ? `url(${imgUrl(e.imagePath)})` : undefined }}
                  />
                  <div className={styles.favPosterLabel}>
                    <div className={styles.favPosterTitle}>{e.title}</div>
                  </div>
                </Link>
              ))}
            </div>
            {favFilms.length > 6 && <div className={styles.favMore}>+{favFilms.length - 6} more</div>}
          </div>
        )}

        {favSeries.length === 0 && favFilms.length === 0 && (
          <div className={styles.emptyFavBox}>
            <span>♡</span>
            No favorites yet
            <br />
            <span style={{ fontSize: '10px' }}>Hover over cards and click ♡</span>
          </div>
        )}
      </div>

      {/* Main column */}
      <div className={styles.overviewMain}>
        <div className={styles.overviewStatsGrid}>
          {[
            { label: 'Series', data: series, accent: '#3db4f2' },
            { label: 'Films',  data: films,  accent: '#c9965a' },
          ].map(({ label, data, accent }) => (
            <div
              key={label}
              className={styles.overviewStatCard}
            >
              <div className={styles.overviewStatLabel} style={{ color: accent }}>{label}</div>
              <div className={styles.overviewStatRow}>
                <span className={styles.overviewStatRowLabel}>Total</span>
                <span className={styles.overviewStatRowValue} style={{ color: accent }}>{data.length}</span>
              </div>
              {label === 'Series' && (
                <div className={styles.overviewStatRow}>
                  <span className={styles.overviewStatRowLabel}>Episodes</span>
                  <span className={styles.overviewStatRowValue}>{data.reduce((a, e) => a + (e.progress || 0), 0).toLocaleString()}</span>
                </div>
              )}
              {label === 'Films' && (
                <div className={styles.overviewStatRow}>
                  <span className={styles.overviewStatRowLabel}>Watched</span>
                  <span className={styles.overviewStatRowValue}>{data.filter(e => e.status === 'COMPLETED').length}</span>
                </div>
              )}
              <div className={styles.overviewStatRow}>
                <span className={styles.overviewStatRowLabel}>Mean Score</span>
                <span
                  className={styles.overviewStatRowValue}
                  style={{ color: mean(data) !== '—' ? scoreColor(Number(mean(data))) : undefined }}
                >
                  {mean(data)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className={styles.activityPanel}>
          <div className={styles.activityPanelTitle}>Recent Activity</div>
          {visibleActivities.length === 0 ? (
            <div className={styles.activityEmpty}>No activity yet.</div>
          ) : (
            visibleActivities.map(a => (
              <ActivityItemEntry key={a.id} activity={a} onDelete={onDeleteActivity} />
            ))
          )}
          {hasMore && (
            <button onClick={onLoadMore} className={styles.loadMoreBtn}>
              Load more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────

function ProfileContent() {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editingProf, setEditingProf] = useState(false);
  const [activityVisible, setActivityVisible] = useState(15);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const activityLogRef = useRef<ActivityLog[]>([]);
  const recentActivityIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    activityLogRef.current = activityLog;
  }, [activityLog]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eRes, pRes, aRes] = await Promise.all([
        fetch('/api/entries'),
        fetch('/api/profile'),
        fetch('/api/activity'),
      ]);
      if (eRes.ok) setEntries(await eRes.json());
      if (pRes.ok) setProfile(await pRes.json());
      if (aRes.ok) setActivityLog(await aRes.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  const silentRefresh = useCallback(async () => {
    try {
      const [eRes, pRes] = await Promise.all([fetch('/api/entries'), fetch('/api/profile')]);
      if (eRes.ok) setEntries(await eRes.json());
      if (pRes.ok) setProfile(await pRes.json());
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') silentRefresh();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [silentRefresh]);

  const pushActivity = useCallback(async (entry: Entry) => {
    const now = Date.now();
    const key = `${entry.id}-${entry.status}-${entry.progress}-${Math.floor(now / 200)}`;
    if (recentActivityIds.current.has(key)) return;
    recentActivityIds.current.add(key);
    setTimeout(() => recentActivityIds.current.delete(key), 500);

    const shouldGroup = entry.type === 'TV_SEASON' &&
      (entry.status === 'WATCHING' || entry.status === 'REWATCHING');
    const last = activityLogRef.current[0];

    if (shouldGroup && last && last.entryId === entry.id && last.status === entry.status) {
      const lastTime = new Date(last.lastUpdatedAt).getTime();
      const hoursDiff = (now - lastTime) / (1000 * 60 * 60);
      const isConsecutive = (last.progressEnd ?? 0) === entry.progress - 1;
      if (hoursDiff <= 24 && isConsecutive) {
        const res = await fetch(`/api/activity/${last.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progressEnd: entry.progress }),
        });
        if (res.ok) {
          const updated = await res.json();
          activityLogRef.current = [updated, ...activityLogRef.current.slice(1)];
          setActivityLog(activityLogRef.current);
        }
        return;
      }
    }

    const payload = {
      entryId: entry.id,
      title: entry.title,
      imagePath: entry.imagePath ?? null,
      type: entry.type,
      status: entry.status,
      progressStart: shouldGroup ? entry.progress : null,
      progressEnd: shouldGroup ? entry.progress : null,
      score: entry.score,
      slug: entrySlug(entry),
    };

    const res = await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const newLog = await res.json();
      activityLogRef.current = [newLog, ...activityLogRef.current];
      setActivityLog(activityLogRef.current);
    }
  }, []);

  function handleSaved(updated: Entry) {
    emitXPNotification((updated as EntryWithGamification).gamification);
    setEntries(prev => prev.map(e =>
      e.id === updated.id ? { ...e, ...updated } : e
    ));
    pushActivity(updated);
    setEditingEntry(null);
  }

  async function toggleFav(entry: Entry) {
    const next = !entry.isFavorite;
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, isFavorite: next } : e));
    const res = await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: next }),
    });
    if (res.ok) {
      const updated = await res.json();
      emitXPNotification(updated.gamification);
    }
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
        emitXPNotification(updatedEntry.gamification);
        setEntries(prev => prev.map(e => e.id === entryId ? updatedEntry : e));
        pushActivity(updatedEntry);
      } else {
        console.error('Erro ao atualizar progresso');
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className={styles.loadingState}>Loading...</div>;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',   label: 'Overview' },
    { id: 'series',     label: 'Series List' },
    { id: 'films',      label: 'Film List' },
    { id: 'favorites',  label: 'Favorites' },
    { id: 'stats',      label: 'Stats' },
    { id: 'goals', label: 'Goals' },
  ];

  const series = entries.filter(e => e.type === 'TV_SEASON');
  const films   = entries.filter(e => e.type === 'MOVIE');

  return (
    <div className={styles.profilePage}>
      {/* ── Banner ── */}
      <div
        className={styles.banner}
        style={{
          backgroundImage: profile?.bannerUrl
            ? `url(${profile.bannerUrl})`
            : 'linear-gradient(135deg, #1a1818 0%, #292727 50%, #1a1818 100%)',
        }}
      >
        <div className={styles.bannerOverlay} />
        <div className={styles.bannerContent}>
          {/* Avatar — estrutura preservada integralmente */}
          <div
            className={styles.avatarWrap}
            style={{
              background: profile?.avatarUrl ? 'transparent' : (profile?.avatarColor ?? '#3db4f2'),
              boxShadow: profile?.avatarUrl ? 'none' : '0 0 10px rgba(0,0,0,0.5)',
            }}
          >
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} className={styles.avatarImg} alt="avatar" />
            ) : (
              <span style={{ fontSize: '64px' }}>👤</span>
            )}
          </div>
          <div className={styles.bannerUserInfo}>
            <h1 className={styles.bannerUsername}>{profile?.username ?? 'My Profile'}</h1>
          </div>
        </div>
        <button onClick={() => setEditingProf(true)} className={styles.editProfileBtn}>
          ✎ Edit Profile
        </button>
      </div>

      {/* ── Meta bar with tabs ── */}
      <div className={styles.metaBar}>
        <div className={styles.metaBarInner}>
          {profile?.bio && <div className={styles.bio}>{profile.bio}</div>}
          <div className={styles.quickStats}>
            <div className={styles.quickStatItem}>
              <span className={styles.quickStatValue}>{series.length}</span>
              <span className={styles.quickStatLabel}>Series</span>
            </div>
            <div className={styles.quickStatItem}>
              <span className={styles.quickStatValue}>
                {series.reduce((a, e) => a + (e.progress || 0), 0).toLocaleString()}
              </span>
              <span className={styles.quickStatLabel}>Episodes</span>
            </div>
            <div className={styles.quickStatItem}>
              <span className={styles.quickStatValue} style={{ color: '#c9965a' }}>{films.length}</span>
              <span className={styles.quickStatLabel}>Films</span>
            </div>
          </div>
          <nav className={styles.tabsNav}>
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className={styles.contentWrap}>
        {tab === 'overview' && (
          <OverviewTab
            entries={entries}
            onEdit={setEditingEntry}
            onToggleFav={toggleFav}
            onUpdateProgress={updateProgress}
            activityLog={activityLog}
            activityVisible={activityVisible}
            onLoadMore={() => setActivityVisible(v => v + 15)}
            onDeleteActivity={async (id) => {
              await fetch(`/api/activity/${id}`, { method: 'DELETE' });
              const filtered = activityLogRef.current.filter(a => a.id !== id);
              activityLogRef.current = filtered;
              setActivityLog(filtered);
            }}
          />
        )}
        {tab === 'series'    && <MediaListTab entries={entries} type="TV_SEASON" onEdit={setEditingEntry} onToggleFav={toggleFav} onUpdateProgress={updateProgress} />}
        {tab === 'films'     && <MediaListTab entries={entries} type="MOVIE"     onEdit={setEditingEntry} onToggleFav={toggleFav} onUpdateProgress={updateProgress} />}
        {tab === 'favorites' && <FavoritesTab entries={entries} onEdit={setEditingEntry} onToggleFav={toggleFav} onUpdateProgress={updateProgress} />}
        {tab === 'stats'     && <StatsTab entries={entries} onImport={load} />}
        {tab === 'goals' && <PersonalGoalsSection />}
      </div>

      {editingEntry && (
        <ListEditor
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={handleSaved}
          onDelete={() => {
            setEntries(prev => prev.filter(e => e.id !== editingEntry.id));
            setEditingEntry(null);
          }}
        />
      )}
      {editingProf && profile && (
        <ProfileEditor profile={profile} onClose={() => setEditingProf(false)} onSaved={p => setProfile(p)} />
      )}
    </div>
  );
}

// ─── Exportação principal com Suspense ────────────────────────────────────────
export default function ProfilePage() {
  return (
    <Suspense fallback={<div className={styles.loadingState}>Carregando...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
