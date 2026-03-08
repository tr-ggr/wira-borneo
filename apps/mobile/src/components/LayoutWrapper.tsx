'use client';

import React from 'react';
import { Home, AlertTriangle, Users, MessageSquare, Info, User } from 'lucide-react';

export default function LayoutWrapper({
  children,
  currentPath,
  onNavigate,
}: {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}) {
  const navItems = [
    { label: 'Forecast', icon: Home, path: '/' },
    { label: 'Warnings', icon: AlertTriangle, path: '/warnings' },
    { label: 'Party', icon: Users, path: '/family' },
    { label: 'Assistant', icon: MessageSquare, path: '/assistant' },
    { label: 'Help', icon: Info, path: '/help' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="flex flex-col h-screen bg-wira-ivory wira-batik-bg overflow-hidden">
      {/* Sacred Status Zone (Top 48px) */}
      <div className="h-12 w-full bg-wira-teal text-white flex items-center justify-center px-4 shrink-0 transition-colors duration-300 z-50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-safe animate-pulse"></span>
          <span className="text-xs font-mono uppercase tracking-widest">WIRA — Systems Online</span>
        </div>
      </div>

      <main className="flex-1 pb-20 px-4 pt-4 overflow-y-auto w-full max-w-md mx-auto scroll-smooth">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-wira-ivory-dark px-2 pb-2 flex items-center justify-around z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button 
              key={item.path} 
              onClick={() => onNavigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 flex-1 h-full ${isActive ? 'text-wira-gold' : 'text-wira-teal-light/60 hover:text-wira-teal-light'}`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-wira-gold/10' : ''}`}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-body font-bold uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
