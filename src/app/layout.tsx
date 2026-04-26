// src/app/layout.tsx
import './globals.css';
import Link from 'next/link';

interface NavLinkProps {
  href: string;
  label: string;
  isActive?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ href, label, isActive }) => (
  <Link
    href={href}
    className={`nav-link ${isActive ? 'active' : ''}`}
  >
    {label}
  </Link>
);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="anilist-theme">
        <header className="navbar-header">
          <nav className="navbar-container">
            <div className="navbar-brand">
              <Link href="/" className="brand-link">
                <span className="brand-text">Hades</span>
              </Link>
            </div>

            <div className="navbar-links">
              <NavLink href="/" label="Home" />
              <NavLink href="/profile" label="Profile" />
              <NavLink href="/profile?tab=films" label="Film List" />
              <NavLink href="/profile?tab=series" label="Series List" />
              <NavLink href="/search" label="Browse" />
            </div>

            <div className="navbar-user">
              <Link href="/profile?tab=overview" className="avatar-link">
                <div className="avatar-circle" title="Go to Profile">
                  <span className="avatar-initial">H</span>
                </div>
              </Link>
            </div>
          </nav>
        </header>

        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}