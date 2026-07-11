import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getSettings, saveSettings } from '../store/settings';
import { interpolate } from './format';
import { translations, type Locale } from './translations';

interface I18nCtx {
  locale: Locale;
    t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (next: Locale) => Promise<void>;
}

const I18nContext = createContext<I18nCtx>(null!);

function detectLocale(): Locale {
  const l = (typeof navigator !== 'undefined' ? navigator.language : 'zh').toLowerCase();
  return l.startsWith('zh') ? 'zh' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh');

  useEffect(() => {
    getSettings().then((s) => {
      const init = s.locale ?? detectLocale();
      setLocaleState(init);
      document.documentElement.lang = init === 'zh' ? 'zh-CN' : 'en';
    });
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      interpolate(translations[locale][key] ?? translations.zh[key] ?? key, params),
    [locale],
  );

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
    await saveSettings({ locale: next });
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>{children}</I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
