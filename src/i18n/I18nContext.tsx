import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translations, type Locale, type TranslationKey } from './translations';
import chineseCopy from './ui.zh-CN.json';

const STORAGE_KEY = 'athenaeum.ui.locale.v1';

type TranslationParams = Record<string, string | number>;

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  tx: (english: string, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'zh-CN') return stored;
  } catch (error) {
    console.warn('[I18n] Could not read the saved language:', error);
  }

  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return browserLanguages.some(language => language.toLowerCase().startsWith('zh')) ? 'zh-CN' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>(initialLocale);

  const setLocale = useCallback((nextLocale: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, nextLocale);
    } catch (error) {
      console.warn('[I18n] Could not save the selected language:', error);
    }
    updateLocale(nextLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback((key: TranslationKey, params?: TranslationParams) => {
    const template = translations[locale][key] ?? translations.en[key];
    if (!params) return template;

    return template.replace(/\{(\w+)\}/g, (match, name: string) => {
      const replacement = params[name];
      return replacement === undefined ? match : String(replacement);
    });
  }, [locale]);

  // Source-copy keys keep incremental translations close to upstream wording.
  // Unknown copy falls back to English; placeholders are interpolated once.
  const tx = useCallback((english: string, params?: TranslationParams) => {
    const dictionary: Record<string, string> = chineseCopy;
    const template = locale === 'zh-CN' && Object.prototype.hasOwnProperty.call(dictionary, english)
      ? dictionary[english] : english;
    return params ? template.replace(/\{(\w+)\}/g, (match, name: string) =>
      params[name] === undefined ? match : String(params[name])) : template;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t, tx }), [locale, setLocale, t, tx]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
