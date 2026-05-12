import {
  PRODUCTION_STATUS_COLORS,
  type MediaKind,
  type ProductionStatus,
} from '@/lib/production-status';

interface StatusBubbleProps {
  status?: ProductionStatus | string | null;
  mediaType?: MediaKind | 'MOVIE' | 'TV_SEASON';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { size: 8, offset: 5 },
  md: { size: 12, offset: 7 },
  lg: { size: 16, offset: 9 },
};

export default function StatusBubble({
  status,
  mediaType,
  size = 'sm',
  className,
}: StatusBubbleProps) {
  const normalized = (status || (mediaType === 'MOVIE' || mediaType === 'movie' ? 'Released' : 'Ended')) as ProductionStatus;
  const color = PRODUCTION_STATUS_COLORS[normalized] ?? '#6b7280';
  const dimensions = SIZE_MAP[size];

  return (
    <span
      className={className}
      title={normalized}
      aria-label={`Production status: ${normalized}`}
      style={{
        position: 'absolute',
        top: dimensions.offset,
        left: dimensions.offset,
        width: dimensions.size,
        height: dimensions.size,
        borderRadius: '50%',
        backgroundColor: color,
        border: '1px solid rgba(255,255,255,0.55)',
        zIndex: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
        pointerEvents: 'none',
      }}
    />
  );
}

