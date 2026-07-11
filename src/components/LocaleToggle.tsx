import { useI18n, type Locale } from '../i18n';

/** 中/EN 分段切换，与 ThemeToggle 并列于 header。切换即时全站生效并持久化。 */
export function LocaleToggle() {
  const { locale, setLocale } = useI18n();
  const items: { key: Locale; label: string }[] = [
    { key: 'zh', label: '中' },
    { key: 'en', label: 'EN' },
  ];
  return (
    <div className="flex items-center rounded-lg bg-card p-0.5 text-xs">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => setLocale(it.key)}
          className={`rounded-md px-2 py-1 transition-colors ${
            locale === it.key ? 'bg-elevated text-fg shadow-sm' : 'text-muted hover:text-fg'
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
