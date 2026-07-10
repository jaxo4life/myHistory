import { useLiveQuery } from 'dexie-react-hooks';
import { getAllTags } from '../db/queries';

/** 右栏：标签云，点击某标签回调（联动中栏过滤）。 */
export function TagStats({
  onPick,
  version,
}: {
  onPick: (tag: string) => void;
  version: number;
}) {
  const tags = useLiveQuery(() => getAllTags(), [version]);

  if (!tags) return null;
  if (tags.length === 0) return <div className="text-xs text-muted">暂无标签（在记录上点 # 添加）</div>;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(({ tag, count }) => (
        <button
          key={tag}
          onClick={() => onPick(tag)}
          className="rounded bg-card px-2 py-0.5 text-xs text-fg hover:bg-border"
          title={`按 #${tag} 筛选`}
        >
          #{tag} <span className="text-muted">{count}</span>
        </button>
      ))}
    </div>
  );
}
