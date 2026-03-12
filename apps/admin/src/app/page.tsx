'use client';

import Link from 'next/link';
import { useI18n } from '../i18n/context';

const MODULE_HREFS = [
  { href: '/volunteers', titleKey: 'dashboard.moduleVolunteers.title', subtitleKey: 'dashboard.moduleVolunteers.subtitle' },
  { href: '/warnings/new', titleKey: 'dashboard.moduleWarnings.title', subtitleKey: 'dashboard.moduleWarnings.subtitle' },
  { href: '/map', titleKey: 'dashboard.moduleMap.title', subtitleKey: 'dashboard.moduleMap.subtitle' },
] as const;

export default function HomePage() {
  const { t } = useI18n();

  return (
    <section className="page-shell">
      <header className="section-header">
        <p className="eyebrow">{t('dashboard.eyebrow')}</p>
        <h1 className="title">{t('dashboard.title')}</h1>
        <p className="subtitle">{t('dashboard.subtitle')}</p>
      </header>

      <div className="grid-list">
        {MODULE_HREFS.map(({ href, titleKey, subtitleKey }) => (
          <Link key={href} href={href} className="card module-card">
            <h2 className="card-title">{t(titleKey)}</h2>
            <p className="muted">{t(subtitleKey)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
