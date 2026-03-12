'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n/context';
import type { Locale } from '../i18n/locales';
import { LOCALES, LOCALE_DISPLAY, getLocaleFlagEmoji, getLocaleDisplayLabel } from '../i18n/locales';

const NAV_HREFS = [
  { href: '/', key: 'shell.nav.dashboard' },
  { href: '/volunteers', key: 'shell.nav.volunteers' },
  { href: '/warnings/new', key: 'shell.nav.warnings' },
  { href: '/map', key: 'shell.nav.map' },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const [langOpen, setLangOpen] = useState(false);

  const isLoginPage = pathname === '/login';
  const isDashboardPage = pathname === '/';
  const useWhiteMainContent =
    isDashboardPage ||
    pathname?.startsWith('/volunteers') ||
    pathname?.startsWith('/warnings');

  if (isLoginPage) {
    return <main>{children}</main>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {t('common.loadingConsole')}
      </div>
    );
  }

  if (user && user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">{t('shell.accessDeniedTitle')}</h1>
          <p className="text-neutral-600 mb-6">
            {t('shell.accessDeniedMessage')}
          </p>
          <button
            onClick={logout}
            className="w-full bg-neutral-900 text-white py-3 rounded-md font-medium hover:bg-neutral-800 transition-colors"
          >
            {t('shell.logoutButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="status-banner" role="status" aria-live="polite">
        <span className="status-dot" />
        <span>{t('shell.statusBanner')}</span>
      </div>

      <div className="app-shell">
        <aside className="side-nav">
          <div className="mb-4 flex justify-center">
            <img
              src="/logo.svg"
              alt=""
              aria-hidden
              className="h-12 w-auto max-w-[160px] object-contain"
            />
          </div>
          <h1 className="brand-title">{t('shell.brandTitle')}</h1>
          <p className="brand-subtitle">{t('shell.brandSubtitle')}</p>

          <div className="language-selector-block" style={{ marginBottom: '1rem' }}>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">{t('shell.language')}</p>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setLangOpen((o) => !o)}
                className="nav-link w-full text-left flex items-center gap-2"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '12px' }}
                aria-expanded={langOpen}
                aria-haspopup="listbox"
                aria-label={LOCALE_DISPLAY[locale].nativeLabel ?? getLocaleDisplayLabel(locale)}
              >
                <span aria-hidden>{getLocaleFlagEmoji(locale)}</span>
                <span>{getLocaleDisplayLabel(locale)}</span>
              </button>
              {langOpen && (
                <ul
                  role="listbox"
                  className="card"
                  style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, padding: 4, zIndex: 50, listStyle: 'none' }}
                >
                  {LOCALES.map((loc: Locale) => (
                    <li key={loc}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={locale === loc}
                        onClick={() => {
                          setLocale(loc);
                          setLangOpen(false);
                        }}
                        className="nav-link w-full text-left flex items-center gap-2"
                        style={{ background: locale === loc ? 'rgba(13, 79, 92, 0.1)' : 'transparent', border: 'none', cursor: 'pointer', padding: '8px 12px' }}
                      >
                        <span aria-hidden>{LOCALE_DISPLAY[loc].flagEmoji}</span>
                        <span>{LOCALE_DISPLAY[loc].displayLabel}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="user-profile mb-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
            <p className="text-sm font-bold text-teal-900">{user?.name}</p>
            <p className="text-xs text-teal-700">{user?.email}</p>
          </div>

          <nav>
            {NAV_HREFS.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${pathname === href ? 'nav-link-active' : ''}`}
              >
                {t(key)}
              </Link>
            ))}

            <button
              onClick={logout}
              className="nav-link w-full text-left mt-8 text-neutral-500 hover:text-red-600 border-t border-neutral-100 pt-4 rounded-none"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', padding: '12px' }}
            >
              {t('shell.logoutButton')}
            </button>
          </nav>
        </aside>
        <main
          className={`main-content${useWhiteMainContent ? ' main-content-white' : ''}`}
        >
          {children}
        </main>
      </div>
    </>
  );
}
