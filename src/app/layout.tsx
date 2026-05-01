// src/app/layout.tsx
import './globals.css';
import Link from 'next/link';
import NotificationPanel from '@/components/NotificationPanel';
import XPProgressBar from '@/components/XPProgressBar';
import XPToastHost from '@/components/XPToastHost';
import AchievementToast from '@/components/AchievementToast';
import ChallengeToast from '@/components/ChallengeToast';

interface NavLinkProps {
  href: string;
  label: string;
}

const NavLink: React.FC<NavLinkProps> = ({ href, label }) => (
  <Link href={href} className="nav-link">
    {label}
  </Link>
);

const HadesIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 3 C10 3 7 6.5 7 10.5 C7 8 9 7 11 8.5 C11 6 12.5 4.5 14 4.5 C15.5 4.5 17 6 17 8.5 C19 7 21 8 21 10.5 C21 6.5 18 3 14 3Z" fill="url(#flameTop)" opacity="0.9" />
    <path d="M6 13 C6 9.5 9.5 7 14 7 C18.5 7 22 9.5 22 13 L22 17 C22 18.1 21.1 19 20 19 L8 19 C6.9 19 6 18.1 6 17 Z" fill="url(#helmetGrad)" />
    <rect x="12" y="14" width="4" height="6" rx="1" fill="url(#vizorGrad)" opacity="0.85" />
    <path d="M6 17 L6 21 C6 22 7 23 8 23 L11 23 L11 19 Z" fill="url(#guardGrad)" opacity="0.75" />
    <path d="M22 17 L22 21 C22 22 21 23 20 23 L17 23 L17 19 Z" fill="url(#guardGrad)" opacity="0.75" />
    <path d="M11 7 C11 5 12 3.5 14 3 C16 3.5 17 5 17 7" stroke="url(#cristaGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <defs>
      <linearGradient id="flameTop" x1="14" y1="3" x2="14" y2="11" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f0a070" />
        <stop offset="100%" stopColor="rgb(230,125,153)" />
      </linearGradient>
      <linearGradient id="helmetGrad" x1="14" y1="7" x2="14" y2="19" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgb(230,125,153)" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#9b3a5a" stopOpacity="0.85" />
      </linearGradient>
      <linearGradient id="vizorGrad" x1="14" y1="14" x2="14" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0e0c0c" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#1a1717" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="guardGrad" x1="14" y1="17" x2="14" y2="23" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgb(230,125,153)" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#7a2a44" stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id="cristaGrad" x1="14" y1="3" x2="14" y2="7" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f0c070" />
        <stop offset="100%" stopColor="rgb(230,125,153)" />
      </linearGradient>
    </defs>
  </svg>
);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Estilos para corrigir o alinhamento da navbar e XPProgressBar */}
        <style>{`
          .navbar-user {
            display: flex !important;
            align-items: center !important;
            gap: 1rem !important;
            flex-wrap: wrap !important;
          }
          .xp-float-shell {
            display: flex !important;
            align-items: center !important;
          }
          /* Ajuste pequeno para o NotificationPanel não ter margens indesejadas */
          .notification-panel-trigger,
          .notification-panel-trigger button {
            display: flex !important;
            align-items: center !important;
          }
          /* Garantir que o avatar circle fique alinhado verticalmente */
          .avatar-link {
            display: flex !important;
            align-items: center !important;
          }
        `}</style>
      </head>
      <body className="anilist-theme">

        <header className="navbar-header">
          <nav className="navbar-container">

            <div className="navbar-brand">
              <Link href="/" className="brand-link" title="Hades — Início">
                <span className="brand-icon"><HadesIcon /></span>
                <span className="brand-text">Hades</span>
              </Link>
            </div>

            <div className="navbar-links">
              <NavLink href="/"                    label="Home"           />
              <NavLink href="/profile"             label="Profile"        />
              <NavLink href="/profile?tab=films"   label="Film List"      />
              <NavLink href="/profile?tab=series"  label="Series List"    />
              <NavLink href="/search"              label="Browse"         />
              <NavLink href="/gamification"        label="Gamification"   />
            </div>

            <div className="navbar-user">
              <div className="xp-float-shell">
                <XPProgressBar />
              </div>
              <NotificationPanel />
              <Link href="/profile?tab=overview" className="avatar-link" title="Ir ao Perfil">
                <div className="avatar-circle">
                  <span className="avatar-initial">H</span>
                </div>
              </Link>
            </div>

          </nav>
        </header>

        <main className="main-content">
          {children}
        </main>

        <XPToastHost />
        <AchievementToast />
        <ChallengeToast />

      </body>
    </html>
  );
}