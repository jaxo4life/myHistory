import { useEffect, useState } from 'react';
import { getSettings, saveSettings, type Settings } from '../store/settings';

/** 在 <html> 上切换 .dark 类，并持久化到 chrome.storage。 */
export function ThemeToggle() {
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
      className="rounded bg-card px-3 py-1 text-sm text-fg hover:bg-border"
      title="切换主题"
    >
      {theme === 'dark' ? '☀ 浅色' : '🌙 深色'}
    </button>
  );
}
