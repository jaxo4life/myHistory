import { useLiveQuery } from 'dexie-react-hooks';
import { getCategoryCounts } from '../db/queries';

/** 右栏：分类卡片 tag 网格，点击某类别联动中栏过滤。version 变化时重新查询。 */
export function CategoryStats({
  onPick,
  version,
}: {
  onPick: (category: string) => void;
  version: number;
}) {
  const cats = useLiveQuery(() => getCategoryCounts(), [version]);

  if (!cats) return <div className="text-sm text-muted">加载中…</div>;
  if (cats.length === 0) return <div className="text-sm text-muted">暂无数据</div>;

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {cats.map(({ category, count, icon }) => (
        <button
          key={category}
          onClick={() => onPick(category)}
          className="flex items-center gap-1.5 rounded-lg bg-card px-2 py-1.5 text-left text-xs hover:bg-border"
          title={`按「${category}」过滤`}
        >
          <span className="text-sm">{icon}</span>
          <span className="min-w-0 flex-1 truncate text-fg">{category}</span>
          <span className="shrink-0 text-muted">{count}</span>
        </button>
      ))}
    </div>
  );
}
