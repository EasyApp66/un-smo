import { useCallback } from 'react';
import { useAppStore } from '@/store/appStore';

export type Lang = 'de' | 'en';

/** Aktuelle Sprache ausserhalb von React (z. B. in Hilfsfunktionen). */
export const currentLang = (): Lang => (useAppStore.getState().language === 'en' ? 'en' : 'de');

/** Übersetzung ausserhalb von React: tr('Deutsch', 'English') */
export const tr = (de: string, en: string) => (currentLang() === 'en' ? en : de);

/** Übersetzung in Komponenten: const t = useT(); t('Deutsch', 'English') */
export const useT = () => {
  const lang = useAppStore((s) => (s.language === 'en' ? 'en' : 'de'));
  return useCallback(<T,>(de: T, en: T): T => (lang === 'en' ? en : de), [lang]);
};

export const useLang = (): Lang => useAppStore((s) => (s.language === 'en' ? 'en' : 'de'));

/** Locale für Datums-/Zahlenformatierung */
export const useLocale = () => (useLang() === 'en' ? 'en-GB' : 'de-CH');
export const currentLocale = () => (currentLang() === 'en' ? 'en-GB' : 'de-CH');
