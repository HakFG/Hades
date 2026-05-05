import Link from 'next/link';
import type { RichRoleCard } from '@/app/api/staff/[id]/route';
import { posterUrl }         from '@/lib/staff';
import styles from '@/app/staff/staff.module.css';

export function StaffRolesSection({
  title,
  cards,
}: {
  title: string;
  cards: RichRoleCard[];
}) {
  if (cards.length === 0) return null;

  return (
    <section>
      <h2 className={styles.rolesSectionTitle}>{title}</h2>
      <div className={styles.rolesGrid}>
        {cards.map((c) => {
          const src = posterUrl(c.posterPath, 'w342');
          return (
            <Link
              key={c.key}
              href={`/titles/${c.titleSlug}`}
              className={styles.roleCardWrapper}
            >
              <div className={styles.roleCardPoster}>
                {src ? (
                  <img src={src} alt={c.title} loading="lazy" />
                ) : (
                  <div className={styles.roleCardPosterNoImg}>No image</div>
                )}

                {/* Badge "On My List" */}
                {c.inList && (
                  <div className={styles.roleCardInListBadge} aria-label="On your list">
                    ✓
                  </div>
                )}
              </div>

              <div className={styles.roleCardInfo}>
                <div className={styles.roleCardTitleRow}>
                  <span className={styles.roleCardTitle}>{c.title}</span>
                </div>
                {c.roles.length > 0 && (
                  <div className={styles.roleCardRoles}>
                    {c.roles.slice(0, 2).map((role, idx) => (
                      <div key={idx} className={styles.roleCardRole}>
                        {role}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}