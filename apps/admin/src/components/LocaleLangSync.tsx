'use client';

import { useEffect } from 'react';
import { useI18n } from '../i18n/context';

/**
 * Syncs document.documentElement.lang with current locale for a11y and SEO.
 * Renders nothing; must be mounted inside I18nProvider.
 */
export function LocaleLangSync() {
  const { locale } = useI18n();

  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}
