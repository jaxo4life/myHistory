import { useEffect, useState } from 'react';
import type { Visit } from '../types/visit';
import { HistoryItem } from './HistoryItem';

const PAGE_SIZE = 100;

interface ListProps {
  visits: Visit[] | undefined;
  selectionMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  onTagClick?: (tag: string) => void;
}

export function HistoryList({
  visits,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onTagClick,
}: ListProps) {
  const [limit, setLimit] = useState(PAGE_SIZE);

  // 列表数据变化时重置分页
  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [visits]);

  if (visits === undefined) {
    return <div className="p-4 text-muted">加载中…</div>;
  }
  if (visits.length === 0) {
    return <div className="p-4 text-muted">没有匹配的浏览记录。</div>;
  }

  const shown = visits.slice(0, limit);
  const remaining = visits.length - limit;

  return (
    <div>
      <div className="flex flex-col gap-2">
        {shown.map((v) => (
          <HistoryItem
            key={v.id}
            visit={v}
            selectionMode={selectionMode}
            selected={v.id !== undefined && selectedIds?.has(v.id)}
            onToggleSelect={onToggleSelect}
            onTagClick={onTagClick}
          />
        ))}
      </div>
      {remaining > 0 && (
        <button
          onClick={() => setLimit((l) => l + PAGE_SIZE)}
          className="mt-3 w-full rounded bg-card py-2 text-sm text-muted hover:text-fg"
        >
          显示更多（还有 {remaining} 条）
        </button>
      )}
    </div>
  );
}
