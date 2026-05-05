'use client';

import { useMemo, useState } from 'react';
import type { StaffPersonPayload } from '@/lib/staff';
import { personProfileUrl } from '@/lib/staff';
import { StaffFavoriteButton } from './StaffFavoriteButton';
import styles from '@/app/staff/staff.module.css';

const BIO_COLLAPSE = 520;

function formatUsDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function StaffHeader({ person }: { person: StaffPersonPayload }) {
  const [bioOpen, setBioOpen] = useState(false);
  const photo = personProfileUrl(person.profilePath, 'h632');

  const bioShort = useMemo(() => {
    const t = person.biography?.trim() ?? '';
    if (t.length <= BIO_COLLAPSE || bioOpen) return t;
    return `${t.slice(0, BIO_COLLAPSE).trim()}…`;
  }, [person.biography, bioOpen]);

  const showReadMore =
    (person.biography?.length ?? 0) > BIO_COLLAPSE && !bioOpen;

  const metaItems: { label: string; value: string }[] = [];

  if (person.birthday)
    metaItems.push({ label: 'Born', value: formatUsDate(person.birthday) ?? person.birthday });
  if (person.age !== null && person.age !== undefined)
    metaItems.push({ label: 'Age', value: String(person.age) });
  if (person.genderLabel)
    metaItems.push({ label: 'Gender', value: person.genderLabel });
  if (person.yearsActive)
    metaItems.push({ label: 'Years active', value: person.yearsActive });
  if (person.placeOfBirth)
    metaItems.push({ label: 'Hometown', value: person.placeOfBirth });
  if (person.knownForDepartment)
    metaItems.push({ label: 'Known for', value: person.knownForDepartment });

  return (
    <header className={styles.staffHeader}>
      {photo ? (
        <img
          className={styles.staffPhoto}
          src={photo}
          alt={person.name}
          width={185}
          height={260}
        />
      ) : (
        <div className={styles.staffPhotoPlaceholder}>No photo</div>
      )}

      <div className={styles.staffInfo}>
        <div className={styles.staffNameRow}>
          <div style={{ minWidth: 0 }}>
            <h1 className={styles.staffName}>{person.name}</h1>
            {person.alternateName && (
              <div className={styles.staffNativeName}>{person.alternateName}</div>
            )}
          </div>
          <StaffFavoriteButton personId={person.id} />
        </div>

        {metaItems.length > 0 && (
          <ul className={styles.staffMetaList}>
            {metaItems.map(({ label, value }) => (
              <li key={label} className={styles.staffMetaItem}>
                <span className={styles.staffMetaLabel}>{label}</span>
                <span className={styles.staffMetaValue}>{value}</span>
              </li>
            ))}
          </ul>
        )}

        {person.biography ? (
          <div className={styles.staffBio}>{bioShort}</div>
        ) : (
          <div className={styles.staffBio} style={{ fontStyle: 'italic' }}>
            No biography available on TMDB.
          </div>
        )}

        {showReadMore && (
          <button
            type="button"
            className={styles.staffReadMore}
            onClick={() => setBioOpen(true)}
          >
            Read more ›
          </button>
        )}
      </div>
    </header>
  );
}