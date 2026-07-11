import { useLiveQuery } from 'dexie-react-hooks';
import { getCategoryCounts } from '../db/queries';
import { useI18n, catLabel } from '../i18n';

/** 右栏：分类行式列表（左色条占比 + 计数），点击联动中栏过滤。 */
export function CategoryStats({
  onPick,
  version,
}: {
  onPick: (category: string) => void;
  version: number;
}) {
  const { t, locale } = useI18n();
  const cats = useLiveQuery(() => getCategoryCounts(), [version]);

  if (!cats) return <div className="text-sm text-muted">{t('common.loading')}</div>;
  if (cats.length === 0) return <div className="text-sm text-muted">{t('common.noData')}</div>;

  const max = cats[0].count;

  return (
    <div className="flex flex-col gap-0.5">
      {cats.map(({ category, count, icon, color }) => {
        const pct = max ? (count / max) * 100 : 0;
        return (
          <button
            key={category}
            onClick={() => onPick(category)}
            className="relative block w-full overflow-hidden rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-card"
            title={t('catStats.filterTitle', { name: catLabel(category, locale) })}
          >
            <span
              className="absolute inset-y-0 left-0 opacity-[0.12]"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
            <span className="relative flex items-center gap-2 text-xs">
              <span className="shrink-0" style={{ color }}>
                {icon}
              </span>
              <span className="min-w-0 flex-1 truncate text-fg">
                {catLabel(category, locale)}
              </span>
              <span className="shrink-0 font-semibold tabular-nums" style={{ color }}>
                {count}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
