import Link from 'next/link';
import { IBM_Plex_Mono, IBM_Plex_Sans, Playfair_Display } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './global.css';
import { Providers } from './providers';

const display = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
});

const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'WIRA Admin',
  description: 'WIRA administrative operations console',
};

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/volunteers', label: 'Volunteers' },
  { href: '/warnings/new', label: 'Warnings' },
  { href: '/map', label: 'Map' },
];

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <Providers>
          <div className="status-banner" role="status" aria-live="polite">
            <span className="status-dot" />
            <span>Manual Warning Mode / Mod Amaran Manual</span>
          </div>

          <div className="app-shell">
            <aside className="side-nav">
              <h1 className="brand-title">WIRA Admin</h1>
              <p className="brand-subtitle">Woven Intelligence for Regional Alertness</p>
              <nav>
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="nav-link">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>
            <main className="main-content">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
