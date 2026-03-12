'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const warningTabs = [
  { href: '/warnings', label: 'Active warnings' },
  { href: '/warnings/new', label: 'Create warning' },
] as const;

export default function WarningsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <div
        className="card filter-row resources-tabs"
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        {warningTabs.map((tab) => {
          const isActive =
            tab.href === '/warnings'
              ? pathname === '/warnings'
              : pathname?.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`chip ${isActive ? 'chip-active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </>
  );
}
