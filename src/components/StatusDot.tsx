/**
 * Bolinha de status da lista do usuário (AniList-style):
 * verde = assistindo, laranja = planejado / em breve.
 * Complementa StatusBubble (produção TMDB), que fica no canto superior esquerdo.
 */

export type UserListStatus =
  | 'WATCHING'
  | 'COMPLETED'
  | 'PAUSED'
  | 'DROPPED'
  | 'PLANNING'
  | 'REWATCHING'
  | 'UPCOMING'
  | string;

const SIZE_MAP = {
  sm: { size: 8, offset: 5 },
  md: { size: 11, offset: 6 },
  lg: { size: 14, offset: 8 },
};

function resolveDotColor(status?: string | null): { fill: string; label: string } {
  const key = (status || 'PLANNING').toString().toUpperCase();
  if (key === 'WATCHING' || key === 'REWATCHING') {
    return { fill: '#2ecc71', label: 'Watching' };
  }
  if (key === 'UPCOMING' || key === 'PLANNING') {
    return { fill: '#e67e22', label: key === 'UPCOMING' ? 'Upcoming' : 'Planning' };
  }
  if (key === 'COMPLETED') return { fill: '#3498db', label: 'Completed' };
  if (key === 'PAUSED') return { fill: '#f1c40f', label: 'Paused' };
  if (key === 'DROPPED') return { fill: '#e74c3c', label: 'Dropped' };
  return { fill: '#8892a0', label: 'List status' };
}

interface StatusDotProps {
  status?: UserListStatus | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** default: bottom-right (para não sobrepor StatusBubble no topo-esquerdo) */
  position?: 'br' | 'bl' | 'tr' | 'tl';
}

export default function StatusDot({
  status,
  size = 'md',
  className,
  position = 'br',
}: StatusDotProps) {
  const { fill, label } = resolveDotColor(status);
  const dim = SIZE_MAP[size];
  const pos =
    position === 'br'
      ? { bottom: dim.offset, right: dim.offset, top: 'auto', left: 'auto' }
      : position === 'bl'
        ? { bottom: dim.offset, left: dim.offset, top: 'auto', right: 'auto' }
        : position === 'tr'
          ? { top: dim.offset, right: dim.offset, bottom: 'auto', left: 'auto' }
          : { top: dim.offset, left: dim.offset, bottom: 'auto', right: 'auto' };

  return (
    <span
      className={className}
      title={`List: ${label}`}
      aria-label={`User list status: ${label}`}
      style={{
        position: 'absolute',
        ...pos,
        width: dim.size,
        height: dim.size,
        borderRadius: '50%',
        backgroundColor: fill,
        border: '1px solid rgba(255,255,255,0.55)',
        zIndex: 15,
        boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
        pointerEvents: 'none',
      }}
    />
  );
}
