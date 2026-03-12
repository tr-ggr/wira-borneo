'use client';

import React, { useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useI18n, LOCALES } from '../../i18n/context';
import type { Locale } from '../../i18n/locales';
import { LOCALE_DISPLAY } from '../../i18n/locales';

type LanguageSelectorProps = {
  open: boolean;
  onClose: () => void;
};

export function LanguageSelector({ open, onClose }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useI18n();

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

  const handleSelect = (loc: Locale) => {
    setLocale(loc);
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
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] max-w-[90vw] bg-white rounded-xl shadow-xl z-50 p-4 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label={t('language.ariaSelect')}
      >
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <Globe className="size-5 text-asean-blue shrink-0" />
          <span className="font-sagip font-bold text-sagip-heading text-sm">
            {t('language.title')}
          </span>
        </div>
        <ul className="py-2">
          {LOCALES.map((loc) => (
            <li key={loc}>
              <button
                type="button"
                onClick={() => handleSelect(loc)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-sagip font-medium text-sm text-sagip-heading hover:bg-asean-blue/10 transition-colors"
                aria-label={LOCALE_DISPLAY[loc].nativeLabel ?? LOCALE_DISPLAY[loc].displayLabel}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden className="text-base leading-none">{LOCALE_DISPLAY[loc].flagEmoji}</span>
                  {LOCALE_DISPLAY[loc].displayLabel}
                </span>
                {locale === loc && (
                  <Check className="size-4 text-asean-blue shrink-0" aria-hidden />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
