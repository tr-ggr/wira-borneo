'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const resourcesTabs = [
  { href: '/volunteers', label: 'Volunteer registry' },
  { href: '/volunteers/assets', label: 'Asset registry' },
] as const;

export default function VolunteersLayout({ children }: { children: ReactNode }) {
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
        {resourcesTabs.map((tab) => {
          const isActive =
            tab.href === '/volunteers'
              ? pathname === '/volunteers'
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
