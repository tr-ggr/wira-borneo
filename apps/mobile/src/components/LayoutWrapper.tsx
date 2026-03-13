'use client';

import React, { useState } from 'react';
import { Home, AlertTriangle, MapPin, User, BarChart3, Activity, CloudRain, Building2 } from 'lucide-react';
import {
  MobileHeader,
  type MobileHeaderConfig,
} from './sagip/MobileHeader';
import { MenuDrawer } from './sagip/MenuDrawer';
import { LanguageSelector } from './sagip/LanguageSelector';
import { useI18n } from '../i18n/context';
import { getLocaleDisplayLabel, getLocaleFlagEmoji } from '../i18n/locales';

function buildHeaderConfig(t: (key: string) => string): Record<string, MobileHeaderConfig> {
  const systemsOnline = { label: t('header.systemsOnline'), dotColor: 'green' as const };
  const mapConfig: MobileHeaderConfig = { title: t('header.titleMap'), status: systemsOnline, showDivider: true };
  const defaultConfig: MobileHeaderConfig = { title: t('header.titleWira'), status: systemsOnline, showDivider: true };
  return {
    '/': { title: t('header.titleSagip'), showDivider: true },
    '/sos': { title: t('header.titleSagip'), showSecurePill: true, showDivider: true },
    '/assistant': {
      title: t('header.titleSeaLionSagip'),
      icon: 'message',
      status: { label: t('header.aiResponderActive'), dotColor: 'green' },
      showDivider: true,
    },
    '/map': mapConfig,
    '/map/flood-simulation': mapConfig,
    '/map/pin-location': mapConfig,
    '/map/building-vulnerability': mapConfig,
    '/map/health-outbreaks': mapConfig,
    '/warnings': { title: t('header.titleAlerts'), status: systemsOnline, showDivider: true },
    '/help': { title: t('header.titleHelp'), status: systemsOnline, showDivider: true },
    '/profile': { title: t('header.titleProfile'), status: systemsOnline, showDivider: true },
    '/family': { title: t('header.titleFamily'), status: systemsOnline, showDivider: true },
    '/blockchain': { title: t('header.titleBlockchain'), status: systemsOnline, showDivider: true },
    __default: defaultConfig,
  };
}

export default function LayoutWrapper({
  children,
  currentPath,
  onNavigate,
  showNav = true,
  onSignOut,
}: {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  showNav?: boolean;
  onSignOut?: () => void;
}) {
  const { t, locale } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const isHome = currentPath === '/';
  const isAssistant = currentPath === '/assistant';
  const isMapScreen = currentPath === '/map' || currentPath.startsWith('/map/');
  const mapActions = [
    { path: '/map', labelKey: 'map.vulnerabilityDensity', icon: BarChart3 },
    { path: '/map/health-outbreaks', labelKey: 'map.healthOutbreaks', icon: Activity },
    { path: '/map/flood-simulation', labelKey: 'map.floodSim', icon: CloudRain },
    { path: '/map/pin-location', labelKey: 'map.pinLocation', icon: MapPin },
    { path: '/map/building-vulnerability', labelKey: 'map.vulnerability', icon: Building2 },
  ];
  const configMap = buildHeaderConfig(t);
  const headerConfig =
    configMap[currentPath] ?? (isMapScreen ? configMap['/map'] : configMap.__default);
  const headerLangLocale = locale;
  const headerLanguageLabel = `${getLocaleFlagEmoji(headerLangLocale)} ${getLocaleDisplayLabel(headerLangLocale)}`;

  return (
    <div className={`flex flex-col overflow-hidden ${isMapScreen ? 'w-full max-w-full h-screen' : 'h-screen'} ${isHome || isAssistant ? 'bg-[var(--sagip-bg)]' : 'bg-wira-ivory wira-batik-bg'}`}>
      <MobileHeader
        {...headerConfig}
        languageLabel={headerLanguageLabel}
        onMenuClick={() => setMenuOpen(true)}
        onLanguageClick={() => setLanguageOpen(true)}
      />

      <main className={`flex-1 flex flex-col min-h-0 min-w-0 overflow-x-hidden ${showNav ? (isMapScreen ? 'mobile-nav-safe-map' : 'mobile-nav-safe') : 'pb-4'} ${isHome || isAssistant ? '' : isMapScreen ? 'px-0' : 'px-4'} pt-0 ${isAssistant ? 'overflow-hidden min-h-0' : isMapScreen ? 'overflow-hidden' : 'overflow-y-auto'} w-full ${isMapScreen ? 'max-w-none' : 'max-w-md mx-auto'} scroll-smooth`}>
        {children}
      </main>

      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        currentPath={currentPath}
      />
      <LanguageSelector
        open={languageOpen}
        onClose={() => setLanguageOpen(false)}
      />

      {showNav && isMapScreen && (
        <div
          className="fixed left-0 right-0 z-40 px-4 py-2 bg-white/95 backdrop-blur-md border-t border-wira-earth/10 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
          style={{ bottom: 'calc(var(--bottom-nav-height) + var(--map-actions-bar-gap, 0.5rem))', height: 'var(--map-actions-bar-height, 56px)' }}
          role="group"
          aria-label={t('map.mapLayers')}
        >
          <div className="flex gap-2 overflow-x-auto overflow-y-hidden py-1 min-h-0 h-full items-center [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-wira-earth/20">
            {mapActions.map(({ path, labelKey, icon: Icon }) => {
              const isActive = currentPath === path;
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => onNavigate(path)}
                  className={`shrink-0 flex items-center gap-2 rounded-full px-4 py-2.5 font-sagip text-sm font-medium transition-colors min-h-[44px] border ${
                    isActive
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                      : 'bg-white/95 backdrop-blur-md border-wira-earth/20 text-wira-earth hover:bg-wira-earth/5'
                  }`}
                  title={t(labelKey)}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-wira-teal'} />
                  <span>{t(labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showNav && (
        <nav className="sagip-bottom-nav">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="flex flex-col gap-0.5 items-center shrink-0 min-w-0 max-w-[72px] focus:outline-none focus-visible:ring-2 focus-visible:ring-asean-blue focus-visible:ring-offset-2 rounded-lg"
            aria-current={currentPath === '/' ? 'page' : undefined}
          >
            <Home className={`size-5 shrink-0 ${currentPath === '/' ? 'text-asean-blue' : 'text-slate-400'}`} />
            <span className={`font-sagip font-bold text-[9px] tracking-widest uppercase truncate w-full text-center ${currentPath === '/' ? 'text-asean-blue' : 'text-slate-400'}`}>
              {t('nav.home')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/warnings')}
            className="flex flex-col gap-0.5 items-center shrink-0 min-w-0 max-w-[72px] focus:outline-none focus-visible:ring-2 focus-visible:ring-asean-blue focus-visible:ring-offset-2 rounded-lg"
            aria-current={currentPath === '/warnings' ? 'page' : undefined}
          >
            <AlertTriangle className={`size-5 shrink-0 ${currentPath === '/warnings' ? 'text-asean-blue' : 'text-slate-400'}`} />
            <span className={`font-sagip font-bold text-[9px] tracking-widest uppercase truncate w-full text-center ${currentPath === '/warnings' ? 'text-asean-blue' : 'text-slate-400'}`}>
              {t('nav.alerts')}
            </span>
          </button>

          <div className="w-16 shrink-0 flex flex-col items-center justify-end relative h-full min-h-[52px] bg-transparent overflow-visible">
            <button
              type="button"
              onClick={() => onNavigate('/sos')}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center size-16 rounded-full bg-asean-red border-4 border-white shadow-[0_10px_15px_-3px_rgba(253,24,19,0.4),0_4px_6px_-4px_rgba(253,24,19,0.4)] text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-asean-red focus-visible:ring-offset-2 font-sagip font-bold text-lg uppercase tracking-widest"
              aria-label={t('aria.emergencySos')}
            >
              SOS
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/map')}
            className="flex flex-col gap-0.5 items-center shrink-0 min-w-0 max-w-[72px] focus:outline-none focus-visible:ring-2 focus-visible:ring-asean-blue focus-visible:ring-offset-2 rounded-lg"
            aria-current={currentPath === '/map' || currentPath.startsWith('/map/') ? 'page' : undefined}
          >
            <MapPin className={`size-5 shrink-0 ${currentPath === '/map' || currentPath.startsWith('/map/') ? 'text-asean-blue' : 'text-slate-400'}`} />
            <span className={`font-sagip font-bold text-[9px] tracking-widest uppercase truncate w-full text-center ${currentPath === '/map' || currentPath.startsWith('/map/') ? 'text-asean-blue' : 'text-slate-400'}`}>
              {t('nav.map')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/profile')}
            className="flex flex-col gap-0.5 items-center shrink-0 min-w-0 max-w-[72px] focus:outline-none focus-visible:ring-2 focus-visible:ring-asean-blue focus-visible:ring-offset-2 rounded-lg"
            aria-current={currentPath === '/profile' ? 'page' : undefined}
          >
            <User className={`size-5 shrink-0 ${currentPath === '/profile' ? 'text-asean-blue' : 'text-slate-400'}`} />
            <span className={`font-sagip font-bold text-[9px] tracking-widest uppercase truncate w-full text-center ${currentPath === '/profile' ? 'text-asean-blue' : 'text-slate-400'}`}>
              {t('nav.profile')}
            </span>
          </button>
        </nav>
      )}
    </div>
  );
}
