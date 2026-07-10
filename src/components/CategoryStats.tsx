import { useLiveQuery } from 'dexie-react-hooks';
import { getCategoryCounts } from '../db/queries';

/** 右栏：按自动分类统计，点击某类别回调（联动中栏过滤）。 */
export function CategoryStats({ onPick }: { onPick: (category: string) => void }) {
  const cats = useLiveQuery(() => getCategoryCounts(), []);

  if (!cats) return <div className="text-sm text-muted">加载中…</div>;
  if (cats.length === 0) return <div className="text-sm text-muted">暂无数据</div>;

  const max = cats[0].count;

  return (
    <div className="flex flex-col gap-1">
      {cats.map(({ category, count }) => (
        <button
          key={category}
          onClick={() => onPick(category)}
          className="relative flex items-center justify-between overflow-hidden rounded px-2 py-1 text-left text-sm hover:bg-card"
          title={`按「${category}」过滤`}
        >
          <span
            className="absolute left-0 top-0 h-full bg-accent opacity-10"
            style={{ width: `${(count / max) * 100}%` }}
          />
          <span className="relative truncate text-fg">{category}</span>
          <span className="relative ml-2 shrink-0 text-xs text-muted">{count}</span>
        </button>
      ))}
    </div>
  );
}
