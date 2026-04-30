// src/components/NotificationPanel.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'NEW_EPISODE' | 'PREMIERE' | 'RELATED_ADDED';
  title: string;
  message: string;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  createdAt: string;
  read: boolean;
  slug: string;
}

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_EPISODE': return '🎬';
      case 'PREMIERE': return '🎉';
      default: return '✨';
    }
  };

  return (
    <div className="notification-container" ref={panelRef}>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificações"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <span>Notificações</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="mark-all-read">
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="notification-list">
            {loading && <div className="notification-loading">Carregando...</div>}
            {!loading && error && (
              <div className="notification-empty">Erro ao carregar notificações.</div>
            )}
            {!loading && !error && notifications.length === 0 && (
              <div className="notification-empty">Nenhuma notificação</div>
            )}
            {!loading && !error && notifications.map(notif => (
              <Link
                key={notif.id}
                href={`/titles/${notif.slug}`}
                className={`notification-item ${!notif.read ? 'unread' : ''}`}
                onClick={() => {
                  if (!notif.read) markAsRead(notif.id);
                  setIsOpen(false);
                }}
              >
                <div className="notification-icon">{getIcon(notif.type)}</div>
                <div className="notification-content">
                  <div className="notification-title">{notif.title}</div>
                  <div className="notification-message">{notif.message}</div>
                  <div className="notification-time">
                    {new Date(notif.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .notification-container { 
          position: relative; 
        }
        .notification-bell {
          background: none;
          border: none;
          cursor: pointer;
          color: rgb(220,210,215);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 50%;
          transition: background 0.2s, color 0.2s;
          position: relative;
        }
        .notification-bell:hover {
          background: rgba(230,125,153,0.15);
          color: rgb(230,125,153);
        }
        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background: rgb(230,125,153);
          color: white;
          font-size: 10px;
          font-weight: bold;
          border-radius: 10px;
          min-width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          line-height: 1;
        }
        .notification-dropdown {
          position: absolute;
          top: 48px;
          right: 0;
          left: auto;
          width: 360px;
          max-height: 480px;
          background: rgb(30,28,28);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(230,125,153,0.2);
          z-index: 1000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(230,125,153,0.2);
          font-weight: 700;
          font-size: 13px;
          color: rgb(230,125,153);
          letter-spacing: 1px;
        }
        .mark-all-read {
          background: none;
          border: none;
          color: rgba(220,210,215,0.6);
          font-size: 11px;
          cursor: pointer;
          transition: color 0.2s;
          font-family: inherit;
        }
        .mark-all-read:hover { 
          color: rgb(230,125,153); 
        }
        .notification-list { 
          overflow-y: auto; 
          max-height: 420px; 
        }
        .notification-item {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          text-decoration: none;
          transition: background 0.2s;
          cursor: pointer;
        }
        .notification-item.unread { 
          background: rgba(230,125,153,0.08); 
        }
        .notification-item:hover { 
          background: rgba(230,125,153,0.15); 
        }
        .notification-icon { 
          font-size: 24px; 
          flex-shrink: 0; 
        }
        .notification-content { 
          flex: 1; 
        }
        .notification-title {
          font-size: 13px;
          font-weight: 700;
          color: rgb(220,210,215);
          margin-bottom: 4px;
        }
        .notification-message { 
          font-size: 12px; 
          color: rgba(220,210,215,0.7); 
          margin-bottom: 6px; 
        }
        .notification-time { 
          font-size: 10px; 
          color: rgba(220,210,215,0.4); 
        }
        .notification-loading, .notification-empty {
          padding: 32px;
          text-align: center;
          color: rgba(220,210,215,0.5);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}