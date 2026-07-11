import { useEffect, useState } from 'react';
import { getSettings, saveSettings, type Settings } from '../store/settings';
import { useI18n } from '../i18n';

/** 在 <html> 上切换 .dark 类，并持久化到 chrome.storage。纯图标按钮。 */
export function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Settings['theme']>('dark');

  useEffect(() => {
    getSettings().then((s) => {
      setTheme(s.theme);
      applyTheme(s.theme);
    });
  }, []);

  function applyTheme(t: Settings['theme']) {
    document.documentElement.classList.toggle('dark', t === 'dark');
  }

  async function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    await saveSettings({ theme: next });
  }

  return (
    <button
      onClick={toggle}
      className="rounded-lg p-2 text-fg transition-colors hover:bg-card"
      title={t(theme === 'dark' ? 'theme.toLight' : 'theme.toDark')}
      aria-label={t('theme.toggle')}
    >
      {theme === 'dark' ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
