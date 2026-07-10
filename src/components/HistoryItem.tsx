import type { Visit } from '../types/visit';
import { deleteVisit, updateVisitTags } from '../db/queries';

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface ItemProps {
  visit: Visit;
  selected?: boolean;
  selectionMode?: boolean;
  onToggleSelect?: (id: number) => void;
  onTagClick?: (tag: string) => void;
}

export function HistoryItem({ visit, selected, selectionMode, onToggleSelect, onTagClick }: ItemProps) {
  function addTag() {
    const input = prompt('添加标签（多个用逗号分隔）');
    if (!input) return;
    const newTags = input.split(/[\s,，]+/).map((s) => s.trim()).filter(Boolean);
    const tags = [...new Set([...(visit.tags ?? []), ...newTags])];
    updateVisitTags(visit.id!, tags);
  }

  function removeTag(tag: string, e: React.MouseEvent) {
    e.stopPropagation();
    const tags = (visit.tags ?? []).filter((t) => t !== tag);
    updateVisitTags(visit.id!, tags);
  }

  return (
    <div
      className={`flex flex-col rounded px-3 py-2 text-sm ${
        selected ? 'bg-accent/20 ring-1 ring-accent' : 'bg-card'
      }`}
    >
      <div className="flex items-center gap-3">
        {selectionMode && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect?.(visit.id!)}
            className="h-4 w-4 shrink-0"
          />
        )}
        <span className="w-10 shrink-0 text-xs text-muted">{formatTime(visit.visitTime)}</span>
        {visit.faviconUrl && <img src={visit.faviconUrl} alt="" className="h-4 w-4 shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="truncate text-fg">{visit.title}</div>
          <div className="truncate text-xs text-accent">{visit.domain}</div>
        </div>
        {!selectionMode && (
          <>
            <a
              href={visit.url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-muted hover:text-fg"
              title="打开"
            >
              ↗
            </a>
            <button onClick={addTag} className="shrink-0 text-muted hover:text-fg" title="添加标签">
              #
            </button>
            <button
              onClick={() => deleteVisit(visit.id!)}
              className="shrink-0 text-muted hover:text-fg"
              title="删除"
            >
              ×
            </button>
          </>
        )}
      </div>
      {(visit.tags ?? []).length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1 pl-[52px]">
          {visit.tags!.map((t) => (
            <span
              key={t}
              className="group inline-flex items-center gap-0.5 rounded bg-bg px-1.5 py-0 text-[10px] text-muted"
            >
              <button onClick={() => onTagClick?.(t)} className="hover:text-accent" title={`按 #${t} 筛选`}>
                #{t}
              </button>
              <button
                onClick={(e) => removeTag(t, e)}
                className="opacity-0 hover:text-fg group-hover:opacity-100"
                title="移除标签"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
