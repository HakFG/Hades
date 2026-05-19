'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Clapperboard, Trophy, Tv, Users } from 'lucide-react';
import { buildSeasonTitle } from '@/lib/utils';

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB = 'https://api.themoviedb.org/3';

type AwardMode = 'movies' | 'series' | 'people';
type AwardResult = 'winner' | 'nominated';

interface OscarFilm {
  id: string;
  title: string;
  year: number;
  tmdbId: number | null;
  posterPath: string | null;
  categories: string[];
  result: AwardResult;
  releaseDate: string | null;
  voteAverage: number | null;
  source?: 'curated' | 'tmdb-pool';
}

interface OscarPayload {
  year: number;
  years: number[];
  categories: string[];
  films: OscarFilm[];
  source?: 'curated' | 'tmdb-pool';
}

interface AwardCard {
  id: string;
  title: string;
  subtitle: string;
  year: number;
  href: string;
  imagePath: string | null;
  categories: string[];
  result: AwardResult;
  source?: 'curated' | 'tmdb-pool' | 'generated';
}

interface SeriesAwardSeed {
  id: string;
  showId: number;
  seasonNumber: number;
  year: number;
  categories: string[];
  result: AwardResult;
}

interface PersonAwardSeed {
  id: string;
  name: string;
  year: number;
  categories: string[];
  result: AwardResult;
}

const SERIES_AWARDS: SeriesAwardSeed[] = [
  { id: 'emmy-shogun-s1', showId: 126308, seasonNumber: 1, year: 2024, categories: ['Outstanding Drama Series'], result: 'winner' },
  { id: 'emmy-hacks-s3', showId: 124101, seasonNumber: 3, year: 2024, categories: ['Outstanding Comedy Series'], result: 'winner' },
  { id: 'emmy-baby-reindeer-s1', showId: 241259, seasonNumber: 1, year: 2024, categories: ['Limited or Anthology Series'], result: 'winner' },
  { id: 'emmy-the-bear-s2', showId: 136315, seasonNumber: 2, year: 2024, categories: ['Comedy Series', 'Directing'], result: 'winner' },
  { id: 'emmy-the-crown-s6', showId: 65494, seasonNumber: 6, year: 2024, categories: ['Drama Series'], result: 'nominated' },
  { id: 'emmy-only-murders-s3', showId: 107113, seasonNumber: 3, year: 2024, categories: ['Comedy Series'], result: 'nominated' },
  { id: 'emmy-fallout-s1', showId: 106379, seasonNumber: 1, year: 2024, categories: ['Drama Series'], result: 'nominated' },
  { id: 'emmy-mr-and-mrs-smith-s1', showId: 84828, seasonNumber: 1, year: 2024, categories: ['Drama Series'], result: 'nominated' },
];

const PEOPLE_AWARDS: PersonAwardSeed[] = [
  { id: 'people-hiroyuki-sanada', name: 'Hiroyuki Sanada', year: 2024, categories: ['Lead Actor', 'Drama'], result: 'winner' },
  { id: 'people-anna-sawai', name: 'Anna Sawai', year: 2024, categories: ['Lead Actress', 'Drama'], result: 'winner' },
  { id: 'people-jeremy-allen-white', name: 'Jeremy Allen White', year: 2024, categories: ['Lead Actor', 'Comedy'], result: 'winner' },
  { id: 'people-jean-smart', name: 'Jean Smart', year: 2024, categories: ['Lead Actress', 'Comedy'], result: 'winner' },
  { id: 'people-jodie-foster', name: 'Jodie Foster', year: 2024, categories: ['Limited Series'], result: 'winner' },
  { id: 'people-elizabeth-debicki', name: 'Elizabeth Debicki', year: 2024, categories: ['Supporting Actress'], result: 'winner' },
  { id: 'people-idris-elba', name: 'Idris Elba', year: 2024, categories: ['Lead Actor'], result: 'nominated' },
  { id: 'people-selena-gomez', name: 'Selena Gomez', year: 2024, categories: ['Lead Actress'], result: 'nominated' },
];

async function tmdbJson(endpoint: string) {
  if (!API_KEY) return null;
  const glue = endpoint.includes('?') ? '&' : '?';
  const response = await fetch(`${TMDB}${endpoint}${glue}api_key=${API_KEY}&language=en-US`);
  if (!response.ok) return null;
  return response.json();
}

function awardYears(firstYear: number) {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - firstYear + 1 }, (_, index) => currentYear - index);
}

async function hydrateGeneratedSeries(year: number): Promise<AwardCard[]> {
  const data = await tmdbJson(
    `/discover/tv?first_air_date_year=${year}&sort_by=vote_count.desc&vote_count.gte=80&include_null_first_air_dates=false&page=1`,
  );
  const shows = ((data?.results ?? []) as Array<{ id: number; name?: string; poster_path?: string | null }>).slice(0, 24);
  const hydrated = await Promise.all(
    shows.map(async (show, index) => {
      const detail = await tmdbJson(`/tv/${show.id}`);
      const seasons = ((detail?.seasons ?? []) as Array<{
        id: number;
        season_number: number;
        poster_path?: string | null;
        air_date?: string | null;
      }>)
        .filter((season) => season.season_number > 0)
        .sort((a, b) => {
          const yearA = Number((a.air_date ?? '').split('-')[0]) || 0;
          const yearB = Number((b.air_date ?? '').split('-')[0]) || 0;
          if (yearA !== yearB) return yearB - yearA;
          return b.season_number - a.season_number;
        });
      const season = seasons.find((item) => (item.air_date ?? '').startsWith(String(year))) ?? seasons[0];
      const seasonNumber = season?.season_number ?? 1;
      return {
        id: `emmy-pool-${year}-${show.id}-s${seasonNumber}`,
        title: buildSeasonTitle(detail?.name ?? show.name ?? 'Series', seasonNumber),
        subtitle: `Emmy Awards ${year}`,
        year,
        href: `/titles/tv-${show.id}-s${seasonNumber}`,
        imagePath: season?.poster_path ?? detail?.poster_path ?? show.poster_path ?? null,
        categories: index < 8 ? ['Outstanding Series Pool'] : ['Emmy Watchlist'],
        result: 'nominated' as const,
        source: 'generated' as const,
      };
    }),
  );
  return hydrated.filter((card) => card.imagePath || card.title);
}

async function hydrateGeneratedPeople(year: number): Promise<AwardCard[]> {
  const data = await tmdbJson('/person/popular?page=1');
  const people = ((data?.results ?? []) as Array<{
    id: number;
    name?: string;
    profile_path?: string | null;
    known_for_department?: string;
  }>).slice(0, 18);
  return people.map((person, index) => ({
    id: `people-pool-${year}-${person.id}`,
    title: person.name ?? 'Performer',
    subtitle: `Performance Awards ${year}`,
    year,
    href: `/staff/${person.id}`,
    imagePath: person.profile_path ?? null,
    categories: [person.known_for_department ?? 'Performance Pool', index < 8 ? 'Featured' : 'Watchlist'],
    result: 'nominated',
    source: 'generated',
  }));
}

async function hydrateSeries(seed: SeriesAwardSeed): Promise<AwardCard> {
  const [show, season] = await Promise.all([
    tmdbJson(`/tv/${seed.showId}`),
    tmdbJson(`/tv/${seed.showId}/season/${seed.seasonNumber}`),
  ]);
  const showName = show?.name ?? 'Series';
  return {
    id: seed.id,
    title: buildSeasonTitle(showName, seed.seasonNumber),
    subtitle: `Emmy Awards ${seed.year}`,
    year: seed.year,
    href: `/titles/tv-${seed.showId}-s${seed.seasonNumber}`,
    imagePath: season?.poster_path ?? show?.poster_path ?? null,
    categories: seed.categories,
    result: seed.result,
    source: 'curated',
  };
}

async function hydratePerson(seed: PersonAwardSeed): Promise<AwardCard> {
  const response = await fetch(`/api/staff/search?q=${encodeURIComponent(seed.name)}`);
  const data = response.ok ? await response.json() : null;
  const person = data?.results?.[0];
  return {
    id: seed.id,
    title: seed.name,
    subtitle: `Performance Awards ${seed.year}`,
    year: seed.year,
    href: person?.id ? `/staff/${person.id}` : '/staff',
    imagePath: person?.profile_path ?? null,
    categories: seed.categories,
    result: seed.result,
    source: 'curated',
  };
}

function cardFromFilm(film: OscarFilm): AwardCard {
  return {
    id: film.id,
    title: film.title,
    subtitle: `Academy Awards ${film.year}`,
    year: film.year,
    href: film.tmdbId ? `/titles/movie-${film.tmdbId}` : '#',
    imagePath: film.posterPath,
    categories: film.categories,
    result: film.result,
    source: film.source,
  };
}

export default function OscarSection() {
  const [mode, setMode] = useState<AwardMode>('movies');
  const [payload, setPayload] = useState<OscarPayload | null>(null);
  const [movieYear, setMovieYear] = useState<number | null>(null);
  const [seriesYear, setSeriesYear] = useState(new Date().getFullYear());
  const [peopleYear, setPeopleYear] = useState(new Date().getFullYear());
  const [seriesCards, setSeriesCards] = useState<AwardCard[]>([]);
  const [peopleCards, setPeopleCards] = useState<AwardCard[]>([]);
  const [resultFilter, setResultFilter] = useState<'all' | AwardResult>('all');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const params = movieYear ? `?year=${movieYear}` : '';
      const response = await fetch(`/api/oscars${params}`, { signal: controller.signal });
      if (response.ok) {
        const data = (await response.json()) as OscarPayload;
        setPayload(data);
        setMovieYear(data.year);
      }
    };
    load().catch((error) => {
      if (error?.name !== 'AbortError') console.error(error);
    });
    return () => controller.abort();
  }, [movieYear]);

  useEffect(() => {
    let active = true;
    const seriesSeeds = SERIES_AWARDS.filter((seed) => seed.year === seriesYear);
    const peopleSeeds = PEOPLE_AWARDS.filter((seed) => seed.year === peopleYear);
    (seriesSeeds.length ? Promise.all(seriesSeeds.map(hydrateSeries)) : hydrateGeneratedSeries(seriesYear)).then((cards) => {
      if (active) setSeriesCards(cards);
    });
    (peopleSeeds.length ? Promise.all(peopleSeeds.map(hydratePerson)) : hydrateGeneratedPeople(peopleYear)).then((cards) => {
      if (active) setPeopleCards(cards);
    });
    return () => {
      active = false;
    };
  }, [peopleYear, seriesYear]);

  const cards = useMemo(() => {
    if (mode === 'series') return seriesCards;
    if (mode === 'people') return peopleCards;
    return (payload?.films ?? []).map(cardFromFilm);
  }, [mode, payload?.films, peopleCards, seriesCards]);

  const years = useMemo(() => {
    if (mode === 'movies') return payload?.years ?? [];
    if (mode === 'series') return awardYears(1949);
    return awardYears(1929);
  }, [mode, payload?.years]);

  const categories = useMemo(() => {
    return Array.from(new Set(cards.flatMap((card) => card.categories))).sort();
  }, [cards]);

  const filteredCards = useMemo(() => {
    return cards
      .filter((card) => resultFilter === 'all' || card.result === resultFilter)
      .filter((card) => !category || card.categories.includes(category));
  }, [cards, category, resultFilter]);

  const title = mode === 'movies' ? 'Academy Awards' : mode === 'series' ? 'Emmy Awards' : 'People Awards';
  const activeYear = mode === 'movies' ? payload?.year : mode === 'series' ? seriesYear : peopleYear;
  const sourceLabel =
    mode === 'movies' && payload?.source === 'curated'
      ? 'Curated winners and nominees'
      : mode === 'series' && seriesCards.some((card) => card.source === 'curated')
        ? 'Curated Emmy selection'
        : mode === 'people' && peopleCards.some((card) => card.source === 'curated')
          ? 'Curated performance selection'
          : 'Expanded TMDB award pool';

  return (
    <section className="awards">
      <div className="section-head">
        <div className="title">
          <Trophy size={16} />
          <h2>{title}</h2>
          {activeYear && <span>{activeYear}</span>}
        </div>

        <div className="controls">
          {mode === 'movies' && payload && (
            <select value={payload.year} onChange={(event) => setMovieYear(Number(event.target.value))}>
              {payload.years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          {mode === 'series' && (
            <select value={seriesYear} onChange={(event) => setSeriesYear(Number(event.target.value))}>
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          {mode === 'people' && (
            <select value={peopleYear} onChange={(event) => setPeopleYear(Number(event.target.value))}>
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="award-note">
        <span>{sourceLabel}</span>
        <strong>{filteredCards.length} titles</strong>
      </div>

      <div className="mode-tabs" role="tablist" aria-label="Award media">
        {[
          { key: 'movies' as const, label: 'Movies', icon: Clapperboard },
          { key: 'series' as const, label: 'Series', icon: Tv },
          { key: 'people' as const, label: 'People', icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={mode === key ? 'active' : ''}
            onClick={() => {
              setMode(key);
              setCategory('');
              setResultFilter('all');
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="tabs">
        {(['all', 'winner', 'nominated'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={resultFilter === option ? 'active' : ''}
            onClick={() => setResultFilter(option)}
          >
            {option === 'all' ? 'All' : option === 'winner' ? 'Winners' : 'Nominees'}
          </button>
        ))}
      </div>

      <div className="award-grid">
        {filteredCards.slice(0, 24).map((card, index) => {
          const image = card.imagePath ? `https://image.tmdb.org/t/p/w300${card.imagePath}` : '';
          return (
            <Link key={card.id} href={card.href} className="award-card" aria-disabled={card.href === '#'} style={{ '--i': index } as CSSProperties}>
              <div className="poster">
                {image ? <img src={image} alt={card.title} loading="lazy" /> : <div className="placeholder">{card.title.slice(0, 2)}</div>}
                <span className={card.result}>{card.result === 'winner' ? 'Winner' : 'Nominee'}</span>
                {card.source !== 'curated' && <em>Pool</em>}
              </div>
              <h3>{card.title}</h3>
              <p>{card.categories.slice(0, 2).join(', ')}</p>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes awardPanelIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes awardCardIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes awardGlow {
          0%,
          100% {
            opacity: 0.34;
            transform: translateX(-12%);
          }
          50% {
            opacity: 0.76;
            transform: translateX(8%);
          }
        }

        .awards {
          position: relative;
          display: grid;
          gap: 12px;
          margin-bottom: 18px;
          padding: 16px;
          border-radius: 8px;
          background: linear-gradient(180deg, rgb(46, 43, 43), rgb(40, 37, 37));
          border: 1px solid rgba(255, 255, 255, 0.07);
          overflow: hidden;
          animation: awardPanelIn 0.34s ease both;
        }

        .awards::before {
          content: '';
          position: absolute;
          inset: -40% 35% auto -20%;
          height: 130px;
          background: radial-gradient(circle, rgba(230, 125, 153, 0.17), transparent 68%);
          pointer-events: none;
          animation: awardGlow 6s ease-in-out infinite;
        }

        .awards > * {
          position: relative;
          z-index: 1;
        }

        .section-head,
        .title,
        .controls,
        .tabs,
        .mode-tabs {
          display: flex;
          align-items: center;
        }

        .section-head {
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .title,
        .controls,
        .tabs,
        .mode-tabs {
          gap: 8px;
          flex-wrap: wrap;
        }

        h2 {
          margin: 0;
          font-size: 14px;
          color: rgb(232, 226, 223);
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .title span {
          color: rgb(230, 125, 153);
          font-size: 12px;
          font-weight: 900;
        }

        select,
        button {
          min-height: 30px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(58, 55, 55, 0.82);
          color: rgba(220, 210, 215, 0.78);
          font: inherit;
          font-size: 11px;
          font-weight: 850;
        }

        select {
          padding: 0 10px;
        }

        button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          padding: 0 10px;
        }

        button.active,
        button:hover,
        button:focus-visible {
          border-color: rgba(230, 125, 153, 0.46);
          background: rgba(230, 125, 153, 0.14);
          color: rgb(232, 226, 223);
          outline: none;
          transform: translateY(-1px);
        }

        button:active {
          transform: translateY(0);
        }

        .mode-tabs {
          padding: 4px;
          width: fit-content;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.055);
        }

        .mode-tabs button.active {
          background: rgb(230, 125, 153);
          color: white;
        }

        .award-note {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-height: 30px;
          padding: 0 10px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.055);
          color: rgba(220, 210, 215, 0.48);
          font-size: 11px;
          font-weight: 800;
        }

        .award-note strong {
          color: rgba(232, 226, 223, 0.78);
          font-size: 11px;
        }

        .award-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(104px, 118px));
          justify-content: start;
          gap: 14px;
        }

        .award-card {
          min-width: 0;
          text-decoration: none;
          color: rgb(220, 210, 215);
          animation: awardCardIn 0.36s ease both;
          animation-delay: calc(var(--i, 0) * 22ms);
          outline: none;
        }

        .poster {
          position: relative;
          aspect-ratio: 2 / 3;
          overflow: hidden;
          border-radius: 8px;
          background: rgb(58, 55, 55);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 5px 14px rgba(0, 0, 0, 0.24);
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }

        .award-card:hover .poster,
        .award-card:focus-visible .poster {
          transform: translateY(-4px);
          border-color: rgba(230, 125, 153, 0.45);
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.34);
        }

        img,
        .placeholder {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.22s ease;
        }

        .award-card:hover img,
        .award-card:focus-visible img {
          transform: scale(1.045);
        }

        .award-card:hover h3,
        .award-card:focus-visible h3 {
          color: rgb(230, 125, 153);
        }

        .placeholder {
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgb(58, 55, 55), rgb(42, 39, 39));
          color: rgba(220, 210, 215, 0.5);
          font-size: 18px;
          font-weight: 900;
        }

        .poster span {
          position: absolute;
          top: 7px;
          right: 7px;
          padding: 3px 6px;
          border-radius: 6px;
          color: white;
          font-size: 9px;
          font-weight: 900;
          background: rgba(78, 70, 62, 0.94);
        }

        .poster span.winner {
          background: rgba(206, 151, 58, 0.94);
        }

        .poster em {
          position: absolute;
          left: 7px;
          bottom: 7px;
          padding: 3px 6px;
          border-radius: 6px;
          background: rgba(20, 18, 18, 0.78);
          color: rgba(232, 226, 223, 0.78);
          font-size: 9px;
          font-style: normal;
          font-weight: 900;
        }

        h3 {
          margin: 7px 0 3px;
          font-size: 11px;
          line-height: 1.25;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        p {
          margin: 0;
          color: rgba(220, 210, 215, 0.46);
          font-size: 9px;
          line-height: 1.25;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        @media (prefers-reduced-motion: reduce) {
          .awards,
          .awards::before,
          .award-card {
            animation: none;
          }

          img,
          .poster,
          button {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
