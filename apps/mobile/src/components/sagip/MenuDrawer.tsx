'use client';

import React, { useEffect } from 'react';
import {
  Home,
  AlertTriangle,
  MapPin,
  User,
  Siren,
  HelpCircle,
  Shield,
  LogOut,
  X,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';

type MenuDrawerProps = {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onSignOut?: () => void;
  currentPath: string;
};

const MENU_ITEMS: { path: string; labelKey: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { path: '/', labelKey: 'menu.home', icon: Home },
  { path: '/warnings', labelKey: 'menu.alerts', icon: AlertTriangle },
  { path: '/blockchain', labelKey: 'menu.blockchain', icon: Shield },
  { path: '/map', labelKey: 'menu.map', icon: MapPin },
  { path: '/profile', labelKey: 'menu.profile', icon: User },
  { path: '/sos', labelKey: 'menu.emergencySos', icon: Siren },
  { path: '/help', labelKey: 'menu.help', icon: HelpCircle },
];

export function MenuDrawer({ open, onClose, onNavigate, onSignOut, currentPath }: MenuDrawerProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleNav = (path: string) => {
    onNavigate(path);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed top-0 right-0 bottom-0 w-[280px] max-w-[85vw] bg-white shadow-xl z-50 flex flex-col animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label={t('menu.ariaNav')}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
          <span className="font-sagip font-bold text-sagip-heading text-sm">{t('menu.title')}</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-asean-blue"
            aria-label={t('menu.close')}
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {MENU_ITEMS.map(({ path, labelKey, icon: Icon }) => (
            <button
              key={path}
              type="button"
              onClick={() => handleNav(path)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left font-sagip font-medium text-sm transition-colors ${
                currentPath === path
                  ? 'bg-asean-blue/10 text-asean-blue'
                  : 'text-sagip-heading hover:bg-slate-50'
              }`}
            >
              <Icon className="size-5 shrink-0" />
              {t(labelKey)}
            </button>
          ))}
        </nav>
        {onSignOut && (
          <div className="p-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left font-sagip font-medium text-sm text-slate-500 hover:bg-slate-50 rounded-lg"
            >
              <LogOut className="size-5 shrink-0" />
              {t('menu.signOut')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
