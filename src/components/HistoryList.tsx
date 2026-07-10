import type { Visit } from '../types/visit';
import { HistoryItem } from './HistoryItem';

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
  if (visits === undefined) {
    return <div className="p-4 text-muted">加载中…</div>;
  }
  if (visits.length === 0) {
    return <div className="p-4 text-muted">没有匹配的浏览记录。</div>;
  }
  return (
    <div className="flex flex-col gap-2">
      {visits.map((v) => (
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
  );
}
