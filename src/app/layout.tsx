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
    className={`nav-link ${
      isActive ? 'active' : ''
    }`}
  >
    {label}
  </Link>
);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="anilist-theme">
        {/* Navigation Header */}
        <header className="navbar-header">
          <nav className="navbar-container">
            {/* Logo/Brand */}
            <div className="navbar-brand">
              <Link href="/" className="brand-link">
                <span className="brand-text">Hades</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="navbar-links">
              <NavLink href="/" label="Home" />
              <NavLink href="/profile" label="Profile" />
              <NavLink href="/profile?type=film" label="Film List" />
              <NavLink href="/profile?type=series" label="Series List" />
              <NavLink href="/search" label="Browse" />
            </div>

            {/* User Avatar */}
            <div className="navbar-user">
              <Link href="/profile" className="avatar-link">
                <div className="avatar-circle" title="Go to Profile">
                  <span className="avatar-initial">H</span>
                </div>
              </Link>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}