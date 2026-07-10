import type { Visit } from '../types/visit';
import { deleteVisit } from '../db/queries';

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface ItemProps {
  visit: Visit;
  selected?: boolean;
  selectionMode?: boolean;
  onToggleSelect?: (id: number) => void;
}

export function HistoryItem({ visit, selected, selectionMode, onToggleSelect }: ItemProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded px-3 py-2 text-sm ${
        selected ? 'bg-accent/20 ring-1 ring-accent' : 'bg-card'
      }`}
    >
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
  );
}
