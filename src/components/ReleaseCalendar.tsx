import React from 'react';
import Link from 'next/link';
import { CalendarDays, Tv, Clock } from 'lucide-react';

export interface CalendarEpisode {
  id: string;
  showName: string;
  episodeName: string;
  seasonNumber: number;
  episodeNumber: number;
  airDate: string; // ISO string
  posterPath: string | null;
  slug: string;
}

interface ReleaseCalendarProps {
  episodes: CalendarEpisode[];
}

const PT_WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const PT_MONTHS   = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export default function ReleaseCalendar({ episodes }: ReleaseCalendarProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const grouped = days.map(day => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    return {
      date: day,
      episodes: episodes.filter(e => {
        const ad = new Date(e.airDate);
        return ad >= day && ad < next;
      }),
    };
  });

  const totalEpisodes = episodes.length;

  return (
    <section className="rc-root">
      <style>{`
        /* ──────────────────────────────────────────────
           ReleaseCalendar — Hades Design System
        ────────────────────────────────────────────── */
        .rc-root {
          margin-bottom: 44px;
        }

        /* ── Header ── */
        .rc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .rc-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .rc-bar {
          width: 3px;
          height: 18px;
          border-radius: 4px;
          background: linear-gradient(180deg, #60a5fa 0%, rgba(96,165,250,0.15) 100%);
          flex-shrink: 0;
        }
        .rc-eyebrow {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.8px;
          text-transform: uppercase;
          color: #60a5fa;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .rc-eyebrow-icon {
          width: 13px; height: 13px;
        }
        .rc-divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(96,165,250,0.25), transparent);
          min-width: 32px;
        }
        .rc-count-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: rgba(96,165,250,0.07);
          border: 1px solid rgba(96,165,250,0.16);
          border-radius: 999px;
        }
        .rc-count-text {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: rgba(96,165,250,0.7);
        }

        /* ── Week strip ── */
        .rc-week-strip {
          display: flex;
          gap: 2px;
          margin-bottom: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px;
          padding: 4px;
          overflow: hidden;
        }
        .rc-week-day {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px 4px;
          border-radius: 7px;
          cursor: default;
          transition: background 0.18s ease;
        }
        .rc-week-day.today {
          background: rgba(96,165,250,0.14);
        }
        .rc-week-day-name {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 3px;
        }
        .rc-week-day.today .rc-week-day-name {
          color: #60a5fa;
        }
        .rc-week-day-num {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          line-height: 1;
        }
        .rc-week-day.today .rc-week-day-num {
          color: #93c5fd;
        }
        .rc-week-day-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          margin-top: 4px;
          background: rgba(96,165,250,0.6);
          box-shadow: 0 0 5px rgba(96,165,250,0.5);
        }
        .rc-week-day-dot.empty {
          background: rgba(255,255,255,0.08);
          box-shadow: none;
        }

        /* ── Scrollable days track ── */
        .rc-track {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 10px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(96,165,250,0.35) rgba(40,38,38,0.4);
        }
        .rc-track::-webkit-scrollbar { height: 4px; }
        .rc-track::-webkit-scrollbar-track { background: rgba(40,38,38,0.5); border-radius: 2px; }
        .rc-track::-webkit-scrollbar-thumb { background: rgba(96,165,250,0.35); border-radius: 2px; }

        /* ── Day column ── */
        .rc-day-col {
          flex-shrink: 0;
          width: 220px;
          scroll-snap-align: start;
          display: flex;
          flex-direction: column;
          background: #2c2929;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          overflow: hidden;
          animation: rc-col-in 0.4s ease both;
        }
        .rc-day-col:nth-child(1) { animation-delay: 0.04s; }
        .rc-day-col:nth-child(2) { animation-delay: 0.08s; }
        .rc-day-col:nth-child(3) { animation-delay: 0.12s; }
        .rc-day-col:nth-child(4) { animation-delay: 0.16s; }
        .rc-day-col:nth-child(5) { animation-delay: 0.20s; }
        .rc-day-col:nth-child(6) { animation-delay: 0.24s; }
        .rc-day-col:nth-child(7) { animation-delay: 0.28s; }

        .rc-day-col.today-col {
          border-color: rgba(96,165,250,0.22);
          box-shadow: 0 0 0 1px rgba(96,165,250,0.08), 0 4px 18px rgba(0,0,0,0.35);
        }

        /* Day column header */
        .rc-day-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px 8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .rc-day-col.today-col .rc-day-head {
          background: rgba(96,165,250,0.07);
          border-bottom-color: rgba(96,165,250,0.12);
        }
        .rc-day-head-left {
          display: flex;
          flex-direction: column;
        }
        .rc-day-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          line-height: 1;
        }
        .rc-day-col.today-col .rc-day-label {
          color: #60a5fa;
        }
        .rc-day-date {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.25);
          margin-top: 2px;
          letter-spacing: 0.5px;
        }
        .rc-day-col.today-col .rc-day-date {
          color: rgba(96,165,250,0.55);
        }
        .rc-ep-count-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          background: rgba(96,165,250,0.15);
          border: 1px solid rgba(96,165,250,0.25);
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          color: #93c5fd;
        }
        .rc-ep-count-badge.empty {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.2);
        }

        /* Day body */
        .rc-day-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px;
        }

        /* Episode row */
        .rc-ep-row {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 6px;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.16s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
          cursor: pointer;
        }
        .rc-ep-row:hover {
          background: rgba(255,255,255,0.05);
          transform: translateX(2px);
        }
        .rc-ep-row:hover .rc-ep-show {
          color: #60a5fa;
        }

        /* Poster thumbnail */
        .rc-ep-thumb {
          flex-shrink: 0;
          width: 32px;
          height: 46px;
          border-radius: 5px;
          object-fit: cover;
          background: #3c3939;
          display: block;
        }
        .rc-ep-thumb-empty {
          flex-shrink: 0;
          width: 32px;
          height: 46px;
          border-radius: 5px;
          background: #3c3939;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rc-ep-thumb-icon {
          width: 14px; height: 14px;
          color: rgba(255,255,255,0.15);
        }

        /* Episode text */
        .rc-ep-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .rc-ep-show {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.16s ease;
          line-height: 1.2;
        }
        .rc-ep-meta {
          font-size: 10px;
          font-weight: 600;
          color: rgba(96,165,250,0.55);
          letter-spacing: 0.3px;
        }
        .rc-ep-name {
          font-size: 9px;
          color: rgba(255,255,255,0.28);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 1px;
        }

        /* Empty state */
        .rc-empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 20px 10px;
        }
        .rc-empty-icon {
          width: 18px; height: 18px;
          color: rgba(255,255,255,0.1);
        }
        .rc-empty-text {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.15);
          text-align: center;
        }

        /* Empty total state */
        .rc-no-data {
          padding: 36px 20px;
          text-align: center;
          background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.07);
          border-radius: 12px;
        }
        .rc-no-data-icon {
          width: 28px; height: 28px;
          color: rgba(255,255,255,0.12);
          margin: 0 auto 10px;
        }
        .rc-no-data-text {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
        }

        @keyframes rc-col-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="rc-header">
        <div className="rc-header-left">
          <div className="rc-bar" />
          <h2 className="rc-eyebrow">
            <CalendarDays className="rc-eyebrow-icon" />
            Calendário de Lançamentos
          </h2>
          <div className="rc-divider-line" />
        </div>
        {totalEpisodes > 0 && (
          <div className="rc-count-pill">
            <span className="rc-count-text">{totalEpisodes} ep. esta semana</span>
          </div>
        )}
      </div>

      {/* ── Mini week overview strip ── */}
      <div className="rc-week-strip">
        {grouped.map((g, i) => {
          const isToday = i === 0;
          const hasEps  = g.episodes.length > 0;
          return (
            <div key={i} className={`rc-week-day${isToday ? ' today' : ''}`}>
              <span className="rc-week-day-name">
                {isToday ? 'Hoje' : PT_WEEKDAYS[g.date.getDay()]}
              </span>
              <span className="rc-week-day-num">{g.date.getDate()}</span>
              <div className={`rc-week-day-dot${hasEps ? '' : ' empty'}`} />
            </div>
          );
        })}
      </div>

      {/* ── Days track ── */}
      {totalEpisodes === 0 ? (
        <div className="rc-no-data">
          <CalendarDays className="rc-no-data-icon" />
          <p className="rc-no-data-text">
            Nenhum episódio nos próximos 7 dias.<br />
            <span style={{ opacity: 0.6, fontSize: '11px' }}>
              Séries com status <strong>Assistindo</strong> aparecerão aqui.
            </span>
          </p>
        </div>
      ) : (
        <div className="rc-track">
          {grouped.map((g, i) => {
            const isToday    = i === 0;
            const isTomorrow = i === 1;
            const hasEps     = g.episodes.length > 0;

            let dayLabel = PT_WEEKDAYS[g.date.getDay()];
            if (isToday)    dayLabel = 'Hoje';
            if (isTomorrow) dayLabel = 'Amanhã';

            const dayNum = g.date.getDate();
            const month  = PT_MONTHS[g.date.getMonth()];

            return (
              <div key={i} className={`rc-day-col${isToday ? ' today-col' : ''}`}>
                {/* Column header */}
                <div className="rc-day-head">
                  <div className="rc-day-head-left">
                    <span className="rc-day-label">{dayLabel}</span>
                    <span className="rc-day-date">{dayNum} {month}</span>
                  </div>
                  <div className={`rc-ep-count-badge${hasEps ? '' : ' empty'}`}>
                    {g.episodes.length}
                  </div>
                </div>

                {/* Column body */}
                <div className="rc-day-body">
                  {hasEps ? (
                    g.episodes.map(ep => (
                      <Link key={ep.id} href={`/titles/${ep.slug}`} className="rc-ep-row">
                        {ep.posterPath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${ep.posterPath}`}
                            alt={ep.showName}
                            className="rc-ep-thumb"
                          />
                        ) : (
                          <div className="rc-ep-thumb-empty">
                            <Tv className="rc-ep-thumb-icon" />
                          </div>
                        )}
                        <div className="rc-ep-text">
                          <span className="rc-ep-show">{ep.showName}</span>
                          <span className="rc-ep-meta">T{ep.seasonNumber} · E{ep.episodeNumber}</span>
                          <span className="rc-ep-name">{ep.episodeName}</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="rc-empty-state">
                      <CalendarDays className="rc-empty-icon" />
                      <span className="rc-empty-text">Sem episódios</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}