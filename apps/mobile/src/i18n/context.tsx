'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Locale } from './locales';
import { DEFAULT_LOCALE, getLocaleDisplayLabel, isLocale, LOCALES } from './locales';
import en from './en.json';
import ceb from './ceb.json';
import ms from './ms.json';
import id from './id.json';
import th from './th.json';
import vi from './vi.json';
import ta from './ta.json';

const STORAGE_KEY = 'wira-locale';

const messages: Record<Locale, Record<string, string>> = {
  en: en as Record<string, string>,
  ceb: ceb as Record<string, string>,
  ms: ms as Record<string, string>,
  id: id as Record<string, string>,
  th: th as Record<string, string>,
  vi: vi as Record<string, string>,
  ta: ta as Record<string, string>,
};

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isLocale(stored)) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  localeDisplayLabel: string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setMounted(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const localeMessages = messages[locale];
      if (localeMessages && key in localeMessages) return localeMessages[key];
      const fallback = messages[DEFAULT_LOCALE];
      return (fallback && fallback[key]) || key;
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      localeDisplayLabel: getLocaleDisplayLabel(locale),
    }),
    [locale, setLocale, t]
  );

  if (!mounted) {
    return (
      <I18nContext.Provider value={value}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export { LOCALES };
