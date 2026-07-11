import { useLiveQuery } from 'dexie-react-hooks';
import { getAllTags } from '../db/queries';
import { useI18n } from '../i18n';

/** 右栏：标签云，点击某标签回调（联动中栏过滤）。 */
export function TagStats({
  onPick,
  version,
}: {
  onPick: (tag: string) => void;
  version: number;
}) {
  const { t } = useI18n();
  const tags = useLiveQuery(() => getAllTags(), [version]);

  if (!tags) return null;
  if (tags.length === 0)
    return <div className="text-xs text-muted">{t('tagStats.empty')}</div>;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(({ tag, count }) => (
        <button
          key={tag}
          onClick={() => onPick(tag)}
          className="rounded bg-card px-2 py-0.5 text-xs text-fg transition-colors hover:bg-border"
          title={t('tagStats.filterTitle', { tag })}
        >
          #{tag} <span className="text-muted">{count}</span>
        </button>
      ))}
    </div>
  );
}
