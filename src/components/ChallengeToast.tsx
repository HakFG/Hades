'use client';

import { useCallback, useEffect, useState } from 'react';
import { Target, Trophy } from 'lucide-react';
import { CHALLENGE_EVENT, type CompletedChallengeNotification } from '@/hooks/useXPNotification';

interface ChallengeToastItem {
  id: string;
  challenge: CompletedChallengeNotification;
}

const CATEGORY_LABEL: Record<string, string> = {
  daily: 'Desafio diario',
  weekly: 'Missao semanal',
  special: 'Missao especial',
};

export default function ChallengeToast() {
  const [toasts, setToasts] = useState<ChallengeToastItem[]>([]);

  const push = useCallback((challenge: CompletedChallengeNotification) => {
    const item = {
      id: `${challenge.challengeId}-${Date.now()}`,
      challenge,
    };
    setToasts((prev) => [item, ...prev].slice(0, 3));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== item.id));
    }, 5200);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ challenges?: CompletedChallengeNotification[] }>;
      custom.detail?.challenges?.forEach(push);
    };
    window.addEventListener(CHALLENGE_EVENT, handler);
    return () => window.removeEventListener(CHALLENGE_EVENT, handler);
  }, [push]);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      right: '22px',
      bottom: '24px',
      zIndex: 9999,
      display: 'grid',
      gap: '10px',
      width: 'min(360px, calc(100vw - 32px))',
      pointerEvents: 'none',
    }}>
      {toasts.map(({ id, challenge }) => (
        <div key={id} style={{
          display: 'grid',
          gridTemplateColumns: '42px 1fr',
          gap: '12px',
          padding: '13px',
          borderRadius: '8px',
          border: '1px solid rgba(201,151,58,0.42)',
          background: 'linear-gradient(135deg, rgba(201,151,58,0.16), rgba(26,23,23,0.97))',
          boxShadow: '0 18px 44px rgba(0,0,0,0.52), 0 0 18px rgba(201,151,58,0.12)',
          animation: 'challengeToastIn 0.34s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '8px',
            color: '#fff4ec',
            background: 'linear-gradient(135deg, rgb(230,125,153), rgb(201,151,58))',
          }}>
            <Trophy size={20} aria-hidden="true" />
          </div>
          <div style={{ minWidth: 0, display: 'grid', gap: '3px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#c9973a',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              <Target size={12} aria-hidden="true" />
              {CATEGORY_LABEL[challenge.category] ?? 'Desafio'}
            </div>
            <strong style={{
              color: '#f2e9e3',
              fontSize: '14px',
              lineHeight: 1.18,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {challenge.title}
            </strong>
            <span style={{ color: 'rgba(232,226,223,0.74)', fontSize: '12px', lineHeight: 1.35 }}>
              Completo: {challenge.current}/{challenge.goal} · +{challenge.rewardXP.toLocaleString('pt-BR')} XP
            </span>
            {challenge.badge && (
              <small style={{ color: '#ffd693', fontSize: '11px', fontWeight: 800 }}>
                Badge liberado
              </small>
            )}
          </div>
        </div>
      ))}
      <style>{`
        @keyframes challengeToastIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
