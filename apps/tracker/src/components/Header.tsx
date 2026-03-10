'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between z-20">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            placeholder="Search transactions, families, or centers..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>

        {/* Wallet Connect Button */}
        <ConnectButton
          chainStatus="icon"
          showBalance={false}
          accountStatus={{
            smallScreen: 'avatar',
            largeScreen: 'full',
          }}
        />
      </div>
    </header>
  );
}
