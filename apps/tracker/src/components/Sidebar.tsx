'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: 'dashboard', label: 'Dashboard' },
    { href: '/map', icon: 'map', label: 'Impact Map' },
    { href: '/transactions', icon: 'account_balance_wallet', label: 'Ledger' },
    { href: '/validators', icon: 'verified_user', label: 'Validators' },
    { href: '/settings', icon: 'settings', label: 'Settings' },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 hidden lg:flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="size-8 bg-primary rounded flex items-center justify-center text-white">
          <span className="material-symbols-outlined">diversity_3</span>
        </div>
        <h1 className="font-bold text-xl tracking-tight">ASEAN Relief</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold uppercase text-slate-500 mb-2">
            Network Status
          </p>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-medium">Mainnet Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
