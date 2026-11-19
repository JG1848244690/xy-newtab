import { DEFAULT_LOCALE, type Locale } from './types';

export function detectLocale(): Locale {
  const uiLanguage = typeof browser === 'undefined' ? undefined : browser.i18n?.getUILanguage?.();
  const preferences = typeof navigator === 'undefined' ? [] : [...(navigator.languages ?? []), navigator.language];

  for (const language of [uiLanguage, ...preferences]) {
    const primary = language?.trim().toLowerCase().split(/[-_]/)[0];
    if (primary === 'zh') return 'zh_CN';
    if (primary === 'en') return 'en';
  }
  return DEFAULT_LOCALE;
}
