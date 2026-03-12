/**
 * Supported app locales. ISO 639-1/639-2 style.
 * Display labels and flag emoji are used in header and language selector.
 * Aligned with SEA-LION v2 (en, id, th, vi, ta) plus ceb, ms.
 */
export type Locale = 'en' | 'ceb' | 'ms' | 'id' | 'th' | 'vi' | 'ta';

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALES: Locale[] = ['en', 'ceb', 'ms', 'id', 'th', 'vi', 'ta'];

export type LocaleDisplayInfo = {
  displayLabel: string;
  nativeLabel?: string;
  flagEmoji: string;
};

export const LOCALE_DISPLAY: Record<Locale, LocaleDisplayInfo> = {
  en: { displayLabel: 'ENG', nativeLabel: 'English', flagEmoji: '🇬🇧' },
  ceb: { displayLabel: 'BISAYA', nativeLabel: 'Cebuano', flagEmoji: '🇵🇭' },
  ms: { displayLabel: 'BM', nativeLabel: 'Bahasa Melayu', flagEmoji: '🇲🇾' },
  id: { displayLabel: 'IND', nativeLabel: 'Bahasa Indonesia', flagEmoji: '🇮🇩' },
  th: { displayLabel: 'TH', nativeLabel: 'ไทย', flagEmoji: '🇹🇭' },
  vi: { displayLabel: 'VN', nativeLabel: 'Tiếng Việt', flagEmoji: '🇻🇳' },
  ta: { displayLabel: 'TA', nativeLabel: 'தமிழ்', flagEmoji: '🇮🇳' },
};

export function getLocaleDisplayLabel(locale: Locale): string {
  return LOCALE_DISPLAY[locale].displayLabel;
}

export function getLocaleFlagEmoji(locale: Locale): string {
  return LOCALE_DISPLAY[locale].flagEmoji;
}

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}
